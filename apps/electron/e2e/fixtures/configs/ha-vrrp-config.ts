export const HA_VRRP_CONFIG: Record<string, unknown> = {
  interfaces: {
    ethernet: {
      eth0: {
        vif: {
          '50': { address: ['192.0.2.21/24'] },
          '100': { address: ['203.0.113.2/24'] },
          '201': { address: ['10.200.201.2/24'] },
        },
      },
    },
    wireguard: {
      wg01: {
        address: ['10.254.60.1/30'],
        description: 'router1-to-offsite1',
        peer: {
          OFFSITE1: {
            'allowed-ips': ['0.0.0.0/0'],
            endpoint: '203.0.113.3:50001',
            'persistent-keepalive': '15',
            pubkey: 'GEFMOWzAyau42/HwdwfXnrfHdIISQF8YHj35rOgSZ0o=',
          },
        },
        port: '50001',
      },
    },
    loopback: { lo: {} },
  },
  'high-availability': {
    vrrp: {
      group: {
        int: {
          'hello-source-address': '10.200.201.2',
          interface: 'eth0.201',
          'peer-address': '10.200.201.3',
          'no-preempt': {},
          priority: '200',
          address: ['10.200.201.1/24'],
          vrid: '201',
        },
        public: {
          'hello-source-address': '203.0.113.2',
          interface: 'eth0.100',
          'peer-address': '203.0.113.3',
          'no-preempt': {},
          priority: '200',
          address: ['203.0.113.1/24'],
          vrid: '113',
        },
      },
      'sync-group': {
        sync: { member: ['int'] },
      },
    },
  },
  nat: {
    source: {
      rule: {
        '10': {
          destination: { address: '!192.0.2.0/24' },
          'outbound-interface': { name: 'eth0.50' },
          source: { address: '10.200.201.0/24' },
          translation: { address: '203.0.113.1' },
        },
      },
    },
  },
  protocols: {
    ospf: {
      area: { '0.0.0.0': { authentication: 'md5', network: ['10.254.60.0/24'] } },
      'auto-cost': { 'reference-bandwidth': '10000' },
      'log-adjacency-changes': {},
      parameters: { 'abr-type': 'cisco', 'router-id': '10.254.60.2' },
      redistribute: { connected: {} },
      interface: {
        wg01: {
          authentication: { md5: { 'key-id': { '1': { 'md5-key': 'i360KoCwUGZvPq7e' } } } },
          cost: '11',
          'dead-interval': '5',
          'hello-interval': '1',
          network: 'point-to-point',
          priority: '1',
          'retransmit-interval': '5',
          'transmit-delay': '1',
        },
      },
    },
    bgp: {
      'system-as': '65551',
      'address-family': {
        'ipv4-unicast': {
          network: { '192.0.2.0/24': {} },
          redistribute: {
            connected: { metric: '50' },
            ospf: { metric: '50' },
          },
        },
      },
      neighbor: {
        '192.0.2.11': {
          'address-family': {
            'ipv4-unicast': {
              'route-map': { export: 'BGPOUT' },
              'soft-reconfiguration': { inbound: {} },
            },
          },
          'remote-as': '65550',
          'update-source': '192.0.2.21',
        },
      },
      parameters: { 'router-id': '192.0.2.21' },
    },
    static: {
      route: { '0.0.0.0/0': { 'next-hop': { '192.0.2.11': {} } } },
    },
  },
  service: {
    ssh: {},
    'conntrack-sync': {
      'accept-protocol': 'tcp,udp,icmp',
      'event-listen-queue-size': '8',
      'failover-mechanism': { vrrp: { 'sync-group': 'sync' } },
      interface: { 'eth0.201': {} },
      'mcast-group': '224.0.0.50',
      'sync-queue-size': '8',
    },
  },
  policy: {
    'prefix-list': {
      BGPOUT: {
        rule: {
          '10': { action: 'deny', ge: '25', prefix: '0.0.0.0/0', description: 'Do not advertise short masks' },
          '100': { action: 'permit', prefix: '203.0.113.0/24', description: 'Our network' },
          '10000': { action: 'deny', prefix: '0.0.0.0/0' },
        },
      },
    },
    'route-map': {
      BGPOUT: {
        description: 'BGP Export Filter',
        rule: {
          '10': { action: 'permit', match: { ip: { address: { 'prefix-list': 'BGPOUT' } } } },
          '10000': { action: 'deny' },
        },
      },
    },
    'access-list': {
      '150': {
        description: 'Outbound OSPF Redistribution',
        rule: {
          '10': { action: 'permit', destination: 'any', source: { 'inverse-mask': '0.0.0.255', network: '10.200.201.0' } },
          '20': { action: 'permit', destination: 'any', source: { 'inverse-mask': '0.0.0.255', network: '203.0.113.0' } },
          '100': { action: 'deny', destination: 'any', source: 'any' },
        },
      },
    },
  },
  system: {
    'host-name': 'vyos-ha-r1',
    'name-server': ['8.8.8.8'],
  },
};
