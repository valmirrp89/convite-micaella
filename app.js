// Estado da aplicação
let eventData = {
  childName: "Micaella",
  age: "4 Anos",
  title: "4º Aniversário da Micaella! 🌺🌊",
  subtitle: "O horizonte me chama! Venha comemorar os 4 aninhos da Micaella em uma grande aventura tropical com piscina, sol e muita diversão!",
  theme: "Moana - Um Mar de Aventuras",
  photoUrl: "aniversariante.jpg",
  date: "2026-12-19",
  time: "10:00",
  endTime: "18:00",
  cakeTime: "16:00",
  locationName: "Festa da Micaella (Rua Ouro Velho)",
  address: "Rua Ouro Velho, 116",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Rua+Ouro+Velho%2C+116",
  description: "Se no dia tiver sol, teremos piscina liberada a partir das 10:00 da manhã! Traga roupa de banho e toalha para se refrescar. O corte do bolo será às 16:00 da tarde! Venha comemorar esses 4 aninhos inesquecíveis da nossa linda Micaella!",
  rsvpDeadline: "12/12/2026",
  contactPhone: "(11) 99999-8888"
};

let guestsList = [];
let countdownInterval = null;

// Stepper auxiliar para botões + e -
function stepVal(inputId, delta) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const current = parseInt(input.value, 10) || 0;
  const min = parseInt(input.min, 10) || 0;
  const max = parseInt(input.max, 10) || 20;
  const newVal = Math.min(max, Math.max(min, current + delta));
  input.value = newVal;
}

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
  initConfetti();
  initMusicPlayer();
  await loadEvent();
  await loadGuests();
  setupEventListeners();
  startCountdown();
});

// Carregar dados do evento
async function loadEvent() {
  try {
    const res = await fetch('/api/event');
    if (res.ok) {
      eventData = await res.json();
    }
  } catch (err) {
    console.warn('API offline, usando dados em cache/padrão', err);
    const local = localStorage.getItem('party_event');
    if (local) eventData = JSON.parse(local);
  }
  renderEvent();
}

// Renderizar informações do evento na tela
function renderEvent() {
  document.title = `Convite: ${eventData.title || 'Festa Infantil Moana'}`;
  
  setText('event-title', eventData.title || `4º Aniversário da Moana!`);
  setText('event-age', `🌺 ${eventData.age || '4 Anos!'} 🌺`);
  setText('event-subtitle', eventData.subtitle || 'Venha comemorar conosco!');
  setText('display-location-name', eventData.locationName || 'Rua Ouro Velho, 116');
  setText('display-address', eventData.address || 'Rua Ouro Velho, 116');
  setText('event-description', eventData.description || '');
  setText('rsvp-deadline', eventData.rsvpDeadline || '12/12/2026');
  setText('display-pool-time', `A partir das ${eventData.time || '10:00'} da manhã`);
  setText('display-cake-time', `Às ${eventData.cakeTime || '16:00'} horas da tarde 🎉`);

  const photoEl = document.getElementById('child-photo');
  if (photoEl && eventData.photoUrl) {
    photoEl.src = eventData.photoUrl;
  }

  // Formatar data em português
  if (eventData.date) {
    try {
      const parts = eventData.date.split('-');
      if (parts.length === 3) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        let formatted = d.toLocaleDateString('pt-BR', options);
        // Capitalizar primeira letra
        formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
        setText('display-date', formatted);
      }
    } catch (e) {
      setText('display-date', eventData.date);
    }
  }

  // Horário
  let timeStr = `A partir das ${eventData.time || '16:00'}`;
  if (eventData.endTime) {
    timeStr = `Das ${eventData.time} às ${eventData.endTime}`;
  }
  setText('display-time', timeStr);

  // Link do mapa
  const mapBtn = document.getElementById('btn-map');
  if (mapBtn) {
    mapBtn.href = eventData.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(eventData.address)}`;
  }

  // Link do Google Calendar
  setupCalendarLink();
}

// Contagem Regressiva
function startCountdown() {
  if (countdownInterval) clearInterval(countdownInterval);

  function update() {
    if (!eventData.date) return;
    const timePart = eventData.time ? `${eventData.time}:00` : '16:00:00';
    const targetDate = new Date(`${eventData.date}T${timePart}`);
    const now = new Date();
    const diff = targetDate - now;

    if (diff <= 0) {
      setText('days', '00');
      setText('hours', '00');
      setText('minutes', '00');
      setText('seconds', '00');
      const sub = document.querySelector('.card-subtitle');
      if (sub) sub.innerText = 'É HOJE! A FESTA COMEÇOU! 🎉🥳';
      return;
    }

    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / (1000 * 60)) % 60);
    const s = Math.floor((diff / 1000) % 60);

    setText('days', String(d).padStart(2, '0'));
    setText('hours', String(h).padStart(2, '0'));
    setText('minutes', String(m).padStart(2, '0'));
    setText('seconds', String(s).padStart(2, '0'));
  }

  update();
  countdownInterval = setInterval(update, 1000);
}

// Carregar lista de convidados
async function loadGuests() {
  const listEl = document.getElementById('guests-list');
  try {
    const res = await fetch('/api/guests');
    if (res.ok) {
      const data = await res.json();
      guestsList = data.guests || [];
      renderGuests(guestsList);
      renderStats(data.stats);
      return;
    }
  } catch (err) {
    console.warn('API não conectada, usando localStorage');
    const local = localStorage.getItem('party_guests');
    if (local) {
      guestsList = JSON.parse(local);
      renderGuests(guestsList);
      calculateAndRenderStats(guestsList);
      return;
    }
  }

  // Se vazio
  renderGuests([]);
  renderStats({ totalConfirmations: 0, totalAdults: 0, totalChildren: 0, totalPeople: 0 });
}

// Renderizar estatísticas
function renderStats(stats) {
  const pills = document.getElementById('stats-pills');
  if (!pills || !stats) return;

  pills.innerHTML = `
    <span class="stat-pill"><strong>${stats.totalConfirmations || 0}</strong> ${stats.totalConfirmations === 1 ? 'Família/Grupo' : 'Famílias/Grupos'}</span>
    <span class="stat-pill"><strong>${stats.totalAdults || 0}</strong> Adultos</span>
    <span class="stat-pill"><strong>${stats.totalChildren || 0}</strong> Crianças</span>
    <span class="stat-pill" style="background:#FFE3EC; color:#D81B60;"><strong>${stats.totalPeople || 0}</strong> Pessoas no Total</span>
  `;
}

function calculateAndRenderStats(list) {
  const stats = list.reduce((acc, g) => {
    acc.totalConfirmations += 1;
    acc.totalAdults += Number(g.adults) || 1;
    acc.totalChildren += Number(g.children) || 0;
    acc.totalPeople += (Number(g.adults) || 1) + (Number(g.children) || 0);
    return acc;
  }, { totalConfirmations: 0, totalAdults: 0, totalChildren: 0, totalPeople: 0 });
  renderStats(stats);
}

// Renderizar Lista de Convidados
function renderGuests(list) {
  const container = document.getElementById('guests-list');
  if (!container) return;

  if (!list || list.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span style="font-size: 2.2rem; display: block; margin-bottom: 8px;">🎈</span>
        Seja o primeiro a confirmar sua presença acima!
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(g => {
    const initials = (g.name || 'C').substring(0, 2).toUpperCase();
    const adults = Number(g.adults) || 1;
    const kids = Number(g.children) || 0;
    
    let countBadge = `${adults} ${adults === 1 ? 'adulto' : 'adultos'}`;
    if (kids > 0) {
      countBadge += ` + ${kids} ${kids === 1 ? 'criança' : 'crianças'}`;
    }

    const companionsHtml = g.companionNames 
      ? `<div class="guest-companions-text">👥 Acompanhantes: <strong>${escapeHtml(g.companionNames)}</strong></div>`
      : '';

    const messageHtml = g.message
      ? `<div class="guest-message-bubble">💬 "${escapeHtml(g.message)}"</div>`
      : '';

    const dateFormatted = g.confirmedAt 
      ? new Date(g.confirmedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
      : '';

    return `
      <div class="guest-item">
        <div class="guest-avatar">${initials}</div>
        <div class="guest-content">
          <div class="guest-top">
            <span class="guest-name">${escapeHtml(g.name)}</span>
            <span class="guest-count-badge">${countBadge}</span>
          </div>
          ${companionsHtml}
          ${messageHtml}
          ${dateFormatted ? `<span class="guest-time">Confirmado em ${dateFormatted}</span>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// Event Listeners
function setupEventListeners() {
  // Envio de formulário RSVP
  const form = document.getElementById('rsvp-form');
  if (form) {
    form.addEventListener('submit', handleRsvpSubmit);
  }

  // Busca em tempo real de convidados
  const searchInput = document.getElementById('search-guest');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase().trim();
      if (!term) {
        renderGuests(guestsList);
        return;
      }
      const filtered = guestsList.filter(g => 
        (g.name && g.name.toLowerCase().includes(term)) ||
        (g.companionNames && g.companionNames.toLowerCase().includes(term)) ||
        (g.message && g.message.toLowerCase().includes(term))
      );
      renderGuests(filtered);
    });
  }

  // Copiar endereço
  const copyBtn = document.getElementById('btn-copy-address');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const fullText = `${eventData.locationName} - ${eventData.address}`;
      navigator.clipboard.writeText(fullText).then(() => {
        showToast('📋 Endereço copiado para a área de transferência!');
      }).catch(() => {
        showToast('Não foi possível copiar automaticamente.');
      });
    });
  }

  // Compartilhar WhatsApp
  const shareBtn = document.getElementById('btn-share-whatsapp');
  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      const pageUrl = window.location.href;
      const text = `🌺 *Você foi convidado para o 4º Aniversário da Micaella (Tema Moana)!* 🌊⛵\n\n` +
        `📅 *Data:* ${eventData.date} às ${eventData.time}\n` +
        `🎂 *Corte do Bolo:* às 16:00\n` +
        `📍 *Local:* ${eventData.address}\n\n` +
        `➡️ *Confirme sua presença no link:* ${pageUrl}`;
      const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
    });
  }
}

// Submissão do RSVP
async function handleRsvpSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = document.getElementById('btn-submit-rsvp');
  const statusMsg = document.getElementById('rsvp-status-msg');

  const name = form.name.value.trim();
  const adults = parseInt(form.adults.value, 10) || 1;
  const children = parseInt(form.children.value, 10) || 0;
  const companionNames = form.companionNames.value.trim();
  const message = form.message.value.trim();

  if (!name) {
    showStatusMsg('Por favor, informe seu nome.', 'error');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerText = 'Confirmando...';

  const guestPayload = {
    name,
    adults,
    children,
    companionNames,
    message
  };

  try {
    const res = await fetch('/api/guests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(guestPayload)
    });

    if (res.ok) {
      const data = await res.json();
      fireConfetti();
      showToast(`🎉 Presença de ${name} confirmada com sucesso!`);
      showStatusMsg(`Oba! Presença confirmada com sucesso! Te esperamos lá! 🎈`, 'success');
      form.reset();
      form.adults.value = 1;
      form.children.value = 0;
      await loadGuests();
      openRsvpModal(guestPayload);
    } else {
      throw new Error('Erro na resposta do servidor');
    }
  } catch (err) {
    console.warn('Usando armazenamento local (fallback offline)', err);
    // Fallback offline / local
    const offlineGuest = {
      id: Date.now().toString(),
      ...guestPayload,
      confirmedAt: new Date().toISOString()
    };
    guestsList.unshift(offlineGuest);
    localStorage.setItem('party_guests', JSON.stringify(guestsList));
    renderGuests(guestsList);
    calculateAndRenderStats(guestsList);

    fireConfetti();
    showToast(`🎉 Presença de ${name} confirmada!`);
    showStatusMsg(`Presença confirmada com sucesso! 🎈`, 'success');
    form.reset();
    form.adults.value = 1;
    form.children.value = 0;
    openRsvpModal(guestPayload);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = '🌺 Confirmar e Encaminhar no WhatsApp! ⛵';
  }
}

// Modal de Confirmação com WhatsApp
let lastConfirmedGuestText = '';

function openRsvpModal(guest) {
  const modal = document.getElementById('rsvp-modal');
  if (!modal) return;

  const total = (Number(guest.adults) || 1) + (Number(guest.children) || 0);
  const summaryEl = document.getElementById('modal-guest-summary');
  if (summaryEl) {
    summaryEl.innerText = `Obrigado, ${guest.name}! Registramos ${total} ${total === 1 ? 'pessoa' : 'pessoas'} no site.`;
  }

  // Montar mensagem formatada com os nomes de quem vai
  let msg = `🌺 *CONFIRMAÇÃO DE PRESENÇA - 4º ANIVER DA MICAELLA!* 🌊⛵\n\n`;
  msg += `👤 *Convidado(a):* ${guest.name}\n`;
  msg += `👥 *Total de Pessoas:* ${total} (${guest.adults} ${guest.adults === 1 ? 'Adulto' : 'Adultos'} e ${guest.children} ${guest.children === 1 ? 'Criança' : 'Crianças'})\n`;
  if (guest.companionNames) {
    msg += `👫 *Quem vai vir junto:* ${guest.companionNames}\n`;
  }
  if (guest.message) {
    msg += `💬 *Recadinho:* "${guest.message}"\n`;
  }
  msg += `\n☀️ Estaremos lá no dia 19/12 para curtir a piscina e comemorar os 4 aninhos da Micaella! 🏊‍♀️🎂🎉`;

  lastConfirmedGuestText = msg;

  const previewEl = document.getElementById('modal-preview-msg');
  if (previewEl) {
    previewEl.innerText = msg;
  }

  // Copia o texto automaticamente para a área de transferência
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(msg).then(() => {
      showToast('📋 Nomes de quem vai copiados! Agora é só colar no grupo.');
    }).catch(() => {});
  }

  const groupUrl = eventData.whatsappGroupUrl || 'https://chat.whatsapp.com/FdhFkFGozFEDvBZ2woKcJ0';
  const shareUrl = 'https://api.whatsapp.com/send?text=' + encodeURIComponent(msg);

  const groupBtn = document.getElementById('btn-modal-open-group');
  if (groupBtn) {
    groupBtn.href = groupUrl;
  }

  const sendBtn = document.getElementById('btn-modal-send-msg');
  if (sendBtn) {
    sendBtn.href = shareUrl;
  }

  const copyBtn = document.getElementById('btn-modal-copy-msg');
  if (copyBtn) {
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(msg).then(() => {
        showToast('📋 Nomes copiados com sucesso! Basta colar no grupo.');
      }).catch(() => {
        showToast('Texto exibido na tela!');
      });
    };
  }

  modal.style.display = 'flex';

  // Abre diretamente o grupo do WhatsApp da Micaella
  try {
    window.open(groupUrl, '_blank');
  } catch (e) {
    console.log('Navegador bloqueou popup automático, o usuário pode clicar no botão verde');
  }
}

function closeRsvpModal() {
  const modal = document.getElementById('rsvp-modal');
  if (modal) modal.style.display = 'none';
}

// Controle de Música da Moana (Foto da Micaella como Botão Play)
function initMusicPlayer() {
  const audio = document.getElementById('bg-music');
  const topBtn = document.getElementById('btn-toggle-music');
  const textEl = document.getElementById('music-btn-text');
  const iconEl = document.getElementById('music-note-icon');

  const photoBtn = document.getElementById('photo-music-btn');
  const photoPlayIcon = document.getElementById('photo-play-icon');
  const captionPill = document.getElementById('photo-caption-pill');
  const captionText = document.getElementById('photo-caption-text');

  if (!audio) return;

  // Volume confortável (65%)
  audio.volume = 0.65;

  function setPlayingState(isPlaying) {
    if (isPlaying) {
      if (topBtn) topBtn.classList.add('playing');
      if (textEl) textEl.innerText = 'Pausar Música';
      if (iconEl) iconEl.innerText = '🌺';

      if (photoBtn) photoBtn.classList.add('is-playing');
      if (photoPlayIcon) photoPlayIcon.innerText = '⏸️';
      if (captionText) captionText.innerText = 'Tocando: Saber Quem Sou 🎶 (Toque para pausar)';
    } else {
      if (topBtn) topBtn.classList.remove('playing');
      if (textEl) textEl.innerText = 'Música da Moana 🌺';
      if (iconEl) iconEl.innerText = '🎵';

      if (photoBtn) photoBtn.classList.remove('is-playing');
      if (photoPlayIcon) photoPlayIcon.innerText = '▶️';
      if (captionText) captionText.innerText = 'Toque na foto da Micaella para tocar a música! 🌺';
    }
  }

  function toggleMusic(e) {
    if (e) e.stopPropagation();

    if (audio.paused) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setPlayingState(true);
            showToast('🎶 Tocando: Saber Quem Sou (Moana)!');
          })
          .catch(err => {
            console.warn('Erro ao reproduzir áudio:', err);
            showToast('Dê mais um toque na foto para liberar o áudio!');
          });
      }
    } else {
      audio.pause();
      setPlayingState(false);
    }
  }

  // Clicar na foto da Micaella toca / pausa
  if (photoBtn) {
    photoBtn.addEventListener('click', toggleMusic);
    photoBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleMusic();
      }
    });
  }

  // Clicar na legenda abaixo da foto toca / pausa
  if (captionPill) {
    captionPill.addEventListener('click', toggleMusic);
  }

  // Clicar no botão do topo toca / pausa
  if (topBtn) {
    topBtn.addEventListener('click', toggleMusic);
  }

  audio.addEventListener('play', () => setPlayingState(true));
  audio.addEventListener('pause', () => setPlayingState(false));

  audio.addEventListener('error', () => {
    console.warn('Áudio não carregado ou arquivo ausente no servidor:', audio.error);
    setPlayingState(false);
    if (captionText) captionText.innerText = 'Toque na foto para ouvir a música!';
  });

  // Tenta iniciar no primeiro clique em qualquer lugar da tela
  const unlockAudio = () => {
    if (audio.paused) {
      audio.play().then(() => {
        setPlayingState(true);
      }).catch(() => {});
    }
    document.removeEventListener('click', unlockAudio);
    document.removeEventListener('touchstart', unlockAudio);
  };

  document.addEventListener('click', unlockAudio, { once: true });
  document.addEventListener('touchstart', unlockAudio, { once: true });
}

// Configurar Link do Google Calendar
function setupCalendarLink() {
  const calBtn = document.getElementById('btn-add-calendar');
  if (!calBtn || !eventData.date) return;

  const cleanDate = eventData.date.replace(/-/g, '');
  const startTime = (eventData.time || '16:00').replace(':', '') + '00';
  const endTime = (eventData.endTime || '20:30').replace(':', '') + '00';

  const startIso = `${cleanDate}T${startTime}`;
  const endIso = `${cleanDate}T${endTime}`;

  const calUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE` +
    `&text=${encodeURIComponent(eventData.title || `Aniversário de ${eventData.childName}`)}` +
    `&dates=${startIso}/${endIso}` +
    `&details=${encodeURIComponent(eventData.description || 'Festa de Aniversário Infantil!')}` +
    `&location=${encodeURIComponent(`${eventData.locationName}, ${eventData.address}`)}`;

  calBtn.href = calUrl;
}

// Utilitários
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.innerText = text;
}

function showStatusMsg(msg, type) {
  const el = document.getElementById('rsvp-status-msg');
  if (!el) return;
  el.innerText = msg;
  el.className = `status-message ${type}`;
  el.style.display = 'block';
  setTimeout(() => {
    el.style.display = 'none';
  }, 6000);
}

function showToast(text) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.innerText = text;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* =========================================
   CANVAS CONFETTI ENGINE (Zero dependências)
   ========================================= */
let confettiCanvas, confettiCtx, particles = [];
let confettiRunning = false;

function initConfetti() {
  confettiCanvas = document.getElementById('confetti-canvas');
  if (!confettiCanvas) return;
  confettiCtx = confettiCanvas.getContext('2d');
  resizeConfettiCanvas();
  window.addEventListener('resize', resizeConfettiCanvas);
}

function resizeConfettiCanvas() {
  if (!confettiCanvas) return;
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}

function fireConfetti() {
  if (!confettiCanvas || !confettiCtx) return;
  particles = [];
  const colors = ['#E76F51', '#00A896', '#F4A261', '#028090', '#FFE66D', '#FF5E7E', '#52B788'];
  const count = 120;

  for (let i = 0; i < count; i++) {
    particles.push({
      x: window.innerWidth / 2,
      y: window.innerHeight * 0.4,
      r: Math.random() * 6 + 4,
      dx: (Math.random() - 0.5) * 14,
      dy: (Math.random() - 0.7) * 16,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 10,
      tiltSpeed: Math.random() * 0.1 + 0.05,
      opacity: 1
    });
  }

  if (!confettiRunning) {
    confettiRunning = true;
    animateConfetti();
  }
}

function animateConfetti() {
  if (!confettiRunning) return;
  confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

  let activeParticles = 0;
  for (let p of particles) {
    p.x += p.dx;
    p.y += p.dy;
    p.dy += 0.35; // Gravidade
    p.tilt += p.tiltSpeed;
    p.opacity -= 0.008;

    if (p.opacity > 0 && p.y < confettiCanvas.height) {
      activeParticles++;
      confettiCtx.save();
      confettiCtx.fillStyle = p.color;
      confettiCtx.globalAlpha = Math.max(0, p.opacity);
      confettiCtx.beginPath();
      confettiCtx.ellipse(p.x, p.y, p.r, p.r * Math.abs(Math.sin(p.tilt)), p.tilt, 0, Math.PI * 2);
      confettiCtx.fill();
      confettiCtx.restore();
    }
  }

  if (activeParticles > 0) {
    requestAnimationFrame(animateConfetti);
  } else {
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    confettiRunning = false;
  }
}
