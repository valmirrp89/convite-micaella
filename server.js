// Servidor nativo Node.js (Sem necessidade de npm install / sem dependências externas)
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = path.join(__dirname, 'data');
const EVENT_FILE = path.join(DATA_DIR, 'event.json');
const GUESTS_FILE = path.join(DATA_DIR, 'guests.json');

// Garantir pastas
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.ogg': 'audio/ogg'
};

function readJSON(file, defaultVal) {
  try {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, JSON.stringify(defaultVal, null, 2), 'utf-8');
      return defaultVal;
    }
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch (err) {
    console.error(`Erro ao ler ${file}:`, err);
    return defaultVal;
  }
}

function writeJSON(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error(`Erro ao gravar ${file}:`, err);
    return false;
  }
}

function sendJSON(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 1e6) { // 1MB limit
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const reqHost = req.headers.host || 'localhost';
  const parsedUrl = new URL(req.url, `http://${reqHost}`);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  // API Endpoints
  if (pathname === '/api/event') {
    if (method === 'GET') {
      const event = readJSON(EVENT_FILE, {});
      return sendJSON(res, 200, event);
    }
    if (method === 'POST') {
      try {
        const data = await parseBody(req);
        writeJSON(EVENT_FILE, data);
        return sendJSON(res, 200, { success: true, event: data });
      } catch (e) {
        return sendJSON(res, 400, { error: 'Dados inválidos' });
      }
    }
  }

  if (pathname === '/api/guests') {
    if (method === 'GET') {
      const guests = readJSON(GUESTS_FILE, []);
      const stats = guests.reduce(
        (acc, g) => {
          acc.totalConfirmations += 1;
          acc.totalAdults += Number(g.adults) || 1;
          acc.totalChildren += Number(g.children) || 0;
          acc.totalPeople += (Number(g.adults) || 1) + (Number(g.children) || 0);
          return acc;
        },
        { totalConfirmations: 0, totalAdults: 0, totalChildren: 0, totalPeople: 0 }
      );
      return sendJSON(res, 200, { guests, stats });
    }

    if (method === 'POST') {
      try {
        const body = await parseBody(req);
        const { name, adults, children, companionNames, message } = body;

        if (!name || !name.trim()) {
          return sendJSON(res, 400, { error: 'O nome é obrigatório.' });
        }

        const guests = readJSON(GUESTS_FILE, []);
        const newGuest = {
          id: Date.now().toString(),
          name: name.trim(),
          adults: Math.max(1, parseInt(adults, 10) || 1),
          children: Math.max(0, parseInt(children, 10) || 0),
          companionNames: (companionNames || '').trim(),
          message: (message || '').trim(),
          confirmedAt: new Date().toISOString()
        };

        guests.unshift(newGuest);
        writeJSON(GUESTS_FILE, guests);
        return sendJSON(res, 201, { success: true, guest: newGuest });
      } catch (e) {
        return sendJSON(res, 400, { error: 'Erro ao processar dados' });
      }
    }
  }

  // DELETE /api/guests/:id
  if (pathname.startsWith('/api/guests/') && method === 'DELETE') {
    const id = pathname.replace('/api/guests/', '');
    let guests = readJSON(GUESTS_FILE, []);
    const initialLen = guests.length;
    guests = guests.filter(g => g.id !== id);
    if (guests.length === initialLen) {
      return sendJSON(res, 404, { error: 'Convidado não encontrado' });
    }
    writeJSON(GUESTS_FILE, guests);
    return sendJSON(res, 200, { success: true });
  }

  // Exportar CSV
  if (pathname === '/api/guests/export' && method === 'GET') {
    const guests = readJSON(GUESTS_FILE, []);
    let csv = '\uFEFF';
    csv += 'Nome Convidado;Adultos;Crianças;Total Pessoas;Acompanhantes;Recado;Data da Confirmação\n';
    guests.forEach(g => {
      const total = (Number(g.adults) || 1) + (Number(g.children) || 0);
      const date = new Date(g.confirmedAt).toLocaleString('pt-BR');
      const esc = (s) => `"${(s || '').toString().replace(/"/g, '""')}"`;
      csv += `${esc(g.name)};${g.adults};${g.children};${total};${esc(g.companionNames)};${esc(g.message)};${esc(date)}\n`;
    });

    res.writeHead(200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="convidados_confirmados.csv"',
      'Access-Control-Allow-Origin': '*'
    });
    return res.end(csv);
  }

  // Static Files Server
  let reqPath = pathname === '/' ? '/index.html' : pathname;
  let safePath = path.normalize(path.join(PUBLIC_DIR, reqPath));

  if (!safePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end('Acesso Negado');
  }

  fs.stat(safePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Tenta servir index.html para SPA ou 404
      const fallbackIndex = path.join(PUBLIC_DIR, 'index.html');
      if (fs.existsSync(fallbackIndex)) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        fs.createReadStream(fallbackIndex).pipe(res);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Página não encontrada');
      }
      return;
    }

    const ext = path.extname(safePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const totalSize = stats.size;
    const range = req.headers.range;

    // Suporte a HTTP Range Requests (essencial para streaming de áudio .mp3 no Chrome/Safari)
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

      if (start >= totalSize || end >= totalSize) {
        res.writeHead(416, {
          'Content-Range': `bytes */${totalSize}`,
          'Access-Control-Allow-Origin': '*'
        });
        return res.end();
      }

      const chunkSize = (end - start) + 1;
      const fileStream = fs.createReadStream(safePath, { start, end });
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${totalSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*'
      });
      fileStream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': totalSize,
        'Accept-Ranges': 'bytes',
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*'
      });
      fs.createReadStream(safePath).pipe(res);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🎈 Convite de Festa da Micaella rodando na porta ${PORT}!`);
  console.log(`🌐 Pronto para receber convidados!`);
  console.log(`=======================================================`);
});
