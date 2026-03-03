export const QOS_CONFIG: Record<string, unknown> = {
  interfaces: {
    ethernet: {
      eth0: { address: ['10.1.1.100/24'], description: 'WAN' },
      eth1: { address: ['172.17.1.1/24'], description: 'LAN' },
    },
    loopback: { lo: {} },
  },
  qos: {
    policy: {
      shaper: {
        vyos3: {
          class: {
            '10': {
              match: { ADDRESS10: { ip: { source: { address: '172.17.1.2/32' } } } },
              'set-dscp': 'CS4',
            },
            '20': {
              match: { ADDRESS20: { ip: { source: { address: '172.17.1.3/32' } } } },
              'set-dscp': 'CS5',
            },
            '30': {
              match: { ADDRESS20: { ip: { source: { address: '172.17.1.4/32' } } } },
              'set-dscp': 'CS6',
            },
          },
          default: {
            bandwidth: '10%',
            ceiling: '100%',
            priority: '7',
            'queue-type': 'fair-queue',
          },
        },
      },
    },
    interface: {
      eth0: { egress: 'vyos3' },
    },
  },
  'traffic-policy': {
    shaper: {
      vyos3: {
        class: {
          '10': {
            match: { ADDRESS10: { ip: { source: { address: '172.17.1.2/32' } } } },
            'set-dscp': 'CS4',
          },
          '20': {
            match: { ADDRESS20: { ip: { source: { address: '172.17.1.3/32' } } } },
            'set-dscp': 'CS5',
          },
          '30': {
            match: { ADDRESS20: { ip: { source: { address: '172.17.1.4/32' } } } },
            'set-dscp': 'CS6',
          },
        },
        default: {
          bandwidth: '10%',
          ceiling: '100%',
          priority: '7',
          'queue-type': 'fair-queue',
        },
      },
    },
  },
  protocols: {
    static: {
      route: { '0.0.0.0/0': { 'next-hop': { '10.1.1.1': {} } } },
    },
  },
  system: {
    'host-name': 'vyos-qos',
    'name-server': ['8.8.8.8'],
  },
};
