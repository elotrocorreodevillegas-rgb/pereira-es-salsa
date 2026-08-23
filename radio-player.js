(() => {
  const STREAM_URL = 'https://radio35.virtualtronics.com/proxy/siganlaclave?mp=/stream';
  const META_URL = 'https://radio35.virtualtronics.com:2199/external/rpc.php?m=streaminfo.get&username=siganlaclave&mountpoint=/stream';
  const STATION_ART = '/assets/images/siganlaclave-logo.png';

  const player = document.createElement('aside');
  player.className = 'radio-dock';
  player.setAttribute('aria-label', 'Reproductor de Sigan la Clave');
  player.innerHTML = `
    <audio data-radio-audio preload="none"></audio>
    <div class="radio-art-wrap">
      <img class="radio-art" data-radio-art src="${STATION_ART}" alt="Sigan la Clave">
      <span class="radio-live-pulse" aria-hidden="true"></span>
    </div>
    <div class="radio-copy">
      <div class="radio-station"><span class="radio-live-label">EN VIVO</span> Sigan la Clave</div>
      <div class="radio-track" data-radio-track aria-live="polite">Salsa 24/7 desde Colombia</div>
      <div class="radio-status" data-radio-status>Emisora oficial de Pereira es Salsa</div>
    </div>
    <div class="radio-actions">
      <label class="radio-volume" aria-label="Volumen">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4zm11.5 3a3.5 3.5 0 0 0-1.5-2.87v5.74A3.5 3.5 0 0 0 15.5 12zm0-7.18v2.06a6 6 0 0 1 0 10.24v2.06a8 8 0 0 0 0-14.36z"/></svg>
        <input data-radio-volume type="range" min="0" max="100" value="82">
      </label>
      <button class="radio-main-control" data-radio-main type="button" aria-label="Reproducir Sigan la Clave">
        <svg class="icon-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
        <svg class="icon-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>
        <span class="radio-spinner" aria-hidden="true"></span>
      </button>
    </div>`;
  document.body.append(player);

  const whatsapp = document.createElement('a');
  whatsapp.className = 'whatsapp-float';
  whatsapp.href = 'https://wa.me/573205282582?text=Hola%20Pereira%20es%20Salsa';
  whatsapp.target = '_blank';
  whatsapp.rel = 'noopener noreferrer';
  whatsapp.setAttribute('aria-label', 'Escribir a Pereira es Salsa por WhatsApp');
  whatsapp.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm5.78 14.09c-.24.68-1.4 1.32-1.93 1.38-.5.06-1.06.28-3.6-.75-3.05-1.24-5.02-4.35-5.17-4.55-.15-.2-1.23-1.64-1.23-3.13s.78-2.22 1.05-2.52c.27-.3.6-.37.8-.37.2 0 .4 0 .58.01.19.01.44-.07.68.53.25.6.85 2.08.92 2.24.07.15.12.33.02.53-.1.2-.15.32-.3.5-.15.17-.31.38-.44.5-.15.15-.3.31-.13.6.17.3.76 1.26 1.64 2.04 1.13 1 2.08 1.32 2.38 1.47.3.15.47.12.65-.08.17-.2.73-.85.93-1.14.2-.3.4-.24.66-.15.27.1 1.73.82 2.02.97.3.15.5.22.57.35.07.12.07.7-.17 1.38z"/></svg>';
  document.body.append(whatsapp);

  const audio = player.querySelector('[data-radio-audio]');
  const mainButton = player.querySelector('[data-radio-main]');
  const track = player.querySelector('[data-radio-track]');
  const status = player.querySelector('[data-radio-status]');
  const artwork = player.querySelector('[data-radio-art]');
  const volume = player.querySelector('[data-radio-volume]');
  const accessButtons = [...document.querySelectorAll('[data-radio-toggle]')];
  let state = 'paused';
  let metaTimer;
  let currentMeta = { artist: 'Sigan la Clave', title: 'Salsa 24/7', artwork: STATION_ART };

  const savedVolume = Number(localStorage.getItem('siganLaClaveVolume'));
  audio.volume = Number.isFinite(savedVolume) ? Math.min(1, Math.max(0, savedVolume)) : 0.82;
  volume.value = Math.round(audio.volume * 100);

  function renderState(nextState) {
    state = nextState;
    player.dataset.state = state;
    const playing = state === 'playing';
    const loading = state === 'loading';
    mainButton.setAttribute('aria-label', playing ? 'Pausar Sigan la Clave' : 'Reproducir Sigan la Clave');
    accessButtons.forEach(button => {
      button.classList.toggle('is-playing', playing);
      button.setAttribute('aria-pressed', String(playing));
      const label = button.querySelector('[data-radio-button-label]');
      if (label) label.textContent = loading ? 'Conectando…' : playing ? 'Pausar radio' : 'Escuchar en vivo';
    });
  }

  function play() {
    if (!audio.src) audio.src = STREAM_URL;
    renderState('loading');
    status.textContent = 'Conectando con la señal en vivo…';
    audio.play().then(() => {
      renderState('playing');
      status.textContent = 'Sonando ahora';
      updateMetadata();
      clearInterval(metaTimer);
      metaTimer = setInterval(updateMetadata, 20000);
    }).catch(() => {
      renderState('error');
      status.textContent = 'No se pudo conectar. Intenta nuevamente.';
    });
  }

  function pause() {
    audio.pause();
    renderState('paused');
    status.textContent = 'Emisora oficial de Pereira es Salsa';
    clearInterval(metaTimer);
  }

  function toggle() {
    state === 'playing' || state === 'loading' ? pause() : play();
  }

  async function updateMetadata() {
    try {
      const response = await fetch(META_URL, { cache: 'no-store' });
      if (!response.ok) throw new Error('metadata unavailable');
      const payload = await response.json();
      const data = payload.data?.[0];
      if (!data || data.offline) {
        status.textContent = 'La emisora está fuera de línea';
        return;
      }
      const artist = data.track?.artist?.trim() || 'Sigan la Clave';
      const title = data.track?.title?.trim() || data.song?.trim() || 'Salsa 24/7';
      const image = data.track?.imageurl || STATION_ART;
      currentMeta = { artist, title, artwork: image };
      track.textContent = `${artist} — ${title}`;
      artwork.src = image;
      artwork.alt = `Carátula de ${title}, ${artist}`;
      if (state === 'playing') status.textContent = data.listeners === 1 ? 'Sonando ahora · 1 oyente' : `Sonando ahora · ${data.listeners || 0} oyentes`;
      updateMediaSession();
    } catch {
      track.textContent = 'Sigan la Clave — Salsa 24/7';
    }
  }

  function updateMediaSession() {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentMeta.title,
      artist: currentMeta.artist,
      album: 'Sigan la Clave · En vivo',
      artwork: [{ src: currentMeta.artwork, sizes: '100x100' }]
    });
  }

  mainButton.addEventListener('click', toggle);
  accessButtons.forEach(button => button.addEventListener('click', toggle));
  volume.addEventListener('input', () => {
    audio.volume = Number(volume.value) / 100;
    localStorage.setItem('siganLaClaveVolume', String(audio.volume));
  });
  audio.addEventListener('playing', () => renderState('playing'));
  audio.addEventListener('waiting', () => renderState('loading'));
  audio.addEventListener('error', () => {
    renderState('error');
    status.textContent = 'Se perdió la conexión. Toca play para reconectar.';
  });
  if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('play', play);
    navigator.mediaSession.setActionHandler('pause', pause);
  }
  renderState('paused');
  updateMetadata();
})();
