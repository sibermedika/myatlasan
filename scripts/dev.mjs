import { spawn } from 'node:child_process';
const processes=[spawn(process.execPath,['server/start.mjs'],{stdio:'inherit',env:{...process.env,PORT:'3031'}}),spawn(process.execPath,['node_modules/vite/bin/vite.js','--port','3030','--host','localhost','--strictPort'],{stdio:'inherit'})];
let exiting=false;
const stop=(code=0)=>{if(exiting)return;exiting=true;for(const child of processes)child.kill();process.exitCode=code;};
for(const child of processes)child.on('exit',code=>stop(code || 0));
process.on('SIGINT',()=>stop());process.on('SIGTERM',()=>stop());
