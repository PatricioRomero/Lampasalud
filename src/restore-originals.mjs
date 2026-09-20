import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const imgDir = path.join(ROOT, 'assets', 'img');

// HTML original (pristino) desde git
const orig = fs.readFileSync(path.join(ROOT, '_original_index.html'), 'utf8');

const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 45);

// Mapa nombre -> buffer original
const originales = new Map();
const heroM = orig.match(/url\('data:image\/(\w+);base64,([A-Za-z0-9+/=]+)'\)/);
if (heroM) originales.set('hero-inicio.jpg', Buffer.from(heroM[2], 'base64'));

const usados = new Set();
for (const m of orig.matchAll(/<img\s+([^>]*?)src="data:image\/(\w+);base64,([A-Za-z0-9+/=]+)"([^>]*?)>/g)) {
  const attrs = (m[1] || '') + (m[4] || '');
  const alt = (attrs.match(/alt="([^"]*)"/) || [, ''])[1];
  let nombre = alt ? slug(alt) + '.jpg' : 'imagen.jpg';
  while (usados.has(nombre)) nombre = nombre.replace(/\.jpg$/, '-2.jpg');
  usados.add(nombre);
  originales.set(nombre, Buffer.from(m[3], 'base64'));
}

console.log('Imagenes originales recuperadas de git: ' + originales.size);
for (const [n, b] of originales) console.log(`  ${n}: ${Math.round(b.length / 1024)} KB`);

// Guardar los originales pristinos en un temporal para que PowerShell los optimice
const tmp = path.join(ROOT, '_orig_img');
fs.rmSync(tmp, { recursive: true, force: true });
fs.mkdirSync(tmp, { recursive: true });
for (const [n, b] of originales) fs.writeFileSync(path.join(tmp, n), b);
console.log('\nOriginales pristinos en: _orig_img/');
