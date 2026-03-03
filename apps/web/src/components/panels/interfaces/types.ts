export type InterfaceType =
  | 'ethernet'
  | 'bonding'
  | 'bridge'
  | 'vlan'
  | 'pppoe'
  | 'wireguard'
  | 'openvpn'
  | 'loopback'
  | 'dummy'
  | 'tunnel'
  | 'wireless'
  | 'vxlan'
  | 'geneve'
  | 'macsec'
  | 'pseudo-ethernet'
  | 'wwan'
  | 'other';

export type InterfaceStatus = 'up' | 'down' | 'unknown';

export interface InterfaceAddress {
  address: string;
  prefix?: string;
}

export interface InterfaceNode {
  id: string;
  name: string;
  type: InterfaceType;
  status: InterfaceStatus;
  addresses: string[];
  description?: string;
  vrf?: string;
  mtu?: number;
  mac?: string;
  speed?: string;
  duplex?: string;
  disabled?: boolean;
  children: InterfaceNode[];
  // raw config data
  rawConfig?: Record<string, unknown>;
  // for display tree purposes
  depth: number;
  parentName?: string;
}

export interface InterfaceConfig {
  description?: string;
  address?: string | string[];
  'hw-id'?: string;
  mtu?: number | string;
  vrf?: string;
  disabled?: string;
  speed?: string;
  duplex?: string;
  vif?: Record<string, VifConfig>;
  'source-interface'?: string;
  member?: { interface?: Record<string, unknown> };
}

export interface VifConfig {
  description?: string;
  address?: string | string[];
  vrf?: string;
  disabled?: string;
}

export interface OperationalInterfaceData {
  [name: string]: {
    flags?: string;
    mac?: string;
    mtu?: number;
    speed?: string;
    duplex?: string;
    'addr-info'?: Array<{ family: string; local: string; prefixlen: number }>;
  };
}

export type InterfaceTypeFilter = 'all' | InterfaceType;
