#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { rm, mkdir, readdir, stat, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

async function run(command, args, options = {}) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: process.platform === 'win32',
      ...options,
    });
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`));
      }
    });
    child.on('error', reject);
  });
}

async function pathExists(targetPath) {
  try {
    await stat(targetPath);
    return true;
  } catch (error) {
    if ((error?.code ?? '') === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

async function copyDir(source, destination) {
  await mkdir(destination, { recursive: true });
  const entries = await readdir(source, { withFileTypes: true });
  for (const entry of entries) {
    const from = path.join(source, entry.name);
    const to = path.join(destination, entry.name);
    if (entry.isDirectory()) {
      await copyDir(from, to);
    } else if (entry.isFile()) {
      await copyFile(from, to);
    }
  }
}

async function main() {
  const projectRoot = process.cwd();
  if (!existsSync(path.join(projectRoot, 'node_modules'))) {
    throw new Error('node_modules directory is missing. Install dependencies before exporting.');
  }

  await run('npx', ['next', 'build']);

  const outDir = path.join(projectRoot, 'out');
  if (!(await pathExists(outDir))) {
    throw new Error('Static build directory "out" was not created. Ensure output: "export" is enabled.');
  }

  const pathsToRemove = ['index.html', '404.html', '_next', 'sitemap.xml', 'robots.txt'];
  await Promise.all(
    pathsToRemove.map(async (relativePath) => {
      const target = path.join(projectRoot, relativePath);
      await rm(target, { recursive: true, force: true });
    }),
  );

  await copyDir(outDir, projectRoot);
}

main().catch((error) => {
  console.error('[export-to-root] Failed to export static build:', error.message);
  process.exitCode = 1;
});
