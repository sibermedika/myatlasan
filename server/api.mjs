import express from 'express';
import { DatabaseSync, backup } from 'node:sqlite';
import { randomBytes, scryptSync, timingSafeEqual, createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { resolveSketchfabShortUrl } from './sketchfab.mjs';
import { GENERAL, DEFAULT_INSTITUTIONS, institutionName, generalAdmin, institutionAdmin, sameInstitution, editOrgan, readOrgan } from '../shared/institutions.mjs';

export const DEFAULT_BRANDING = { name: 'AnatoVerse', description: 'Atlas anatomi interaktif', logoUrl: '' };
const admin = generalAdmin;
const editor = user => admin(user) || institutionAdmin(user) || user?.role === 'DOSEN';
const hashToken = token => createHash('sha256').update(token).digest('hex');
const passwordHash = password => { const salt = randomBytes(16).toString('hex'); return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`; };
const verifyPassword = (password, hash) => { const [salt, value] = hash.split(':'); const actual = scryptSync(password, salt, 64); return timingSafeEqual(actual, Buffer.from(value, 'hex')); };
const fail = (status, message) => { const error = new Error(message); error.status = status; throw error; };
const text = (value, max = 200) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const validId = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,120}$/.test(value);
const validUrl = value => !value || (typeof value === 'string' && (/^https:\/\//.test(value) || /^\/anatomy\/[\w.-]+$/.test(value) || /^\/api\/media\/[\w-]+$/.test(value)));

export function createApi({ directory, seed = [], adminPassword, lecturerPassword, secureCookies = false, trustProxy = false }) {
  fs.mkdirSync(directory, { recursive: true });
  const db = new DatabaseSync(path.join(directory, 'atlas.sqlite'));
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, profile TEXT NOT NULL, hash TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS organs(id TEXT PRIMARY KEY, owner TEXT NOT NULL, data TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1);
    CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS media(id TEXT PRIMARY KEY, owner TEXT NOT NULL, meta TEXT NOT NULL, bytes BLOB NOT NULL, bundles TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS settings(id TEXT PRIMARY KEY, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY, user_id TEXT, action TEXT NOT NULL, object_id TEXT, at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS institutions(name TEXT PRIMARY KEY COLLATE NOCASE);`);
  const recordAudit = (user, action, id) => db.prepare('INSERT INTO audit(user_id,action,object_id,at) VALUES(?,?,?,?)').run(user?.id || null, action, id, new Date().toISOString());
  const getUser = id => { const row = db.prepare('SELECT profile FROM users WHERE id=?').get(id); return row ? {...JSON.parse(row.profile),institution:institutionName(JSON.parse(row.profile).institution)} : null; };
  const getOrgan = id => { const row = db.prepare('SELECT * FROM organs WHERE id=?').get(id); return row ? { ...JSON.parse(row.data), institution:institutionName(JSON.parse(row.data).institution), ownerId: row.owner, version: row.version } : null; };
  const getOrgans = () => db.prepare('SELECT id FROM organs ORDER BY rowid').all().map(row => getOrgan(row.id));
  const canEdit = editOrgan;
  const canRead = readOrgan;
  const transaction = fn => { db.exec('BEGIN IMMEDIATE'); try { const result = fn(); db.exec('COMMIT'); return result; } catch (e) { db.exec('ROLLBACK'); throw e; } };
  if (!db.prepare('SELECT id FROM users LIMIT 1').get()) {
    const credentials = { admin: adminPassword || 'admin', dosen: lecturerPassword || randomBytes(18).toString('base64url') };
    for (const [id, email, name, role] of [['admin-master', 'admin', 'Administrator', 'ADMIN'], ['dosen-paijo', 'dosen', 'Dosen', 'DOSEN']]) {
      db.prepare('INSERT INTO users VALUES(?,?,?)').run(id, JSON.stringify({ id, email, name, role, institution: 'Institusi Mandiri', identifierNumber: email }), passwordHash(credentials[email]));
    }
    fs.writeFileSync(path.join(directory, 'bootstrap-accounts.txt'), `Akun awal — hanya digunakan saat database pertama dibuat.\nadmin: ${credentials.admin}\ndosen: ${credentials.dosen}\n`, { mode: 0o600 });
  }
  const insertSeed = (version = 1) => { for (const source of seed) { const data = { ...source, ownerId: 'admin-master', status: 'published', version }; db.prepare('INSERT INTO organs(id,owner,data,version) VALUES(?,?,?,?)').run(data.id, data.ownerId, JSON.stringify(data),version); } };
  // An empty catalogue after deletion must remain empty; initialization is recorded separately.
  if (!db.prepare("SELECT id FROM settings WHERE id='initialized'").get()) transaction(() => { insertSeed(); db.prepare('INSERT INTO settings VALUES(?,?)').run('initialized', 'true'); });
  // Preserve all existing accounts and media while normalizing legacy General labels.
  transaction(() => {
    if(!db.prepare("SELECT id FROM settings WHERE id='institutions-initialized'").get()) {
      for(const name of DEFAULT_INSTITUTIONS) db.prepare('INSERT OR IGNORE INTO institutions VALUES(?)').run(name);
      db.prepare('INSERT INTO settings VALUES(?,?)').run('institutions-initialized','true');
    }
    db.prepare('INSERT OR IGNORE INTO institutions VALUES(?)').run(GENERAL);
    for(const row of db.prepare('SELECT id,profile FROM users').all()) {
      const profile=JSON.parse(row.profile); profile.institution=row.id==='admin-master'?GENERAL:institutionName(profile.institution);
      if(['ADMIN','SUPERADMIN'].includes(profile.role) && profile.institution!==GENERAL) profile.role='ADMIN_INSTITUSI';
      db.prepare('UPDATE users SET profile=? WHERE id=?').run(JSON.stringify(profile),row.id);
      db.prepare('INSERT OR IGNORE INTO institutions VALUES(?)').run(profile.institution);
    }
    for(const organ of getOrgans()) db.prepare('INSERT OR IGNORE INTO institutions VALUES(?)').run(organ.institution);
  });
  const registeredInstitution = value => { const name=institutionName(value); const row=db.prepare('SELECT name FROM institutions WHERE name=? COLLATE NOCASE').get(name); if(!row) fail(400,'Instansi belum terdaftar. Tambahkan melalui Cluster Instansi.'); return row.name; };
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy',trustProxy);
  app.use((req, res, next) => { res.set('X-Content-Type-Options','nosniff'); res.set('Cache-Control','no-store'); next(); });
  app.use((req, res, next) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      if (req.get('X-Atlas-Request') !== '1') return res.status(403).json({ message: 'Permintaan tidak sah.' });
      const origin = req.get('Origin');
      if (origin && origin !== `${req.protocol}://${req.get('host')}`) return res.status(403).json({ message: 'Origin tidak diizinkan.' });
    }
    const cookie = (req.get('Cookie') || '').split(';').map(s => s.trim()).find(s => s.startsWith('atlas_session='));
    const token = cookie?.slice('atlas_session='.length);
    const session = token && db.prepare('SELECT user_id FROM sessions WHERE token=? AND expires>?').get(hashToken(token), Date.now());
    req.user = session ? getUser(session.user_id) : null;
    next();
  });
  app.use(express.json({ limit: '100mb' }));
  const route = fn => (req, res, next) => { try { fn(req, res); } catch (error) { next(error); } };
  const requireAdmin = req => { if (!admin(req.user)) fail(req.user ? 403 : 401, 'Hanya admin yang dapat melakukan tindakan ini.'); };
  const requireAccountAdmin = req => { if(!admin(req.user) && !institutionAdmin(req.user)) fail(req.user ? 403 : 401,'Hanya admin General atau admin instansi.'); };
  const manageAccount = (user,target) => admin(user) || (institutionAdmin(user) && target && sameInstitution(user,target) && ['ADMIN_INSTITUSI','DOSEN','MAHASISWA'].includes(target.role));
  const requireEditor = req => { if (!editor(req.user)) fail(req.user ? 403 : 401, 'Masuk sebagai pengelola materi.'); };
  const attempts = new Map();
  app.post('/auth/login', route((req, res) => {
    const key = req.ip; const limit = attempts.get(key);
    if (limit?.count >= 10 && limit.until > Date.now()) fail(429, 'Terlalu banyak percobaan. Coba lagi dalam 10 menit.');
    const identifier = text(req.body.identifier).toLowerCase(); const password = req.body.password;
    const row = db.prepare('SELECT * FROM users').all().find(r => { const u = JSON.parse(r.profile); return [u.email, u.identifierNumber, u.dosenCode, u.id].some(v => v?.toLowerCase() === identifier); });
    if (typeof password !== 'string' || password.length > 200 || !row || !verifyPassword(password, row.hash)) {
      attempts.set(key, { count: limit?.until > Date.now() ? limit.count + 1 : 1, until: Date.now() + 600000 });
      fail(401, 'Identitas atau kata sandi tidak sesuai.');
    }
    attempts.delete(key); const token = randomBytes(32).toString('base64url');
    db.prepare('DELETE FROM sessions WHERE expires<?').run(Date.now());
    db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(hashToken(token), row.id, Date.now()+8*3600000);
    res.cookie('atlas_session', token, { httpOnly:true, sameSite:'strict', secure:secureCookies, path:'/api', maxAge:8*3600000 });
    recordAudit(req.user, 'login', row.id); res.json({ success:true, user:getUser(row.id) });
  }));
  app.get('/auth/me', (req,res) => res.json({ user:req.user }));
  app.get('/embeds/sketchfab', async (req,res,next) => {
    try {
      if(typeof req.query.url !== 'string' || req.query.url.length > 1000) fail(400,'Tautan Sketchfab tidak sah.');
      res.json({url:await resolveSketchfabShortUrl(req.query.url)});
    } catch(error) { error.status = 400; next(error); }
  });
  app.post('/auth/logout', route((req,res) => { const token = (req.get('Cookie') || '').split(';').map(s=>s.trim()).find(s=>s.startsWith('atlas_session='))?.slice(14); if(token) db.prepare('DELETE FROM sessions WHERE token=?').run(hashToken(token)); res.clearCookie('atlas_session', { path:'/api' }); res.json({ok:true}); }));
  app.get('/organs', (req,res) => res.json(getOrgans().filter(o=>canRead(req.user,o))));
  app.get('/institutions', route((req,res)=>{ res.json(db.prepare('SELECT name FROM institutions ORDER BY name').all().map(row=>row.name).filter(name=>!institutionAdmin(req.user)||name===req.user.institution||name===GENERAL)); }));
  app.post('/institutions',route((req,res)=>{ requireAdmin(req);const name=institutionName(text(req.body.name,200));if(name===GENERAL)fail(400,'General sudah tersedia.');if(db.prepare('SELECT name FROM institutions WHERE name=? COLLATE NOCASE').get(name))fail(409,'Instansi sudah terdaftar.');db.prepare('INSERT INTO institutions VALUES(?)').run(name);recordAudit(req.user,'create-institution',name);res.status(201).json({name}); }));
  app.put('/institutions/:name',route((req,res)=>{
    requireAdmin(req);
    const oldName=registeredInstitution(req.params.name), name=institutionName(text(req.body.name,200));
    if(oldName===GENERAL || name===GENERAL) fail(400,'Cluster General tidak dapat diubah.');
    const duplicate=db.prepare('SELECT name FROM institutions WHERE name=? COLLATE NOCASE').get(name);
    if(duplicate && duplicate.name.toLowerCase()!==oldName.toLowerCase()) fail(409,'Instansi sudah terdaftar.');
    transaction(()=>{
      db.prepare('UPDATE institutions SET name=? WHERE name=?').run(name,oldName);
      for(const row of db.prepare('SELECT id,profile FROM users').all()) {
        const profile=JSON.parse(row.profile);
        if(sameInstitution(profile,{institution:oldName})) db.prepare('UPDATE users SET profile=? WHERE id=?').run(JSON.stringify({...profile,institution:name}),row.id);
      }
      for(const organ of getOrgans()) if(sameInstitution(organ,{institution:oldName})) {
        const updated={...organ,institution:name,version:organ.version+1,updatedAt:new Date().toISOString()};
        db.prepare('UPDATE organs SET data=?,version=? WHERE id=?').run(JSON.stringify(updated),updated.version,organ.id);
      }
      recordAudit(req.user,'rename-institution',oldName+' → '+name);
    });
    res.json({name});
  }));
  app.delete('/institutions/:name',route((req,res)=>{
    requireAdmin(req);const name=registeredInstitution(req.params.name);
    if(name===GENERAL) fail(400,'Cluster General tidak dapat dihapus.');
    const accounts=db.prepare('SELECT profile FROM users').all().filter(row=>sameInstitution(JSON.parse(row.profile),{institution:name})).length;
    const organs=getOrgans().filter(organ=>sameInstitution(organ,{institution:name})).length;
    if(accounts || organs) fail(409,`Instansi masih memiliki ${accounts} akun dan ${organs} organ. Kosongkan terlebih dahulu sebelum menghapus.`);
    db.prepare('DELETE FROM institutions WHERE name=?').run(name);recordAudit(req.user,'delete-institution',name);res.json({ok:true});
  }));
  app.get('/organs/:id', route((req,res)=>{ const organ=getOrgan(req.params.id); if(!organ || !canRead(req.user,organ)) fail(404,'Materi tidak tersedia.'); res.json(organ); }));
  const validateOrgan = (body, user, previous) => {
    for (const key of ['id','name','latinName','system','subSystem','description']) if(!text(body[key],10000)) fail(400, `Bidang ${key} wajib diisi.`);
    if(!validId(body.id)) fail(400,'ID materi tidak sah.');
    if(typeof body.isFree!=='boolean') fail(400,'Hak akses publik tidak sah.');
    if(body.mediaSource && !/^https:\/\//.test(body.mediaSource)) fail(400,'Sumber gambar harus menggunakan HTTPS.');
    const items=body.mediaItems;
    if(!Array.isArray(items) || !items.length || items.length>30) fail(400,'Materi memerlukan 1–30 media.');
    const urls=[];
    const mediaIds = new Set();
    for(const item of items) {
      if(!validId(item.id) || mediaIds.has(item.id)) fail(400,'ID media harus unik dan tidak kosong.');
      mediaIds.add(item.id);
      if(!['2d_image','3d_model','3d_embed'].includes(item.type) || !validUrl(item.url)) fail(400,'Jenis atau URL media tidak sah. Gunakan unggahan atau HTTPS.');
      if(item.type!=='3d_model' && !item.url) fail(400,'Sumber media belum diisi.');
      if(item.type==='3d_model' && !item.url && !['heart','brain','lungs','skull','body'].includes(item.model3dType)) fail(400,'Sumber model belum diisi.');
      if(item.mediaFileId) { const m=db.prepare('SELECT owner FROM media WHERE id=?').get(item.mediaFileId); if(!m || (!admin(user) && m.owner!==user.id && !previous?.mediaItems?.some(old=>old.mediaFileId===item.mediaFileId))) fail(403,'Media bukan milik akun Anda.'); item.url=`/api/media/${item.mediaFileId}`; }
      urls.push(item.url);
    }
    if(!validUrl(body.imageUrl) || !validUrl(body.model3dData) || !validUrl(body.embed3dUrl)) fail(400,'URL media tidak dapat disimpan.');
    for(const url of [...urls,body.imageUrl,body.model3dData,body.embed3dUrl].filter(Boolean)) {
      if(!url.startsWith('/api/media/')) continue;
      const id=url.slice('/api/media/'.length);
      const media=db.prepare('SELECT owner FROM media WHERE id=?').get(id);
      const retained=previous && [previous.imageUrl,previous.model3dData,...(previous.mediaItems||[]).map(m=>m.url)].includes(url);
      if(!media || (!admin(user) && media.owner!==user.id && !retained)) fail(403,'Media bukan milik akun Anda.');
    }
    if(!Array.isArray(body.pins) || body.pins.length>500) fail(400,'Maksimum 500 notasi per materi.');
    const pinIds = new Set();
    const pins = body.pins.map(pin => {
      if(!pin || !validId(pin.id) || pinIds.has(pin.id) || !text(pin.title) || typeof pin.description !== 'string' || !pin.description.trim() || pin.title.length>200 || pin.description.length>10000 || !Number.isFinite(pin.x) || !Number.isFinite(pin.y)) fail(400,'Nama, deskripsi, atau posisi notasi tidak valid.');
      pinIds.add(pin.id);
      const is3d = Boolean(pin.is3d || pin.z !== undefined);
      const type = is3d ? '3d_model' : '2d_image';
      const media = pin.mediaId ? items.find(item => item.id === pin.mediaId) : items.find(item => item.type === type && item.isDefault) || items.find(item => item.type === type);
      if(!media || media.type!==type) fail(400,'Notasi harus terikat pada gambar 2D atau model 3D yang sesuai.');
      if(is3d ? !Number.isFinite(pin.z) : pin.x<0 || pin.x>100 || pin.y<0 || pin.y>100) fail(400,'Posisi notasi berada di luar media atau tidak valid.');
      if(pin.coordinateSpace !== undefined && (!is3d || pin.coordinateSpace!=='model')) fail(400,'Ruang koordinat notasi tidak valid.');
      if(pin.normal !== undefined && (!is3d || !pin.normal || !['x','y','z'].every(axis => Number.isFinite(pin.normal[axis])) || Math.hypot(pin.normal.x,pin.normal.y,pin.normal.z)<0.000001)) fail(400,'Arah penanda 3D tidak valid.');
      return {...pin,title:pin.title.trim(),description:pin.description.trim(),mediaId:media.id,is3d};
    });
    const institution = registeredInstitution(admin(user) ? body.institution || previous?.institution : user.institution);
    if(previous && institution!==previous.institution) fail(400,'Instansi materi tidak dapat dipindahkan. Buat salinan untuk instansi tujuan.');
    return { ...body, institution, isFree:institution===GENERAL && body.isFree, pins, ownerId:previous?.ownerId || user.id, version:(previous?.version || 0)+1, status:body.status==='draft'?'draft':'published', updatedAt:new Date().toISOString(), createdAt:previous?.createdAt || new Date().toISOString(), ...(admin(user)?{}:{dosenName:user.name,dosenCode:user.dosenCode || user.id}) };
  };
  app.put('/organs/:id', route((req,res)=>{
    requireEditor(req); const previous=getOrgan(req.params.id);
    if(previous && !canEdit(req.user,previous)) fail(403,'Anda hanya dapat mengubah materi milik sendiri.');
    if(req.body.id!==req.params.id) fail(400,'ID tidak cocok.');
    if(previous && req.body.version!==previous.version) fail(409,'Materi telah diubah oleh pengguna lain. Muat ulang materi sebelum menyimpan.');
    const data=validateOrgan(req.body,req.user,previous);
    db.prepare('INSERT INTO organs(id,owner,data,version) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data,version=excluded.version').run(data.id,data.ownerId,JSON.stringify(data),data.version);
    recordAudit(req.user,'save-organ',data.id); res.json(data);
  }));
  app.delete('/organs/:id', route((req,res)=>{ requireEditor(req); const data=getOrgan(req.params.id); if(!data) fail(404,'Materi tidak ditemukan.'); if(!canEdit(req.user,data)) fail(403,'Materi bukan milik Anda.'); if(Number(req.query.version)!==data.version) fail(409,'Materi telah berubah. Muat ulang daftar.'); db.prepare('DELETE FROM organs WHERE id=?').run(data.id); recordAudit(req.user,'delete-organ',data.id); res.json({ok:true}); }));
  app.post('/organs/:id/copy',route((req,res)=>{
    requireEditor(req);const source=getOrgan(req.params.id);if(!source||!canRead(req.user,source))fail(404,'Materi sumber tidak tersedia.');
    const institution=registeredInstitution(admin(req.user)?req.body.institution:req.user.institution);
    const id='organ-'+randomUUID();
    const data=validateOrgan({...source,id,institution,status:'draft',sourceOrganId:source.id},req.user,{...source,institution,ownerId:req.user.id,version:0,createdAt:undefined});
    db.prepare('INSERT INTO organs VALUES(?,?,?,?)').run(id,data.ownerId,JSON.stringify(data),data.version);recordAudit(req.user,'copy-organ',id);res.status(201).json(data);
  }));
  app.post('/organs/import',route((req,res)=>{ requireAdmin(req); if(!Array.isArray(req.body) || req.body.length>1000) fail(400,'Format impor tidak sah.'); const ids=new Set(); const data=req.body.map(o=>{ if(ids.has(o.id)) fail(400,'ID materi ganda.');ids.add(o.id);return validateOrgan(o,req.user,getOrgan(o.id)); }); transaction(()=>{ for(const o of data) db.prepare('INSERT INTO organs(id,owner,data,version) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data,version=excluded.version').run(o.id,o.ownerId,JSON.stringify(o),o.version); }); recordAudit(req.user,'import-organs',String(data.length));res.json(getOrgans()); }));
  app.post('/organs/reset',route((req,res)=>{ requireAdmin(req); if(req.body.confirm!=='RESET') fail(400,'Konfirmasi diperlukan.'); transaction(()=>{const version=Number(db.prepare('SELECT COALESCE(MAX(version),0) AS version FROM organs').get().version)+1;db.exec('DELETE FROM organs');insertSeed(version);});recordAudit(req.user,'reset-organs','all');res.json(getOrgans()); }));
  app.post('/collections/copy',route((req,res)=>{
    requireAccountAdmin(req);
    const institution=registeredInstitution(admin(req.user)?req.body.institution:req.user.institution);
    if(!Array.isArray(req.body.ids)||!req.body.ids.length||req.body.ids.length>1000)fail(400,'Pilih materi yang akan disalin.');
    const sources=[...new Set(req.body.ids)].map(id=>getOrgan(id));
    if(sources.some(source=>!source||!canRead(req.user,source)))fail(404,'Materi sumber tidak tersedia.');
    if(sources.some(source=>source.institution===institution))fail(400,'Pilih instansi tujuan yang berbeda dari sumber.');
    const existing=getOrgans();
    const result=transaction(()=>sources.filter(source=>!existing.some(organ=>organ.institution===institution&&organ.sourceOrganId===source.id)).map(source=>{
      const id='organ-'+randomUUID();
      const data={...source,id,institution,ownerId:req.user.id,version:1,status:'draft',sourceOrganId:source.id,isFree:false,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
      db.prepare('INSERT INTO organs VALUES(?,?,?,?)').run(id,data.ownerId,JSON.stringify(data),1);return data;
    }));
    recordAudit(req.user,'copy-collection',institution);res.json({copied:result.length,skipped:sources.length-result.length});
  }));
  app.post('/collections/reset',route((req,res)=>{
    requireAccountAdmin(req);const institution=registeredInstitution(admin(req.user)?req.body.institution:req.user.institution);
    if(req.body.confirm!=='RESET_MEDIA')fail(400,'Konfirmasi reset media diperlukan.');
    const sources=getOrgans().filter(organ=>organ.institution===institution);
    transaction(()=>{for(const source of sources){
      const data={...source,mediaItems:[],pins:[],imageUrl:'',status:'draft',version:source.version+1,updatedAt:new Date().toISOString()};
      for(const key of ['mediaType','mediaFileId','model3dType','model3dData','model3dFormat','embed3dUrl','mediaSource','mediaLicense','mediaLicenseUrl','mediaCredit','mediaOverview'])delete data[key];
      db.prepare('UPDATE organs SET data=?,version=? WHERE id=?').run(JSON.stringify(data),data.version,data.id);
    }});
    recordAudit(req.user,'reset-collection-media',institution);res.json({reset:sources.length});
  }));
  app.get('/users', route((req,res)=>{ requireAccountAdmin(req);res.json(db.prepare('SELECT id FROM users').all().map(r=>getUser(r.id)).filter(user=>manageAccount(req.user,user))); }));
  app.put('/users/:id', route((req,res)=>{
    requireAccountAdmin(req); const previous=getUser(req.params.id); const u=req.body;
    if(!validId(req.params.id)||!text(u.name)||!text(u.email)||!['ADMIN','ADMIN_INSTITUSI','SUPERADMIN','DOSEN','MAHASISWA','GUEST'].includes(u.role)) fail(400,'Data akun tidak lengkap.');
    if(previous && !manageAccount(req.user,previous)) fail(403,'Akun berada di luar instansi Anda.');
    const institution=registeredInstitution(['ADMIN','SUPERADMIN'].includes(u.role)?GENERAL:u.institution);
    if(u.role==='ADMIN_INSTITUSI' && institution===GENERAL)fail(400,'Admin instansi harus terhubung ke instansi selain General.');
    if(institutionAdmin(req.user) && (!['ADMIN_INSTITUSI','DOSEN','MAHASISWA'].includes(u.role)||institution!==req.user.institution))fail(403,'Admin instansi hanya dapat mengelola akun pada instansinya.');
    if(previous && previous.institution!==institution && db.prepare('SELECT id FROM organs WHERE owner=? LIMIT 1').get(previous.id))fail(409,'Akun masih memiliki materi di instansi asal.');
    if(req.params.id==='admin-master' && !admin(u)) fail(400,'Admin utama harus tetap admin.');
    if(req.params.id===req.user.id && u.role!==req.user.role) fail(400,'Tidak dapat mengubah role akun sendiri.');
    const profile={ id:req.params.id,name:text(u.name),email:text(u.email).toLowerCase(),role:u.role,institution,identifierNumber:text(u.identifierNumber),dosenCode:text(u.dosenCode),specialization:text(u.specialization),createdAt:previous?.createdAt || new Date().toISOString() };
    const others=db.prepare('SELECT profile FROM users WHERE id!=?').all(profile.id).map(r=>JSON.parse(r.profile));
    if(others.some(other=>[profile.email,profile.identifierNumber,profile.dosenCode].filter(Boolean).some(v=>[other.email,other.identifierNumber,other.dosenCode,other.id].filter(Boolean).includes(v)))) fail(409,'Identitas akun telah digunakan.');
    if(u.password!==undefined && typeof u.password!=='string') fail(400,'Kata sandi tidak sah.');
    if(!previous && (!u.password || u.password.length<10)) fail(400,'Kata sandi akun baru minimal 10 karakter.');
    if(u.password && (u.password.length<10 || u.password.length>200)) fail(400,'Kata sandi harus 10–200 karakter.');
    const hash=u.password ? passwordHash(u.password) : db.prepare('SELECT hash FROM users WHERE id=?').get(profile.id).hash;
    transaction(()=>{ db.prepare('INSERT INTO users VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET profile=excluded.profile,hash=excluded.hash').run(profile.id,JSON.stringify(profile),hash); if(previous && (u.password || previous.role!==profile.role || previous.institution!==profile.institution)) db.prepare('DELETE FROM sessions WHERE user_id=?').run(profile.id); });
    recordAudit(req.user,'save-user',profile.id);res.json(profile);
  }));
  app.delete('/users/:id',route((req,res)=>{ requireAccountAdmin(req); if(!manageAccount(req.user,getUser(req.params.id)))fail(403,'Akun berada di luar instansi Anda.');if(req.params.id==='admin-master'||req.params.id===req.user.id) fail(400,'Akun utama atau akun sendiri tidak dapat dihapus.'); if(db.prepare('SELECT id FROM organs WHERE owner=? LIMIT 1').get(req.params.id)) fail(409,'Akun masih memiliki materi. Pindahkan materi sebelum menghapus akun.');db.prepare('DELETE FROM users WHERE id=?').run(req.params.id);recordAudit(req.user,'delete-user',req.params.id);res.json({ok:true}); }));
  app.get('/settings/branding',(req,res)=>{const row=db.prepare("SELECT data FROM settings WHERE id='branding'").get();res.json(row?JSON.parse(row.data):DEFAULT_BRANDING);});
  app.put('/settings/branding',route((req,res)=>{requireAdmin(req);const branding={name:text(req.body.name,60),description:text(req.body.description,160),logoUrl:req.body.logoUrl || ''};if(!branding.name||!(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(branding.logoUrl)||!branding.logoUrl)||branding.logoUrl.length>1500000)fail(400,'Nama wajib diisi; logo PNG/JPEG/WebP maksimal 1 MB.');db.prepare('INSERT INTO settings VALUES(?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data').run('branding',JSON.stringify(branding));recordAudit(req.user,'branding','branding');res.json(branding);}));
  app.post('/media',route((req,res)=>{
    requireEditor(req);const {fileName,category,base64,bundleFiles=[]}=req.body;
    const extension=text(fileName).split('.').pop()?.toLowerCase();
    const allowed=category==='2d_image'?['png','jpg','jpeg','webp']:category==='3d_model'?['glb','gltf','obj','fbx','3ds','stl']:[];
    if(!allowed.includes(extension)||typeof base64!=='string'||!base64.length||bundleFiles.length>200) fail(400,'Berkas tidak didukung.');
    const bytes=Buffer.from(base64,'base64');let size=bytes.length;
    for(const b of bundleFiles){if(!text(b.name)||typeof b.base64!=='string')fail(400,'Paket media tidak sah.');size+=Buffer.byteLength(b.base64,'base64');}
    if(size>60*1024*1024)fail(413,'Ukuran paket maksimal 60 MB.');
    const mimeType=category==='2d_image'?({png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp'}[extension]):'application/octet-stream';
    if(category==='2d_image' && !((extension==='png'&&bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))||(['jpg','jpeg'].includes(extension)&&bytes[0]===255&&bytes[1]===216)||(extension==='webp'&&bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP')))fail(400,'Isi berkas tidak sesuai format gambar.');
    const id='media-'+randomUUID();const meta={id,fileName:text(fileName),category,extension,mimeType,sizeBytes:bytes.length,createdAt:new Date().toISOString(),uploadedBy:req.user.id};
    db.prepare('INSERT INTO media VALUES(?,?,?,?,?)').run(id,req.user.id,JSON.stringify(meta),bytes,JSON.stringify(bundleFiles));recordAudit(req.user,'upload-media',id);res.json({...meta,blobUrl:`/api/media/${id}`,bundleFilesCount:bundleFiles.length});
  }));
  const readMedia=(req)=>{const row=db.prepare('SELECT * FROM media WHERE id=?').get(req.params.id);if(!row)fail(404,'Media tidak ditemukan.');const used=getOrgans().some(o=>canRead(req.user,o)&&(o.mediaItems||[]).some(m=>m.mediaFileId===row.id||m.url===`/api/media/${row.id}`));if(!admin(req.user)&&row.owner!==req.user?.id&&!used)fail(403,'Media tidak dapat diakses.');return row;};
  app.get('/media/:id/record',route((req,res)=>{const row=readMedia(req);res.json({...JSON.parse(row.meta),base64:Buffer.from(row.bytes).toString('base64'),bundleFiles:JSON.parse(row.bundles)});}));
  app.get('/media/:id',route((req,res)=>{const row=readMedia(req);res.type(JSON.parse(row.meta).mimeType).send(Buffer.from(row.bytes));}));
  app.get('/backup',async(req,res,next)=>{
    let file;
    try { requireAdmin(req); file=path.join(directory,'backup-'+randomUUID()+'.sqlite'); await backup(db,file); recordAudit(req.user,'backup','database'); res.download(file,'atlas-backup.sqlite',error=>{fs.unlink(file,()=>{});if(error && !res.headersSent)next(error);}); }
    catch(error){if(file)fs.unlink(file,()=>{});next(error);}
  });
  app.get('/health',(req,res)=>res.json({status:'ok',storage:'sqlite'}));
  app.use((req,res)=>res.status(404).json({message:'Endpoint tidak ditemukan.'}));
  app.use((error,req,res,next)=>{if(res.headersSent)return next(error);res.status(error.status || 500).json({message:error.status?error.message:'Terjadi kesalahan server. Perubahan belum disimpan.'});});
  return {app,db};
}
