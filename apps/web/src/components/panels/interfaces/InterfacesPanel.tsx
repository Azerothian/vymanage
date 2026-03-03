'use client';

import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { VyosConnectionInfo } from '@vymanage/vyos-client';
import { useConfigActions } from '@/lib/hooks/useConfig';
import { useClient } from '@/lib/context/ClientContext';
import { InterfaceTable } from './InterfaceTable';
import { InterfaceDetail } from './InterfaceDetail';
import type { InterfaceNode, InterfaceConfig, InterfaceType, InterfaceStatus } from './types';

export interface InterfacesPanelProps {
  connection: VyosConnectionInfo;
}

type InterfacesConfigData = Record<string, Record<string, InterfaceConfig>>;

function buildInterfaceNodes(configData: InterfacesConfigData): InterfaceNode[] {
  const roots: InterfaceNode[] = [];
  // track which interfaces are claimed as members so we can mark them as children
  const claimedByBond = new Set<string>();
  const claimedByBridge = new Set<string>();

  // First pass: collect bond/bridge members
  const bondingConfig = configData['bonding'] ?? {};
  const bridgeConfig = configData['bridge'] ?? {};

  for (const [, bondCfg] of Object.entries(bondingConfig)) {
    if (bondCfg.member?.interface) {
      for (const memberName of Object.keys(bondCfg.member.interface)) {
        claimedByBond.add(memberName);
      }
    }
  }
  for (const [, brgCfg] of Object.entries(bridgeConfig)) {
    if (brgCfg.member?.interface) {
      for (const memberName of Object.keys(brgCfg.member.interface)) {
        claimedByBridge.add(memberName);
      }
    }
  }

  function makeAddresses(cfg: InterfaceConfig): string[] {
    if (!cfg.address) return [];
    return Array.isArray(cfg.address) ? cfg.address : [cfg.address];
  }

  function makeVifChildren(parentName: string, cfg: InterfaceConfig, depth: number): InterfaceNode[] {
    if (!cfg.vif) return [];
    return Object.entries(cfg.vif).map(([vifId, vifCfg]) => ({
      id: `${parentName}.${vifId}`,
      name: `${parentName}.${vifId}`,
      type: 'vlan' as InterfaceType,
      status: 'unknown' as InterfaceStatus,
      addresses: makeAddresses(vifCfg),
      description: vifCfg.description,
      vrf: vifCfg.vrf,
      disabled: !!vifCfg.disabled,
      children: [],
      depth,
      parentName,
      rawConfig: vifCfg as Record<string, unknown>,
    }));
  }

  function makeNode(
    name: string,
    type: InterfaceType,
    cfg: InterfaceConfig,
    depth: number,
    parentName?: string,
  ): InterfaceNode {
    return {
      id: parentName ? `${parentName}:${name}` : name,
      name,
      type,
      status: 'unknown' as InterfaceStatus,
      addresses: makeAddresses(cfg),
      description: cfg.description,
      vrf: cfg.vrf,
      mtu: cfg.mtu ? Number(cfg.mtu) : undefined,
      mac: cfg['hw-id'],
      speed: cfg.speed,
      duplex: cfg.duplex,
      disabled: !!cfg.disabled,
      children: makeVifChildren(name, cfg, depth + 1),
      depth,
      parentName,
      rawConfig: cfg as Record<string, unknown>,
    };
  }

  const TYPE_MAP: Array<[string, InterfaceType]> = [
    ['ethernet', 'ethernet'],
    ['bonding', 'bonding'],
    ['bridge', 'bridge'],
    ['pppoe', 'pppoe'],
    ['wireguard', 'wireguard'],
    ['openvpn', 'openvpn'],
    ['loopback', 'loopback'],
    ['dummy', 'dummy'],
    ['tunnel', 'tunnel'],
    ['vti', 'tunnel'],
    ['wireless', 'wireless'],
    ['vxlan', 'vxlan'],
    ['geneve', 'vxlan'],
    ['macsec', 'ethernet'],
    ['pseudo-ethernet', 'ethernet'],
    ['wwan', 'wireless'],
  ];

  for (const [cfgType, ifType] of TYPE_MAP) {
    const typeConfig = configData[cfgType] ?? {};
    for (const [ifName, ifCfg] of Object.entries(typeConfig)) {
      // Skip bond/bridge members — they'll be added as children below
      if (cfgType === 'ethernet' && (claimedByBond.has(ifName) || claimedByBridge.has(ifName))) {
        continue;
      }

      const node = makeNode(ifName, ifType, ifCfg, 0);

      // For bonding: add member ethernet interfaces as children
      if (cfgType === 'bonding' && ifCfg.member?.interface) {
        for (const memberName of Object.keys(ifCfg.member.interface)) {
          const memberCfg = configData['ethernet']?.[memberName] ?? {};
          node.children.unshift(makeNode(memberName, 'ethernet', memberCfg, 1, ifName));
        }
      }

      // For bridge: add member interfaces as children
      if (cfgType === 'bridge' && ifCfg.member?.interface) {
        for (const memberName of Object.keys(ifCfg.member.interface)) {
          const memberEth = configData['ethernet']?.[memberName];
          const memberBond = configData['bonding']?.[memberName];
          const memberCfg = memberEth ?? memberBond ?? {};
          const memberType: InterfaceType = memberBond ? 'bonding' : 'ethernet';
          node.children.unshift(makeNode(memberName, memberType, memberCfg, 1, ifName));
        }
      }

      // For pppoe: add source-interface as child (informational)
      if (cfgType === 'pppoe' && ifCfg['source-interface']) {
        const srcName = ifCfg['source-interface'];
        const srcCfg = configData['ethernet']?.[srcName] ?? {};
        node.children.unshift(makeNode(srcName, 'ethernet', srcCfg, 1, ifName));
      }

      roots.push(node);
    }
  }

  // Sort: loopback first, then alphabetical by name
  roots.sort((a, b) => {
    if (a.type === 'loopback') return -1;
    if (b.type === 'loopback') return 1;
    return a.name.localeCompare(b.name);
  });

  return roots;
}

export function InterfacesPanel({ connection }: InterfacesPanelProps) {
  const [selectedNode, setSelectedNode] = useState<InterfaceNode | null>(null);
  const queryClient = useQueryClient();
  const { deleteConfig } = useConfigActions(connection);
  const client = useClient(connection);

  const { data: configData, isLoading, error } = useQuery({
    queryKey: ['config', connection.host, 'interfaces'],
    queryFn: () => client!.showConfig(['interfaces']),
    enabled: !!client,
    refetchInterval: false,
  });

  // Operational polling for status (5s)
  const { data: operData } = useQuery({
    queryKey: ['operational', connection.host, 'interfaces'],
    queryFn: () => client!.show(['interfaces']),
    enabled: !!client,
    refetchInterval: 5000,
  });

  const roots = useMemo(() => {
    if (!configData || typeof configData !== 'object') return [];
    const data = configData as InterfacesConfigData;
    const nodes = buildInterfaceNodes(data);

    // Merge operational status if available
    if (operData && typeof operData === 'object') {
      const operMap = operData as Record<string, { flags?: string }>;

      function applyStatus(node: InterfaceNode): InterfaceNode {
        const opInfo = operMap[node.name];
        let status: InterfaceStatus = 'unknown';
        if (opInfo?.flags) {
          status = opInfo.flags.includes('UP') ? 'up' : 'down';
        }
        return {
          ...node,
          status,
          children: node.children.map(applyStatus),
        };
      }

      return nodes.map(applyStatus);
    }

    return nodes;
  }, [configData, operData]);

  const handleDelete = async (node: InterfaceNode) => {
    if (!confirm(`Delete interface ${node.name}?`)) return;
    const typeMap: Record<string, string> = {
      ethernet: 'ethernet',
      bonding: 'bonding',
      bridge: 'bridge',
      pppoe: 'pppoe',
      wireguard: 'wireguard',
      openvpn: 'openvpn',
      loopback: 'loopback',
      dummy: 'dummy',
      tunnel: 'tunnel',
      wireless: 'wireless',
      vxlan: 'vxlan',
    };
    const cfgType = typeMap[node.type] ?? 'ethernet';
    await deleteConfig(['interfaces', cfgType, node.name]);
    await queryClient.invalidateQueries({ queryKey: ['config', connection.host, 'interfaces'] });
    if (selectedNode?.name === node.name) setSelectedNode(null);
  };

  const handleSaved = async () => {
    await queryClient.invalidateQueries({ queryKey: ['config', connection.host, 'interfaces'] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="ml-2 text-sm text-muted-foreground">Loading interfaces...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive m-4">
        Failed to load interfaces: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main table */}
      <div className={`flex-1 overflow-auto p-4 ${selectedNode ? 'hidden lg:block' : ''}`}>
        <InterfaceTable
          roots={roots}
          selectedName={selectedNode?.name}
          onSelect={setSelectedNode}
          onAdd={() => setSelectedNode(null)}
          onDelete={handleDelete}
        />
      </div>

      {/* Detail panel */}
      {selectedNode && (
        <div className="w-full lg:w-96 xl:w-[420px] border-l border-border flex-shrink-0 overflow-hidden">
          <InterfaceDetail
            node={selectedNode}
            connection={connection}
            onClose={() => setSelectedNode(null)}
            onSaved={handleSaved}
          />
        </div>
      )}
    </div>
  );
}
