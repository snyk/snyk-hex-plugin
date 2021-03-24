import debugLib = require('debug');

const PLUGIN_NAME = 'snyk-hex-plugin';
export const debug = debugLib(PLUGIN_NAME);

export function init(enable = false) {
  enable ? debugLib.enable(PLUGIN_NAME) : debugLib.disable();
}
