{
  "name": "@snyk/snyk-hex-plugin",
  "description": "Snyk Hex Plugin for Elixir ecosystem",
  "homepage": "https://github.com/snyk/snyk-hex-plugin",
  "repository": {
    "type": "git",
    "url": "https://github.com/snyk/snyk-hex-plugin"
  },
  "author": "snyk.io",
  "license": "Apache-2.0",
  "engines": {
    "node": ">=10"
  },
  "files": [
    "elixirsrc",
    "dist"
  ],
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "format:check": "prettier --check '{lib,test}/**/*.{js,ts,json,yml}'",
    "format": "prettier --write '{lib,test}/**/*.{js,ts,json,yml}'",
    "lint": "npm run format:check && npm run lint:eslint",
    "lint:eslint": "eslint --color --cache 'lib/**/*.{js,ts}'",
    "test": "npm run test:unit",
    "test:unit": "jest --runInBand",
    "test:watch": "tsc-watch --onSuccess 'npm run test:unit'",
    "build": "tsc",
    "build-watch": "tsc -w",
    "prepare": "npm run build"
  },
  "dependencies": {
    "@snyk/dep-graph": "^1.28.0",
    "@snyk/mix-parser": "^1.1.1",
    "debug": "^4.3.1",
    "shescape": "1.6.1",
    "tmp": "^0.0.33",
    "tslib": "^2.0.0",
    "upath": "2.0.1"
  },
  "devDependencies": {
    "@types/debug": "^4.1.5",
    "@types/jest": "^28.1.3",
    "@types/node": "^16.11.66",
    "@types/tmp": "^0.1.0",
    "@typescript-eslint/eslint-plugin": "^4.33.0",
    "@typescript-eslint/parser": "^4.33.0",
    "eslint": "^7.32.0",
    "eslint-config-prettier": "^8.3.0",
    "jest": "^28.1.3",
    "prettier": "^2.7.1",
    "ts-jest": "^28.0.8",
    "ts-node": "^8.10.1",
    "tsc-watch": "^4.2.7",
    "typescript": "^4.8.4"
  }
}
