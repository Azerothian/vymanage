import * as http from 'http';
import * as https from 'https';
import * as crypto from 'crypto';

export interface MockApiServerOptions {
  port?: number;
  https?: boolean;
}

const MOCK_INFO = {
  version: '1.4.0',
  hostname: 'vyos-router',
};

const MOCK_CONFIG: Record<string, unknown> = {
  interfaces: {
    ethernet: {
      eth0: {
        address: ['dhcp'],
        description: 'WAN',
        'hw-id': '00:11:22:33:44:55',
      },
      eth1: {
        address: ['192.168.1.1/24'],
        description: 'LAN',
        'hw-id': '00:11:22:33:44:66',
      },
    },
  },
  system: {
    'host-name': 'vyos-router',
    'name-server': ['8.8.8.8', '8.8.4.4'],
  },
  service: {
    ssh: { port: '22' },
  },
};

export class MockVyosApiServer {
  private server: http.Server | https.Server;
  private _port: number;
  private _isHttps: boolean;
  public lastRequest: {
    method?: string;
    url?: string;
    headers?: http.IncomingHttpHeaders;
    body?: string;
  } = {};

  constructor(opts?: MockApiServerOptions) {
    this._port = opts?.port ?? 0;
    this._isHttps = opts?.https ?? false;

    const handler = (req: http.IncomingMessage, res: http.ServerResponse) => {
      let body = '';
      req.on('data', (chunk: Buffer) => {
        body += chunk.toString();
      });
      req.on('end', () => {
        this.lastRequest = {
          method: req.method,
          url: req.url,
          headers: req.headers,
          body,
        };
        this.handleRequest(req, res, body);
      });
    };

    if (this._isHttps) {
      const { key, cert } = generateSelfSignedCert();
      this.server = https.createServer({ key, cert }, handler);
    } else {
      this.server = http.createServer(handler);
    }
  }

  private handleRequest(req: http.IncomingMessage, res: http.ServerResponse, body: string): void {
    res.setHeader('Content-Type', 'application/json');
    const url = req.url || '/';

    if (url === '/info' && req.method === 'GET') {
      res.end(JSON.stringify(MOCK_INFO));
      return;
    }

    // Parse form-encoded body
    let data: Record<string, unknown> = {};
    try {
      const params = new URLSearchParams(body);
      const dataStr = params.get('data');
      if (dataStr) {
        data = JSON.parse(dataStr);
      }
    } catch {
      // ignore parse errors
    }

    if (url === '/retrieve') {
      const path = (data.path as string[]) || [];
      let result: unknown = MOCK_CONFIG;
      if (path.length > 0) {
        result = getNestedValue(MOCK_CONFIG, path);
      }
      res.end(JSON.stringify({ success: true, data: result }));
      return;
    }

    if (url === '/configure') {
      res.end(JSON.stringify({ success: true, data: null }));
      return;
    }

    if (url === '/config-file') {
      res.end(JSON.stringify({ success: true, data: null }));
      return;
    }

    if (url === '/show') {
      res.end(JSON.stringify({ success: true, data: {} }));
      return;
    }

    // Generic success for other endpoints
    if (['/generate', '/reset', '/reboot', '/poweroff', '/image'].includes(url)) {
      res.end(JSON.stringify({ success: true, data: null }));
      return;
    }

    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Not found' }));
  }

  async start(): Promise<number> {
    return new Promise((resolve) => {
      this.server.listen(this._port, '127.0.0.1', () => {
        const addr = this.server.address();
        if (addr && typeof addr === 'object') {
          this._port = addr.port;
        }
        resolve(this._port);
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      this.server.close(() => resolve());
    });
  }

  get port(): number {
    return this._port;
  }

  get baseUrl(): string {
    const protocol = this._isHttps ? 'https' : 'http';
    return `${protocol}://127.0.0.1:${this._port}`;
  }
}

function getNestedValue(obj: Record<string, unknown>, path: string[]): unknown {
  let current: unknown = obj;
  for (const key of path) {
    if (current && typeof current === 'object' && key in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }
  return current;
}

function generateSelfSignedCert(): { key: string; cert: string } {
  // Generate a self-signed certificate using Node.js crypto
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  // Create a minimal self-signed cert using a bare approach
  // For test purposes, we use the forge-free approach with Node built-ins
  // We'll use a simple exec of openssl if available, or fall back
  const cert = createSelfSignedCert(privateKey, publicKey);
  return { key: privateKey, cert };
}

function createSelfSignedCert(privateKey: string, _publicKey: string): string {
  // Use Node.js crypto to create a self-signed certificate
  // This is a simplified approach for testing
  const { execSync } = require('child_process');
  try {
    // Write key to temp file and generate cert
    const tmpKey = '/tmp/vymanage-test-key.pem';
    const tmpCert = '/tmp/vymanage-test-cert.pem';
    require('fs').writeFileSync(tmpKey, privateKey);
    execSync(
      `openssl req -new -x509 -key ${tmpKey} -out ${tmpCert} -days 1 -subj "/CN=localhost" 2>/dev/null`,
    );
    const cert = require('fs').readFileSync(tmpCert, 'utf-8');
    require('fs').unlinkSync(tmpKey);
    require('fs').unlinkSync(tmpCert);
    return cert;
  } catch {
    // If openssl is not available, return a dummy - HTTPS tests will be skipped
    return '';
  }
}
