// Stand-in for a build tool. Prints the names (never values) of SNYK_* variables.
process.stdout.write(
  JSON.stringify({
    snykKeys: Object.keys(process.env).filter((key) => /^snyk_/i.test(key)),
  }),
);
