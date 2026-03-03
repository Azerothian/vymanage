import type { Page } from '@playwright/test';
import { StatefulMockApi } from './stateful-mock';
import { FULL_MOCK_CONFIG, MOCK_INFO as FULL_MOCK_INFO, MOCK_OPERATIONAL as FULL_MOCK_OPERATIONAL } from './mock-config';

const MOCK_INFO = {
  version: '1.4.0',
  hostname: 'vyos-router',
};

const MOCK_INTERFACES = {
  ethernet: {
    eth0: {
      address: ['192.168.1.1/24'],
      description: 'WAN',
      hw_id: '00:11:22:33:44:55',
    },
    eth1: {
      address: ['10.0.0.1/24'],
      description: 'LAN',
      hw_id: '00:11:22:33:44:66',
    },
    eth2: {
      description: 'Bond member',
    },
    eth3: {
      description: 'Bond member',
    },
  },
  bonding: {
    bond0: {
      address: ['172.16.0.1/24'],
      description: 'Uplink bond',
      member: { interface: ['eth2', 'eth3'] },
    },
  },
  bridge: {
    br0: {
      address: ['192.168.50.1/24'],
      description: 'Service bridge',
      member: { interface: ['eth4', 'bond0'] },
    },
  },
  loopback: {
    lo: {
      address: ['127.0.0.1/8'],
    },
  },
  wireguard: {
    wg0: {
      address: ['10.10.0.1/24'],
      description: 'WireGuard tunnel',
    },
  },
};

const MOCK_FIREWALL = {
  name: {
    WAN_IN: {
      'default-action': 'drop',
      rule: {
        '10': { action: 'accept', state: { established: 'enable', related: 'enable' } },
        '20': { action: 'drop', state: { invalid: 'enable' } },
        '30': { action: 'accept', protocol: 'icmp' },
      },
    },
    WAN_LOCAL: {
      'default-action': 'drop',
      rule: {
        '10': { action: 'accept', state: { established: 'enable', related: 'enable' } },
        '20': { action: 'accept', protocol: 'tcp', destination: { port: '22' } },
      },
    },
  },
  group: {
    'address-group': {
      TRUSTED_HOSTS: { address: ['10.0.0.0/8', '192.168.0.0/16'] },
    },
    'port-group': {
      WEB_PORTS: { port: ['80', '443'] },
    },
  },
};

const MOCK_OPERATIONAL = {
  interfaces: {
    eth0: { status: 'up', speed: '1000', rx_bytes: '1234567', tx_bytes: '7654321' },
    eth1: { status: 'up', speed: '1000', rx_bytes: '9876543', tx_bytes: '3456789' },
    bond0: { status: 'up', speed: '2000' },
    br0: { status: 'up' },
    wg0: { status: 'up' },
  },
};

export async function setupApiMocks(page: Page) {
  // GET /info
  await page.route('**/info', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_INFO),
    });
  });

  // POST /retrieve
  await page.route('**/retrieve', async (route) => {
    const postData = route.request().postData() || '';
    const params = new URLSearchParams(postData);
    const data = JSON.parse(params.get('data') || '{}');

    let responseData: unknown = {};

    if (data.op === 'showConfig') {
      const path = data.path || [];
      if (path[0] === 'interfaces' || path.length === 0) {
        responseData = path.length === 0 ? { interfaces: MOCK_INTERFACES } : MOCK_INTERFACES;
      } else if (path[0] === 'firewall') {
        responseData = MOCK_FIREWALL;
      } else {
        responseData = {};
      }
    } else if (data.op === 'exists') {
      responseData = true;
    } else if (data.op === 'returnValues') {
      responseData = [];
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: responseData }),
    });
  });

  // POST /configure
  await page.route('**/configure', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: null }),
    });
  });

  // POST /config-file
  await page.route('**/config-file', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: null }),
    });
  });

  // POST /show
  await page.route('**/show', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: MOCK_OPERATIONAL }),
    });
  });

  // POST /generate, /reset, /reboot, /poweroff, /image
  for (const endpoint of ['generate', 'reset', 'reboot', 'poweroff', 'image']) {
    await page.route(`**/${endpoint}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: null }),
      });
    });
  }
}

export async function setupStatefulApiMocks(
  page: Page,
  initialConfig?: Record<string, unknown>,
): Promise<StatefulMockApi> {
  const mockApi = new StatefulMockApi(initialConfig ?? FULL_MOCK_CONFIG);

  await page.route('**/info', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: FULL_MOCK_INFO }),
    });
  });

  await page.route('**/retrieve', async (route) => {
    const postData = route.request().postData();
    let path: string[] = [];
    if (postData) {
      try {
        const params = new URLSearchParams(postData);
        const data = JSON.parse(params.get('data') || '{}');
        path = data.path || [];
      } catch { /* empty */ }
    }
    const result = path.length > 0 ? mockApi.showConfig(path) : mockApi.getConfig();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: result }),
    });
  });

  await page.route('**/configure', async (route) => {
    const postData = route.request().postData();
    if (postData) {
      try {
        const params = new URLSearchParams(postData);
        const data = JSON.parse(params.get('data') || '[]');
        mockApi.processCommands(data);
      } catch { /* empty */ }
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: null }),
    });
  });

  await page.route('**/config-file', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: null }),
    });
  });

  await page.route('**/show', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: FULL_MOCK_OPERATIONAL }),
    });
  });

  for (const endpoint of ['generate', 'reset', 'reboot', 'poweroff', 'image']) {
    await page.route(`**/${endpoint}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: null }),
      });
    });
  }

  return mockApi;
}
