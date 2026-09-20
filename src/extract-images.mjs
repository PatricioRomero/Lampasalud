import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dest = path.join(ROOT, 'assets', 'img');
fs.mkdirSync(dest, { recursive: true });

const slug = (s) => s.toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 45);

const usados = new Set();

// 1) Fondo del hero (CSS)
const heroMatch = html.match(/linear-gradient\([^)]*\),\s*url\('data:image\/(\w+);base64,([A-Za-z0-9+/=]+)'\)/);
if (heroMatch) {
  const bytes = Buffer.from(heroMatch[2], 'base64');
  fs.writeFileSync(path.join(dest, 'hero-inicio.jpg'), bytes);
  console.log(`hero-inicio.jpg (${Math.round(bytes.length / 1024)} KB)  [fondo CSS del hero]`);
  usados.add('hero-inicio.jpg');
}

// 2) Etiquetas <img> con alt
const imgs = [...html.matchAll(/<img\s+([^>]*?)src="data:image\/(\w+);base64,([A-Za-z0-9+/=]+)"([^>]*?)>/g)];
for (const m of imgs) {
  const attrs = (m[1] || '') + (m[4] || '');
  const alt = (attrs.match(/alt="([^"]*)"/) || [, ''])[1];
  const bytes = Buffer.from(m[3], 'base64');
  let nombre = alt ? slug(alt) + '.jpg' : `imagen-${imgs.indexOf(m) + 1}.jpg`;
  while (usados.has(nombre)) nombre = nombre.replace(/\.jpg$/, '-2.jpg');
  usados.add(nombre);
  fs.writeFileSync(path.join(dest, nombre), bytes);
  console.log(`${nombre} (${Math.round(bytes.length / 1024)} KB)  alt="${alt}"`);
}

// 3) Reemplazar en el HTML las rutas base64 por archivos externos
html = html.replace(/linear-gradient\(([^)]*)\),\s*url\('data:image\/\w+;base64,[A-Za-z0-9+/=]+'\)/, "linear-gradient($1), url('/assets/img/hero-inicio.jpg')");
let idx = 0;
html = html.replace(/<img\s+([^>]*?)src="data:image\/\w+;base64,[A-Za-z0-9+/=]+"([^>]*?)>/g, (full, a1, a2) => {
  const attrs = (a1 || '') + (a2 || '');
  const alt = (attrs.match(/alt="([^"]*)"/) || [, ''])[1];
  let nombre = alt ? slug(alt) + '.jpg' : `imagen-${++idx}.jpg`;
  let n = nombre; let c = 2;
  while (!fs.existsSync(path.join(dest, n))) { n = nombre.replace(/\.jpg$/, `-${c++}.jpg`); }
  // conservar clases y alt, solo cambiar el src
  return full.replace(/src="data:image\/\w+;base64,[A-Za-z0-9+/=]+"/, `src="/assets/img/${n}"`);
});
fs.writeFileSync(path.join(ROOT, 'index.html'), html, 'utf8');
console.log('\nindex.html actualizado: imagenes ahora externas (' + Math.round(Buffer.byteLength(html) / 1024) + ' KB)');
