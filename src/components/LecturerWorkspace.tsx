import React, {useState} from 'react';
import {Organ, UserProfile} from '../types';
import {canEditOrgan} from '../permissions';
interface Props {user:UserProfile|null;organs:Organ[];onAdd:()=>void;onEdit:(organ:Organ)=>void;onView:(organ:Organ)=>void;onDelete:(id:string)=>void;}
export default function LecturerWorkspace({user,organs,onAdd,onEdit,onView,onDelete}:Props){
  const [query,setQuery]=useState('');
  const owned=organs.filter(organ=>canEditOrgan(user,organ));
  const filtered=owned.filter(organ=>[organ.name,organ.latinName,organ.system].join(' ').toLowerCase().includes(query.trim().toLowerCase()));
  return <main className="flex-1 overflow-auto p-4 sm:p-6"><div className="max-w-5xl mx-auto space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-2xl font-bold">Materi saya</h2><p className="mt-2 text-slate-400">{owned.length} materi milik Anda. Draf hanya terlihat oleh Anda dan admin.</p></div><button className="rounded-xl bg-teal-500 text-slate-950 px-5 py-3 font-semibold" onClick={onAdd}>Tambah materi</button></div>
    <input aria-label="Cari materi saya" placeholder="Cari materi saya…" className="w-full rounded-xl border border-slate-500/40 bg-transparent p-3" value={query} onChange={e=>setQuery(e.target.value)}/>
    {!owned.length ? <section className="rounded-xl border border-slate-500/30 p-6"><h3 className="font-semibold">Belum ada materi milik Anda</h3><p className="mt-2 text-slate-400">Mulai dengan Tambah materi. Koleksi bawaan tetap dapat dibaca melalui Lihat Atlas.</p></section> : !filtered.length ? <p role="status">Tidak ada materi sesuai pencarian.</p> : <div className="grid gap-3 sm:grid-cols-2">{filtered.map(organ=><article key={organ.id} className="border border-slate-500/30 rounded-xl p-4"><div className="flex items-start justify-between gap-3"><h3 className="font-semibold">{organ.name}</h3><span className="text-xs rounded-md border border-slate-500/30 px-2 py-1">{organ.status==='draft'?'Draf':'Terbit'}</span></div><p className="text-sm text-slate-400 mt-2">{organ.subSystem}</p><div className="flex flex-wrap gap-4 mt-4"><button className="text-teal-500" onClick={()=>onEdit(organ)}>Edit materi</button><button onClick={()=>onView(organ)}>Lihat di Atlas</button><button className="text-rose-400" onClick={()=>onDelete(organ.id)}>Hapus</button></div></article>)}</div>}
  </div></main>;
}
