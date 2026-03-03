export const BGP_UNNUMBERED_CONFIG: Record<string, unknown> = {
  protocols: {
    bgp: {
      'system-as': '64496',
      'address-family': {
        'ipv4-unicast': { redistribute: { connected: {} } },
        'ipv6-unicast': { redistribute: { connected: {} } },
      },
      neighbor: {
        eth1: {
          interface: {
            v6only: {
              'peer-group': 'fabric',
            },
          },
        },
        eth2: {
          interface: {
            v6only: {
              'peer-group': 'fabric',
            },
          },
        },
      },
      parameters: {
        bestpath: {
          'as-path': { 'multipath-relax': {} },
          'compare-routerid': {},
        },
        default: { 'no-ipv4-unicast': {} },
        'router-id': '192.168.0.1',
      },
      'peer-group': {
        fabric: {
          'address-family': {
            'ipv4-unicast': {},
            'ipv6-unicast': {},
          },
          capability: { 'extended-nexthop': {} },
          'remote-as': 'external',
        },
      },
    },
  },
  interfaces: {
    ethernet: {
      eth1: { address: ['192.168.0.1/32'], description: 'to-peer-1' },
      eth2: { address: ['192.168.0.1/32'], description: 'to-peer-2' },
    },
    loopback: { lo: { address: ['192.168.0.1/32'] } },
  },
  system: {
    'host-name': 'vyos-bgp',
    'name-server': ['8.8.8.8'],
  },
};
