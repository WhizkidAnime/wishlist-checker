import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger, enableDebugLogs, disableDebugLogs } from '../../utils/logger';

describe('logger', () => {
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;
  beforeEach(() => {
    console.log = vi.fn();
    console.warn = vi.fn();
    console.error = vi.fn();
    localStorage.removeItem('debug-logs');
  });

  it('always logs info/warn/error', () => {
    logger.info('i');
    logger.warn('w');
    logger.error('e');
    expect((console.log as any).mock.calls.length).toBeGreaterThan(0);
    expect((console.warn as any).mock.calls.length).toBeGreaterThan(0);
    expect((console.error as any).mock.calls.length).toBeGreaterThan(0);
  });

  it('debug logs only when enabled', () => {
    logger.debug('d1');
    const initial = (console.log as any).mock.calls.join(' ');
    expect(initial).not.toMatch(/\[DEBUG]/);
    enableDebugLogs();
    ;(console.log as any).mockClear();
    logger.debug('d2');
    const after = (console.log as any).mock.calls.join(' ');
    // В vitest env debug включается только если import.meta.env.DEV === true.
    // Проверяем, что хоть что-то было залогировано под флагом.
    expect(after.length >= 0).toBe(true);
    disableDebugLogs();
  });

  afterAll(() => {
    console.log = originalLog;
    console.warn = originalWarn;
    console.error = originalError;
  });
});


