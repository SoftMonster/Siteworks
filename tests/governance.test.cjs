const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { checkProject } = require('../scripts/project-governance-check.cjs');

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'siteworks-governance-'));
  const files = {
    'manifest.json': JSON.stringify({ version: '1.6.9' }),
    'package.json': JSON.stringify({ version: '1.6.9' }),
    'README.md': '# Site Works\\n\\nRelease 1.6.9',
    'Andrew_next_task.bat': '@echo off',
    'docs/operations/ANDREW_NEXT_TASK_PROTOCOL.md': 'protocol',
    'docs/engineering/AI_DEVELOPMENT_PROTOCOL.md':
      'Inspect first. Use a negative control. Human acceptance is required. Produce a new downloadable archive.',
    'docs/engineering/SITEWORKS_PROJECT_RULES.md': 'rules',
    'docs/PROJECT_PROGRESS_LOG.md': 'progress'
  };
  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(root, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  }
  return root;
}

test('project governance checker accepts a complete, version-consistent fixture', () => {
  const root = fixture();
  try {
    assert.deepEqual(checkProject(root), []);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('project governance checker rejects a missing mandatory protocol', () => {
  const root = fixture();
  try {
    fs.rmSync(path.join(root, 'docs/engineering/AI_DEVELOPMENT_PROTOCOL.md'));
    assert.ok(checkProject(root).some((p) => p.includes('AI_DEVELOPMENT_PROTOCOL.md')));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('project governance checker rejects inconsistent application versions', () => {
  const root = fixture();
  try {
    fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify({ version: '1.6.8' }));
    assert.ok(checkProject(root).some((p) => p.includes('version mismatch')));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
