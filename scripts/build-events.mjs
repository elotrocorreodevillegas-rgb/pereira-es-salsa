import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.env.BUILD_ROOT ? path.resolve(process.env.BUILD_ROOT) : process.cwd();
const SITE = 'https://www.pereiraessalsa.com';
const sourcePath = process.env.EVENTS_SOURCE ? path.resolve(process.env.EVENTS_SOURCE) : path.join(ROOT, 'content/events.json');
const publicPath = path.join(ROOT, 'data/events.json');
const eventsDir = path.join(ROOT, 'eventos');
const archiveDir = path.join(ROOT, 'archivo-eventos');

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));

const isUrl = value => {
  try { return ['http:', 'https:'].includes(new URL(value).protocol); } catch { return false; }
};

const allowedStatuses = new Set(['verified', 'postponed', 'cancelled', 'draft']);
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function validateEvent(event, index, slugs) {
  const at = `Evento ${index + 1}`;
  const requiredStrings = ['slug', 'name', 'status', 'startDate', 'description', 'officialUrl'];
  for (const field of requiredStrings) {
    if (typeof event[field] !== 'string' || !event[field].trim()) throw new Error(`${at}: falta ${field}`);
  }
  if (!slugPattern.test(event.slug)) throw new Error(`${at}: slug inválido`);
  if (slugs.has(event.slug)) throw new Error(`${at}: slug duplicado ${event.slug}`);
  slugs.add(event.slug);
  if (!allowedStatuses.has(event.status)) throw new Error(`${at}: status inválido`);
  if (Number.isNaN(Date.parse(event.startDate))) throw new Error(`${at}: startDate inválido`);
  if (event.endDate && Number.isNaN(Date.parse(event.endDate))) throw new Error(`${at}: endDate inválido`);
  if (!isUrl(event.officialUrl)) throw new Error(`${at}: officialUrl inválido`);
  if (event.ticketUrl && !isUrl(event.ticketUrl)) throw new Error(`${at}: ticketUrl inválido`);
  if (!event.venue || !['name', 'address', 'city', 'region'].every(key => typeof event.venue[key] === 'string' && event.venue[key].trim())) {
    throw new Error(`${at}: venue incompleto`);
  }
  if (!event.source || !isUrl(event.source.url) || Number.isNaN(Date.parse(event.source.verifiedAt))) {
    throw new Error(`${at}: source debe incluir url y verifiedAt válidos`);
  }
  if (event.image && !event.image.startsWith('/assets/images/')) throw new Error(`${at}: image debe estar en /assets/images/`);
}

function publicEvent(event) {
  return {
    slug: event.slug,
    name: event.name,
    status: event.status,
    startDate: event.startDate,
    endDate: event.endDate || null,
    description: event.description,
    venue: event.venue,
    image: event.image || '/assets/images/og-image.jpg',
    officialUrl: event.officialUrl,
    ticketUrl: event.ticketUrl || null,
    price: event.price || null,
    organizer: event.organizer || null,
    performers: Array.isArray(event.performers) ? event.performers : [],
    verifiedAt: event.source.verifiedAt,
    pageUrl: `/eventos/${event.slug}/`
  };
}

const dateFormatter = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'full', timeStyle: 'short', timeZone: 'America/Bogota'
});

function layout({ title, description, canonical, image, body, schema = null }) {
  const schemaTag = schema ? `\n  <script type="application/ld+json">${JSON.stringify(schema)}</script>` : '';
  return `<!doctype html>
<html lang="es-CO"><head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="website"><meta property="og:locale" content="es_CO">
  <meta property="og:url" content="${canonical}"><meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}"><meta property="og:image" content="${image}">
  <meta name="twitter:card" content="summary_large_image"><link rel="stylesheet" href="/styles.css?v=20260823-2">${schemaTag}
</head><body class="form-page">
  <header class="site-header"><a class="brand" href="/"><img src="/assets/images/logo-pereira-es-salsa.png" width="373" height="150" alt="Pereira es Salsa"></a><nav aria-label="Navegación"><a href="/#agenda">Agenda</a><a href="/eventos/">Eventos</a><a href="/archivo-eventos/">Archivo</a></nav><button class="header-radio" data-radio-toggle type="button"><span class="live-mini" aria-hidden="true"></span><span data-radio-button-label>Escuchar en vivo</span></button></header>
  ${body}
  <footer><div><strong>Pereira es Salsa</strong><a href="/">Inicio</a></div><div><strong>Agenda local verificada</strong><a href="/publicar-evento.html">Publicar evento</a></div><p>Información sujeta a confirmación del organizador.</p></footer>
  <script src="/radio-player.js?v=20260823-2" defer></script>
</body></html>`;
}

function eventPage(event) {
  const canonical = `${SITE}${event.pageUrl}`;
  const image = `${SITE}${event.image}`;
  const statusLabels = { verified: 'Confirmado', postponed: 'Aplazado', cancelled: 'Cancelado' };
  const ticket = event.ticketUrl ? `<a class="button" href="${escapeHtml(event.ticketUrl)}" target="_blank" rel="noopener noreferrer">Comprar entradas</a>` : '';
  const price = event.price ? `<p><strong>Precio:</strong> ${escapeHtml(event.price)}</p>` : '';
  const performers = event.performers.length ? `<p><strong>Artistas:</strong> ${escapeHtml(event.performers.join(', '))}</p>` : '';
  const schema = {
    '@context': 'https://schema.org', '@type': 'Event', name: event.name,
    startDate: event.startDate, endDate: event.endDate || undefined,
    eventStatus: event.status === 'cancelled' ? 'https://schema.org/EventCancelled' : event.status === 'postponed' ? 'https://schema.org/EventPostponed' : 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: { '@type': 'Place', name: event.venue.name, address: { '@type': 'PostalAddress', streetAddress: event.venue.address, addressLocality: event.venue.city, addressRegion: event.venue.region, addressCountry: 'CO' } },
    image: [image], description: event.description, url: canonical,
    organizer: event.organizer ? { '@type': 'Organization', name: event.organizer } : undefined,
    performer: event.performers.map(name => ({ '@type': 'MusicGroup', name })),
    offers: event.ticketUrl ? { '@type': 'Offer', url: event.ticketUrl, availability: 'https://schema.org/InStock' } : undefined
  };
  const body = `<main class="event-detail">
    <a class="text-link" href="/eventos/">← Volver a eventos</a>
    <div class="event-detail-grid"><div><p class="eyebrow">${statusLabels[event.status]}</p><h1>${escapeHtml(event.name)}</h1><p class="event-lead">${escapeHtml(event.description)}</p><p><strong>Fecha:</strong> ${escapeHtml(dateFormatter.format(new Date(event.startDate)))}</p><p><strong>Lugar:</strong> ${escapeHtml(event.venue.name)}</p><p><strong>Dirección:</strong> ${escapeHtml(event.venue.address)}, ${escapeHtml(event.venue.city)}</p>${price}${performers}<div class="actions">${ticket}<a class="button button-outline" href="${escapeHtml(event.officialUrl)}" target="_blank" rel="noopener noreferrer">Fuente oficial</a></div><p class="verification-note">Última verificación: ${escapeHtml(event.verifiedAt.slice(0, 10))}</p></div><img src="${escapeHtml(event.image)}" width="1200" height="675" alt="${escapeHtml(event.name)}" loading="eager"></div>
  </main>`;
  return layout({ title: `${event.name} | Pereira es Salsa`, description: event.description, canonical, image, body, schema });
}

function listingPage(events, archived = false) {
  const title = archived ? 'Archivo de eventos | Pereira es Salsa' : 'Eventos de salsa en Pereira | Agenda';
  const description = archived ? 'Consulta el archivo de eventos salseros publicados en Pereira y el Eje Cafetero.' : 'Próximos eventos de salsa verificados en Pereira y el Eje Cafetero.';
  const canonical = `${SITE}/${archived ? 'archivo-eventos' : 'eventos'}/`;
  const cards = events.length ? events.map(event => `<article class="event-card"><img src="${escapeHtml(event.image)}" width="600" height="338" loading="lazy" alt="${escapeHtml(event.name)}"><p class="event-date">${escapeHtml(dateFormatter.format(new Date(event.startDate)))}</p><h2>${escapeHtml(event.name)}</h2><p>${escapeHtml(event.venue.name)} · ${escapeHtml(event.venue.city)}</p><a class="text-link" href="${event.pageUrl}">Ver evento →</a></article>`).join('') : `<p class="empty-state">${archived ? 'Todavía no hay eventos en el archivo.' : 'No hay próximos eventos verificados. Vuelve pronto o publica el tuyo.'}</p>`;
  const body = `<main class="listing-page"><p class="eyebrow">Agenda local</p><h1>${archived ? 'Archivo de eventos' : 'Próximos eventos de salsa'}</h1><p>${description}</p><div class="event-grid">${cards}</div></main>`;
  return layout({ title, description, canonical, image: `${SITE}/assets/images/og-image.jpg`, body });
}

const raw = JSON.parse(await readFile(sourcePath, 'utf8'));
if (!Array.isArray(raw)) throw new Error('content/events.json debe contener un arreglo');
const slugs = new Set();
raw.forEach((event, index) => validateEvent(event, index, slugs));
const published = raw.filter(event => event.status !== 'draft').map(publicEvent).sort((a, b) => a.startDate.localeCompare(b.startDate));
const now = Date.now();
const upcoming = published.filter(event => Date.parse(event.endDate || event.startDate) >= now);
const archived = published.filter(event => Date.parse(event.endDate || event.startDate) < now).reverse();

await rm(eventsDir, { recursive: true, force: true });
await rm(archiveDir, { recursive: true, force: true });
await mkdir(eventsDir, { recursive: true });
await mkdir(archiveDir, { recursive: true });
await mkdir(path.dirname(publicPath), { recursive: true });
await writeFile(publicPath, `${JSON.stringify(published, null, 2)}\n`);
await writeFile(path.join(eventsDir, 'index.html'), listingPage(upcoming));
await writeFile(path.join(archiveDir, 'index.html'), listingPage(archived, true));
for (const event of published) {
  const dir = path.join(eventsDir, event.slug);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, 'index.html'), eventPage(event));
}

const urls = [
  ['/', 'daily', '1.0'], ['/eventos/', 'daily', '0.9'], ['/archivo-eventos/', 'weekly', '0.6'], ['/publicar-evento.html', 'monthly', '0.6'],
  ...published.map(event => [event.pageUrl, event.status === 'verified' ? 'daily' : 'weekly', '0.8'])
];
const today = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(([url, frequency, priority]) => `  <url><loc>${SITE}${url}</loc><lastmod>${today}</lastmod><changefreq>${frequency}</changefreq><priority>${priority}</priority></url>`).join('\n')}\n</urlset>\n`;
await writeFile(path.join(ROOT, 'sitemap.xml'), sitemap);
console.log(`Agenda generada: ${upcoming.length} próximos, ${archived.length} archivados, ${published.length} publicados.`);
