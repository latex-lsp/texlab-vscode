import * as cp from 'child_process';
import * as path from 'path';

const EXECUTABLE = path.join(
  __dirname,
  '..',
  'node_modules',
  'vscode',
  'bin',
  'test',
);

const CODE_TESTS_PATH = path.join(__dirname, '..', 'dist', 'test');
const CODE_TESTS_WORKSPACE = path.join(
  __dirname,
  '..',
  'src',
  'test',
  'workspace',
);

cp.spawnSync('node', [EXECUTABLE], {
  env: {
    CODE_TESTS_PATH,
    CODE_TESTS_WORKSPACE,
  },
  stdio: 'inherit',
});
