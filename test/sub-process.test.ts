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
