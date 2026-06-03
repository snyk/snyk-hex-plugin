import * as fs from 'fs';
import * as path from 'upath';

function elixirFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...elixirFiles(full));
    } else if (entry.name.endsWith('.ex')) {
      out.push(full);
    }
  }
  return out;
}

describe('elixirsrc vendored namespace', () => {
  // Regression guard for the Elixir 1.18+ built-in JSON collision.
  // Elixir 1.18 added a standard-library `JSON` module and `JSON.Encoder`
  // protocol. The vendored JSON library must therefore stay under the `Snyk.`
  // namespace so it never shadows the built-ins; a bare `JSON` made
  // `mix read.mix` crash at runtime with `JSON.Encoder.encode/2 is undefined`.
  it('does not define a bare top-level JSON module/protocol/impl', () => {
    const root = path.resolve(__dirname, '..', 'elixirsrc');
    const offenders = elixirFiles(root).filter((file) =>
      /\b(defmodule|defprotocol|defimpl)\s+JSON\b/.test(
        fs.readFileSync(file, 'utf8'),
      ),
    );

    expect(offenders.map((f) => path.relative(root, f))).toEqual([]);
  });
});
