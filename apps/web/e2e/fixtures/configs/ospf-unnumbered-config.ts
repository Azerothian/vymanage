export const OSPF_UNNUMBERED_CONFIG: Record<string, unknown> = {
  interfaces: {
    ethernet: {
      eth0: { address: ['10.0.0.1/24'], description: 'LAN' },
      eth1: {
        address: ['192.168.0.1/32'],
        ip: {
          ospf: {
            authentication: { md5: { 'key-id': { '1': { 'md5-key': 'yourpassword' } } } },
            network: 'point-to-point',
          },
        },
      },
      eth2: {
        address: ['192.168.0.1/32'],
        ip: {
          ospf: {
            authentication: { md5: { 'key-id': { '1': { 'md5-key': 'yourpassword' } } } },
            network: 'point-to-point',
          },
        },
      },
    },
    loopback: { lo: { address: ['192.168.0.1/32'] } },
  },
  protocols: {
    ospf: {
      area: {
        '0.0.0.0': {
          authentication: 'md5',
          network: ['192.168.0.1/32'],
        },
      },
      parameters: { 'router-id': '192.168.0.1' },
      redistribute: { connected: {} },
    },
  },
  system: {
    'host-name': 'vyos-ospf',
    'name-server': ['8.8.8.8'],
  },
};
