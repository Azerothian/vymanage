export type FirewallFamily = 'ipv4' | 'ipv6' | 'bridge';

export interface FirewallRule {
  id: number;
  action: string;
  protocol?: string;
  source?: FirewallRuleEndpoint;
  destination?: FirewallRuleEndpoint;
  description?: string;
  disabled?: boolean;
  // operational data
  hitCount?: number;
}

export interface FirewallRuleEndpoint {
  address?: string;
  port?: string | number;
  group?: {
    'address-group'?: string;
    'port-group'?: string;
    'network-group'?: string;
    'interface-group'?: string;
  };
}

export interface FirewallRuleSet {
  name: string;
  family: FirewallFamily;
  defaultAction?: string;
  rules: FirewallRule[];
  description?: string;
}

export interface FirewallGroup {
  name: string;
  type: 'address-group' | 'port-group' | 'interface-group' | 'network-group';
  members: string[];
  description?: string;
}

export interface FirewallZone {
  name: string;
  interfaces: string[];
  defaultAction?: string;
  description?: string;
  from: FirewallZoneFrom[];
}

export interface FirewallZoneFrom {
  zone: string;
  firewallName?: string;
  firewallIpv6Name?: string;
}

export interface FirewallFlowTable {
  name: string;
  description?: string;
  offload?: string;
}

export interface FirewallGlobalOptions {
  'all-ping'?: string;
  'broadcast-ping'?: string;
  'ip-src-route'?: string;
  'log-martians'?: string;
  'receive-redirects'?: string;
  'send-redirects'?: string;
  'source-validation'?: string;
  'syn-cookies'?: string;
  'twa-hazards-protection'?: string;
}

export interface RuleEditorValues {
  id: number;
  action: string;
  protocol: string;
  description: string;
  disabled: boolean;
  srcAddress: string;
  srcPort: string;
  srcAddressGroup: string;
  srcPortGroup: string;
  dstAddress: string;
  dstPort: string;
  dstAddressGroup: string;
  dstPortGroup: string;
}
