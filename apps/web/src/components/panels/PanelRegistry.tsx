'use client';

import { lazy, Suspense } from 'react';
import type { VyosConnectionInfo } from '@vymanage/vyos-client';

// Lazy-load panels for code splitting
const InterfacesPanel = lazy(() => import('./interfaces/InterfacesPanel').then(m => ({ default: m.InterfacesPanel })));
const FirewallPanel = lazy(() => import('./firewall/FirewallPanel').then(m => ({ default: m.FirewallPanel })));
const NatPanel = lazy(() => import('./nat/NatPanel').then(m => ({ default: m.NatPanel })));
const ProtocolsPanel = lazy(() => import('./protocols/ProtocolsPanel').then(m => ({ default: m.ProtocolsPanel })));
const PolicyPanel = lazy(() => import('./policy/PolicyPanel').then(m => ({ default: m.PolicyPanel })));
const VpnPanel = lazy(() => import('./vpn/VpnPanel').then(m => ({ default: m.VpnPanel })));
const ServicesPanel = lazy(() => import('./services/ServicesPanel').then(m => ({ default: m.ServicesPanel })));
const QosPanel = lazy(() => import('./qos/QosPanel').then(m => ({ default: m.QosPanel })));
const HaPanel = lazy(() => import('./ha/HaPanel').then(m => ({ default: m.HaPanel })));
const LoadBalancingPanel = lazy(() => import('./loadbalancing/LoadBalancingPanel').then(m => ({ default: m.LoadBalancingPanel })));
const ContainersPanel = lazy(() => import('./containers/ContainersPanel').then(m => ({ default: m.ContainersPanel })));
const PkiPanel = lazy(() => import('./pki/PkiPanel').then(m => ({ default: m.PkiPanel })));
const VrfPanel = lazy(() => import('./vrf/VrfPanel').then(m => ({ default: m.VrfPanel })));
const SystemPanel = lazy(() => import('./system/SystemPanel').then(m => ({ default: m.SystemPanel })));
const OperationsPanel = lazy(() => import('./operations/OperationsPanel').then(m => ({ default: m.OperationsPanel })));

const PANEL_MAP: Record<string, React.LazyExoticComponent<React.ComponentType<{ connection: VyosConnectionInfo }>>> = {
  interfaces: InterfacesPanel,
  firewall: FirewallPanel,
  nat: NatPanel,
  routing: ProtocolsPanel,
  policy: PolicyPanel,
  vpn: VpnPanel,
  services: ServicesPanel,
  trafficpolicy: QosPanel,
  ha: HaPanel,
  loadbalancing: LoadBalancingPanel,
  containers: ContainersPanel,
  pki: PkiPanel,
  vrf: VrfPanel,
  system: SystemPanel,
  operations: OperationsPanel,
};

function PanelLoading() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <span className="ml-2 text-sm text-muted-foreground">Loading panel...</span>
    </div>
  );
}

export function renderPanel(menuId: string, connection: VyosConnectionInfo): React.ReactNode {
  const Panel = PANEL_MAP[menuId];

  if (!Panel) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        Panel not found: {menuId}
      </div>
    );
  }

  return (
    <Suspense fallback={<PanelLoading />}>
      <Panel connection={connection} />
    </Suspense>
  );
}
