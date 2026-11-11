import * as childProcess from 'child_process';
import * as path from 'upath';
import * as subProcess from '../lib/sub-process';

const emit = path.resolve(__dirname, 'fixtures', 'subprocess', 'emit.js');

describe('sub-process execute', () => {
  it('resolves with stdout on success', async () => {
    const output = await subProcess.execute('node', [emit, 'hello', '-', '0']);
    expect(output).toContain('hello');
  });

  // Regression guard: a non-zero exit must surface stderr even when the child
  // also wrote to stdout. Previously execute() rejected with `stdout || stderr`,
  // which dropped stderr whenever stdout was non-empty (e.g. Elixir's
  // "Compiling N files (.ex)" message), hiding the real failure reason.
  it('rejects with BOTH stdout and stderr when exit code is non-zero', async () => {
    const error = await subProcess
      .execute('node', [emit, 'compiling', 'real-error', '1'])
      .catch((e) => e as string);

    expect(error).toContain('real-error');
    expect(error).toContain('compiling');
  });

  it('rejects with stderr when there is no stdout', async () => {
    const error = await subProcess
      .execute('node', [emit, '-', 'only-stderr', '1'])
      .catch((e) => e as string);

    expect(error).toContain('only-stderr');
  });
});

describe('sub-process child environment', () => {
  const PRINT_ENV = path.resolve(__dirname, 'fixtures', 'print-env.js');
  const TEST_ENV: Record<string, string> = {
    SNYK_TOKEN: 'test-token',
    SNYK_OAUTH_TOKEN: 'test-oauth-token',
    snyk_cfg_api: 'test-cfg-api',
    HTTP_PROXY: 'http://internal:1',
    SNYK_SYSTEM_HTTP_PROXY: 'http://corp:3128',
    UNRELATED_VAR: 'keep',
  };
  const isSnykKey = (key: string) => /^snyk_/i.test(key);
  const hasPath = (keys: string[]) =>
    keys.some((key) => key.toUpperCase() === 'PATH');

  let saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    saved = {};
    for (const [key, value] of Object.entries(TEST_ENV)) {
      saved[key] = process.env[key];
      process.env[key] = value;
    }
  });

  afterEach(() => {
    jest.restoreAllMocks();
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  it('passes spawn an env without SNYK_* variables and with the user proxy', async () => {
    const spy = jest.spyOn(childProcess, 'spawn');
    await subProcess.execute(process.execPath, [PRINT_ENV]);
    const env = (spy.mock.calls[0][2] as childProcess.SpawnOptions)?.env;
    expect(env).toBeDefined();
    expect(Object.keys(env!).filter(isSnykKey)).toEqual([]);
    expect(env!.HTTP_PROXY).toBe('http://corp:3128');
    expect(env!.http_proxy).toBe('http://corp:3128');
    expect(env!.UNRELATED_VAR).toBe('keep');
    expect(hasPath(Object.keys(env!))).toBe(true);
  });

  it('the child process sees no SNYK_* variables and gets the user proxy', async () => {
    const child = JSON.parse(
      await subProcess.execute(process.execPath, [PRINT_ENV]),
    );
    expect(child.keys.filter(isSnykKey)).toEqual([]);
    expect(child.HTTP_PROXY).toBe('http://corp:3128');
    expect(child.http_proxy).toBe('http://corp:3128');
    expect(child.UNRELATED_VAR).toBe('keep');
    expect(hasPath(child.keys)).toBe(true);
  });

  it('does not modify process.env', async () => {
    await subProcess.execute(process.execPath, [PRINT_ENV]);
    expect(process.env.SNYK_TOKEN).toBe('test-token');
    expect(process.env.HTTP_PROXY).toBe('http://internal:1');
  });
});
