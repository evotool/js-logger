'use strict';

if (process.env.RELEASE_MODE !== '1') {
  throw new Error('Run `npm run release` to publish the package');
}

const { existsSync, unlinkSync } = require('node:fs');
const { resolve } = require('node:path');

const tsbuildinfoPath = resolve(__dirname, '../dist/tsconfig.tsbuildinfo');

if (existsSync(tsbuildinfoPath)) {
  unlinkSync(tsbuildinfoPath);
}
