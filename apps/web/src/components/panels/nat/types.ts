export type NatFamily = 'source' | 'destination' | 'nat64' | 'nat66' | 'cgnat';

export interface NatRule {
  id: number;
  type: NatFamily;
  description?: string;
  disabled?: boolean;
  inboundInterface?: string;
  outboundInterface?: string;
  inboundInterfaceGroup?: string;
  outboundInterfaceGroup?: string;
  protocol?: string;
  source?: NatEndpoint;
  destination?: NatEndpoint;
  translation?: NatTranslation;
}

export interface NatEndpoint {
  address?: string;
  port?: string | number;
  prefix?: string;
}

export interface NatTranslation {
  address?: string;
  port?: string | number;
  prefix?: string;
  pool?: string;
}

export interface NatRuleEditorValues {
  id: number;
  description: string;
  disabled: boolean;
  outboundInterface: string;
  inboundInterface: string;
  outboundInterfaceGroup: string;
  inboundInterfaceGroup: string;
  protocol: string;
  srcAddress: string;
  srcPort: string;
  dstAddress: string;
  dstPort: string;
  translationAddress: string;
  translationPort: string;
  translationPrefix: string;
}
