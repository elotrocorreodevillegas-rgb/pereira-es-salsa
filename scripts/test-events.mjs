import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const root = await mkdtemp(path.join(tmpdir(), 'pereira-events-'));
const source = path.resolve('tests/fixtures/events.valid.json');

try {
  const { stdout } = await exec(process.execPath, ['scripts/build-events.mjs'], {
    env: { ...process.env, BUILD_ROOT: root, EVENTS_SOURCE: source }
  });
  if (!stdout.includes('1 próximos, 1 archivados, 2 publicados')) throw new Error('Conteos incorrectos');
  const upcoming = await readFile(path.join(root, 'eventos/index.html'), 'utf8');
  const archive = await readFile(path.join(root, 'archivo-eventos/index.html'), 'utf8');
  const detail = await readFile(path.join(root, 'eventos/evento-futuro-prueba/index.html'), 'utf8');
  const sitemap = await readFile(path.join(root, 'sitemap.xml'), 'utf8');
  const publicData = JSON.parse(await readFile(path.join(root, 'data/events.json'), 'utf8'));
  if (!upcoming.includes('Evento futuro de prueba')) throw new Error('Falta evento futuro');
  if (!archive.includes('Evento pasado de prueba')) throw new Error('Falta evento archivado');
  if (!detail.includes('schema.org') || !detail.includes('EventScheduled')) throw new Error('Schema Event incompleto');
  if (!sitemap.includes('/eventos/evento-futuro-prueba/')) throw new Error('Evento ausente del sitemap');
  if (publicData.some(event => 'source' in event)) throw new Error('La fuente interna no debe exponerse completa');
  console.log('Pruebas de agenda: PASS');
} finally {
  await rm(root, { recursive: true, force: true });
}
