const fs=require('fs');
const seed=JSON.parse(fs.readFileSync('server/seed.json','utf8'));
const manifest=JSON.parse(fs.readFileSync('public/anatomy/sources.json','utf8'));
const map={1:1,2:9,3:10,4:5,5:4,6:6,7:7,8:8,9:11,10:12,11:2};
const captions={1:'Bidang dan sumbu anatomi',2:'Rangka aksial',3:'Otot rangka (anterior)',4:'Anatomi jantung',5:'Sistem pernapasan',6:'Sistem pencernaan',7:'Sistem kemih',8:'Organ reproduksi laki-laki',9:'Sistem saraf',10:'Struktur mata',11:'Kelenjar endokrin',12:'Sistem limfatik',13:'Organ reproduksi perempuan',14:'Struktur telinga',15:'Pembentukan tabung saraf'};
const strip=s=>(s||'').replace(/<[^>]+>/g,'').replace(/&[^;]+;/g,' ').replace(/\s+/g,' ').trim();
fs.writeFileSync('public/anatomy/pending.svg',`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="650" viewBox="0 0 900 650"><rect width="900" height="650" fill="#f1f5f9"/><text x="450" y="295" text-anchor="middle" font-family="sans-serif" font-size="28" fill="#334155">Ilustrasi belum tersedia</text><text x="450" y="340" text-anchor="middle" font-family="sans-serif" font-size="18" fill="#64748b">Materi ini memerlukan gambar yang terverifikasi</text></svg>`);
for(const organ of seed){
 const system=parseInt(organ.system);
 let index=map[system];
 if(system===11 && organ.subSystem.includes('Miologi')) index=3;
 if(system===3 && !organ.subSystem.includes('Organ Penglihatan')) index=organ.subSystem.includes('Penciuman')?5:14;
 if(system===8 && organ.subSystem.includes('Feminina')) index=13;
 if(system===1 && organ.subSystem.includes('Embriogenesis')) index=15;
 if(organ.name==='Neuroembriologi') index=15;
 const source=manifest.find(m=>m.system===index);
 organ.imageUrl=source?'/anatomy/'+source.file:'/anatomy/pending.svg';
 organ.mediaType='2d_image';organ.mediaItems=[{id:organ.id+'-illustration',type:'2d_image',title:source?captions[index]:'Ilustrasi belum tersedia',url:organ.imageUrl,isDefault:true}];
 organ.mediaSource=source?.url;organ.mediaCredit=source?strip(source.author).split('When using this image')[0].trim().slice(0,160):undefined;organ.mediaLicense=source?.license;organ.mediaLicenseUrl=source?.licenseUrl;
 organ.mediaOverview=source?'Ilustrasi pengantar: '+captions[index]+'. Gambar memperlihatkan sistem secara umum; struktur khusus materi ini belum ditandai.':'Ilustrasi khusus topik ini belum tersedia.';
 organ.pins=[];
}
fs.writeFileSync('server/seed.json',JSON.stringify(seed,null,2)+'\n');
fs.writeFileSync('src/data.ts',"import { Organ } from './types';\n// Source and license of each local illustration is retained in the seed.\nexport const INITIAL_ORGANS: Organ[] = "+JSON.stringify(seed,null,2)+';\n');
fs.writeFileSync('public/anatomy/README.md','# Sumber gambar\n\nBerkas disalin tanpa perubahan dari Wikimedia Commons. Nomor berkas merupakan indeks aset, bukan urutan sistem kurikulum. Manifest lengkap: sources.json. Ilustrasi pengantar tidak menggantikan diagram khusus topik.\n\n'+manifest.map(m=>`- ${m.file}: [${m.title}](${m.url}), ${strip(m.author)}, [${m.license}](${m.licenseUrl||m.url}).`).join('\n')+'\n');
console.log(seed.length+' topics, '+manifest.length+' attributed local assets');
