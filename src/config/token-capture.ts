import * as http from 'http';
import * as path from 'path';
import * as os from 'os';
import { TokenManager } from './token-manager';

export class TokenCaptureServer {
  private server: http.Server | null = null;
  private tokenManager: TokenManager;
  private htmlPath: string;

  constructor(tokenManager: TokenManager) {
    this.tokenManager = tokenManager;
    this.htmlPath = path.join(os.tmpdir(), 'huntr-token-capture.html');
  }

  async start(port: number = 17432): Promise<string> {
    return new Promise((resolve, reject) => {
      this.server = http.createServer(async (req, res) => {
        // Enable CORS for file:// protocol
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.writeHead(200);
          res.end();
          return;
        }

        // Serve the HTML page
        if (req.method === 'GET' && req.url === '/') {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(this.getHtmlPage(port));
          return;
        }

        if (req.method === 'POST' && req.url === '/token') {
          let body = '';

          req.on('data', chunk => {
            body += chunk.toString();
          });

          req.on('end', async () => {
            try {
              const data = JSON.parse(body);
              const token = data.token;

              if (!token) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: false, error: 'No token provided' }));
                return;
              }

              // Save token to config file
              await this.tokenManager.saveToken(token, 'config');

              const sessionId = `session_${Date.now()}`;

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ ok: true, sessionId }));

              console.log('\n✓ Token captured and saved!');
              console.log('You can now use the CLI without --token flag.');

              // Close server after successful capture
              setTimeout(() => {
                this.stop();
                process.exit(0);
              }, 100);

            } catch (error) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ ok: false, error: 'Internal server error' }));
            }
          });
        } else {
          res.writeHead(404);
          res.end('Not found');
        }
      });

      this.server.on('error', (error: any) => {
        if (error.code === 'EADDRINUSE') {
          reject(new Error(`Port ${port} is already in use`));
        } else {
          reject(error);
        }
      });

      this.server.listen(port, () => {
        resolve(`http://127.0.0.1:${port}`);
      });
    });
  }

  stop() {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }

  private getHtmlPage(port: number): string {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Huntr Token Capture</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      max-width: 600px;
      margin: 50px auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 { color: #333; margin-top: 0; }
    .step {
      margin: 20px 0;
      padding: 15px;
      background: #f8f9fa;
      border-left: 4px solid #007bff;
      border-radius: 4px;
    }
    code {
      background: #e9ecef;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 14px;
    }
    .snippet {
      background: #2d2d2d;
      color: #f8f8f2;
      padding: 15px;
      border-radius: 4px;
      margin: 10px 0;
      overflow-x: auto;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 13px;
      cursor: pointer;
    }
    .snippet:hover { background: #3d3d3d; }
    .success { color: #28a745; font-weight: bold; }
    .error { color: #dc3545; }
    button {
      background: #007bff;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }
    button:hover { background: #0056b3; }
    #status { margin-top: 20px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎯 Huntr Token Capture</h1>
    
    <div class="step">
      <strong>Step 1:</strong> Open <a href="https://huntr.co" target="_blank">huntr.co</a> and log in
    </div>
    
    <div class="step">
      <strong>Step 2:</strong> Open DevTools Console (F12 or Cmd+Option+J)
    </div>
    
    <div class="step">
      <strong>Step 3:</strong> Run this in the Huntr console:
      <div class="snippet" onclick="copySnippet()" title="Click to copy">
(async()=>{var t=await window.Clerk.session.getToken({skipCache:true});window.opener?.postMessage({type:'HUNTR_TOKEN',token:t},'http://127.0.0.1:${port}');window.close();console.log('✓ Token sent!')})();
      </div>
      <small style="color: #666;">Click to copy, or click button below</small>
    </div>
    
    <button onclick="openHuntr()">Open Huntr & Capture Token</button>
    
    <div id="status"></div>
  </div>
  
  <script>
    let huntrWindow = null;
    
    function copySnippet() {
      const text = \`(async()=>{var t=await window.Clerk.session.getToken({skipCache:true});window.opener?.postMessage({type:'HUNTR_TOKEN',token:t},'http://127.0.0.1:${port}');window.close();console.log('✓ Token sent!')})();\`;
      navigator.clipboard.writeText(text).then(() => {
        document.getElementById('status').innerHTML = '<span class="success">✓ Copied! Now paste in Huntr Console</span>';
      });
    }
    
    function openHuntr() {
      huntrWindow = window.open('https://huntr.co', 'huntr', 'width=800,height=600');
      document.getElementById('status').innerHTML = '<span style="color: #666;">Waiting for token from Huntr window...</span>';
    }
    
    window.addEventListener('message', async (event) => {
      if (event.origin !== 'https://huntr.co') return;
      if (event.data.type === 'HUNTR_TOKEN' && event.data.token) {
        document.getElementById('status').innerHTML = '<span style="color: #666;">Sending token to CLI...</span>';
        
        try {
          const response = await fetch('http://127.0.0.1:${port}/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: event.data.token })
          });
          
          if (response.ok) {
            document.getElementById('status').innerHTML = '<span class="success">✓ Token captured! You can close this window.</span>';
            setTimeout(() => window.close(), 2000);
          } else {
            document.getElementById('status').innerHTML = '<span class="error">Error saving token</span>';
          }
        } catch (error) {
          document.getElementById('status').innerHTML = '<span class="error">Error: ' + error.message + '</span>';
        }
      }
    });
  </script>
</body>
</html>`;
  }
}
