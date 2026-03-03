export const DMVPN_CONFIG: Record<string, unknown> = {
  interfaces: {
    ethernet: {
      eth0: { address: ['10.0.12.2/30'], description: 'WAN' },
      eth1: { address: ['192.168.12.1/24'], description: 'LAN' },
    },
    tunnel: {
      tun100: {
        address: ['10.100.100.12/32'],
        'enable-multicast': {},
        encapsulation: 'gre',
        ip: { 'adjust-mss': '1360' },
        mtu: '1436',
        parameters: { ip: { key: '42' } },
        'source-interface': 'eth0',
      },
      tun101: {
        address: ['10.100.101.12/32'],
        'enable-multicast': {},
        encapsulation: 'gre',
        ip: { 'adjust-mss': '1360' },
        mtu: '1436',
        parameters: { ip: { key: '43' } },
        'source-interface': 'eth0',
      },
    },
    loopback: { lo: {} },
  },
  protocols: {
    nhrp: {
      tunnel: {
        tun100: {
          authentication: 'vyos',
          holdtime: '300',
          multicast: '10.0.0.2',
          'network-id': '1',
          nhs: { 'tunnel-ip': { dynamic: { nbma: '10.0.0.2' } } },
          'registration-no-unique': {},
          shortcut: {},
        },
        tun101: {
          authentication: 'vyos',
          holdtime: '300',
          multicast: '10.0.1.2',
          'network-id': '2',
          nhs: { 'tunnel-ip': { dynamic: { nbma: '10.0.1.2' } } },
          'registration-no-unique': {},
          shortcut: {},
        },
      },
    },
    ospf: {
      interface: {
        eth1: { area: '0' },
        tun100: { area: '0', network: 'point-to-multipoint', passive: 'disable' },
        tun101: { area: '0', network: 'point-to-multipoint', passive: 'disable' },
      },
      'passive-interface': 'default',
    },
    static: {
      route: { '0.0.0.0/0': { 'next-hop': { '10.0.12.1': {} } } },
    },
  },
  vpn: {
    ipsec: {
      'esp-group': {
        'ESP-HUB': {
          lifetime: '1800',
          mode: 'transport',
          pfs: 'disable',
          proposal: { '1': { encryption: 'aes256', hash: 'sha1' } },
        },
      },
      'ike-group': {
        'IKE-HUB': {
          'key-exchange': 'ikev1',
          lifetime: '3600',
          proposal: { '1': { 'dh-group': '2', encryption: 'aes256', hash: 'sha1' } },
        },
      },
      interface: 'eth0',
      profile: {
        NHRPVPN: {
          authentication: { mode: 'pre-shared-secret', 'pre-shared-secret': 'secret' },
          bind: { tunnel: ['tun100', 'tun101'] },
          'esp-group': 'ESP-HUB',
          'ike-group': 'IKE-HUB',
        },
      },
    },
  },
  system: {
    'host-name': 'vyos-spoke2',
    'name-server': ['8.8.8.8'],
  },
};
