export const PPPOE_IPV6_CONFIG: Record<string, unknown> = {
  interfaces: {
    ethernet: {
      eth0: { description: 'WAN physical' },
      eth1: { address: ['192.168.1.1/24'], description: 'LAN' },
    },
    pppoe: {
      pppoe0: {
        authentication: { password: 'mypassword', user: 'myuser' },
        'service-name': 'myisp',
        'source-interface': 'eth0',
        ipv6: {
          address: { autoconf: {} },
        },
        'dhcpv6-options': {
          pd: {
            '0': { interface: { eth1: { address: '100' } } },
          },
        },
      },
    },
    loopback: { lo: {} },
  },
  service: {
    'router-advert': {
      interface: {
        eth1: {
          'link-mtu': '1492',
          'name-server': ['2001:4860:4860::8888'],
          prefix: {
            '::/64': { 'valid-lifetime': '172800' },
          },
        },
      },
    },
  },
  firewall: {
    ipv6: {
      name: {
        WAN_IN: {
          'default-action': 'drop',
          rule: {
            '10': { action: 'accept', state: { established: 'enable', related: 'enable' } },
            '20': { action: 'accept', protocol: 'icmpv6' },
          },
        },
        WAN_LOCAL: {
          'default-action': 'drop',
          rule: {
            '10': { action: 'accept', state: { established: 'enable', related: 'enable' } },
            '20': { action: 'accept', protocol: 'icmpv6' },
            '30': { action: 'accept', destination: { port: '546' }, protocol: 'udp', source: { port: '547' } },
          },
        },
      },
      forward: {
        filter: {
          rule: {
            '10': { action: 'jump', 'jump-target': 'WAN_IN', 'inbound-interface': { name: 'pppoe0' } },
          },
        },
      },
      input: {
        filter: {
          rule: {
            '10': { action: 'jump', 'jump-target': 'WAN_LOCAL', 'inbound-interface': { name: 'pppoe0' } },
          },
        },
      },
    },
  },
  system: {
    'host-name': 'vyos-pppoe6',
    'name-server': ['8.8.8.8', '2001:4860:4860::8888'],
  },
};
