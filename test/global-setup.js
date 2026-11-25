// Runs in the jest parent process: jest's process.env is a copy that child_process never reads.
module.exports = async () => {
  process.env.SNYK_TOKEN = 'test-token';
  process.env.snyk_debug = '1';
};
