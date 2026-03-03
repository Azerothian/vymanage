export const ZONE_POLICY_CONFIG: Record<string, unknown> = {
  firewall: {
    zone: {
      dmz: {
        'default-action': 'drop',
        interface: ['eth0.30'],
        from: {
          lan: {
            firewall: {
              name: 'lan-dmz',
              'ipv6-name': 'lan-dmz-6',
            },
          },
          wan: {
            firewall: {
              name: 'wan-dmz',
            },
          },
        },
      },
      lan: {
        'default-action': 'drop',
        interface: ['eth0.10'],
        from: {
          dmz: {
            firewall: {
              name: 'dmz-lan',
            },
          },
          wan: {
            firewall: {
              name: 'wan-lan',
            },
          },
        },
      },
      wan: {
        'default-action': 'drop',
        interface: ['eth0'],
        from: {
          dmz: {
            firewall: {
              name: 'dmz-wan',
            },
          },
          lan: {
            firewall: {
              name: 'lan-wan',
            },
          },
        },
      },
    },
    ipv4: {
      name: {
        'lan-dmz': {
          'default-action': 'drop',
          rule: {
            '10': { action: 'accept', state: 'established,related', description: 'Allow established' },
            '20': { action: 'accept', protocol: 'tcp', destination: { port: '80,443' }, description: 'Allow HTTP/HTTPS' },
          },
        },
        'wan-lan': {
          'default-action': 'drop',
          rule: {
            '10': { action: 'accept', state: 'established,related', description: 'Allow established' },
          },
        },
        'wan-dmz': {
          'default-action': 'drop',
          rule: {
            '10': { action: 'accept', state: 'established,related', description: 'Allow established' },
            '20': { action: 'accept', protocol: 'tcp', destination: { port: '80,443' }, description: 'Allow web traffic' },
          },
        },
        'dmz-lan': {
          'default-action': 'drop',
          rule: {
            '10': { action: 'accept', state: 'established,related', description: 'Allow established' },
          },
        },
        'dmz-wan': {
          'default-action': 'accept',
        },
        'lan-wan': {
          'default-action': 'accept',
        },
      },
    },
    ipv6: {
      name: {
        'lan-dmz-6': {
          'default-action': 'drop',
          rule: {
            '10': { action: 'accept', state: 'established,related', description: 'Allow established' },
            '20': { action: 'accept', protocol: 'icmpv6', description: 'Allow ICMPv6' },
          },
        },
      },
    },
  },
  interfaces: {
    ethernet: {
      eth0: {
        address: ['203.0.113.1/24'],
        description: 'WAN',
        vif: {
          '10': { address: ['192.168.10.1/24'], description: 'LAN' },
          '30': { address: ['192.168.30.1/24'], description: 'DMZ' },
        },
      },
    },
    loopback: { lo: {} },
  },
  system: {
    'host-name': 'vyos-zone-fw',
    'name-server': ['8.8.8.8'],
  },
};
