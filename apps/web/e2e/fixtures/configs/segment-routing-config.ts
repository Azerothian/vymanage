export const SEGMENT_ROUTING_CONFIG: Record<string, unknown> = {
  interfaces: {
    dummy: {
      dum0: { address: ['192.0.2.1/32'] },
    },
    ethernet: {
      eth1: { address: ['192.0.2.5/30'], mtu: '8000' },
      eth3: { address: ['192.0.2.21/30'], mtu: '8000' },
    },
    loopback: { lo: {} },
  },
  protocols: {
    isis: {
      interface: {
        dum0: { passive: {} },
        eth1: { network: 'point-to-point' },
        eth3: { network: 'point-to-point' },
      },
      level: 'level-2',
      'log-adjacency-changes': {},
      'metric-style': 'wide',
      net: '49.0000.0000.0000.0001.00',
      'segment-routing': {
        'maximum-label-depth': '8',
        prefix: {
          '192.0.2.1/32': { index: { value: '1' } },
        },
      },
    },
    mpls: {
      interface: ['eth1', 'eth3'],
    },
  },
  system: {
    'host-name': 'P1-VyOS',
    'name-server': ['8.8.8.8'],
  },
};
