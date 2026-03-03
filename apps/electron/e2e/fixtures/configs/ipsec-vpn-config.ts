export const IPSEC_VPN_CONFIG: Record<string, unknown> = {
  interfaces: {
    ethernet: {
      eth0: { address: ['10.0.1.2/30'], description: 'WAN' },
      eth1: { address: ['192.168.0.1/24'], description: 'LAN1' },
      eth2: { address: ['192.168.1.1/24'], description: 'LAN2' },
    },
    vti: {
      vti1: { address: ['10.100.100.1/30'], mtu: '1438' },
    },
    loopback: { lo: {} },
  },
  vpn: {
    ipsec: {
      authentication: {
        psk: {
          'AUTH-PSK': {
            id: ['10.0.1.2', '10.0.2.2'],
            secret: 'dGVzdA==',
            'secret-type': 'base64',
          },
        },
      },
      'esp-group': {
        'ESP-GROUP': {
          lifetime: '3600',
          pfs: 'disable',
          proposal: {
            '10': { encryption: 'aes256', hash: 'sha256' },
          },
        },
      },
      'ike-group': {
        'IKE-GROUP': {
          'close-action': 'start',
          'dead-peer-detection': { action: 'restart', interval: '10', timeout: '30' },
          'key-exchange': 'ikev1',
          lifetime: '28800',
          proposal: {
            '10': { 'dh-group': '14', encryption: 'aes128', hash: 'sha1' },
          },
        },
      },
      options: { 'disable-route-autoinstall': {} },
      'site-to-site': {
        peer: {
          CISCO: {
            authentication: {
              'local-id': '10.0.1.2',
              mode: 'pre-shared-secret',
              'remote-id': '10.0.2.2',
            },
            'connection-type': 'initiate',
            'default-esp-group': 'ESP-GROUP',
            'ike-group': 'IKE-GROUP',
            'local-address': '10.0.1.2',
            'remote-address': '10.0.2.2',
            vti: { bind: 'vti1' },
          },
        },
      },
    },
  },
  protocols: {
    ospf: {
      area: {
        '0': {
          network: ['10.100.100.0/30', '192.168.0.0/24', '192.168.1.0/24'],
        },
      },
      interface: {
        eth1: { passive: {} },
        eth2: { passive: {} },
        vti1: { network: 'point-to-point' },
      },
      parameters: { 'router-id': '2.2.2.2' },
    },
    static: {
      route: { '0.0.0.0/0': { 'next-hop': { '10.0.1.1': {} } } },
    },
  },
  system: {
    'host-name': 'vyos-ipsec',
    'name-server': ['8.8.8.8'],
  },
};
