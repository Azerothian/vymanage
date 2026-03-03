export type LookupType =
  | 'interfaces'
  | 'firewall-ipv4-rulesets'
  | 'firewall-ipv6-rulesets'
  | 'firewall-address-groups'
  | 'firewall-port-groups'
  | 'firewall-interface-groups'
  | 'route-maps'
  | 'prefix-lists'
  | 'as-path-lists'
  | 'community-lists'
  | 'large-community-lists'
  | 'ike-groups'
  | 'esp-groups'
  | 'vrf-instances'
  | 'container-networks'
  | 'traffic-policies';

export interface LookupConfig {
  type: LookupType;
  label: string;
  configPath: string[];
  groupBy?: string;
}

export const LOOKUP_REGISTRY: Record<LookupType, LookupConfig> = {
  interfaces: {
    type: 'interfaces',
    label: 'Interfaces',
    configPath: ['interfaces'],
    groupBy: 'type',
  },
  'firewall-ipv4-rulesets': {
    type: 'firewall-ipv4-rulesets',
    label: 'Firewall IPv4 Rule Sets',
    configPath: ['firewall', 'name'],
  },
  'firewall-ipv6-rulesets': {
    type: 'firewall-ipv6-rulesets',
    label: 'Firewall IPv6 Rule Sets',
    configPath: ['firewall', 'ipv6-name'],
  },
  'firewall-address-groups': {
    type: 'firewall-address-groups',
    label: 'Address Groups',
    configPath: ['firewall', 'group', 'address-group'],
  },
  'firewall-port-groups': {
    type: 'firewall-port-groups',
    label: 'Port Groups',
    configPath: ['firewall', 'group', 'port-group'],
  },
  'firewall-interface-groups': {
    type: 'firewall-interface-groups',
    label: 'Interface Groups',
    configPath: ['firewall', 'group', 'interface-group'],
  },
  'route-maps': {
    type: 'route-maps',
    label: 'Route Maps',
    configPath: ['policy', 'route-map'],
  },
  'prefix-lists': {
    type: 'prefix-lists',
    label: 'Prefix Lists',
    configPath: ['policy', 'prefix-list'],
  },
  'as-path-lists': {
    type: 'as-path-lists',
    label: 'AS Path Lists',
    configPath: ['policy', 'as-path-list'],
  },
  'community-lists': {
    type: 'community-lists',
    label: 'Community Lists',
    configPath: ['policy', 'community-list'],
  },
  'large-community-lists': {
    type: 'large-community-lists',
    label: 'Large Community Lists',
    configPath: ['policy', 'large-community-list'],
  },
  'ike-groups': {
    type: 'ike-groups',
    label: 'IKE Groups',
    configPath: ['vpn', 'ipsec', 'ike-group'],
  },
  'esp-groups': {
    type: 'esp-groups',
    label: 'ESP Groups',
    configPath: ['vpn', 'ipsec', 'esp-group'],
  },
  'vrf-instances': {
    type: 'vrf-instances',
    label: 'VRF Instances',
    configPath: ['vrf', 'name'],
  },
  'container-networks': {
    type: 'container-networks',
    label: 'Container Networks',
    configPath: ['container', 'network'],
  },
  'traffic-policies': {
    type: 'traffic-policies',
    label: 'Traffic Policies',
    configPath: ['traffic-policy'],
  },
};

// Map config area + field to lookup type (spec 8.3)
export interface CrossRefMapping {
  field: string;
  lookupType: LookupType;
}

export const CROSS_REF_FIELDS: Record<string, CrossRefMapping[]> = {
  'firewall-rules': [
    { field: 'inbound-interface.name', lookupType: 'interfaces' },
    { field: 'outbound-interface.name', lookupType: 'interfaces' },
    { field: 'inbound-interface.group', lookupType: 'firewall-interface-groups' },
    { field: 'outbound-interface.group', lookupType: 'firewall-interface-groups' },
    { field: 'source.group.address-group', lookupType: 'firewall-address-groups' },
    { field: 'source.group.port-group', lookupType: 'firewall-port-groups' },
    { field: 'destination.group.address-group', lookupType: 'firewall-address-groups' },
    { field: 'destination.group.port-group', lookupType: 'firewall-port-groups' },
  ],
  'firewall-zones': [
    { field: 'interface', lookupType: 'interfaces' },
    { field: 'from.firewall.name', lookupType: 'firewall-ipv4-rulesets' },
    { field: 'from.firewall.ipv6-name', lookupType: 'firewall-ipv6-rulesets' },
  ],
  nat: [
    { field: 'inbound-interface.name', lookupType: 'interfaces' },
    { field: 'outbound-interface.name', lookupType: 'interfaces' },
    { field: 'inbound-interface.group', lookupType: 'firewall-interface-groups' },
    { field: 'outbound-interface.group', lookupType: 'firewall-interface-groups' },
  ],
  qos: [
    { field: 'interface', lookupType: 'interfaces' },
    { field: 'egress', lookupType: 'traffic-policies' },
    { field: 'ingress', lookupType: 'traffic-policies' },
  ],
  bgp: [
    { field: 'route-map.import', lookupType: 'route-maps' },
    { field: 'route-map.export', lookupType: 'route-maps' },
    { field: 'prefix-list', lookupType: 'prefix-lists' },
    { field: 'address-family.route-map', lookupType: 'route-maps' },
  ],
  ospf: [
    { field: 'interface', lookupType: 'interfaces' },
  ],
  'policy-route-maps': [
    { field: 'match.ip.address.prefix-list', lookupType: 'prefix-lists' },
    { field: 'match.as-path', lookupType: 'as-path-lists' },
    { field: 'match.community', lookupType: 'community-lists' },
    { field: 'match.large-community', lookupType: 'large-community-lists' },
    { field: 'match.ip.next-hop.prefix-list', lookupType: 'prefix-lists' },
  ],
  ipsec: [
    { field: 'ike-group', lookupType: 'ike-groups' },
    { field: 'esp-group', lookupType: 'esp-groups' },
    { field: 'local-address', lookupType: 'interfaces' },
  ],
  vrrp: [
    { field: 'interface', lookupType: 'interfaces' },
  ],
  dhcp: [
    { field: 'listen-interface', lookupType: 'interfaces' },
  ],
  'source-interface': [
    { field: 'source-interface', lookupType: 'interfaces' },
  ],
  'any-interface': [
    { field: 'vrf', lookupType: 'vrf-instances' },
  ],
  bridge: [
    { field: 'member.interface', lookupType: 'interfaces' },
  ],
  bonding: [
    { field: 'member.interface', lookupType: 'interfaces' },
  ],
  containers: [
    { field: 'network', lookupType: 'container-networks' },
  ],
  'load-balancing': [
    { field: 'interface', lookupType: 'interfaces' },
  ],
};
