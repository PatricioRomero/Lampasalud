/**
 * Generador del sitio Lampa Salud
 * - Reescribe index.html con head SEO completo y nav/footer compartidos
 * - Genera páginas por servicio (Fase 2) con keywords locales
 * - Genera robots.txt y sitemap.xml
 *
 * Uso: node src/build-pages.mjs
 */
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const SITE = 'https://lampasalud.cl';
const WA = 'https://wa.me/56999187629';
const TEL = '+56 9 99 18 76 29';
const EMAIL = 'centromedicolampasalud@gmail.com';
const MAPS = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3334.34842186847!2d-70.8753232!3d-33.2841443!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9662b9a7c5b144bd%3A0xc3b82df28399e289!2sBarros%20Luco%201980%2C%20Lampa%2C%20Regi%C3%B3n%20Metropolitana!5e0!3m2!1ses!2scl!4v1700000000000!5m2!1ses!2scl';
const GA_ID = ''; // Lampa Salud no tiene propiedad de GA detectada

const waLink = (t = 'Hola, quisiera agendar una hora en Lampa Salud.') => `${WA}?text=${encodeURIComponent(t)}`;

/* Scripts originales del sitio (AOS, menú móvil, formulario de contacto y asistente).
   Se conservan tal cual para no perder funcionalidad. */
const SCRIPTS = `
    <script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>
    <script>
        AOS.init({ once: true, offset: 50, duration: 800 });
        const btn = document.getElementById('mobile-menu-btn');
        const menu = document.getElementById('mobile-menu');
        if (btn && menu) {
            btn.addEventListener('click', () => { menu.classList.toggle('hidden'); });
            menu.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => { menu.classList.add('hidden'); });
            });
        }

        // El formulario envía el correo por FormSubmit y abre WhatsApp como respaldo inmediato.
        const contactForm = document.querySelector('[data-contact-form]');
        if (contactForm) {
            contactForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                const submitButton = contactForm.querySelector('[data-submit-button]');
                const status = contactForm.querySelector('[data-form-status]');
                const formData = new FormData(contactForm);
                const name = formData.get('Nombre')?.toString().trim() || '';
                const phone = formData.get('Telefono')?.toString().trim() || '';
                const service = formData.get('Servicio')?.toString().trim() || 'Consulta general';
                const message = formData.get('Mensaje')?.toString().trim() || '';
                const whatsappText = [
                    'Hola, quiero hacer una solicitud en Lampa Salud.',
                    \`Nombre: \${name}\`,
                    \`Teléfono: \${phone}\`,
                    \`Servicio: \${service}\`,
                    message ? \`Mensaje: \${message}\` : ''
                ].filter(Boolean).join('\\n');
                const whatsappUrl = \`https://wa.me/56999187629?text=\${encodeURIComponent(whatsappText)}\`;

                // Abrir WhatsApp dentro del gesto del usuario evita bloqueos del navegador.
                window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
                submitButton.disabled = true;
                submitButton.classList.add('opacity-60', 'cursor-wait');
                submitButton.textContent = 'Enviando...';
                status.className = 'hidden text-sm font-semibold rounded-xl px-4 py-3';

                try {
                    const response = await fetch(contactForm.action, {
                        method: 'POST',
                        body: formData,
                        headers: { Accept: 'application/json' }
                    });
                    if (!response.ok) throw new Error('FormSubmit respondió con error');
                    status.textContent = 'Solicitud enviada. WhatsApp también fue abierto para continuar la atención.';
                    status.className = 'text-sm font-semibold rounded-xl px-4 py-3 bg-green-100 text-green-800';
                    contactForm.reset();
                } catch (error) {
                    status.textContent = 'WhatsApp fue abierto, pero no pudimos enviar el correo. Puedes continuar por WhatsApp.';
                    status.className = 'text-sm font-semibold rounded-xl px-4 py-3 bg-yellow-100 text-yellow-800';
                    console.error(error);
                } finally {
                    submitButton.disabled = false;
                    submitButton.classList.remove('opacity-60', 'cursor-wait');
                    submitButton.textContent = 'Enviar Solicitud';
                }
            });
        }
    </script>
    <script>
        // MVP seguro: identificación inicial y derivación humana; no consulta ni escribe en SACMED.
        const assistantForm = document.querySelector('[data-assistant-form]');
        if (assistantForm) {
            assistantForm.addEventListener('submit', (event) => {
                event.preventDefault();
                const data = new FormData(assistantForm);
                const text = [
                    'Hola, necesito orientación de Lampa Salud.',
                    \`Nombre: \${data.get('assistantName')}\`,
                    \`Teléfono: \${data.get('assistantPhone')}\`,
                    \`Motivo: \${data.get('assistantReason')}\`,
                    'Aún no solicito agendamiento automático.'
                ].join('\\n');
                const url = \`https://wa.me/56999187629?text=\${encodeURIComponent(text)}\`;
                window.open(url, '_blank', 'noopener,noreferrer');
                const status = assistantForm.querySelector('[data-assistant-status]');
                status.textContent = 'WhatsApp fue abierto. Nuestro equipo continuará la atención.';
                status.className = 'text-sm font-semibold rounded-xl px-4 py-3 bg-green-100 text-green-800';
            });
        }
    </script>`;

const BIZ_LD = {
  '@type': ['MedicalClinic', 'DiagnosticLab'],
  '@id': `${SITE}/#clinica`,
  name: 'Lampa Salud',
  alternateName: 'Lampa Salud — Centro de Diagnóstico por Imagen',
  url: `${SITE}/`,
  image: `${SITE}/assets/img/hero-inicio.jpg`,
  telephone: '+56999187629',
  email: EMAIL,
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Barros Luco 1980, Street Center',
    addressLocality: 'Lampa',
    addressRegion: 'Región Metropolitana',
    addressCountry: 'CL',
  },
  geo: { '@type': 'GeoCoordinates', latitude: -33.2841443, longitude: -70.8753232 },
  areaServed: { '@type': 'City', name: 'Lampa' },
  openingHours: 'Mo-Fr',
  medicalSpecialty: ['Radiology', 'PrimaryCare', 'Cardiovascular'],
  availableService: [
    'Tomografía Computada', 'Ecografía y Doppler', 'Radiología Digital',
    'Mamografía Digital', 'Densitometría Ósea', 'Toma de Muestras',
    'Consultas Médicas', 'Cardiología',
  ].map((n) => ({ '@type': 'MedicalProcedure', name: n })),
};

/* ------------------------------- HEAD ------------------------------- */
function head({ title, description, canonical, jsonld }) {
  const ga = GA_ID ? `
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${GA_ID}');
    </script>` : '';
  return `<!DOCTYPE html>
<html lang="es" class="scroll-smooth">
<head>${ga}
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <meta name="description" content="${description}">
    <link rel="canonical" href="${canonical}">
    <meta name="robots" content="index, follow">
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <meta name="theme-color" content="#033F63">

    <!-- Open Graph / WhatsApp / Redes -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="${canonical}">
    <meta property="og:site_name" content="Lampa Salud">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${SITE}/assets/img/hero-inicio.jpg">
    <meta property="og:locale" content="es_CL">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${SITE}/assets/img/hero-inicio.jpg">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://unpkg.com/aos@2.3.1/dist/aos.css" rel="stylesheet">
    <link rel="stylesheet" href="/css/styles.css">

    <script type="application/ld+json">
${jsonld}
    </script>
</head>
<body class="text-gray-800 antialiased overflow-x-hidden">
`;
}

/* ----------------------------- TOPBAR + NAV ----------------------------- */
const NAV = [
  ['Inicio', '/'],
  ['Quiénes Somos', '/#nosotros'],
  ['Servicios', '/servicios/'],
  ['Instalaciones', '/#galeria'],
  ['Promociones', '/#promociones'],
  ['Contacto', '/#contacto'],
];

function nav() {
  return `
    <!-- Topbar -->
    <div class="bg-lsDark text-white py-2 text-sm hidden md:block">
        <div class="container mx-auto px-4 flex justify-between items-center">
            <div class="flex items-center space-x-6">
                <span><i class="fa-solid fa-location-dot text-lsGreen mr-2"></i>Barros Luco 1980, Lampa</span>
                <span><i class="fa-solid fa-clock text-lsBlue mr-2"></i>Lunes a Viernes - Horario de Oficina</span>
            </div>
            <div class="flex items-center space-x-4">
                <a href="tel:+56999187629" class="hover:text-lsBlue transition"><i class="fa-solid fa-phone text-lsBlue mr-2"></i>${TEL}</a>
                <a href="mailto:${EMAIL}" aria-label="Correo" class="hover:text-lsBlue transition"><i class="fa-solid fa-envelope"></i></a>
            </div>
        </div>
    </div>

    <!-- Navegación -->
    <nav class="bg-white shadow-lg sticky top-0 z-50">
        <div class="container mx-auto px-4 py-3 flex justify-between items-center">
            <a href="/" class="flex items-center" aria-label="Lampa Salud - Inicio">
                <img src="/assets/img/lampa-salud.jpg" alt="Lampa Salud — Centro de Diagnóstico por Imagen en Lampa" class="h-14 lg:h-16 w-auto object-contain" width="1036" height="602">
            </a>
            <div class="hidden lg:flex items-center space-x-6 font-semibold">
${NAV.map(([t, h]) => `                <a href="${h}" class="text-lsDark hover:text-lsBlue transition">${t}</a>`).join('\n')}
                <a href="${waLink()}" target="_blank" rel="noopener" class="bg-lsGreen hover:bg-[#006028] text-white px-6 py-2.5 rounded-full transition shadow-md">Pida su hora aquí</a>
            </div>
            <button id="mobile-menu-btn" class="lg:hidden text-lsDark text-2xl focus:outline-none" aria-label="Abrir menú"><i class="fa-solid fa-bars"></i></button>
        </div>
        <div id="mobile-menu" class="hidden lg:hidden bg-white border-t border-gray-100 absolute w-full shadow-xl">
            <div class="flex flex-col px-6 py-4 space-y-4 font-semibold">
${NAV.map(([t, h]) => `                <a href="${h}" class="text-lsDark hover:text-lsBlue">${t}</a>`).join('\n')}
                <a href="${waLink()}" target="_blank" rel="noopener" class="text-lsGreen font-bold">Pida su hora aquí</a>
            </div>
        </div>
    </nav>
`;
}

/* ------------------------------- FOOTER ------------------------------- */
function footer() {
  return `
    <footer class="bg-lsDark text-white pt-16 pb-8 border-t-[6px] border-lsBlue">
        <div class="container mx-auto px-4">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
                <div>
                    <div class="mb-6">
                        <img src="/assets/img/lampa-salud.jpg" alt="Lampa Salud" class="h-12 w-auto object-contain" width="1036" height="602" loading="lazy">
                    </div>
                    <p class="text-gray-400 text-sm mb-6 leading-relaxed">Centro de Diagnóstico por Imagen en Lampa. Tecnología avanzada y atención cercana para cuidar de usted y su familia, sin salir de la comuna.</p>
                </div>
                <div>
                    <h4 class="text-lg font-heading font-bold mb-6">Enlaces Rápidos</h4>
                    <ul class="space-y-3">
                        <li><a href="/" class="text-gray-400 hover:text-white transition flex items-center"><i class="fa-solid fa-angle-right text-lsBlue mr-2"></i> Inicio</a></li>
                        <li><a href="/#nosotros" class="text-gray-400 hover:text-white transition flex items-center"><i class="fa-solid fa-angle-right text-lsBlue mr-2"></i> Quiénes Somos</a></li>
                        <li><a href="/servicios/" class="text-gray-400 hover:text-white transition flex items-center"><i class="fa-solid fa-angle-right text-lsBlue mr-2"></i> Servicios</a></li>
                        <li><a href="/#promociones" class="text-lsCoral hover:text-white transition flex items-center"><i class="fa-solid fa-angle-right text-lsCoral mr-2"></i> Promociones</a></li>
                        <li><a href="/#contacto" class="text-gray-400 hover:text-white transition flex items-center"><i class="fa-solid fa-angle-right text-lsBlue mr-2"></i> Contacto</a></li>
                    </ul>
                </div>
                <div>
                    <h4 class="text-lg font-heading font-bold mb-6">Exámenes</h4>
                    <ul class="space-y-3">
${SERVICIOS.slice(0, 6).map((s) => `                        <li><a href="/${s.slug}/" class="text-gray-400 hover:text-white transition">${s.nav}</a></li>`).join('\n')}
                    </ul>
                </div>
                <div>
                    <h4 class="text-lg font-heading font-bold mb-6">Contacto</h4>
                    <ul class="space-y-4 text-sm text-gray-400">
                        <li class="flex items-start"><i class="fa-solid fa-location-dot mt-1 text-lsBlue mr-3 w-4"></i><span>Barros Luco 1980, Street Center<br>Lampa, Región Metropolitana</span></li>
                        <li class="flex items-center"><i class="fa-brands fa-whatsapp text-lsGreen mr-3 w-4 text-lg"></i><a href="${waLink()}" target="_blank" rel="noopener" class="hover:text-white">${TEL}</a></li>
                        <li class="flex items-center"><i class="fa-solid fa-envelope text-lsBlue mr-3 w-4"></i><a href="mailto:${EMAIL}" class="hover:text-white break-all">${EMAIL}</a></li>
                        <li class="flex items-center"><i class="fa-solid fa-clock text-lsBlue mr-3 w-4"></i><span>Lunes a Viernes</span></li>
                    </ul>
                </div>
            </div>
            <div class="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
                <p>&copy; ${new Date().getFullYear()} Lampa Salud. Todos los derechos reservados.</p>
                <p class="mt-2 md:mt-0 font-medium">Centro de Diagnóstico por Imagen · Lampa, Chile</p>
            </div>
        </div>
    </footer>

    <a href="${waLink('Hola, quisiera hacer una consulta con Lampa Salud.')}" target="_blank" rel="noopener" class="floating-whatsapp" aria-label="Escríbenos por WhatsApp">
        <i class="fa-brands fa-whatsapp"></i>
    </a>

    <script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>
${SCRIPTS}
</body>
</html>
`;
}

/* --------------------------- PÁGINAS DE SERVICIO --------------------------- */
const SERVICIOS = [
  {
    slug: 'tomografia-computada-lampa',
    nav: 'Tomografía (Scanner)',
    h1: 'Tomografía Computada (Scanner) en Lampa',
    title: 'Tomografía Computada (Scanner) en Lampa | Lampa Salud',
    description: 'Tomografía computada multicorte con reconstrucciones 3D en Lampa. Realice su scanner sin salir de la comuna. Agende su hora en Lampa Salud.',
    lead: 'Realizamos tomografía computada (scanner) con estudios multicorte y reconstrucciones en 3D, en nuestro centro de Lampa.',
    body: `
      <p>La <strong>tomografía computada</strong> —conocida también como <strong>scanner</strong>— es un examen de diagnóstico por imagen que permite obtener cortes detallados del cuerpo y reconstrucciones en 3D. En Lampa Salud contamos con tomografía computada para que usted no tenga que trasladarse fuera de la comuna para realizarse este examen.</p>
      <h2>¿Cómo es el examen?</h2>
      <p>Es un procedimiento indoloro y rápido. Usted permanece recostado mientras el equipo realiza las imágenes. Nuestro equipo técnico y profesional lo guía durante todo el proceso.</p>`,
    faq: [
      ['¿Necesito preparación previa para la tomografía?', 'Algunos estudios requieren indicaciones especiales. Al agendar su hora le entregaremos las indicaciones correspondientes a su examen en particular.'],
      ['¿Puedo realizarme el scanner en Lampa?', 'Sí. La tomografía computada se realiza en nuestro centro, ubicado en Barros Luco 1980, Street Center, Lampa.'],
      ['¿Cómo agendo mi hora?', 'Puede escribirnos por WhatsApp al ' + TEL + ' o acercarse a nuestro centro en horario de oficina, de lunes a viernes.'],
    ],
  },
  {
    slug: 'ecografia-lampa',
    nav: 'Ecografía y Doppler',
    h1: 'Ecografía y Doppler en Lampa',
    title: 'Ecografía, Doppler y Ecografía 4D en Lampa | Lampa Salud',
    description: 'Ecografías generales, Doppler, obstétricas y 4D en Lampa. Diagnóstico por imagen con atención cercana. Agende su hora en Lampa Salud.',
    lead: 'Realizamos ecografías generales, Doppler, obstétricas y 4D en nuestro centro de diagnóstico por imagen en Lampa.',
    body: `
      <p>La <strong>ecografía</strong> (o ecotomografía) es un examen de imagen que utiliza ultrasonido y no emplea radiación ionizante. En Lampa Salud realizamos <strong>ecografías generales, Doppler, obstétricas y 4D</strong>.</p>
      <h2>Tipos de ecografía que realizamos</h2>
      <ul>
        <li><strong>Ecografía general:</strong> evaluación de órganos y estructuras abdominales y otras zonas.</li>
        <li><strong>Doppler:</strong> estudio del flujo sanguíneo.</li>
        <li><strong>Ecografía obstétrica:</strong> seguimiento del embarazo.</li>
        <li><strong>Ecografía 4D:</strong> visualización del bebé en movimiento.</li>
      </ul>`,
    faq: [
      ['¿La ecografía requiere preparación?', 'Depende del tipo de estudio. Al agendar le indicaremos si debe asistir en ayunas o con vejiga llena, según corresponda.'],
      ['¿La ecografía duele?', 'No. Es un examen indoloro y no invasivo.'],
      ['¿Atienden ecografías los sábados?', 'Nuestra atención es de lunes a viernes, en horario de oficina. Consúltenos por WhatsApp para coordinar su hora.'],
    ],
  },
  {
    slug: 'mamografia-lampa',
    nav: 'Mamografía Digital',
    h1: 'Mamografía Digital en Lampa',
    title: 'Mamografía Digital en Lampa | Lampa Salud',
    description: 'Mamografía digital en Lampa para la detección temprana del cáncer de mama. Promoción Mamografía + Ecografía Mamaria. Agende en Lampa Salud.',
    lead: 'La detección temprana salva vidas. Realizamos mamografía digital en Lampa, con atención cercana y profesional.',
    body: `
      <p>La <strong>mamografía digital</strong> es el examen de referencia para la detección temprana del cáncer de mama. En Lampa Salud contamos con mamografía digital y atención cercana, para que realizarse este examen preventivo no implique salir de la comuna.</p>
      <h2>Promoción vigente</h2>
      <p>En el marco del <strong>Mes de la Concientización</strong>, en Lampa Salud te cuidamos con una promoción en:</p>
      <p><strong>Mamografía + Ecografía Mamaria por $30.000 CLP</strong></p>
      <p><a href="${waLink('Hola, quiero la promoción de Mamografía + Ecografía Mamaria por $30.000.')}" target="_blank" rel="noopener" class="text-lsBlue font-bold">Quiero mi promoción por WhatsApp →</a></p>`,
    faq: [
      ['¿Qué incluye la promoción?', 'La promoción corresponde a Mamografía + Ecografía Mamaria por $30.000 CLP. Consúltenos por WhatsApp para confirmar vigencia y disponibilidad de horas.'],
      ['¿Cada cuánto se recomienda la mamografía?', 'La frecuencia es una indicación médica. Le recomendamos consultar con su profesional de salud, quien evaluará su caso particular.'],
      ['¿Necesito orden médica?', 'Consúltenos al agendar su hora y le indicaremos los requisitos según su previsión.'],
    ],
  },
  {
    slug: 'radiologia-digital-lampa',
    nav: 'Radiología Digital',
    h1: 'Radiografía y Radiología Digital en Lampa',
    title: 'Radiografía y Radiología Digital en Lampa | Lampa Salud',
    description: 'Radiografías generales e integrales de máxima claridad en Lampa. Radiología digital con tecnología de punta. Agende su hora en Lampa Salud.',
    lead: 'Radiografías generales e integrales de máxima claridad, en nuestro centro de diagnóstico por imagen en Lampa.',
    body: `
      <p>La <strong>radiología digital</strong> permite obtener radiografías de máxima claridad con menor dosis y mayor rapidez en la entrega. En Lampa Salud realizamos <strong>radiografías generales e integrales</strong>.</p>
      <h2>¿Qué exámenes incluye?</h2>
      <p>Radiografías generales e integrales indicadas por su médico tratante. Consúltenos si tiene dudas sobre un examen específico.</p>`,
    faq: [
      ['¿Debo llevar orden médica?', 'Consúltenos al agendar; los requisitos dependen del examen y de su previsión.'],
      ['¿Cuánto demora el examen?', 'La radiografía es un examen rápido. El tiempo total dependerá de la zona a estudiar y de la indicación.'],
      ['¿Atienden radiografías a niños?', 'Consúltenos por WhatsApp para coordinar según el caso.'],
    ],
  },
  {
    slug: 'densitometria-osea-lampa',
    nav: 'Densitometría Ósea',
    h1: 'Densitometría Ósea en Lampa',
    title: 'Densitometría Ósea en Lampa | Lampa Salud',
    description: 'Densitometría ósea en Lampa para la evaluación de la densidad mineral ósea y el estudio de la osteoporosis. Agende su hora en Lampa Salud.',
    lead: 'Evaluación de la densidad mineral ósea para el estudio de la osteoporosis, en nuestro centro de Lampa.',
    body: `
      <p>La <strong>densitometría ósea</strong> es el examen que evalúa la densidad mineral de los huesos. Es la herramienta habitual para el estudio y seguimiento de la <strong>osteoporosis</strong>.</p>
      <h2>¿Para qué sirve?</h2>
      <p>Permite evaluar la densidad mineral ósea. Su médico tratante interpretará el resultado según su historia clínica y factores de riesgo.</p>`,
    faq: [
      ['¿La densitometría es dolorosa?', 'No. Es un examen indoloro, similar a una radiografía, en el que usted permanece recostado.'],
      ['¿Requiere preparación?', 'Consúltenos al agendar su hora; le entregaremos las indicaciones correspondientes.'],
      ['¿A qué edad se recomienda?', 'Es una indicación médica. Le sugerimos consultar con su profesional de salud, quien evaluará su caso.'],
    ],
  },
  {
    slug: 'toma-de-muestras-lampa',
    nav: 'Toma de Muestras',
    h1: 'Toma de Muestras y Laboratorio Clínico en Lampa',
    title: 'Toma de Muestras y Laboratorio Clínico en Lampa | Lampa Salud',
    description: 'Toma de muestras y laboratorio clínico completo en Lampa. Fonasa Nivel 1. Agende su hora en Lampa Salud.',
    lead: 'Servicios de laboratorio clínico completo en Lampa, con Fonasa Nivel 1.',
    body: `
      <p>En Lampa Salud contamos con <strong>toma de muestras y laboratorio clínico completo</strong>. Además, disponemos de <strong>Fonasa Nivel 1</strong> para nuestros pacientes.</p>
      <h2>¿Qué necesito para tomar mis exámenes?</h2>
      <p>Preséntese con su orden médica y su documentación. Al agendar le indicaremos si su examen requiere ayuno u otra preparación.</p>`,
    faq: [
      ['¿Atienden Fonasa?', 'Sí, contamos con Fonasa Nivel 1.'],
      ['¿Debo ir en ayunas?', 'Depende de los exámenes indicados. Al agendar su hora le entregaremos las indicaciones de preparación.'],
      ['¿Cómo retiro mis resultados?', 'Consúltenos al momento de la toma de muestras para conocer el plazo y la forma de entrega de sus resultados.'],
    ],
  },
  {
    slug: 'consultas-medicas-lampa',
    nav: 'Consultas Médicas',
    h1: 'Consultas Médicas en Lampa',
    title: 'Consultas Médicas en Lampa: Medicina General y Especialidades | Lampa Salud',
    description: 'Consultas médicas en Lampa: medicina general, traumatología, nutrición, matrona, kinesiología y psicología. Agende su hora en Lampa Salud.',
    lead: 'Medicina General, traumatología, nutrición, matrona, kinesiología y psicología, en nuestro centro de Lampa.',
    body: `
      <p>En Lampa Salud puede atenderse con un equipo de profesionales en distintas áreas, en un mismo lugar y sin salir de la comuna:</p>
      <ul>
        <li><strong>Medicina General</strong></li>
        <li><strong>Traumatología</strong></li>
        <li><strong>Nutrición</strong></li>
        <li><strong>Matrona</strong></li>
        <li><strong>Kinesiología</strong></li>
        <li><strong>Psicología</strong></li>
      </ul>`,
    faq: [
      ['¿Necesito hora previa?', 'Sí, le recomendamos agendar previamente por WhatsApp al ' + TEL + ' o en nuestro centro.'],
      ['¿Atienden convenios o previsiones?', 'Consúltenos por WhatsApp para conocer las condiciones según su previsión.'],
      ['¿Puedo atenderme por Fonasa?', 'Contamos con Fonasa Nivel 1. Consúltenos para confirmar las condiciones de su atención.'],
    ],
  },
  {
    slug: 'cardiologia-lampa',
    nav: 'Cardiología',
    h1: 'Cardiología y Electrocardiograma en Lampa',
    title: 'Cardiología en Lampa: ECG, Holter y Ecocardiograma | Lampa Salud',
    description: 'Cardiología en Lampa: electrocardiogramas, holter de presión y ecocardiogramas. Diagnóstico cardiovascular cercano. Agende en Lampa Salud.',
    lead: 'Electrocardiogramas, holter de presión y ecocardiogramas, en nuestro centro en Lampa.',
    body: `
      <p>En el área de <strong>cardiología</strong> realizamos:</p>
      <ul>
        <li><strong>Electrocardiogramas (ECG)</strong></li>
        <li><strong>Holter de presión</strong></li>
        <li><strong>Ecocardiogramas</strong></li>
      </ul>
      <p>Todos los estudios se realizan en nuestro centro de Lampa, con atención cercana y en coordinación con su médico tratante.</p>`,
    faq: [
      ['¿Necesito orden médica para el ECG?', 'Consúltenos al agendar su hora y le indicaremos los requisitos según su caso y previsión.'],
      ['¿Cuánto demora un electrocardiograma?', 'El ECG es un examen rápido. El holter de presión requiere un período de uso prolongado; le explicaremos el procedimiento al agendar.'],
      ['¿Dónde se realizan estos exámenes?', 'En nuestro centro, Barros Luco 1980, Street Center, Lampa.'],
    ],
  },
];

/* ---------------------------- Piezas comunes ---------------------------- */
const ldService = (nombre, descripcion, slug, faq) => JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    BIZ_LD,
    { '@type': 'MedicalProcedure', name: nombre, description: descripcion, url: `${SITE}/${slug}/`, provider: { '@id': `${SITE}/#clinica` } },
    { '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'Servicios', item: `${SITE}/servicios/` },
      { '@type': 'ListItem', position: 3, name: nombre, item: `${SITE}/${slug}/` },
    ] },
  ],
}, null, 2);

const bc = (items) => `
            <nav aria-label="Ruta de navegación" class="text-sm text-gray-300 mb-6">
${items.map(([t, h], i) => `                ${i > 0 ? '<span class="mx-2 opacity-60">/</span>' : ''}${h ? `<a href="${h}" class="hover:text-white">${t}</a>` : `<span class="text-white">${t}</span>`}`).join('\n')}
            </nav>`;

const ctaFinal = (t, s) => `
    <section class="py-16 bg-lsDark text-white">
        <div class="container mx-auto px-4 text-center max-w-3xl">
            <h2 class="text-3xl md:text-4xl font-heading font-extrabold mb-4">${t}</h2>
            <p class="text-gray-300 mb-8">${s}</p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="${waLink()}" target="_blank" rel="noopener" class="bg-lsGreen hover:bg-[#006028] px-8 py-4 rounded-full font-bold transition shadow-lg"><i class="fa-brands fa-whatsapp mr-2"></i>Agendar por WhatsApp</a>
                <a href="tel:+56999187629" class="border-2 border-lsBlue text-lsBlue hover:bg-lsBlue hover:text-white px-8 py-4 rounded-full font-bold transition"><i class="fa-solid fa-phone mr-2"></i>${TEL}</a>
            </div>
        </div>
    </section>`;

const faqSection = (faq) => `
    <section class="py-16 bg-lsLight">
        <div class="container mx-auto px-4 max-w-3xl">
            <h2 class="text-3xl font-heading font-extrabold text-lsDark mb-8 text-center">Preguntas frecuentes</h2>
            <div class="space-y-4">
${faq.map(([q, a]) => `                <div class="bg-white rounded-xl p-6 shadow-sm">
                    <h3 class="font-heading font-bold text-lsDark mb-2">${q}</h3>
                    <p class="text-gray-600 text-sm leading-relaxed">${a}</p>
                </div>`).join('\n')}
            </div>
        </div>
    </section>`;

const servicePage = (s) => head({
  title: s.title,
  description: s.description,
  canonical: `${SITE}/${s.slug}/`,
  jsonld: ldService(s.h1, s.description, s.slug, s.faq),
}) + nav() + `
    <section class="hero-bg py-20">
        <div class="container mx-auto px-4 relative z-10">
${bc([['Inicio', '/'], ['Servicios', '/servicios/'], [s.nav, null]])}
            <h1 class="text-4xl md:text-5xl font-heading font-extrabold text-white mb-4 max-w-4xl">${s.h1}</h1>
            <p class="text-lg md:text-xl text-gray-100 max-w-3xl">${s.lead}</p>
            <a href="${waLink()}" target="_blank" rel="noopener" class="inline-block mt-8 bg-lsGreen hover:bg-[#006028] text-white px-8 py-4 rounded-full font-bold transition shadow-lg"><i class="fa-brands fa-whatsapp mr-2"></i>Agendar hora</a>
        </div>
    </section>

    <section class="py-16 bg-white">
        <div class="container mx-auto px-4 max-w-4xl prose-ls">
            <div class="space-y-5 text-gray-700 leading-relaxed text-lg">
${s.body}
            </div>
            <div class="mt-10 p-6 bg-lsLight rounded-xl border-l-4 border-lsBlue">
                <p class="text-sm text-gray-600"><i class="fa-solid fa-circle-info text-lsBlue mr-2"></i><strong>Dónde:</strong> Barros Luco 1980, Street Center, Lampa, Región Metropolitana · <strong>Horario:</strong> Lunes a Viernes · <strong>Teléfono:</strong> ${TEL}</p>
            </div>
        </div>
    </section>
` + faqSection(s.faq) + ctaFinal('Agende su hora en Lampa Salud', 'Estamos en Barros Luco 1980, Street Center, Lampa. Le atendemos de lunes a viernes.') + footer();

/* --------------------------------- SALIDAS --------------------------------- */
function write(rel, content) {
  const full = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
  console.log('  ✓ ' + rel + ' (' + Math.round(Buffer.byteLength(content) / 1024) + ' KB)');
}

console.log('Generando páginas de servicio...');
for (const s of SERVICIOS) write(`${s.slug}/index.html`, servicePage(s));

/* Hub de servicios */
const hubLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [BIZ_LD, { '@type': 'CollectionPage', name: 'Servicios y exámenes', url: `${SITE}/servicios/` },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'Servicios', item: `${SITE}/servicios/` }] }],
}, null, 2);

write('servicios/index.html', head({
  title: 'Servicios y Exámenes de Diagnóstico en Lampa | Lampa Salud',
  description: 'Tomografía, ecografía, mamografía, radiología, densitometría, laboratorio, consultas médicas y cardiología en Lampa. Conozca todos nuestros exámenes.',
  canonical: `${SITE}/servicios/`,
  jsonld: hubLd,
}) + nav() + `
    <section class="hero-bg py-20">
        <div class="container mx-auto px-4 relative z-10">
${bc([['Inicio', '/'], ['Servicios', null]])}
            <h1 class="text-4xl md:text-5xl font-heading font-extrabold text-white mb-4">Servicios de Diagnóstico e Imagenología</h1>
            <p class="text-lg md:text-xl text-gray-100 max-w-3xl">Ofrecemos una amplia gama de exámenes médicos y laboratorio clínico con tecnología de punta para garantizar diagnósticos rápidos, en Lampa.</p>
        </div>
    </section>
    <section class="py-16 bg-white">
        <div class="container mx-auto px-4">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
${SERVICIOS.map((s) => `                <a href="/${s.slug}/" class="service-card bg-lsLight rounded-2xl p-8 block border-b-4 border-transparent">
                    <h2 class="text-xl font-heading font-bold text-lsDark mb-3">${s.nav}</h2>
                    <p class="text-gray-600 text-sm mb-4">${s.description}</p>
                    <span class="text-lsBlue font-bold text-sm">Ver detalle <i class="fa-solid fa-angle-right ml-1"></i></span>
                </a>`).join('\n')}
            </div>
        </div>
    </section>
` + ctaFinal('¿Necesita agendar un examen?', 'Escríbanos por WhatsApp y le coordinamos su hora en Lampa.') + footer());

/* --------------------------------- HOME --------------------------------- */
console.log('Actualizando index.html...');
let index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

const heroIdx = index.indexOf('<!-- Hero -->');
const footerIdx = index.indexOf('<footer');
const afterFooterIdx = index.indexOf('</footer>');
const contenido = index.slice(heroIdx, footerIdx);           // hero + secciones
const scripts = index.slice(afterFooterIdx + '</footer>'.length, index.indexOf('</body>')); // whatsapp + scripts

const homeLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [BIZ_LD, {
    '@type': 'WebSite', '@id': `${SITE}/#web`, url: `${SITE}/`, name: 'Lampa Salud',
    inLanguage: 'es-CL', publisher: { '@id': `${SITE}/#clinica` },
  }],
}, null, 2);

const home = head({
  title: 'Lampa Salud | Centro de Diagnóstico por Imagen en Lampa',
  description: 'Centro de Diagnóstico por Imagen en Lampa: tomografía, ecografía, mamografía, radiología, densitometría y laboratorio. Fonasa Nivel 1. Agende su hora.',
  canonical: `${SITE}/`,
  jsonld: homeLd,
}) + nav() + contenido + footer();

fs.writeFileSync(path.join(ROOT, 'index.html'), home, 'utf8');
console.log('  ✓ index.html (' + Math.round(Buffer.byteLength(home) / 1024) + ' KB)');

/* ------------------------------ robots / sitemap ------------------------------ */
write('robots.txt', `User-agent: *
Allow: /

Sitemap: ${SITE}/sitemap.xml
`);

const urls = [
  { loc: '/', p: '1.0', f: 'monthly' },
  { loc: '/servicios/', p: '0.9', f: 'monthly' },
  ...SERVICIOS.map((s) => ({ loc: `/${s.slug}/`, p: '0.8', f: 'monthly' })),
];
const hoy = new Date().toISOString().slice(0, 10);
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${SITE}${u.loc}</loc>
    <lastmod>${hoy}</lastmod>
    <changefreq>${u.f}</changefreq>
    <priority>${u.p}</priority>
  </url>`).join('\n')}
</urlset>
`);
console.log('Listo.');
