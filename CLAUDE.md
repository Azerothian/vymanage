# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Dev Commands

```bash
pnpm install                    # Install all dependencies (pnpm 9.15.9)
pnpm build                      # Build all packages via Turborepo
pnpm dev                        # Start all dev servers (Next.js + Electron)
pnpm lint                       # Lint all packages
pnpm format                     # Prettier format all files
pnpm test                       # Unit tests (Vitest) across all packages
pnpm test:coverage              # Unit tests with coverage
pnpm test:e2e                   # Playwright E2E (web + electron)
pnpm test:e2e:qemu              # Full QEMU integration tests (requires qemu, expect, socat)
```

### Single-package commands
```bash
cd apps/web && pnpm dev         # Next.js dev server on localhost:3000
cd apps/web && pnpm test        # Web unit tests only
cd apps/web && npx playwright test e2e/config-examples/  # Run specific e2e directory
cd apps/electron && pnpm dev    # Electron dev (requires web built or dev running)
cd apps/electron && pnpm test:e2e  # Electron E2E (uses xvfb-run on Linux)
cd packages/vyos-client && pnpm test  # Client library tests
```

### Running a single test
```bash
cd apps/web && npx vitest run src/__tests__/specific.test.ts
cd apps/web && npx playwright test e2e/qemu/connection.spec.ts
```

## Architecture

**Monorepo** (Turborepo + pnpm workspaces):

- `apps/web` — Next.js 15 static export (SSG to `out/`). React 19, Tailwind, shadcn/ui.
- `apps/electron` — Electron 33 desktop wrapper. Serves web static export via custom `vymanage://` protocol. TypeScript compiled to `dist/`.
- `packages/vyos-client` — VyOS REST API client with React Query hooks. Three implementations: `VyosClient` (HTTPS), `FileVyosClient` (in-memory JSON), `ElectronVyosClient` (IPC proxy for CORS bypass).
- `packages/ui` — Shared shadcn/ui components (Radix primitives).
- `packages/config` — Shared Tailwind and TypeScript configs.

### Build dependency chain
Turbo enforces: `packages/*` build first → `apps/web` builds (next build → static export) → `apps/electron` builds (tsc) and can package. Electron dev depends on web build (`electron#dev` → `web#build`).

## Key Patterns

### VyOS Connection Flow
1. `ConnectionDialog` collects host + API key (or file path for offline mode)
2. Connection validated via `client.getInfo()` — saved to cookie on success
3. `ClientFactoryProvider` creates the appropriate client type (VyosClient / FileVyosClient / ElectronVyosClient)
4. Electron auto-connects via CLI args: `--host`, `--key`, `--insecure`, `--file`

### Three Client Implementations
All implement `IVyosClient`. Selection logic:
- **Device + Electron**: `ElectronVyosClient` (IPC proxy bypasses CORS)
- **Device + Web**: `VyosClient` (direct HTTPS — needs same-origin or CORS proxy)
- **File mode**: `FileVyosClient` (loads JSON, simulates API in-memory)

### Config Tree Operations
`packages/vyos-client/src/config-tree.ts` provides `getAtPath()`, `setAtPath()`, `deleteAtPath()` for navigating the nested VyOS config object. Path builder functions (`interfacePath()`, `firewallPath()`, etc.) construct typed config paths.

### React Query Integration
Query keys scoped by `connection.host`. Mutations auto-invalidate config queries. Hooks in `packages/vyos-client/src/queries.ts` and `mutations.ts`.

### Workspace Modes
Three layout modes persisted to localStorage: Desktop (floating windows with z-index/taskbar), Split (binary tree with draggable borders), Inline (single active panel).

### Panel Registry
`components/panels/PanelRegistry.tsx` maps menuId → `React.lazy()` loaded panel component. 15+ panels (interfaces, firewall, nat, vpn, system, etc.). Each receives `connection: VyosConnectionInfo`.

### Commit-Confirm Workflow
`configure()` accepts a confirmTime for auto-rollback. User must call `confirm()` before timeout. `CommitConfirmBanner` shows countdown.

### Electron IPC Security
Context isolation enabled, no nodeIntegration. Preload script exposes `window.electronAPI` via contextBridge. Main process handles API proxying (`ipc-handlers.ts`) and file dialogs.

## Testing

- **Unit/Component**: Vitest + @testing-library/react + MSW for API mocking. Tests in `__tests__/` dirs.
- **E2E Web**: Playwright against `npx serve out -l 3000`. Multi-browser (chromium, firefox, webkit). Helpers in `apps/web/e2e/fixtures/helpers.ts`.
- **E2E Electron**: Playwright with `_electron.launch()`. Single worker, xvfb-run for headless. Helpers in `apps/electron/e2e/fixtures/helpers.ts`.
- **QEMU Integration**: `scripts/e2e-qemu.sh` boots real VyOS in QEMU, configures via expect/serial console, runs Playwright against live HTTPS API. Separate configs: `playwright.qemu.config.ts`.

## TypeScript

Target ES2022, strict mode, bundler module resolution. Path aliases: `@` → `src/`, `@vymanage/*` → workspace packages. Base config in `packages/config/tsconfig.base.json`.
