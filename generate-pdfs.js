const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Servidor estático local para servir los archivos con imagen y CSS correctamente
const server = http.createServer((req, res) => {
  const filePath = path.join(__dirname, req.url.split('?')[0]);
  try {
    const content = fs.readFileSync(filePath);
    const ext = path.extname(filePath);
    const mimeTypes = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.jpg': 'image/jpeg',
      '.png': 'image/png',
    };
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    res.end(content);
  } catch (e) {
    res.writeHead(404);
    res.end('Not found');
  }
});

const PORT = 3456;

const files = [
  { html: 'toniamaya.html',   pdf: 'toniamaya.pdf' },
  { html: 'toni-amaya.html',  pdf: 'toni-amaya.pdf' },
];

(async () => {
  await new Promise(resolve => server.listen(PORT, resolve));
  console.log(`Servidor local en puerto ${PORT}`);

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  for (const file of files) {
    console.log(`Generando ${file.pdf}...`);
    const page = await browser.newPage();
    await page.goto(`http://localhost:${PORT}/${file.html}`, { waitUntil: 'networkidle0' });

    // Ocultar el botón de descarga para que no aparezca en el PDF
    await page.evaluate(() => {
      const btn = document.querySelector('.pdf-btn');
      if (btn) btn.style.display = 'none';
    });

    await page.pdf({
      path: file.pdf,
      format: 'A4',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    await page.close();
    console.log(`✓ ${file.pdf} generado correctamente`);
  }

  await browser.close();
  server.close();
  console.log('¡Todos los PDFs generados!');
})();
