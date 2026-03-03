export const FIREWALL_BRIDGE_CONFIG: Record<string, unknown> = {
  interfaces: {
    bridge: {
      br0: {
        description: 'Isolated L2 bridge',
        member: { interface: { eth1: {}, eth2: {} } },
      },
      br1: {
        address: ['10.1.1.1/24'],
        description: 'L3 bridge br1',
        member: { interface: { eth3: {}, eth4: {} } },
      },
      br2: {
        address: ['10.2.2.1/24'],
        description: 'L3 bridge br2',
        member: { interface: { eth5: {}, eth6: {}, eth7: {} } },
      },
    },
    ethernet: {
      eth1: { description: 'br0' },
      eth2: { description: 'br0' },
      eth3: { description: 'br1' },
      eth4: { description: 'br1' },
      eth5: { description: 'br2 - Host' },
      eth6: { description: 'br2 - Trusted DHCP Server' },
      eth7: { description: 'br2' },
    },
    loopback: { lo: {} },
  },
  firewall: {
    group: {
      'interface-group': {
        'br0-ifaces': { interface: ['br0', 'eth1', 'eth2'] },
        'br1-ifaces': { interface: ['br1', 'eth3', 'eth4'] },
        'br2-ifaces': { interface: ['br2', 'eth5', 'eth6', 'eth7'] },
      },
    },
    bridge: {
      prerouting: {
        filter: {
          rule: {
            '10': {
              action: 'jump',
              description: 'br0 traffic',
              'inbound-interface': { group: 'br0-ifaces' },
              'jump-target': 'br0-pre',
            },
            '20': {
              action: 'jump',
              description: 'br1 traffic',
              'inbound-interface': { group: 'br1-ifaces' },
              'jump-target': 'br1-pre',
            },
            '30': {
              action: 'jump',
              description: 'br2 traffic',
              'inbound-interface': { group: 'br2-ifaces' },
              'jump-target': 'br2-pre',
            },
          },
        },
      },
      forward: {
        filter: {
          'default-action': 'drop',
          rule: {
            '5': { action: 'accept', state: 'established' },
            '10': { action: 'drop', state: 'invalid' },
            '110': {
              action: 'jump',
              description: 'br0 traffic',
              'inbound-interface': { group: 'br0-ifaces' },
              'jump-target': 'br0-fwd',
            },
            '120': {
              action: 'jump',
              description: 'br1 traffic',
              'inbound-interface': { group: 'br1-ifaces' },
              'jump-target': 'br1-fwd',
            },
            '130': {
              action: 'jump',
              description: 'br2 traffic',
              'inbound-interface': { group: 'br2-ifaces' },
              'jump-target': 'br2-fwd',
            },
          },
        },
      },
      name: {
        'br0-pre': {
          'default-action': 'drop',
          rule: {
            '10': { action: 'accept', description: 'Accept IPv6 traffic', 'ethernet-type': 'ipv6' },
          },
        },
        'br1-pre': {
          'default-action': 'accept',
          rule: {
            '10': {
              action: 'drop',
              description: 'Drop DHCP discover',
              protocol: 'udp',
              source: { port: '68' },
              destination: { port: '67', 'mac-address': 'ff:ff:ff:ff:ff:ff' },
              log: {},
            },
            '20': { action: 'drop', description: 'Drop IPv6 traffic', 'ethernet-type': 'ipv6' },
          },
        },
        'br2-pre': {
          'default-action': 'accept',
          rule: {
            '10': { action: 'drop', description: 'Drop IPv6 traffic', 'ethernet-type': 'ipv6' },
          },
        },
        'br0-fwd': { 'default-action': 'accept' },
        'br1-fwd': {
          'default-action': 'drop',
          rule: {
            '10': { action: 'accept', description: 'Accept ARP', 'ethernet-type': 'arp' },
            '20': {
              action: 'accept',
              description: 'Accept ipv4 from host',
              source: { address: '10.1.1.102' },
              state: 'new',
            },
          },
        },
        'br2-fwd': {
          'default-action': 'drop',
          rule: {
            '10': {
              action: 'accept',
              description: 'Accept DHCP discover',
              protocol: 'udp',
              source: { port: '68' },
              destination: { port: '67', 'mac-address': 'ff:ff:ff:ff:ff:ff' },
            },
            '20': {
              action: 'accept',
              description: 'Accept DHCP offers from trusted interface',
              protocol: 'udp',
              source: { port: '67' },
              destination: { port: '68' },
              'inbound-interface': { name: 'eth6' },
            },
            '22': {
              action: 'drop',
              description: 'Drop all other DHCP offers',
              protocol: 'udp',
              source: { port: '67' },
              destination: { port: '68' },
              log: {},
            },
            '30': { action: 'accept', description: 'Accept ARP', 'ethernet-type': 'arp' },
            '40': { action: 'accept', description: 'Accept ipv4', 'ethernet-type': 'ipv4' },
          },
        },
      },
    },
    ipv4: {
      input: {
        filter: {
          rule: {
            '10': { action: 'accept', state: 'established' },
            '20': { action: 'drop', state: 'invalid' },
            '110': {
              action: 'accept',
              description: 'Accept access from br1',
              'inbound-interface': { group: 'br1-ifaces' },
            },
            '120': {
              action: 'drop',
              description: 'Deny access from br2',
              'inbound-interface': { group: 'br2-ifaces' },
            },
          },
        },
      },
      forward: {
        filter: {
          'default-action': 'drop',
          rule: {
            '5': { action: 'accept', state: 'established' },
            '10': { action: 'drop', state: 'invalid' },
            '110': {
              action: 'jump',
              description: 'br1 traffic',
              'inbound-interface': { group: 'br1-ifaces' },
              'jump-target': 'ip-br1-fwd',
            },
            '120': {
              action: 'jump',
              description: 'br2 traffic',
              'inbound-interface': { group: 'br2-ifaces' },
              'jump-target': 'ip-br2-fwd',
            },
          },
        },
      },
      name: {
        'ip-br1-fwd': {
          'default-action': 'drop',
          rule: {
            '10': {
              action: 'accept',
              description: 'br1 - allow internet access',
              'outbound-interface': { name: 'eth0' },
            },
          },
        },
        'ip-br2-fwd': {
          'default-action': 'drop',
          rule: {
            '10': {
              action: 'accept',
              description: 'br2 - allow internet access',
              'outbound-interface': { name: 'eth0' },
            },
            '20': {
              action: 'accept',
              description: 'br2 - allow access to br1',
              'outbound-interface': { group: 'br1-ifaces' },
            },
          },
        },
      },
    },
  },
  system: {
    'host-name': 'vyos-bridge-fw',
    'name-server': ['8.8.8.8'],
  },
};
