import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { build } from 'esbuild';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const cache=path.join(root,'node_modules','.cache'); fs.mkdirSync(cache,{recursive:true});
const directory=fs.mkdtempSync(path.join(cache,'atlas-tests-'));
try {
  const sources=fs.readdirSync(path.join(root,'src','services')).filter(file=>file.endsWith('.test.ts')).map(file=>path.join(root,'src','services',file));
  await build({entryPoints:sources,outdir:directory,outExtension:{'.js':'.mjs'},bundle:true,packages:'external',platform:'node',format:'esm',logLevel:'silent'});
  const tests=[...fs.readdirSync(path.join(root,'server')).filter(file=>file.endsWith('.test.mjs')).map(file=>path.join(root,'server',file)),...fs.readdirSync(directory).filter(file=>file.endsWith('.mjs')).map(file=>path.join(directory,file))];
  const child=spawn(process.execPath,['--test','--test-concurrency=2',...tests],{cwd:root,stdio:'inherit'});
  process.exitCode=await new Promise((resolve,reject)=>{child.on('error',reject);child.on('exit',code=>resolve(code || 0));});
} finally {
  const resolved=path.resolve(directory);
  if(!resolved.startsWith(path.resolve(cache)+path.sep+'atlas-tests-')) throw new Error('Unexpected test output path');
  fs.rmSync(resolved,{recursive:true,force:true});
}
