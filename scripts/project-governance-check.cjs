'use strict';

const fs = require('node:fs');
const path = require('node:path');

function checkProject(root) {
  const required = [
    'manifest.json',
    'package.json',
    'Andrew_next_task.bat',
    'docs/operations/ANDREW_NEXT_TASK_PROTOCOL.md',
    'docs/engineering/AI_DEVELOPMENT_PROTOCOL.md',
    'docs/engineering/SITEWORKS_PROJECT_RULES.md',
    'docs/PROJECT_PROGRESS_LOG.md'
  ];
  const problems = [];
  for (const rel of required) {
    if (!fs.existsSync(path.join(root, rel))) problems.push(`required project file missing: ${rel}`);
  }
  if (problems.length) return problems;

  let manifest;
  let pkg;
  try {
    manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
    pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  } catch (error) {
    return [`cannot parse project manifests: ${error.message}`];
  }

  if (manifest.version !== pkg.version) {
    problems.push(`version mismatch: manifest.json=${manifest.version}, package.json=${pkg.version}`);
  }
  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  if (!readme.includes(`Release ${manifest.version}`)) {
    problems.push(`README.md does not identify release ${manifest.version}`);
  }
  const protocol = fs.readFileSync(path.join(root, 'docs/engineering/AI_DEVELOPMENT_PROTOCOL.md'), 'utf8');
  for (const phrase of ['inspect first', 'negative control', 'human acceptance', 'new downloadable archive']) {
    if (!protocol.toLowerCase().includes(phrase)) {
      problems.push(`AI development protocol is missing required principle: ${phrase}`);
    }
  }
  return problems;
}

if (require.main === module) {
  const root = path.resolve(__dirname, '..');
  const problems = checkProject(root);
  if (problems.length) {
    console.error(problems.join('\n'));
    process.exitCode = 1;
  } else {
    console.log('Project governance OK: required docs, launcher and version identity verified.');
  }
}

module.exports = { checkProject };
