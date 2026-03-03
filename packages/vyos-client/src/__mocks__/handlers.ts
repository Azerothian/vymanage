import { http, HttpResponse } from 'msw';

const MOCK_BASE_URL = 'https://192.168.1.1';

export const mockVyosInfo = {
  version: 'VyOS 1.4.0',
  hostname: 'vyos-router',
  uptime: '5 days, 3:22:10',
};

export const mockConfig = {
  interfaces: {
    ethernet: {
      eth0: {
        address: ['192.168.1.1/24'],
        description: 'LAN',
      },
      eth1: {
        address: ['dhcp'],
        description: 'WAN',
      },
    },
  },
  service: {
    ssh: {
      port: '22',
    },
  },
};

export const mockShowOutput = {
  interfaces: [
    { name: 'eth0', state: 'up', address: '192.168.1.1/24' },
    { name: 'eth1', state: 'up', address: 'dhcp' },
  ],
};

function parseFormData(body: string): Record<string, string> {
  return Object.fromEntries(new URLSearchParams(body));
}

function parseData(body: string): Record<string, unknown> {
  const params = parseFormData(body);
  if (params.data) {
    return JSON.parse(params.data) as Record<string, unknown>;
  }
  return {};
}

export const handlers = [
  // GET /info
  http.get(`${MOCK_BASE_URL}/info`, () => {
    return HttpResponse.json(mockVyosInfo);
  }),

  // POST /retrieve
  http.post(`${MOCK_BASE_URL}/retrieve`, async ({ request }) => {
    const body = await request.text();
    const data = parseData(body);

    switch (data.op) {
      case 'showConfig':
        return HttpResponse.json({ success: true, data: mockConfig, error: null });
      case 'returnValues': {
        const path = data.path as string[];
        if (path.includes('eth0')) {
          return HttpResponse.json({ success: true, data: ['192.168.1.1/24'], error: null });
        }
        return HttpResponse.json({ success: true, data: [], error: null });
      }
      case 'exists':
        return HttpResponse.json({ success: true, data: true, error: null });
      default:
        return HttpResponse.json({ success: false, data: null, error: 'Unknown op' }, { status: 400 });
    }
  }),

  // POST /configure
  http.post(`${MOCK_BASE_URL}/configure`, async ({ request }) => {
    const body = await request.text();
    const data = parseData(body);
    const commands = data.commands as Array<{ op: string; path: string[] }>;

    if (!Array.isArray(commands) || commands.length === 0) {
      return HttpResponse.json({ success: false, data: null, error: 'No commands provided' }, { status: 400 });
    }

    return HttpResponse.json({ success: true, data: null, error: null });
  }),

  // POST /config-file
  http.post(`${MOCK_BASE_URL}/config-file`, async ({ request }) => {
    const body = await request.text();
    const data = parseData(body);

    switch (data.op) {
      case 'save':
        return HttpResponse.json({ success: true, data: null, error: null });
      case 'load':
        return HttpResponse.json({ success: true, data: null, error: null });
      case 'confirm':
        return HttpResponse.json({ success: true, data: null, error: null });
      default:
        return HttpResponse.json({ success: false, data: null, error: 'Unknown op' }, { status: 400 });
    }
  }),

  // POST /show
  http.post(`${MOCK_BASE_URL}/show`, async () => {
    return HttpResponse.json({ success: true, data: mockShowOutput, error: null });
  }),

  // POST /generate
  http.post(`${MOCK_BASE_URL}/generate`, async () => {
    return HttpResponse.json({ success: true, data: null, error: null });
  }),

  // POST /reset
  http.post(`${MOCK_BASE_URL}/reset`, async () => {
    return HttpResponse.json({ success: true, data: null, error: null });
  }),

  // POST /reboot
  http.post(`${MOCK_BASE_URL}/reboot`, async () => {
    return HttpResponse.json({ success: true, data: null, error: null });
  }),

  // POST /poweroff
  http.post(`${MOCK_BASE_URL}/poweroff`, async () => {
    return HttpResponse.json({ success: true, data: null, error: null });
  }),

  // POST /image
  http.post(`${MOCK_BASE_URL}/image`, async ({ request }) => {
    const body = await request.text();
    const data = parseData(body);

    if (data.op === 'add') {
      return HttpResponse.json({ success: true, data: null, error: null });
    }
    if (data.op === 'delete') {
      return HttpResponse.json({ success: true, data: null, error: null });
    }
    return HttpResponse.json({ success: false, data: null, error: 'Unknown op' }, { status: 400 });
  }),
];
