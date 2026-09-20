/** Configuración Tailwind — Lampa Salud
 *  Reemplaza el CDN (cdn.tailwindcss.com) por CSS compilado en build.
 */
module.exports = {
  content: [
    './index.html',
    './*/index.html',
    './*/*/index.html',
  ],
  theme: {
    extend: {
      colors: {
        lsGreen: '#008036',
        lsBlue: '#138CF7',
        lsLight: '#f1f1f1',
        lsCoral: '#EE6352',
        lsDark: '#033F63',
      },
      fontFamily: {
        body: ['Montserrat', 'sans-serif'],
        heading: ['Nunito', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
