import fs from 'node:fs';
const titles=['Anatomical Planes-en.svg','701 Axial Skeleton-01.jpg','Muscles anterior labeled.png','Heart diagram-en.svg','Respiratory system complete en.svg','Digestive system diagram en.svg','Urinary system.svg','Reproductive (male).jpg','1201 Overview of Nervous System.jpg','1413 Structure of the Eye.jpg','1801 The Endocrine System.jpg','2201 Anatomy of the Lymphatic System.jpg','Basic Female Reproductive System (English).svg','Ear-anatomy.svg','Embryonic Development CNS.png'];
const url=new URL('https://commons.wikimedia.org/w/api.php');
url.search=new URLSearchParams({action:'query',format:'json',prop:'imageinfo',iiprop:'url|extmetadata',titles:titles.map(t=>'File:'+t).join('|')});
const data=await (await fetch(url)).json();
fs.mkdirSync('public/anatomy',{recursive:true});
const manifest=[];
for(const page of Object.values(data.query.pages)) {
 const info=page.imageinfo?.[0];if(!info){console.log('MISSING',page.title);continue;}
 const index=titles.findIndex(t=>'File:'+t===page.title);
 const file=`system-${index+1}.${page.title.split('.').pop().toLowerCase()}`;
 if(!fs.existsSync('public/anatomy/'+file)) {
 const response=await fetch(info.url);if(!response.ok){console.log('DOWNLOAD FAILED',response.status,page.title);continue;}
 fs.writeFileSync('public/anatomy/'+file,Buffer.from(await response.arrayBuffer()));
 }
 const meta=info.extmetadata;
 manifest.push({system:index+1,file,url:info.descriptionurl,author:meta.Artist?.value,license:meta.LicenseShortName?.value,licenseUrl:meta.LicenseUrl?.value,title:page.title});
 console.log(index+1,page.title,meta.LicenseShortName?.value);
}
fs.writeFileSync('public/anatomy/sources.json',JSON.stringify(manifest,null,2));


