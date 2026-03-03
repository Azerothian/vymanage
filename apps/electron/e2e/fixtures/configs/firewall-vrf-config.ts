export const FIREWALL_VRF_CONFIG: Record<string, unknown> = {
  interfaces: {
    ethernet: {
      eth0: { description: 'WAN physical' },
      eth1: { address: ['10.100.100.1/24'], vrf: 'MGMT' },
      eth2: {
        vif: {
          '150': { address: ['10.150.150.1/24'], vrf: 'LAN' },
          '160': { address: ['10.160.160.1/24'], vrf: 'LAN' },
          '3500': { address: ['172.16.20.1/24'], vrf: 'PROD' },
        },
      },
    },
    pppoe: {
      pppoe0: {
        authentication: { password: 'p4ssw0rd', username: 'vyos' },
        'source-interface': 'eth0',
        vrf: 'WAN',
      },
    },
    loopback: { lo: {} },
  },
  vrf: {
    'bind-to-all': {},
    name: {
      LAN: {
        table: '103',
        protocols: {
          static: {
            route: {
              '0.0.0.0/0': { interface: { pppoe0: { vrf: 'WAN' } } },
              '10.100.100.0/24': { interface: { eth1: { vrf: 'MGMT' } } },
              '172.16.20.0/24': { interface: { 'eth2.3500': { vrf: 'PROD' } } },
            },
          },
        },
      },
      MGMT: {
        table: '102',
        protocols: {
          static: {
            route: {
              '10.150.150.0/24': { interface: { 'eth2.150': { vrf: 'LAN' } } },
              '10.160.160.0/24': { interface: { 'eth2.160': { vrf: 'LAN' } } },
              '172.16.20.0/24': { interface: { 'eth2.3500': { vrf: 'PROD' } } },
            },
          },
        },
      },
      PROD: {
        table: '104',
        protocols: {
          static: {
            route: {
              '0.0.0.0/0': { interface: { pppoe0: { vrf: 'WAN' } } },
              '10.100.100.0/24': { interface: { eth1: { vrf: 'MGMT' } } },
              '10.150.150.0/24': { interface: { 'eth2.150': { vrf: 'LAN' } } },
              '10.160.160.0/24': { interface: { 'eth2.160': { vrf: 'LAN' } } },
            },
          },
        },
      },
      WAN: {
        table: '101',
        protocols: {
          static: {
            route: {
              '10.150.150.0/24': { interface: { 'eth2.150': { vrf: 'LAN' } } },
              '10.160.160.0/24': { interface: { 'eth2.160': { vrf: 'LAN' } } },
              '172.16.20.0/24': { interface: { 'eth2.3500': { vrf: 'PROD' } } },
            },
          },
        },
      },
    },
  },
  firewall: {
    'global-options': {
      'state-policy': {
        established: { action: 'accept' },
        invalid: { action: 'drop' },
        related: { action: 'accept' },
      },
    },
    ipv4: {
      forward: {
        filter: {
          'default-action': 'drop',
          'default-log': {},
          rule: {
            '10': {
              action: 'accept',
              description: 'MGMT - Allow to LAN and PROD',
              'inbound-interface': { name: 'MGMT' },
              'outbound-interface': { name: 'eth2*' },
            },
            '99': {
              action: 'drop',
              description: 'MGMT - Drop all going to mgmt',
              'outbound-interface': { name: 'eth1' },
            },
            '120': {
              action: 'accept',
              description: 'LAN - Allow to PROD',
              'inbound-interface': { name: 'LAN' },
              'outbound-interface': { name: 'eth2.3500' },
            },
            '130': {
              action: 'accept',
              description: 'LAN - Allow internet',
              'inbound-interface': { name: 'LAN' },
              'outbound-interface': { name: 'pppoe0' },
            },
          },
        },
      },
      input: {
        filter: {
          'default-action': 'drop',
          'default-log': {},
          rule: {
            '10': {
              action: 'accept',
              description: 'MGMT - Allow input',
              'inbound-interface': { name: 'MGMT' },
            },
          },
        },
      },
    },
  },
  nat: {
    source: {
      rule: {
        '100': {
          'outbound-interface': { name: 'pppoe0' },
          translation: { address: 'masquerade' },
          source: { address: '10.150.150.0/24' },
          description: 'LAN masquerade',
        },
        '200': {
          'outbound-interface': { name: 'pppoe0' },
          translation: { address: 'masquerade' },
          source: { address: '172.16.20.0/24' },
          description: 'PROD masquerade',
        },
      },
    },
  },
  system: {
    'host-name': 'vyos-vrf-fw',
    'name-server': ['8.8.8.8'],
  },
};
