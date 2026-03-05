import { describe, it, expect } from 'vitest';
import {
  flattenConfigToCommands,
  generateCleanupCommands,
  pickConfigSections,
} from './config-to-commands';

describe('flattenConfigToCommands', () => {
  it('converts simple key-value to a set command', () => {
    const config = { system: { 'host-name': 'test' } };
    const cmds = flattenConfigToCommands(config);
    expect(cmds).toEqual([
      { op: 'set', path: ['system', 'host-name'], value: 'test' },
    ]);
  });

  it('converts nested objects', () => {
    const config = { firewall: { zone: { lan: { 'default-action': 'drop' } } } };
    const cmds = flattenConfigToCommands(config);
    expect(cmds).toEqual([
      { op: 'set', path: ['firewall', 'zone', 'lan', 'default-action'], value: 'drop' },
    ]);
  });

  it('converts arrays to multiple set commands', () => {
    const config = {
      interfaces: { ethernet: { eth0: { address: ['10.0.0.1/24', '10.0.0.2/24'] } } },
    };
    const cmds = flattenConfigToCommands(config);
    expect(cmds).toEqual([
      { op: 'set', path: ['interfaces', 'ethernet', 'eth0', 'address'], value: '10.0.0.1/24' },
      { op: 'set', path: ['interfaces', 'ethernet', 'eth0', 'address'], value: '10.0.0.2/24' },
    ]);
  });

  it('converts empty objects to valueless set commands', () => {
    const config = { interfaces: { loopback: { lo: {} } } };
    const cmds = flattenConfigToCommands(config);
    expect(cmds).toEqual([
      { op: 'set', path: ['interfaces', 'loopback', 'lo'] },
    ]);
  });

  it('handles boolean true as valueless set', () => {
    const config = { firewall: { 'all-ping': true } };
    const cmds = flattenConfigToCommands(config);
    expect(cmds).toEqual([
      { op: 'set', path: ['firewall', 'all-ping'] },
    ]);
  });

  it('skips boolean false', () => {
    const config = { firewall: { 'all-ping': false } };
    const cmds = flattenConfigToCommands(config);
    expect(cmds).toEqual([]);
  });

  it('handles numeric values', () => {
    const config = { vrf: { name: { LAN: { table: 103 } } } };
    const cmds = flattenConfigToCommands(config);
    expect(cmds).toEqual([
      { op: 'set', path: ['vrf', 'name', 'LAN', 'table'], value: '103' },
    ]);
  });

  it('handles basePath parameter', () => {
    const config = { 'host-name': 'test' };
    const cmds = flattenConfigToCommands(config, ['system']);
    expect(cmds).toEqual([
      { op: 'set', path: ['system', 'host-name'], value: 'test' },
    ]);
  });
});

describe('generateCleanupCommands', () => {
  it('generates delete commands for top-level keys', () => {
    const config = { firewall: { zone: { lan: {} } }, nat: { source: {} } };
    const cmds = generateCleanupCommands(config);
    expect(cmds).toEqual([
      { op: 'delete', path: ['firewall'] },
      { op: 'delete', path: ['nat'] },
    ]);
  });

  it('skips protected paths', () => {
    const config = {
      system: { 'host-name': 'test', 'name-server': ['8.8.8.8'] },
      firewall: { zone: {} },
    };
    const protectedPaths = [['system', 'host-name']];
    const cmds = generateCleanupCommands(config, protectedPaths);
    expect(cmds).toContainEqual({ op: 'delete', path: ['firewall'] });
    expect(cmds).toContainEqual({ op: 'delete', path: ['system', 'name-server'] });
    expect(cmds).not.toContainEqual(
      expect.objectContaining({ path: ['system', 'host-name'] }),
    );
    // Should NOT have a blanket delete for 'system' since host-name is protected
    expect(cmds).not.toContainEqual({ op: 'delete', path: ['system'] });
  });

  it('generates no commands for fully protected config', () => {
    const config = { service: { https: { 'api-keys': {} } } };
    const protectedPaths = [['service', 'https']];
    const cmds = generateCleanupCommands(config, protectedPaths);
    expect(cmds).toEqual([]);
  });
});

describe('pickConfigSections', () => {
  it('picks specified sections', () => {
    const config = { firewall: { zone: {} }, nat: { source: {} }, system: {} };
    const result = pickConfigSections(config, ['firewall', 'nat']);
    expect(result).toEqual({ firewall: { zone: {} }, nat: { source: {} } });
  });

  it('ignores missing sections', () => {
    const config = { firewall: {} };
    const result = pickConfigSections(config, ['firewall', 'nonexistent']);
    expect(result).toEqual({ firewall: {} });
  });
});
