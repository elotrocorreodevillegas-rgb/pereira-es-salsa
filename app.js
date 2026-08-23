const menuButton = document.querySelector('.menu-button');
const menu = document.querySelector('#menu');
menuButton?.addEventListener('click', () => {
  const open = menu.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
});

document.querySelector('#year').textContent = new Date().getFullYear();

const list = document.querySelector('#event-list');
const empty = document.querySelector('#event-empty');
const formatter = new Intl.DateTimeFormat('es-CO', {dateStyle: 'long', timeZone: 'America/Bogota'});

function safeText(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}

fetch('data/events.json')
  .then(response => {
    if (!response.ok) throw new Error('No se pudo cargar la agenda');
    return response.json();
  })
  .then(events => {
    const today = new Date().toISOString().slice(0, 10);
    const upcoming = events.filter(event => event.status === 'verified' && event.date >= today).sort((a, b) => a.date.localeCompare(b.date));
    if (!upcoming.length) { empty.hidden = false; return; }
    list.innerHTML = upcoming.map(event => `<article class="event-card">
      <p class="event-date">${formatter.format(new Date(`${event.date}T12:00:00-05:00`))}</p>
      <h3>${safeText(event.name)}</h3><p>${safeText(event.venue)} · ${safeText(event.city)}</p>
      <a class="text-link" href="${safeText(event.url)}" target="_blank" rel="noopener noreferrer">Información oficial →</a>
    </article>`).join('');
  })
  .catch(() => { empty.hidden = false; });
