import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApi } from './api.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const seed=JSON.parse(fs.readFileSync(path.join(root,'server/seed.json'),'utf8'));
const {app}=createApi({directory:process.env.DATA_DIR || path.join(root,'data'),seed,adminPassword:process.env.ADMIN_PASSWORD,lecturerPassword:process.env.LECTURER_PASSWORD,secureCookies:process.env.COOKIE_SECURE==='true',trustProxy:process.env.TRUST_PROXY || false});
import express from 'express';
const host=process.env.HOST || '127.0.0.1';
const port=Number(process.env.PORT || 3030);
// API uses the same origin as the frontend in production and the Vite proxy in development.
const outer=express();
outer.disable('x-powered-by');
outer.use('/api',app);
outer.use('/anatomy',express.static(path.join(root,'public/anatomy')));
outer.use(express.static(path.join(root,'dist')));
outer.get('*',(req,res)=>{const entry=path.join(root,'dist/index.html');if(fs.existsSync(entry))res.sendFile(entry);else res.status(503).send('Jalankan npm run build atau gunakan npm run dev:local.');});
outer.listen(port,host,()=>console.log(`Atlas backend: http://${host}:${port}`));
