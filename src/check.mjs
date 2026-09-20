import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.git' || e.name === '_orig_img') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.html') && !e.name.startsWith('_')) files.push(p);
  }
})(ROOT);

const exists = (u) => {
  const clean = u.split('#')[0].split('?')[0];
  if (clean === '' || clean === '/') return fs.existsSync(path.join(ROOT, 'index.html'));
  const rel = clean.replace(/^\//, '');
  return fs.existsSync(path.join(ROOT, rel)) || fs.existsSync(path.join(ROOT, rel, 'index.html'));
};

let problemas = 0;
for (const f of files.sort()) {
  const html = fs.readFileSync(f, 'utf8');
  const rel = f.replace(ROOT + path.sep, '');
  const refs = [...html.matchAll(/(?:href|src)="(\/[^"]*)"/g)].map((m) => m[1]);
  const faltan = [...new Set(refs)].filter((r) => !exists(r));
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || '(SIN TITLE)';
  const canon = (html.match(/rel="canonical" href="([^"]*)"/) || [])[1] || '(SIN CANONICAL)';
  const og = (html.match(/property="og:/g) || []).length;
  const ld = (html.match(/application\/ld\+json/g) || []).length;
  const h1 = ((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const faq = html.includes('FAQPage');
  const clinic = html.includes('MedicalClinic');
  console.log(`\n${rel}`);
  console.log(`  title      : ${title}`);
  console.log(`  canonical  : ${canon}`);
  console.log(`  og:${og} jsonld:${ld} faq:${faq} medicalClinic:${clinic}`);
  console.log(`  h1         : ${h1.slice(0, 72)}`);
  console.log(`  imgs base64: ${(html.match(/data:image/g) || []).length}`);
  if (faltan.length) { problemas += faltan.length; console.log(`  ❌ ROTOS: ${faltan.join(', ')}`); }
  else console.log(`  ✓ ${new Set(refs).size} enlaces internos OK`);
}
console.log(`\nTOTAL: ${files.length} paginas | ${problemas} problemas`);

// Secciones del home
const home = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const secciones = [...home.matchAll(/<section[^>]*id="([^"]+)"/g)].map((m) => m[1]);
console.log('Secciones del home: ' + secciones.join(', '));
console.log('Formulario de contacto: ' + (home.includes('data-contact-form') ? 'OK' : 'PERDIDO'));
console.log('Asistente: ' + (home.includes('data-assistant-form') ? 'OK' : 'PERDIDO'));
