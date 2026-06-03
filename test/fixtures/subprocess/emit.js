// Test helper for sub-process.test.ts.
// Writes the given text to stdout and/or stderr, then exits with the given code.
// Usage: node emit.js <stdoutText> <stderrText> <exitCode>
// Pass '-' for a stream to write nothing to it.
const [, , out = '-', err = '-', code = '0'] = process.argv;
if (out !== '-') process.stdout.write(out);
if (err !== '-') process.stderr.write(err);
process.exit(Number(code));
