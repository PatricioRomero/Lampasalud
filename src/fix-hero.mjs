import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const imgDir = path.join(ROOT, 'assets', 'img');
let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

// ¿Qué base64 queda?
const restantes = [...html.matchAll(/data:image\/(\w+);base64,([A-Za-z0-9+/=]{40,})/g)];
console.log('Base64 restantes: ' + restantes.length);
restantes.forEach((m, i) => {
  const ctx = html.slice(Math.max(0, m.index - 120), m.index).replace(/\s+/g, ' ').slice(-110);
  console.log(`  ${i + 1}. tipo=${m[1]} bytes=${Math.round(m[2].length * 0.75)}  <= ...${ctx}`);
});

// Extraer el fondo del hero (esta dentro de url('data:image/...'))
const heroRe = /url\('data:image\/(\w+);base64,([A-Za-z0-9+/=]+)'\)/;
const hero = html.match(heroRe);
if (hero) {
  const bytes = Buffer.from(hero[2], 'base64');
  fs.writeFileSync(path.join(imgDir, 'hero-inicio.jpg'), bytes);
  console.log(`\nhero-inicio.jpg extraido (${Math.round(bytes.length / 1024)} KB)`);
  html = html.replace(heroRe, "url('/assets/img/hero-inicio.jpg')");
  fs.writeFileSync(path.join(ROOT, 'index.html'), html, 'utf8');
}

const fin = [...html.matchAll(/data:image/g, )].length;
console.log('base64 restantes tras el arreglo: ' + [...html.matchAll(/data:image/g)].length);
console.log('index.html: ' + Math.round(Buffer.byteLength(html) / 1024) + ' KB');
