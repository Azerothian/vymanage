// Path builder utilities for VyOS configuration paths

export function buildPath(...segments: string[]): string[] {
  return segments.filter(Boolean);
}

export function interfacePath(type: string, name: string): string[] {
  return ['interfaces', type, name];
}

export function firewallPath(family: string, name: string): string[] {
  return ['firewall', family, 'name', name];
}

export function natPath(type: string): string[] {
  return ['nat', type];
}

export function routingPath(protocol: string): string[] {
  return ['protocols', protocol];
}

export function servicePath(service: string): string[] {
  return ['service', service];
}

export function systemPath(section: string): string[] {
  return ['system', section];
}

export function vpnPath(type: string): string[] {
  return ['vpn', type];
}

export function policyPath(type: string): string[] {
  return ['policy', type];
}
