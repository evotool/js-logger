'use strict';

const { sync } = require('glob');
const { writeFileSync, readFileSync, copyFileSync } = require('node:fs');
const { resolve } = require('node:path');

const packageJson = JSON.parse(readFileSync(resolve(__dirname, '../package.json')).toString());

delete packageJson.scripts;
delete packageJson.jest;
delete packageJson.devDependencies;

copyFileSync(resolve(__dirname, '../README.md'), resolve(__dirname, '../dist/README.md'));
writeFileSync(resolve(__dirname, '../dist/package.json'), JSON.stringify(packageJson, null, '\t'));

const jsTsFilePaths = sync(resolve(__dirname, '../dist/**/*.{js,ts}'));

for (const filePath of jsTsFilePaths) {
  writeFileSync(filePath, readFileSync(filePath, 'utf-8').replace(/ {4}/g, '\t'));
}
