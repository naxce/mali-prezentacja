import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';

const out = 'build/upload';
const stage = `${out}/server-stage`;

execFileSync('npm', ['run', 'build'], { stdio: 'inherit' });
rmSync(out, { recursive: true, force: true });
mkdirSync(`${stage}/data`, { recursive: true });

execFileSync('tar', ['-czf', `${out}/mali-static.tar.gz`, '-C', 'dist', '.']);

cpSync('build/server', `${stage}/build/server`, { recursive: true });
cpSync('package.json', `${stage}/package.json`);
cpSync('package-lock.json', `${stage}/package-lock.json`);
cpSync('data/questions.example.json', `${stage}/data/questions.example.json`);
const real = existsSync('data/questions.json');
if (real) cpSync('data/questions.json', `${stage}/data/questions.json`);
execFileSync('tar', ['-czf', `${out}/mali-quiz-server.tar.gz`, '-C', stage, '.']);
rmSync(stage, { recursive: true, force: true });

console.log(`${out}/mali-static.tar.gz`);
console.log(`${out}/mali-quiz-server.tar.gz${real ? '' : '  (UWAGA: brak data/questions.json, w paczce jest tylko przykład)'}`);
