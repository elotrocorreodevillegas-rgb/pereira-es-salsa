const menuButton = document.querySelector('.menu-button');
const menu = document.querySelector('#menu');
menuButton?.addEventListener('click', () => {
  const open = menu.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
});
menu?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  menu.classList.remove('open');
  menuButton?.setAttribute('aria-expanded', 'false');
}));

const path = window.location.pathname;
menu?.querySelectorAll('a').forEach(link => {
  const href = link.getAttribute('href');
  if ((href === '/eventos/' && path.startsWith('/eventos/')) || (href === '/archivo-eventos/' && path.startsWith('/archivo-eventos/'))) {
    link.setAttribute('aria-current', 'page');
  }
});

const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();

const list = document.querySelector('#event-list');
const empty = document.querySelector('#event-empty');
const formatter = new Intl.DateTimeFormat('es-CO', {dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Bogota'});

function safeText(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}

if (list && empty) fetch('/data/events.json')
  .then(response => {
    if (!response.ok) throw new Error('No se pudo cargar la agenda');
    return response.json();
  })
  .then(events => {
    const now = Date.now();
    const upcoming = events.filter(event => event.status !== 'cancelled' && Date.parse(event.endDate || event.startDate) >= now).sort((a, b) => a.startDate.localeCompare(b.startDate));
    if (!upcoming.length) { empty.hidden = false; return; }
    list.innerHTML = upcoming.map(event => `<article class="event-card">
      <img src="${safeText(event.image)}" width="600" height="338" loading="lazy" alt="${safeText(event.name)}">
      <p class="event-date">${formatter.format(new Date(event.startDate))}</p>
      <h3>${safeText(event.name)}</h3><p>${safeText(event.venue.name)} · ${safeText(event.venue.city)}</p>
      <a class="text-link" href="${safeText(event.pageUrl)}">Ver evento →</a>
    </article>`).join('');
  })
  .catch(() => { empty.hidden = false; });
