import { QOS_CONFIG } from '../../apps/web/e2e/fixtures/configs/qos-config';

/**
 * Zone-Based Firewall — firewall rules only.
 * Strip firewall.zone (not settable via REST API in VyOS 1.4+).
 * Strip interfaces (would override eth0 DHCP address with static 203.0.113.1/24).
 * Strip system (would change hostname).
 * State matching uses { established: true, related: true } (valueless set commands in VyOS 1.4+).
 */
export const QEMU_ZONE_POLICY: Record<string, unknown> = {
  firewall: {
    ipv4: {
      name: {
        'lan-dmz': {
          'default-action': 'drop',
          rule: {
            '10': { action: 'accept', state: { established: true, related: true }, description: 'Allow established' },
            '20': { action: 'accept', protocol: 'tcp', destination: { port: '80,443' }, description: 'Allow HTTP/HTTPS' },
          },
        },
        'wan-lan': {
          'default-action': 'drop',
          rule: {
            '10': { action: 'accept', state: { established: true, related: true }, description: 'Allow established' },
          },
        },
        'wan-dmz': {
          'default-action': 'drop',
          rule: {
            '10': { action: 'accept', state: { established: true, related: true }, description: 'Allow established' },
            '20': { action: 'accept', protocol: 'tcp', destination: { port: '80,443' }, description: 'Allow web traffic' },
          },
        },
        'dmz-lan': {
          'default-action': 'drop',
          rule: {
            '10': { action: 'accept', state: { established: true, related: true }, description: 'Allow established' },
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
            '10': { action: 'accept', state: { established: true, related: true }, description: 'Allow established' },
            '20': { action: 'accept', protocol: 'icmpv6', description: 'Allow ICMPv6' },
          },
        },
      },
    },
  },
};

/**
 * Firewall + VRF — adapted for single VM.
 * - Replace eth1/eth2 with flat dummy interfaces (no VIFs — dummy doesn't support them)
 * - dum0 = MGMT (was eth1), dum1-dum3 = LAN VLANs (was eth2.150/160/3500), dum4 = WAN (was pppoe0)
 * - Inline firewall rules with adapted interface names (original refs MGMT, eth2*, pppoe0)
 * - Keep VRF definitions
 */
export const QEMU_FIREWALL_VRF: Record<string, unknown> = {
  interfaces: {
    dummy: {
      dum0: { address: ['10.100.100.1/24'] },
      dum1: { address: ['10.150.150.1/24'] },
      dum2: { address: ['10.160.160.1/24'] },
      dum3: { address: ['172.16.20.1/24'] },
      dum4: { address: ['198.51.100.1/24'] },
    },
    loopback: { lo: {} },
  },
  vrf: {
    'bind-to-all': {},
    name: {
      LAN: {
        table: '103',
        protocols: {
          static: {
            route: {
              '0.0.0.0/0': { interface: { dum4: {} } },
              '10.100.100.0/24': { interface: { dum0: {} } },
              '172.16.20.0/24': { interface: { dum3: {} } },
            },
          },
        },
      },
      MGMT: {
        table: '102',
        protocols: {
          static: {
            route: {
              '10.150.150.0/24': { interface: { dum1: {} } },
              '10.160.160.0/24': { interface: { dum2: {} } },
              '172.16.20.0/24': { interface: { dum3: {} } },
            },
          },
        },
      },
      PROD: {
        table: '104',
        protocols: {
          static: {
            route: {
              '0.0.0.0/0': { interface: { dum4: {} } },
              '10.100.100.0/24': { interface: { dum0: {} } },
              '10.150.150.0/24': { interface: { dum1: {} } },
              '10.160.160.0/24': { interface: { dum2: {} } },
            },
          },
        },
      },
      WAN: {
        table: '101',
        protocols: {
          static: {
            route: {
              '10.150.150.0/24': { interface: { dum1: {} } },
              '10.160.160.0/24': { interface: { dum2: {} } },
              '172.16.20.0/24': { interface: { dum3: {} } },
            },
          },
        },
      },
    },
  },
  firewall: {
    'global-options': {
      'state-policy': {
        established: { action: 'accept' },
        invalid: { action: 'drop' },
        related: { action: 'accept' },
      },
    },
    ipv4: {
      forward: {
        filter: {
          'default-action': 'drop',
          rule: {
            '10': {
              action: 'accept',
              description: 'MGMT - Allow to LAN and PROD',
              'inbound-interface': { name: 'dum0' },
              'outbound-interface': { name: 'dum1' },
            },
            '99': {
              action: 'drop',
              description: 'MGMT - Drop all going to mgmt',
              'outbound-interface': { name: 'dum0' },
            },
            '120': {
              action: 'accept',
              description: 'LAN - Allow to PROD',
              'inbound-interface': { name: 'dum1' },
              'outbound-interface': { name: 'dum3' },
            },
            '130': {
              action: 'accept',
              description: 'LAN - Allow internet',
              'inbound-interface': { name: 'dum1' },
              'outbound-interface': { name: 'dum4' },
            },
          },
        },
      },
      input: {
        filter: {
          'default-action': 'drop',
          rule: {
            '10': {
              action: 'accept',
              description: 'MGMT - Allow input',
              'inbound-interface': { name: 'dum0' },
            },
          },
        },
      },
    },
  },
  nat: {
    source: {
      rule: {
        '100': {
          'outbound-interface': { name: 'dum4' },
          translation: { address: 'masquerade' },
          source: { address: '10.150.150.0/24' },
          description: 'LAN masquerade',
        },
        '200': {
          'outbound-interface': { name: 'dum4' },
          translation: { address: 'masquerade' },
          source: { address: '172.16.20.0/24' },
          description: 'PROD masquerade',
        },
      },
    },
  },
};

/**
 * QoS — the QoS panel fetches from ['traffic-policy', 'shaper'] (VyOS 1.3 path).
 * VyOS 1.4+ rolling still accepts 'traffic-policy' as a config path alias.
 * We apply under 'traffic-policy' so the panel can query it correctly.
 * Only shaper policies (no interface binding which would conflict with eth0).
 */
export const QEMU_QOS: Record<string, unknown> = {
  'traffic-policy': {
    shaper: (QOS_CONFIG as any).qos.policy.shaper,
  },
};

/**
 * Firewall + Bridge — replace eth1-eth7 with dummy interfaces dum10-dum16.
 * Using dum10+ to avoid conflict with QEMU_FIREWALL_VRF which uses dum0-dum4.
 * Bridge member interfaces cannot have IP addresses. Only bridges get addresses.
 * Bridge firewall rules (firewall.bridge) removed — not supported in this VyOS version.
 * Interface groups and basic ipv4 rules without jump actions retained.
 */
export const QEMU_FIREWALL_BRIDGE: Record<string, unknown> = {
  interfaces: {
    bridge: {
      br0: {
        description: 'Isolated L2 bridge',
        member: { interface: { dum10: {}, dum11: {} } },
      },
      br1: {
        address: ['10.1.1.1/24'],
        description: 'L3 bridge br1',
        member: { interface: { dum12: {}, dum13: {} } },
      },
      br2: {
        address: ['10.2.2.1/24'],
        description: 'L3 bridge br2',
        member: { interface: { dum14: {}, dum15: {}, dum16: {} } },
      },
    },
    dummy: {
      dum10: {},
      dum11: {},
      dum12: {},
      dum13: {},
      dum14: {},
      dum15: {},
      dum16: {},
    },
    loopback: { lo: {} },
  },
  firewall: {
    group: {
      'interface-group': {
        'br0-ifaces': { interface: ['br0', 'dum10', 'dum11'] },
        'br1-ifaces': { interface: ['br1', 'dum12', 'dum13'] },
        'br2-ifaces': { interface: ['br2', 'dum14', 'dum15', 'dum16'] },
      },
    },
    ipv4: {
      input: {
        filter: {
          rule: {
            '10': { action: 'accept', state: { established: true, related: true } },
            '20': { action: 'drop', state: { invalid: true } },
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
            '5': { action: 'accept', state: { established: true, related: true } },
            '10': { action: 'drop', state: { invalid: true } },
          },
        },
      },
    },
  },
};

/**
 * WAN Load Balancing — keep only load-balancing section.
 * Replace eth1 with dummy0, keep eth0 as-is.
 * Simplified rule 20 to avoid commit validation (removed port restriction, kept interface).
 */
export const QEMU_WAN_LB: Record<string, unknown> = {
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
        dummy0: {
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
          'inbound-interface': 'dummy1',
          interface: { eth0: { weight: '10' }, dummy0: { weight: '1' } },
          failover: {},
        },
      },
    },
  },
};

/**
 * NAT rules — extracted from firewall-vrf config.
 * Replace pppoe0 outbound-interface with eth0.
 */
export const QEMU_NAT: Record<string, unknown> = {
  nat: {
    source: {
      rule: {
        '100': {
          'outbound-interface': { name: 'eth0' },
          translation: { address: 'masquerade' },
          source: { address: '10.150.150.0/24' },
          description: 'LAN masquerade',
        },
        '200': {
          'outbound-interface': { name: 'eth0' },
          translation: { address: 'masquerade' },
          source: { address: '172.16.20.0/24' },
          description: 'PROD masquerade',
        },
      },
    },
  },
};

/**
 * PPPoE IPv6 — keep only named firewall IPv6 rulesets.
 * - Use { established: true, related: true } for state matching (valueless set commands in VyOS 1.4+)
 * - Remove forward/input filter jump rules (jump-target validation issues with this VyOS version)
 */
export const QEMU_PPPOE_IPV6: Record<string, unknown> = {
  firewall: {
    ipv6: {
      name: {
        WAN_IN: {
          'default-action': 'drop',
          rule: {
            '10': { action: 'accept', state: { established: true, related: true } },
            '20': { action: 'accept', protocol: 'icmpv6' },
          },
        },
        WAN_LOCAL: {
          'default-action': 'drop',
          rule: {
            '10': { action: 'accept', state: { established: true, related: true } },
            '20': { action: 'accept', protocol: 'icmpv6' },
            '30': { action: 'accept', destination: { port: '546' }, protocol: 'udp', source: { port: '547' } },
          },
        },
      },
    },
  },
};
