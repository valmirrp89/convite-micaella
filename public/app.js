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
  contactPhone: "(11) 99999-8888",
  adminPassword: "Micaella2022"
};

let guestsList = [];
let countdownInterval = null;

// Lista de fotos da Micaella para o carrossel e gotas
const micaellaPhotos = [
  { src: 'aniversariante.jpg', caption: 'Micaella - 4 Aninhos de muita alegria e luz! 🌺🌊' },
  { src: 'fotos/foto1.jpg', caption: 'Mandando um beijinho doce e carinhoso! 💖' },
  { src: 'fotos/foto2.jpg', caption: 'Toda arrumadinha com fitinhas coloridas! 🎀' },
  { src: 'fotos/foto3.jpg', caption: 'Bebê Micaella de turbante rosa - Amor da vida! 👶🌸' },
  { src: 'fotos/foto4.jpg', caption: 'Aquele sorrisinho sapeca que encanta a todos! ✨' },
  { src: 'fotos/foto5.jpg', caption: 'Descansando bem quentinha e charmosa! 🧸' },
  { src: 'fotos/foto6.jpg', caption: 'Princesa passeando com seu bichinho roxo! 💜' },
  { src: 'fotos/foto7.jpg', caption: 'Mandando beijinho de boa noite de pijama! 🌙' },
  { src: 'fotos/foto8.jpg', caption: 'Aniversário de 2 aninhos no fundo do mar! 🎂🌊' },
  { src: 'fotos/foto9.jpg', caption: 'Descendo a escada toda sorridente com seu ursinho! 🐾' },
  { src: 'fotos/foto10.jpg', caption: 'Voando alto sob o céu de sombrinhas coloridas! ☂️☀️' }
];

let currentPhotoIndex = 0;
let photoSlideshowInterval = null;

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
  initPhotoSlideshow();
  initFallingWaterDrops();
  initWaterAlbum();
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

// Carrossel da Foto Principal com efeito de gota d'água
function initPhotoSlideshow() {
  const photoImg = document.getElementById('child-photo');
  const dotsContainer = document.getElementById('photo-dots');
  if (!photoImg) return;

  if (dotsContainer) {
    dotsContainer.innerHTML = micaellaPhotos.map((_, i) => 
      `<span class="photo-dot ${i === 0 ? 'active' : ''}" onclick="goToPhoto(${i})"></span>`
    ).join('');
  }

  function advancePhoto() {
    currentPhotoIndex = (currentPhotoIndex + 1) % micaellaPhotos.length;
    showPhotoWithRipple(currentPhotoIndex);
  }

  photoSlideshowInterval = setInterval(advancePhoto, 3600);
}

function showPhotoWithRipple(index) {
  const photoImg = document.getElementById('child-photo');
  const rippleEl = document.getElementById('water-drop-ripple');
  const dots = document.querySelectorAll('.photo-dot');
  if (!photoImg) return;

  currentPhotoIndex = index;

  if (rippleEl) {
    rippleEl.classList.remove('active');
    void rippleEl.offsetWidth;
    rippleEl.classList.add('active');
  }

  photoImg.style.transition = 'transform 0.25s ease, opacity 0.25s ease';
  photoImg.style.transform = 'scale(0.9)';
  photoImg.style.opacity = '0.6';

  setTimeout(() => {
    photoImg.src = micaellaPhotos[currentPhotoIndex].src;
    photoImg.style.transform = 'scale(1)';
    photoImg.style.opacity = '1';
  }, 200);

  dots.forEach((d, i) => {
    if (i === currentPhotoIndex) d.classList.add('active');
    else d.classList.remove('active');
  });
}

function goToPhoto(index) {
  if (photoSlideshowInterval) {
    clearInterval(photoSlideshowInterval);
    photoSlideshowInterval = setInterval(() => {
      currentPhotoIndex = (currentPhotoIndex + 1) % micaellaPhotos.length;
      showPhotoWithRipple(currentPhotoIndex);
    }, 4500);
  }
  showPhotoWithRipple(index);
}

// =========================================
// MOTOR DE GOTAS D'ÁGUA CAINDO E ESTOURANDO
// =========================================
function initFallingWaterDrops() {
  const container = document.getElementById('water-drops-container');
  if (!container) return;

  function spawnWaterDrop() {
    const existingDrops = container.querySelectorAll('.falling-water-drop');
    if (existingDrops.length >= 4) return;

    const drop = document.createElement('div');
    drop.className = 'falling-water-drop';

    const photoObj = micaellaPhotos[Math.floor(Math.random() * micaellaPhotos.length)];
    const size = Math.floor(Math.random() * 24) + 68; // 68px a 92px
    const startX = Math.floor(Math.random() * (window.innerWidth - size - 24)) + 12;
    const duration = (Math.random() * 3 + 7); // 7s a 10s queda suave

    drop.style.width = `${size}px`;
    drop.style.height = `${Math.round(size * 1.15)}px`;
    drop.style.left = `${startX}px`;
    drop.style.top = `-${size + 20}px`;

    drop.innerHTML = `<img src="${photoObj.src}" alt="Micaella">`;

    let posY = -size - 20;
    let wobbleAngle = Math.random() * Math.PI * 2;
    let active = true;

    function fallStep() {
      if (!active) return;
      posY += (window.innerHeight / (duration * 60));
      wobbleAngle += 0.035;
      const wobbleX = Math.sin(wobbleAngle) * 14;

      drop.style.transform = `translate3d(${wobbleX}px, ${posY}px, 0)`;

      if (posY > window.innerHeight - 70) {
        popDrop(drop, photoObj, false);
        active = false;
        return;
      }

      requestAnimationFrame(fallStep);
    }

    drop.addEventListener('click', (e) => {
      e.stopPropagation();
      active = false;
      popDrop(drop, photoObj, true);
    });

    container.appendChild(drop);
    requestAnimationFrame(fallStep);
  }

  setInterval(spawnWaterDrop, 3400);
  setTimeout(spawnWaterDrop, 800);
  setTimeout(spawnWaterDrop, 2200);
}

function popDrop(dropEl, photoObj, openLightbox) {
  if (!dropEl || dropEl.dataset.popped) return;
  dropEl.dataset.popped = 'true';

  const rect = dropEl.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  createWaterSplash(centerX, centerY);

  dropEl.classList.add('popping');

  setTimeout(() => {
    if (dropEl.parentNode) dropEl.parentNode.removeChild(dropEl);
  }, 340);

  if (openLightbox) {
    openDropLightbox(photoObj.src, photoObj.caption);
  }
}

function createWaterSplash(x, y) {
  const container = document.body;
  const particleCount = 8;
  for (let i = 0; i < particleCount; i++) {
    const p = document.createElement('div');
    p.className = 'water-splash-particle';
    const angle = (i / particleCount) * Math.PI * 2 + (Math.random() * 0.4);
    const dist = Math.random() * 35 + 20;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    const pSize = Math.random() * 5 + 6;

    p.style.width = `${pSize}px`;
    p.style.height = `${pSize}px`;
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
    p.style.setProperty('--dx', `${dx}px`);
    p.style.setProperty('--dy', `${dy}px`);

    container.appendChild(p);
    setTimeout(() => {
      if (p.parentNode) p.parentNode.removeChild(p);
    }, 550);
  }
}

// =========================================
// ÁLBUM DE GOTAS D'ÁGUA ESTOURO INTERATIVO
// =========================================
function initWaterAlbum() {
  const grid = document.getElementById('water-drops-grid');
  if (!grid) return;

  grid.innerHTML = micaellaPhotos.map((photo, i) => `
    <div class="grid-water-drop" onclick="handleGridDropClick(this, '${photo.src}', '${escapeHtml(photo.caption)}')">
      <img src="${photo.src}" alt="Micaella ${i + 1}" loading="lazy">
      <span class="pop-hint">💧</span>
    </div>
  `).join('');
}

function handleGridDropClick(el, src, caption) {
  const rect = el.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;

  createWaterSplash(x, y);

  el.style.transform = 'scale(1.22)';
  setTimeout(() => {
    el.style.transform = '';
    openDropLightbox(src, caption);
  }, 160);
}

function openDropLightbox(src, caption) {
  const modal = document.getElementById('drop-lightbox-modal');
  const img = document.getElementById('lightbox-img');
  const captionEl = document.getElementById('lightbox-caption');
  if (!modal || !img) return;

  img.src = src;
  if (captionEl) captionEl.innerText = caption || 'Micaella - 4 Aninhos! 🌺';
  modal.style.display = 'flex';
}

function closeDropLightbox() {
  const modal = document.getElementById('drop-lightbox-modal');
  if (modal) modal.style.display = 'none';
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
   ACESSO AO PAINEL DE CONTROLE COM SENHA
   ========================================= */
function openAdminPasswordModal() {
  const modal = document.getElementById('admin-pwd-modal');
  const input = document.getElementById('admin-pwd-input');
  const errorMsg = document.getElementById('admin-pwd-error');
  const rememberCheckbox = document.getElementById('admin-pwd-remember');
  if (errorMsg) errorMsg.style.display = 'none';

  // Carrega senha salva se houver
  const savedPwd = localStorage.getItem('saved_admin_password');
  if (savedPwd) {
    if (input) input.value = savedPwd;
    if (rememberCheckbox) rememberCheckbox.checked = true;
  } else {
    if (input) input.value = '';
    if (rememberCheckbox) rememberCheckbox.checked = true;
  }

  if (modal) {
    modal.style.display = 'flex';
    setTimeout(() => {
      if (input) {
        input.focus();
        if (savedPwd) input.select();
      }
    }, 120);
  }
}

function closeAdminPasswordModal(e) {
  if (e && e.target !== e.currentTarget) return;
  const modal = document.getElementById('admin-pwd-modal');
  if (modal) modal.style.display = 'none';
}

function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    if (btn) btn.innerText = '🙈';
  } else {
    input.type = 'password';
    if (btn) btn.innerText = '👁️';
  }
}

function handleAdminPasswordSubmit(e) {
  e.preventDefault();
  const input = document.getElementById('admin-pwd-input');
  const errorMsg = document.getElementById('admin-pwd-error');
  const rememberCheckbox = document.getElementById('admin-pwd-remember');
  const entered = (input ? input.value : '').trim();
  const correctPassword = String((eventData && eventData.adminPassword) || 'Micaella2022');

  if (entered === correctPassword) {
    // Salvar ou remover senha salva no aparelho
    if (rememberCheckbox && rememberCheckbox.checked) {
      localStorage.setItem('saved_admin_password', entered);
    } else {
      localStorage.removeItem('saved_admin_password');
    }

    // Autenticado com sucesso na sessão
    sessionStorage.setItem('admin_authenticated', 'true');
    sessionStorage.setItem('admin_auth_time', Date.now().toString());
    window.location.href = 'admin.html';
  } else {
    if (errorMsg) {
      errorMsg.style.display = 'block';
      errorMsg.classList.remove('shake');
      void errorMsg.offsetWidth;
      errorMsg.classList.add('shake');
    }
    if (input) {
      input.select();
      input.focus();
    }
  }
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
