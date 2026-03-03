export const WAN_LB_CONFIG: Record<string, unknown> = {
  'load-balancing': {
    wan: {
      'interface-health': {
        eth0: {
          'failure-count': '5',
          nexthop: '11.22.33.1',
          test: {
            '10': { type: 'ping', target: '33.44.55.66' },
            '20': { type: 'ping', target: '44.55.66.77' },
          },
        },
        eth1: {
          'failure-count': '4',
          nexthop: '22.33.44.1',
          test: {
            '10': { type: 'ping', target: '55.66.77.88' },
            '20': { type: 'ping', target: '66.77.88.99' },
          },
        },
      },
      rule: {
        '5': {
          exclude: {},
          'inbound-interface': 'eth+',
          destination: { address: '10.0.0.0/8' },
        },
        '10': {
          'inbound-interface': 'eth2',
          interface: { eth0: { weight: '10' }, eth1: { weight: '1' } },
          failover: {},
        },
        '20': {
          'inbound-interface': 'eth2',
          interface: { eth1: {} },
          destination: { port: 'sip' },
          protocol: 'tcp',
        },
      },
    },
  },
  protocols: {
    static: {
      route: {
        '33.44.55.66/32': { 'next-hop': { '11.22.33.1': {} } },
        '44.55.66.77/32': { 'next-hop': { '11.22.33.1': {} } },
        '55.66.77.88/32': { 'next-hop': { '22.33.44.1': {} } },
        '66.77.88.99/32': { 'next-hop': { '22.33.44.1': {} } },
        '0.0.0.0/0': { 'next-hop': { '11.22.33.1': {} } },
      },
    },
  },
  interfaces: {
    ethernet: {
      eth0: { address: ['11.22.33.2/24'], description: 'WAN1' },
      eth1: { address: ['22.33.44.2/24'], description: 'WAN2' },
      eth2: { address: ['192.168.1.1/24'], description: 'LAN' },
    },
    loopback: { lo: {} },
  },
  system: {
    'host-name': 'vyos-wan-lb',
    'name-server': ['8.8.8.8'],
  },
};
