export interface MenuTab {
  id: string;
  label: string;
  configPath: string[];
  pollInterval?: number;
}

export interface MenuItem {
  id: string;
  label: string;
  icon: string; // lucide-react icon name
  tabs?: MenuTab[];
  configPath: string[];
}

export const menuItems: MenuItem[] = [
  {
    id: 'interfaces',
    label: 'Interfaces',
    icon: 'Network',
    configPath: ['interfaces'],
  },
  {
    id: 'firewall',
    label: 'Firewall',
    icon: 'Shield',
    configPath: ['firewall'],
    tabs: [
      { id: 'ipv4', label: 'IPv4 Rules', configPath: ['firewall', 'ipv4'] },
      { id: 'ipv6', label: 'IPv6 Rules', configPath: ['firewall', 'ipv6'] },
      { id: 'bridge', label: 'Bridge Rules', configPath: ['firewall', 'bridge'] },
      { id: 'groups', label: 'Groups', configPath: ['firewall', 'group'] },
      { id: 'zones', label: 'Zones', configPath: ['firewall', 'zone'] },
      { id: 'flowtables', label: 'Flow Tables', configPath: ['firewall', 'flowtable'] },
      { id: 'global', label: 'Global Options', configPath: ['firewall', 'global-options'] },
    ],
  },
  {
    id: 'nat',
    label: 'NAT',
    icon: 'ArrowLeftRight',
    configPath: ['nat'],
    tabs: [
      { id: 'nat44-source', label: 'NAT44 Source', configPath: ['nat', 'source'] },
      { id: 'nat44-dest', label: 'NAT44 Destination', configPath: ['nat', 'destination'] },
      { id: 'nat64', label: 'NAT64', configPath: ['nat', 'nptv6'] },
      { id: 'nat66', label: 'NAT66', configPath: ['nat', 'nat66'] },
      { id: 'cgnat', label: 'CGNAT', configPath: ['nat', 'cgnat'] },
    ],
  },
  {
    id: 'routing',
    label: 'Routing / Protocols',
    icon: 'Route',
    configPath: ['protocols'],
    tabs: [
      { id: 'static', label: 'Static', configPath: ['protocols', 'static'] },
      { id: 'bgp', label: 'BGP', configPath: ['protocols', 'bgp'] },
      { id: 'ospf', label: 'OSPF', configPath: ['protocols', 'ospf'] },
      { id: 'ospfv3', label: 'OSPFv3', configPath: ['protocols', 'ospfv3'] },
      { id: 'isis', label: 'ISIS', configPath: ['protocols', 'isis'] },
      { id: 'rip', label: 'RIP', configPath: ['protocols', 'rip'] },
      { id: 'babel', label: 'Babel', configPath: ['protocols', 'babel'] },
      { id: 'bfd', label: 'BFD', configPath: ['protocols', 'bfd'] },
      { id: 'mpls', label: 'MPLS', configPath: ['protocols', 'mpls'] },
      { id: 'sr', label: 'Segment Routing', configPath: ['protocols', 'segment-routing'] },
      { id: 'igmp', label: 'IGMP Proxy', configPath: ['protocols', 'igmp-proxy'] },
      { id: 'pim', label: 'PIM', configPath: ['protocols', 'pim'] },
      { id: 'multicast', label: 'Multicast', configPath: ['protocols', 'multicast'] },
      { id: 'rpki', label: 'RPKI', configPath: ['protocols', 'rpki'] },
      { id: 'failover', label: 'Failover', configPath: ['protocols', 'failover'] },
    ],
  },
  {
    id: 'policy',
    label: 'Policy',
    icon: 'FileText',
    configPath: ['policy'],
    tabs: [
      { id: 'routemaps', label: 'Route Maps', configPath: ['policy', 'route-map'] },
      { id: 'accesslists', label: 'Access Lists', configPath: ['policy', 'access-list'] },
      { id: 'prefixlists', label: 'Prefix Lists', configPath: ['policy', 'prefix-list'] },
      { id: 'aspath', label: 'AS Path', configPath: ['policy', 'as-path-list'] },
      { id: 'community', label: 'Community', configPath: ['policy', 'community-list'] },
      { id: 'extcommunity', label: 'Ext Community', configPath: ['policy', 'extcommunity-list'] },
      { id: 'largecommunity', label: 'Large Community', configPath: ['policy', 'large-community-list'] },
      { id: 'localroute', label: 'Local Route', configPath: ['policy', 'local-route'] },
    ],
  },
  {
    id: 'vpn',
    label: 'VPN',
    icon: 'Lock',
    configPath: ['vpn'],
    tabs: [
      { id: 'ipsec-s2s', label: 'IPsec S2S', configPath: ['vpn', 'ipsec'] },
      { id: 'ipsec-ra', label: 'IPsec RA', configPath: ['vpn', 'ipsec', 'remote-access'] },
      { id: 'dmvpn', label: 'DMVPN', configPath: ['vpn', 'nhrp'] },
      { id: 'l2tp', label: 'L2TP', configPath: ['vpn', 'l2tp'] },
      { id: 'openconnect', label: 'OpenConnect', configPath: ['vpn', 'openconnect'] },
      { id: 'pptp', label: 'PPTP', configPath: ['vpn', 'pptp'] },
      { id: 'sstp', label: 'SSTP', configPath: ['vpn', 'sstp'] },
    ],
  },
  {
    id: 'services',
    label: 'Services',
    icon: 'Server',
    configPath: ['service'],
    tabs: [
      { id: 'dhcp', label: 'DHCP', configPath: ['service', 'dhcp-server'] },
      { id: 'dhcpv6', label: 'DHCPv6', configPath: ['service', 'dhcpv6-server'] },
      { id: 'dhcprelay', label: 'DHCP Relay', configPath: ['service', 'dhcp-relay'] },
      { id: 'dns', label: 'DNS', configPath: ['service', 'dns'] },
      { id: 'ssh', label: 'SSH', configPath: ['service', 'ssh'] },
      { id: 'https', label: 'HTTPS', configPath: ['service', 'https'] },
      { id: 'ntp', label: 'NTP', configPath: ['service', 'ntp'] },
      { id: 'snmp', label: 'SNMP', configPath: ['service', 'snmp'] },
      { id: 'lldp', label: 'LLDP', configPath: ['service', 'lldp'] },
      { id: 'pppoe', label: 'PPPoE Server', configPath: ['service', 'pppoe-server'] },
    ],
  },
  {
    id: 'trafficpolicy',
    label: 'Traffic Policy / QoS',
    icon: 'Gauge',
    configPath: ['traffic-policy'],
    tabs: [
      { id: 'drop-tail', label: 'Drop Tail', configPath: ['traffic-policy', 'drop-tail'] },
      { id: 'fair-queue', label: 'Fair Queue', configPath: ['traffic-policy', 'fair-queue'] },
      { id: 'fq-codel', label: 'FQ-CoDel', configPath: ['traffic-policy', 'fq-codel'] },
      { id: 'limiter', label: 'Limiter', configPath: ['traffic-policy', 'limiter'] },
      { id: 'network-emulator', label: 'Network Emulator', configPath: ['traffic-policy', 'network-emulator'] },
      { id: 'priority-queue', label: 'Priority Queue', configPath: ['traffic-policy', 'priority-queue'] },
      { id: 'random-detect', label: 'Random Detect', configPath: ['traffic-policy', 'random-detect'] },
      { id: 'round-robin', label: 'Round Robin', configPath: ['traffic-policy', 'round-robin'] },
      { id: 'shaper', label: 'Shaper', configPath: ['traffic-policy', 'shaper'] },
      { id: 'shaper-hfsc', label: 'Shaper HFSC', configPath: ['traffic-policy', 'shaper-hfsc'] },
      { id: 'interface', label: 'Interface Policy', configPath: ['traffic-policy', 'interface'] },
    ],
  },
  {
    id: 'ha',
    label: 'High Availability',
    icon: 'HeartPulse',
    configPath: ['high-availability'],
    tabs: [
      { id: 'vrrp', label: 'VRRP', configPath: ['high-availability', 'vrrp'] },
      { id: 'virtual-server', label: 'Virtual Server', configPath: ['high-availability', 'virtual-server'] },
    ],
  },
  {
    id: 'loadbalancing',
    label: 'Load Balancing',
    icon: 'Scale',
    configPath: ['load-balancing'],
    tabs: [
      { id: 'wan', label: 'WAN', configPath: ['load-balancing', 'wan'] },
      { id: 'haproxy', label: 'HAProxy', configPath: ['load-balancing', 'haproxy'] },
    ],
  },
  {
    id: 'containers',
    label: 'Containers',
    icon: 'Box',
    configPath: ['container'],
    tabs: [
      { id: 'list', label: 'Containers', configPath: ['container', 'name'] },
      { id: 'networks', label: 'Networks', configPath: ['container', 'network'] },
      { id: 'registries', label: 'Registries', configPath: ['container', 'registry'] },
    ],
  },
  {
    id: 'pki',
    label: 'PKI',
    icon: 'KeyRound',
    configPath: ['pki'],
    tabs: [
      { id: 'ca', label: 'CA', configPath: ['pki', 'ca'] },
      { id: 'certs', label: 'Certificates', configPath: ['pki', 'certificate'] },
      { id: 'keypairs', label: 'Key Pairs', configPath: ['pki', 'key-pair'] },
      { id: 'dh', label: 'DH Parameters', configPath: ['pki', 'dh'] },
    ],
  },
  {
    id: 'vrf',
    label: 'VRF',
    icon: 'Layers',
    configPath: ['vrf'],
  },
  {
    id: 'system',
    label: 'System',
    icon: 'Settings',
    configPath: ['system'],
    tabs: [
      { id: 'hostname', label: 'Hostname', configPath: ['system', 'host-name'] },
      { id: 'dns', label: 'DNS', configPath: ['system', 'name-server'] },
      { id: 'timezone', label: 'Timezone', configPath: ['system', 'time-zone'] },
      { id: 'users', label: 'Users', configPath: ['system', 'login'] },
      { id: 'syslog', label: 'Syslog', configPath: ['system', 'syslog'] },
      { id: 'conntrack', label: 'Conntrack', configPath: ['system', 'conntrack'] },
      { id: 'ip', label: 'IP Settings', configPath: ['system', 'ip'] },
      { id: 'console', label: 'Console', configPath: ['system', 'console'] },
      { id: 'scheduler', label: 'Task Scheduler', configPath: ['system', 'task-scheduler'] },
      { id: 'watchdog', label: 'Watchdog', configPath: ['system', 'watchdog'] },
      { id: 'options', label: 'Options', configPath: ['system', 'option'] },
      { id: 'acceleration', label: 'Acceleration', configPath: ['system', 'acceleration'] },
      { id: 'updates', label: 'Updates', configPath: [] },
      { id: 'image', label: 'Image Mgmt', configPath: [] },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    icon: 'Terminal',
    configPath: [],
    tabs: [
      { id: 'sysinfo', label: 'System Info', configPath: [] },
      { id: 'reboot', label: 'Reboot/Poweroff', configPath: [] },
      { id: 'show', label: 'Show Commands', configPath: [] },
    ],
  },
];
