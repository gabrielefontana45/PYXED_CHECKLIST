const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3080;
const apiHandler = require('./api/save-lead');

const server = http.createServer((req, res) => {
  // Normalize URL paths to prevent path traversal
  let safeUrl = req.url.split('?')[0];
  if (safeUrl === '/') {
    safeUrl = '/index.html';
  }

  console.log(`${req.method} ${safeUrl}`);

  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  // 1. API route
  if (safeUrl === '/api/save-lead' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        req.body = JSON.parse(body);
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'JSON non valido' }));
        return;
      }

      // Mock response wrapper for Vercel req/res format
      const mockRes = {
        statusCode: 200,
        headers: {},
        setHeader(name, value) {
          this.headers[name] = value;
        },
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(data) {
          res.writeHead(this.statusCode, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            ...this.headers
          });
          res.end(JSON.stringify(data));
        },
        end() {
          res.writeHead(this.statusCode, {
            'Access-Control-Allow-Origin': '*',
            ...this.headers
          });
          res.end();
        }
      };

      // Mock environment check
      if (!process.env.RESEND_API_KEY || !process.env.NOTIFICATION_EMAIL) {
        console.log('\n--- [MOCK API] Ricevuto lead ---');
        console.log('Nome:', req.body.name);
        console.log('Email:', req.body.email);
        console.log('Nota: RESEND_API_KEY o NOTIFICATION_EMAIL non configurati. Invio email simulato.');
        console.log('--------------------------------\n');
        
        mockRes.status(200).json({ success: true, message: 'MOCK: Lead salvato con successo' });
        return;
      }

      // Call actual handler
      try {
        await apiHandler(req, mockRes);
      } catch (err) {
        console.error('Errore nell\'eseguire l\'handler:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Errore interno nel mock server' }));
      }
    });
    return;
  }

  // 2. Static files
  const filePath = path.join(__dirname, safeUrl);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('File non trovato');
      return;
    }

    let contentType = 'text/html';
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.css') contentType = 'text/css';
    else if (ext === '.js') contentType = 'application/javascript';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.svg') contentType = 'image/svg+xml';
    else if (ext === '.pdf') contentType = 'application/pdf';

    res.writeHead(200, { 
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`Server locale di test avviato su http://localhost:${PORT}`);
  console.log('Premi Ctrl+C per interrompere.');
});
