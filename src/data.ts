import { Organ } from './types';

// Compact list of the 87 distinct curriculum topics spanning all 12 anatomical systems as per PAAI curriculum.
export const INITIAL_ORGANS: Organ[] = [
  // ==========================================
  // 1. ANATOMI DAN EMBRIOLOGI UMUM
  // ==========================================
  {
    id: 'istilah-terminologi',
    name: 'Istilah & Terminologi',
    latinName: 'Nomina Generalia',
    system: '1. Anatomi dan Embriologi Umum',
    subSystem: '1.1 Anatomi Umum Tubuh Manusia',
    imageUrl: 'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?auto=format&fit=crop&w=1200&q=80',
    description: 'Sistem tata nama anatomi internasional resmi (Nomina Anatomica) untuk mengidentifikasi struktur morfologis tubuh tanpa ambiguitas.',
    functionMain: 'Membakukan istilah medis berdasarkan arah anatomis serta relasi spasial.',
    vascularization: 'Tidak berlaku (Konseptual).',
    innervation: 'Tidak berlaku (Konseptual).',
    clinicalNotes: 'Kesalahan arah anatomis (misal: sinistra vs dextra) memicu insiden salah sisi bedah.',
    isFree: true,
    pins: [
      { id: 'ist-1', title: 'Posisi Anatomis Standar', description: 'Berdiri tegak, pandangan ke depan, telapak tangan menghadap depan.', x: 50, y: 20 },
      { id: 'ist-2', title: 'Arah Sinistra & Dextra', description: 'Kiri (sinistra) dan kanan (dextra) selalu merujuk pada sudut pandang pasien.', x: 45, y: 55 }
    ]
  },
  {
    id: 'pembagian-posisi-tubuh',
    name: 'Pembagian & Posisi Tubuh',
    latinName: 'Partes Corporis Humani',
    system: '1. Anatomi dan Embriologi Umum',
    subSystem: '1.1 Anatomi Umum Tubuh Manusia',
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
    description: 'Pembagian utama tubuh manusia yang terdiri atas kepala (caput), leher (collum), badan (truncus), ekstremitas superior dan inferior.',
    functionMain: 'Menyusun segmentasi regional tubuh untuk mempermudah pemeriksaan fisik klinis.',
    vascularization: 'Sistemik (Arteria aorta dan cabang-cabangnya).',
    innervation: 'Saraf sensorik dan motorik perifer.',
    clinicalNotes: 'Pemeriksaan fisik standar kedokteran selalu dilakukan secara "Cephalocaudal" (Kepala ke Kaki).',
    isFree: true,
    pins: [
      { id: 'pos-1', title: 'Caput (Kepala)', description: 'Regio superior yang menampung otak dan organ indera utama.', x: 50, y: 15 },
      { id: 'pos-2', title: 'Truncus (Badan)', description: 'Menampung cavitas thoracis, abdominis, dan pelvis.', x: 50, y: 50 }
    ]
  },
  {
    id: 'garis-bidang-imaginer',
    name: 'Garis & Bidang Imaginer',
    latinName: 'Lineae et Plana Imaginer',
    system: '1. Anatomi dan Embriologi Umum',
    subSystem: '1.1 Anatomi Umum Tubuh Manusia',
    imageUrl: 'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?auto=format&fit=crop&w=1200&q=80',
    description: 'Bidang khayal (sagital, frontal, transversal) yang membagi tubuh untuk koordinat spasial organ.',
    functionMain: 'Titik acuan pemotongan radiologi medis (CT Scan / MRI).',
    vascularization: 'Tidak berlaku.',
    innervation: 'Tidak berlaku.',
    clinicalNotes: 'Pencitraan MRI selalu diatur berdasarkan potongan Aksial, Sagital, dan Koronal.',
    isFree: true,
    pins: [
      { id: 'bid-1', title: 'Bidang Sagital', description: 'Membagi tubuh menjadi bagian kanan dan kiri.', x: 48, y: 45 },
      { id: 'bid-2', title: 'Bidang Transversal', description: 'Membagi tubuh menjadi bagian superior dan inferior.', x: 52, y: 60 }
    ]
  },
  {
    id: 'embriogenesis-normal',
    name: 'Embriogenesis Normal & Patologi',
    latinName: 'Ontogenesis Normalis et Patologica',
    system: '1. Anatomi dan Embriologi Umum',
    subSystem: '1.2 Embriogenesis',
    imageUrl: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=1200&q=80',
    description: 'Proses perkembangan manusia sejak fertilisasi, pembentukan 3 lapisan germinal, hingga organogenesis.',
    functionMain: 'Membentuk seluruh garis keturunan seluler tubuh dari satu sel tunggal.',
    vascularization: 'Sirkulasi uteroplasenta awal via tali pusat.',
    innervation: 'Neurulasi menginisiasi pembentukan korda saraf pusat.',
    clinicalNotes: 'Gangguan neurulasi memicu Spina Bifida atau Anensefali (kegagalan tuba neural).',
    isFree: false,
    pins: [
      { id: 'emb-1', title: 'Ektoderm', description: 'Lapisan luar yang membentuk sistem saraf dan epidermis.', x: 40, y: 40 },
      { id: 'emb-2', title: 'Mesoderm', description: 'Lapisan tengah pembentuk sistem kardiovaskular dan muskuloskeletal.', x: 50, y: 50 }
    ]
  },

  // ==========================================
  // 2. SISTEM SARAF (SYSTEMA NERVOSUM)
  // ==========================================
  {
    id: 'susunan-saraf',
    name: 'Susunan Saraf',
    latinName: 'Systema Nervosum',
    system: '2. Sistem Saraf (Systema Nervosum)',
    subSystem: '2.1 Pengantar & Organisasi',
    imageUrl: 'https://images.unsplash.com/photo-1559757175-73677c29b50c?auto=format&fit=crop&w=1200&q=80',
    description: 'Organisasi struktural dan fungsional dari Susunan Saraf Pusat (SSP) dan Susunan Saraf Tepi (SST).',
    functionMain: 'Mengatur koordinasi motorik, sensorik, otonom, dan fungsi kognitif luhur.',
    vascularization: 'A. carotis interna dan A. vertebralis.',
    innervation: 'Inervasi sinaptik neuron motorik dan sensorik.',
    clinicalNotes: 'Stroke iskemik merusak koordinasi motorik somatik akibat oklusi arteri serebral.',
    isFree: false,
    pins: [
      { id: 'sn-1', title: 'Saraf Pusat (SSP)', description: 'Terdiri atas otak (en-cephalon) dan medulla spinalis.', x: 50, y: 30 },
      { id: 'sn-2', title: 'Saraf Tepi (SST)', description: 'Terdiri atas saraf kranial dan saraf spinal perifer.', x: 45, y: 65 }
    ]
  },
  {
    id: 'neuroembriologi',
    name: 'Neuroembriologi',
    latinName: 'Neuroembryologia',
    system: '2. Sistem Saraf (Systema Nervosum)',
    subSystem: '2.1 Pengantar & Organisasi',
    imageUrl: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=1200&q=80',
    description: 'Perkembangan awal sistem saraf dari lempeng ektoderm hingga terbentuk tiga vesikel otak primer.',
    functionMain: 'Inisiasi diferensiasi otak depan, tengah, belakang, dan sumsum tulang.',
    vascularization: 'Pleksus kapiler embrio.',
    innervation: 'Perkembangan awal aksonal segmental.',
    clinicalNotes: 'Defisiensi asam folat prenatal sangat terkait dengan malformasi sistem saraf pusat.',
    isFree: false,
    pins: [
      { id: 'ne-1', title: 'Prosencephalon', description: 'Otak depan yang akan berkembang menjadi telencephalon.', x: 45, y: 35 }
    ]
  },
  {
    id: 'anatomi-cortex',
    name: 'Anatomi Cortex',
    latinName: 'Cortex Cerebri',
    system: '2. Sistem Saraf (Systema Nervosum)',
    subSystem: '2.2 Prosencephalon',
    imageUrl: 'https://images.unsplash.com/photo-1559757175-73677c29b50c?auto=format&fit=crop&w=1200&q=80',
    description: 'Lapisan terluar cerebrum yang berlipat-lipat membentuk sulcus dan gyrus untuk memperluas area permukaan fungsional.',
    functionMain: 'Pusat kognisi, bahasa, memori, gerakan sadar, dan persepsi sensorik.',
    vascularization: 'A. cerebri anterior, media, dan posterior.',
    innervation: 'Saraf asosiasi intrakortikal.',
    clinicalNotes: 'Afasia Broca disebabkan oleh kerusakan gyrus frontalis inferior lobus kiri.',
    isFree: false,
    pins: [
      { id: 'ctx-1', title: 'Gyrus Precentralis', description: 'Korteks motorik primer yang mengatur gerakan tubuh volunter.', x: 48, y: 38 },
      { id: 'ctx-2', title: 'Lobus Occipitalis', description: 'Korteks visual primer untuk interpretasi bayangan mata.', x: 72, y: 52 }
    ]
  },
  {
    id: 'substansia-alba',
    name: 'Substansia Alba',
    latinName: 'Substantia Alba Cerebri',
    system: '2. Sistem Saraf (Systema Nervosum)',
    subSystem: '2.2 Prosencephalon',
    imageUrl: 'https://images.unsplash.com/photo-1559757175-73677c29b50c?auto=format&fit=crop&w=1200&q=80',
    description: 'Serabut saraf bermielin yang menghubungkan berbagai area korteks dan subkorteks.',
    functionMain: 'Transmisi impuls saraf antarlokus otak secara cepat.',
    vascularization: 'Arteri penetrasi cabang medularis.',
    innervation: 'Traktus asosiasi, komisura, dan proyeksi.',
    clinicalNotes: 'Multiple Sclerosis menyerang mielin substansia alba, mengacaukan hantaran saraf.',
    isFree: false,
    pins: [
      { id: 'sa-1', title: 'Corpus Callosum', description: 'Komisura terbesar penghubung hemisfer kiri dan kanan.', x: 50, y: 48 }
    ]
  },
  {
    id: 'nuclei-subcortical',
    name: 'Nuclei Subcortical',
    latinName: 'Nuclei Subcorticales',
    system: '2. Sistem Saraf (Systema Nervosum)',
    subSystem: '2.2 Prosencephalon',
    imageUrl: 'https://images.unsplash.com/photo-1559757175-73677c29b50c?auto=format&fit=crop&w=1200&q=80',
    description: 'Struktur massa kelabu dalam otak yang mencakup ganglia basalia dan substansia nigra.',
    functionMain: 'Mengatur inisiasi gerakan dan modulasi sirkuit motorik sadar.',
    vascularization: 'Arteria lenticulostriata.',
    innervation: 'Sistem dopaminergik dari tegmentum.',
    clinicalNotes: 'Kerusakan neuron dopaminergik substansia nigra memicu Penyakit Parkinson.',
    isFree: false,
    pins: [
      { id: 'ns-1', title: 'Nucleus Caudatus', description: 'Bagian penting dari striatum untuk kontrol motorik kognitif.', x: 45, y: 45 }
    ]
  },
  {
    id: 'anatomi-diencephalon',
    name: 'Anatomi Diencephalon',
    latinName: 'Diencephalon',
    system: '2. Sistem Saraf (Systema Nervosum)',
    subSystem: '2.2 Prosencephalon',
    imageUrl: 'https://images.unsplash.com/photo-1559757175-73677c29b50c?auto=format&fit=crop&w=1200&q=80',
    description: 'Bagian otak yang mengitari ventrikel ketiga, mencakup talamus, hipotalamus, dan epitalamus.',
    functionMain: 'Stasiun pemancar sensorik, pusat homeostasis otonom, dan regulasi sirkadian.',
    vascularization: 'Cabang sirkulus arteriosus Willisi.',
    innervation: 'Sirkuit sinaptik kompleks otonom.',
    clinicalNotes: 'Tumor hipotalamus dapat mengacaukan regulasi suhu tubuh dan rasa lapar ekstrem.',
    isFree: false,
    pins: [
      { id: 'di-1', title: 'Thalamus', description: 'Stasiun transmisi utama untuk hampir semua informasi sensorik ke korteks.', x: 52, y: 50 },
      { id: 'di-2', title: 'Hypothalamus', description: 'Pusat kendali otonom dan pelepasan hormon endokrin tubuh.', x: 48, y: 56 }
    ]
  },
  {
    id: 'struktur-mesencephalon',
    name: 'Struktur Mesencephalon',
    latinName: 'Mesencephalon',
    system: '2. Sistem Saraf (Systema Nervosum)',
    subSystem: '2.3 Mesencephalon',
    imageUrl: 'https://images.unsplash.com/photo-1559757175-73677c29b50c?auto=format&fit=crop&w=1200&q=80',
    description: 'Otak tengah yang terletak di antara diencephalon dan pons, bagian superior dari batang otak.',
    functionMain: 'Refleks auditoris dan visual, jalur motorik naik-turun, serta asal N. III dan IV.',
    vascularization: 'A. basilaris dan A. cerebri posterior.',
    innervation: 'Nervus Oculomotorius (N. III) dan Trochlearis (N. IV).',
    clinicalNotes: 'Kompresi mesencephalon pada herniasi uncus merusak fungsi saraf okulomotorik (pupil midriasis).',
    isFree: false,
    pins: [
      { id: 'mes-1', title: 'Tectum (Colliculus)', description: 'Refleks visual (colliculus superior) dan pendengaran (colliculus inferior).', x: 55, y: 58 }
    ]
  },
  {
    id: 'anatomi-pons',
    name: 'Anatomi Pons',
    latinName: 'Pons',
    system: '2. Sistem Saraf (Systema Nervosum)',
    subSystem: '2.4 Rhombencephalon',
    imageUrl: 'https://images.unsplash.com/photo-1559757175-73677c29b50c?auto=format&fit=crop&w=1200&q=80',
    description: 'Jembatan jaringan saraf antara cerebrum, medulla oblongata, dan cerebellum.',
    functionMain: 'Pusat respirasi pneumotaksis dan asal dari saraf kranial N. V, VI, VII, VIII.',
    vascularization: 'Aa. pontinae cabang dari Arteria Basilaris.',
    innervation: 'Inti N. Trigeminus, Abducens, Facialis, Vestibulocochlearis.',
    clinicalNotes: 'Pons stroke dapat menyebabkan Locked-in Syndrome (kelumpuhan total kecuali gerakan mata vertikal).',
    isFree: false,
    pins: [
      { id: 'pon-1', title: 'Saraf Abducens (VI)', description: 'Inti saraf di pons medial bawah yang menginervasi M. rectus lateralis.', x: 50, y: 62 }
    ]
  },
  {
    id: 'medulla-oblongata',
    name: 'Medulla Oblongata',
    latinName: 'Medulla Oblongata',
    system: '2. Sistem Saraf (Systema Nervosum)',
    subSystem: '2.4 Rhombencephalon',
    imageUrl: 'https://images.unsplash.com/photo-1559757175-73677c29b50c?auto=format&fit=crop&w=1200&q=80',
    description: 'Bagian distal batang otak yang berlanjut menjadi medulla spinalis di foramen magnum.',
    functionMain: 'Mengontrol fungsi vital otonom seperti pernapasan, denyut jantung, dan tekanan darah.',
    vascularization: 'A. spinalis anterior dan A. cerebellar inferior posterior.',
    innervation: 'N. Craniales IX, X, XI, XII.',
    clinicalNotes: 'Peningkatan tekanan intrakranial hebat mendesak tonsil serebelum menjepit medulla, memicu henti napas.',
    isFree: false,
    pins: [
      { id: 'mob-1', title: 'Pyramis Medullae', description: 'Dekusasio traktus kortikospinalis untuk motorik silang tubuh.', x: 48, y: 68 }
    ]
  },
  {
    id: 'anatomi-cerebellum',
    name: 'Anatomi Cerebellum',
    latinName: 'Cerebellum',
    system: '2. Sistem Saraf (Systema Nervosum)',
    subSystem: '2.4 Rhombencephalon',
    imageUrl: 'https://images.unsplash.com/photo-1559757175-73677c29b50c?auto=format&fit=crop&w=1200&q=80',
    description: 'Otak kecil yang terletak di fossa posterior cranii, di belakang pons dan medulla.',
    functionMain: 'Koordinasi motorik halus, keseimbangan, postur tubuh, dan tonus otot.',
    vascularization: 'SCA, AICA, dan PICA (Arteri Cerebellares).',
    innervation: 'Serabut purkinje dan pedunculus cerebellaris.',
    clinicalNotes: 'Kerusakan cerebellum menyebabkan ataksia (gerakan sempoyongan) dan dismetria.',
    isFree: false,
    pins: [
      { id: 'cer-1', title: 'Vermis Cerebelli', description: 'Struktur garis tengah yang menjaga keseimbangan aksial tubuh.', x: 58, y: 62 }
    ]
  },
  {
    id: 'struktur-luar-medulla',
    name: 'Struktur Luar',
    latinName: 'Morphologia Externa Medullae Spinalis',
    system: '2. Sistem Saraf (Systema Nervosum)',
    subSystem: '2.5 Medulla Spinalis',
    imageUrl: 'https://images.unsplash.com/photo-1559757175-73677c29b50c?auto=format&fit=crop&w=1200&q=80',
    description: 'Morfologi luar sumsum tulang belakang dengan pelebaran intumescentia dan berujung pada conus medullaris.',
    functionMain: 'Menghubungkan sistem saraf tepi dengan otak serta memproses refleks lokal.',
    vascularization: 'Arteria Spinalis Anterior dan Posteriores.',
    innervation: 'Saraf spinal segmentalis (C1 - Co1).',
    clinicalNotes: 'Pungsi lumbal dilakukan di sela L3-L4 atau L4-L5 untuk menghindari cedera conus medullaris.',
    isFree: false,
    pins: [
      { id: 'slm-1', title: 'Conus Medullaris', description: 'Ujung kaudal sumsum tulang belakang setinggi vertebra L1-L2.', x: 50, y: 75 }
    ]
  },
  {
    id: 'penampang-melintang-medulla',
    name: 'Penampang Melintang',
    latinName: 'Sectio Transversalis Medullae Spinalis',
    system: '2. Sistem Saraf (Systema Nervosum)',
    subSystem: '2.5 Medulla Spinalis',
    imageUrl: 'https://images.unsplash.com/photo-1559757175-73677c29b50c?auto=format&fit=crop&w=1200&q=80',
    description: 'Potongan transversal medulla spinalis yang memperlihatkan substansia grisea berbentuk kupu-kupu dikelilingi substansia alba.',
    functionMain: 'Tempat sinaps refleks motorik (cornu anterior) dan sensorik (cornu posterior).',
    vascularization: 'Arteria spinalis anterior dan posterior segmental.',
    innervation: 'Radix anterior (motorik) dan radix posterior (sensorik).',
    clinicalNotes: 'Poliomielitis menyerang cornu anterior medulla spinalis, menyebabkan kelumpuhan flaksid.',
    isFree: false,
    pins: [
      { id: 'pmm-1', title: 'Cornu Anterior', description: 'Badan sel neuron motorik somatik efferen.', x: 46, y: 52 },
      { id: 'pmm-2', title: 'Cornu Posterior', description: 'Menerima serabut aferen sensorik radiks dorsal.', x: 54, y: 48 }
    ]
  },
  {
    id: 'lapisan-meninges',
    name: 'Lapisan Meninges',
    latinName: 'Meninges',
    system: '2. Sistem Saraf (Systema Nervosum)',
    subSystem: '2.6 Meninges & LCS',
    imageUrl: 'https://images.unsplash.com/photo-1559757175-73677c29b50c?auto=format&fit=crop&w=1200&q=80',
    description: 'Tiga lapisan pelindung otak dan medula spinalis: duramater, arachnoidmater, dan piamater.',
    functionMain: 'Melindungi sistem saraf dari trauma fisik dan mengalirkan LCS.',
    vascularization: 'Arteria Meningea Media cabang dari A. maxillaris.',
    innervation: 'Saraf sensorik dari cabang N. trigeminus.',
    clinicalNotes: 'Ruptur arteria meningea media memicu Epidural Hematoma (EDH) akibat trauma temporal kranium.',
    isFree: false,
    pins: [
      { id: 'men-1', title: 'Duramater', description: 'Lapisan pelindung fibrosa terluar yang tebal dan kuat.', x: 50, y: 15 },
      { id: 'men-2', title: 'Cavum Subarachnoid', description: 'Ruang antara arachnoid dan piamater berisi cairan serebrospinal.', x: 52, y: 22 }
    ]
  },
  {
    id: 'sistem-ventrikel-lcs',
    name: 'Sistem Ventrikel & LCS',
    latinName: 'Systema Ventriculare et Liquor Cerebrospinalis',
    system: '2. Sistem Saraf (Systema Nervosum)',
    subSystem: '2.6 Meninges & LCS',
    imageUrl: 'https://images.unsplash.com/photo-1559757175-73677c29b50c?auto=format&fit=crop&w=1200&q=80',
    description: 'Sistem rongga otak yang memproduksi dan mengalirkan cairan serebrospinal (LCS).',
    functionMain: 'Meredam guncangan otak (bantalan air) dan nutrisi metabolisme sistem saraf.',
    vascularization: 'Plexus choroideus ventrikel.',
    innervation: 'Serabut otonom vaskular serebral.',
    clinicalNotes: 'Penyumbatan saluran (misal: aquaductus sylvii) memicu hidrosefalus (penumpukan LCS).',
    isFree: false,
    pins: [
      { id: 'vlcs-1', title: 'Ventriculus Lateralis', description: 'Rongga ventrikel terbesar berbentuk C penghasil LCS dominan.', x: 45, y: 40 }
    ]
  },
  {
    id: 'sistem-cerebrovascular',
    name: 'Sistem Cerebrovascular',
    latinName: 'Circulus Arteriosus Cerebri',
    system: '2. Sistem Saraf (Systema Nervosum)',
    subSystem: '2.7 Vaskularisasi & SST',
    imageUrl: 'https://images.unsplash.com/photo-1559757175-73677c29b50c?auto=format&fit=crop&w=1200&q=80',
    description: 'Jejaring sirkulasi arteri otak yang menyatu membentuk Circulus Arteriosus Willisi di basis cranii.',
    functionMain: 'Menjamin kolateral sirkulasi darah yang kontinu ke seluruh hemisfer serebral.',
    vascularization: 'A. carotis interna kiri-kanan dan A. basilaris.',
    innervation: 'Otonom simpatis/parasimpatis pembuluh darah.',
    clinicalNotes: 'Aneurisma sakular (berry aneurysm) pada Circulus Willisi rentan pecah memicu Subarachnoid Hemorrhage.',
    isFree: false,
    pins: [
      { id: 'scv-1', title: 'Arteria Cerebri Media', description: 'Arteri terbesar penyuplai sebagian besar aspek lateral korteks.', x: 50, y: 50 }
    ]
  },
  {
    id: 'sistem-saraf-tepi',
    name: 'Sistem Saraf Tepi (SST)',
    latinName: 'Systema Nervosum Periphericum',
    system: '2. Sistem Saraf (Systema Nervosum)',
    subSystem: '2.7 Vaskularisasi & SST',
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
    description: 'Serabut saraf somatik dan otonom di luar kranium dan medulla spinalis, termasuk plexus saraf.',
    functionMain: 'Menghantarkan impuls sensorik dari tepi ke SSP, dan perintah motorik dari SSP ke efektor.',
    vascularization: 'Vasa nervorum pembuluh mikro.',
    innervation: 'Plexus brachialis, cervicalis, lumbosacralis, dan 12 pasang N. kranial.',
    clinicalNotes: 'Cedera N. radialis pada fraktur humerus sepertiga tengah menyebabkan "wrist drop" (tangan jatuh).',
    isFree: false,
    pins: [
      { id: 'sst-1', title: 'Plexus Brachialis', description: 'Jejaring saraf (C5-T1) yang menginervasi ekstremitas superior.', x: 40, y: 40 }
    ]
  },
  {
    id: 'sistem-limbik',
    name: 'Sistem Limbik',
    latinName: 'Systema Limbicum',
    system: '2. Sistem Saraf (Systema Nervosum)',
    subSystem: '2.8 Sistem Limbik & Cranium',
    imageUrl: 'https://images.unsplash.com/photo-1559757175-73677c29b50c?auto=format&fit=crop&w=1200&q=80',
    description: 'Sirkuit struktur otak (hippocampus, amigdala, gyrus cinguli) pengatur emosi dan pembentukan memori.',
    functionMain: 'Regulasi memori jangka panjang, respon takut, motivasi, dan perilaku emosional.',
    vascularization: 'Cabang arteri serebral anterior dan media.',
    innervation: 'Sirkuit Papez intralimbik.',
    clinicalNotes: 'Sindrom Kluver-Bucy terjadi akibat kerusakan amigdala bilateral, ditandai hiperoralitas dan hilangnya rasa takut.',
    isFree: false,
    pins: [
      { id: 'lim-1', title: 'Hippocampus', description: 'Situs utama konsolidasi memori jangka pendek menjadi memori jangka panjang.', x: 50, y: 55 }
    ]
  },
  {
    id: 'cranium',
    name: 'Cranium',
    latinName: 'Cranium',
    system: '2. Sistem Saraf (Systema Nervosum)',
    subSystem: '2.8 Sistem Limbik & Cranium',
    imageUrl: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=1200&q=80',
    description: 'Struktur tulang pembentuk tengkorak kepala, terbagi menjadi neurocranium dan viscerocranium.',
    functionMain: 'Melindungi otak, batang otak, serta membentuk rongga wajah dan organ indera.',
    vascularization: 'Arteria meningea media dan pembuluh periosteal.',
    innervation: 'N. trigeminus sensorik fasial.',
    clinicalNotes: 'Fraktur basis cranii dapat merusak saluran saraf kranial dan memicu hematoma kacamata (raccoon eyes).',
    isFree: false,
    pins: [
      { id: 'cra-1', title: 'Fossa Cranii Anterior', description: 'Menampung lobus frontalis otak besar.', x: 50, y: 35 }
    ]
  },

  // ==========================================
  // 3. ORGAN INDERA (ORGANA SENSUUM)
  // ==========================================
  {
    id: 'struktur-ekstraokular',
    name: 'Struktur Ekstraokular',
    latinName: 'Apparatus Extraocularis',
    system: '3. Organ Indera (Organa Sensuum)',
    subSystem: '3.1 Organ Penglihatan',
    imageUrl: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=1200&q=80',
    description: 'Struktur pelindung dan penunjang bola mata termasuk palpebra, conjunctiva, apparatus lacrimalis, dan orbita.',
    functionMain: 'Proteksi fisik bola mata, lubrikasi kornea, dan pergerakan kelopak.',
    vascularization: 'Arteria palpebralis lateral dan medial.',
    innervation: 'N. Facialis (motorik M. orbicularis oculi), N. Trigeminal (sensorik palpebra).',
    clinicalNotes: 'Sumbatan glandula meibom di palpebra memicu kalazion (benjolan tanpa nyeri).',
    isFree: false,
    pins: [
      { id: 'exo-1', title: 'Glandula Lacrimalis', description: 'Kelenjar di superolateral orbita penghasil air mata.', x: 45, y: 35 }
    ]
  },
  {
    id: 'bulbus-oculi',
    name: 'Bulbus Oculi',
    latinName: 'Bulbus Oculi',
    system: '3. Organ Indera (Organa Sensuum)',
    subSystem: '3.1 Organ Penglihatan',
    imageUrl: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=1200&q=80',
    description: 'Bola mata manusia yang tersusun dari tiga lapisan konsentris utama: sklera-kornea, koroid-iris, dan retina.',
    functionMain: 'Menangkap berkas cahaya luar dan mengubahnya menjadi impuls listrik saraf visual.',
    vascularization: 'A. centralis retinae cabang dari A. ophthalmica.',
    innervation: 'Nervus Opticus (N. II) untuk indera penglihatan.',
    clinicalNotes: 'Ablasio retina adalah kondisi lepasnya lapisan sensorik retina dari epitel pigmen, memicu kebutaan mendadak.',
    isFree: false,
    pins: [
      { id: 'bo-1', title: 'Retina', description: 'Lapisan profundus sensitif cahaya berisi sel fotoreseptor batang dan kerucut.', x: 50, y: 55 },
      { id: 'bo-2', title: 'Iris & Pupil', description: 'Iris mengatur diameter pupil untuk mengontrol jumlah cahaya masuk.', x: 48, y: 30 }
    ]
  },
  {
    id: 'media-refrakta-musculi',
    name: 'Media Refrakta & Musculi',
    latinName: 'Media Refringentia et Musculi Oculi',
    system: '3. Organ Indera (Organa Sensuum)',
    subSystem: '3.1 Organ Penglihatan',
    imageUrl: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=1200&q=80',
    description: 'Sistem pembiasan cahaya (lensa, humor aquosus, vitreous body) dan otot penggerak bola mata.',
    functionMain: 'Membiasakan bayangan tepat jatuh ke makula retina dan menggerakkan mata.',
    vascularization: 'Arteria ciliaris anterior dan posterior.',
    innervation: 'N. III, IV, VI menggerakkan otot-otot ekstraokular.',
    clinicalNotes: 'Kekeruhan pada lensa mata akibat penuaan disebut katarak.',
    isFree: false,
    pins: [
      { id: 'mrm-1', title: 'Lensa Kristalina', description: 'Struktur bikonveks transparan pengatur akomodasi mata.', x: 48, y: 40 }
    ]
  },
  {
    id: 'inervasi-vaskularisasi-mata',
    name: 'Inervasi & Vaskularisasi',
    latinName: 'Vasa et Nervi Bulbi',
    system: '3. Organ Indera (Organa Sensuum)',
    subSystem: '3.1 Organ Penglihatan',
    imageUrl: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=1200&q=80',
    description: 'Persarafan sensorik, motorik, simpatik, serta suplai darah arteria ophthalmica di rongga mata.',
    functionMain: 'Menyediakan nutrisi jaringan intraokular dan mengendalikan refleks pupil.',
    vascularization: 'Arteria Ophthalmica dan cabang Arteri Sentralis Retina.',
    innervation: 'N. Opticus (II), Oculomotorius (III), Trochlearis (IV), Abducens (VI), Trigeminal (V1).',
    clinicalNotes: 'Penyumbatan akut Arteri Sentralis Retina menyebabkan kehilangan penglihatan mendadak yang permanen.',
    isFree: false,
    pins: [
      { id: 'ivm-1', title: 'Nervus Opticus', description: 'Membawa serabut visual melintasi canalis opticus.', x: 50, y: 70 }
    ]
  },
  {
    id: 'surface-anatomy-mata',
    name: 'Surface Anatomy',
    latinName: 'Anatomia Superficialis Oculi',
    system: '3. Organ Indera (Organa Sensuum)',
    subSystem: '3.1 Organ Penglihatan',
    imageUrl: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=1200&q=80',
    description: 'Aspek visual luar dari mata termasuk limbus kornea, karunkula lakrimalis, dan punctum lakrimalis.',
    functionMain: 'Pemeriksaan klinis langsung integritas eksternal bola mata.',
    vascularization: 'Arteri konjungtivalis superfisialis.',
    innervation: 'N. ophthalmicus (cabang lakrimalis, nasosiliaris).',
    clinicalNotes: 'Pelebaran pembuluh darah konjungtiva (injeksi siliaris) menandakan peradangan intraokular.',
    isFree: false,
    pins: [
      { id: 'sam-1', title: 'Limbus Kornea', description: 'Perbatasan melingkar transisi antara kornea jernih dan sklera putih.', x: 50, y: 50 }
    ]
  },
  {
    id: 'morfologi-struktur-nasal',
    name: 'Morfologi & Struktur Nasal',
    latinName: 'Nasus Externus et Cavum Nasi',
    system: '3. Organ Indera (Organa Sensuum)',
    subSystem: '3.2 Organ Penciuman',
    imageUrl: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=1200&q=80',
    description: 'Anatomi hidung luar dan rongga hidung bagian dalam yang dipisahkan oleh septum nasi.',
    functionMain: 'Indera penciuman (olfaktori), filtrasi, humidifikasi, dan penghangatan udara respirasi.',
    vascularization: 'Arteria sphenopalatina, arteria ethmoidalis anterior.',
    innervation: 'Nervus Olfactorius (N. I) untuk penciuman, N. trigeminus untuk sensorik umum.',
    clinicalNotes: 'Deviasi septum nasi yang berat dapat menyebabkan hambatan jalan napas kronik dan sinusitis.',
    isFree: false,
    pins: [
      { id: 'msn-1', title: 'Septum Nasi', description: 'Dinding pemisah rongga hidung kanan dan kiri, tersusun atas tulang dan tulang rawan.', x: 50, y: 48 },
      { id: 'msn-2', title: 'Epitel Olfaktorius', description: 'Situs reseptor penciuman di atap kavum nasi.', x: 50, y: 25 }
    ]
  },
  {
    id: 'sinus-paranasalis',
    name: 'Sinus Paranasalis',
    latinName: 'Sinus Paranasales',
    system: '3. Organ Indera (Organa Sensuum)',
    subSystem: '3.2 Organ Penciuman',
    imageUrl: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=1200&q=80',
    description: 'Rongga berisi udara di dalam tulang-tulang wajah yang bermuara di kavum nasi.',
    functionMain: 'Meringankan beban cranium, resonansi suara, dan produksi mukus.',
    vascularization: 'Aa. ethmoidales dan Aa. sphenopalatina.',
    innervation: 'Cabang N. Maxillaris dan N. Ophthalmicus.',
    clinicalNotes: 'Sinusitis maksilaris sering terjadi akibat penyebaran infeksi akar gigi premolar atas.',
    isFree: false,
    pins: [
      { id: 'sip-1', title: 'Sinus Maxillaris', description: 'Sinus paranasal terbesar di bawah rongga mata kiri-kanan.', x: 48, y: 55 }
    ]
  },
  {
    id: 'nasopharynx-indera',
    name: 'Nasopharynx',
    latinName: 'Nasopharynx',
    system: '3. Organ Indera (Organa Sensuum)',
    subSystem: '3.2 Organ Penciuman',
    imageUrl: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=1200&q=80',
    description: 'Bagian posterior rongga hidung yang berada di atas palatum molle.',
    functionMain: 'Saluran udara pernapasan dan ventilasi telinga tengah via tuba eustachius.',
    vascularization: 'Arteria pharyngea ascendens.',
    innervation: 'Plexus pharyngeus (N. IX dan X).',
    clinicalNotes: 'Karsinoma Nasofaring (KNF) sangat erat kaitannya dengan infeksi Epstein-Barr Virus.',
    isFree: false,
    pins: [
      { id: 'npi-1', title: 'Ostium Tuba Eustachius', description: 'Pintu masuk ke saluran penghubung kavum timpani telinga tengah.', x: 50, y: 45 }
    ]
  },
  {
    id: 'inervasi-vaskularisasi-nasal',
    name: 'Inervasi & Vaskularisasi Nasal',
    latinName: 'Vasa et Nervi Nasi',
    system: '3. Organ Indera (Organa Sensuum)',
    subSystem: '3.2 Organ Penciuman',
    imageUrl: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=1200&q=80',
    description: 'Jejaring saraf trigeminus, olfaktori, serta anastomosis pembuluh darah septum.',
    functionMain: 'Transmisi sensasi bau, nyeri, suhu, dan regulasi aliran darah hidung.',
    vascularization: 'Plexus Kiesselbach di septum anterior.',
    innervation: 'N. Olfactorius (I) dan cabang N. Maxillaris (V2).',
    clinicalNotes: 'Mimisan anterior (epistaksis) paling sering bersumber dari ruptur pembuluh Plexus Kiesselbach.',
    isFree: false,
    pins: [
      { id: 'ivn-1', title: 'Plexus Kiesselbach', description: 'Situs anastomosis anastomosis subkutan rentan trauma/udara kering.', x: 46, y: 50 }
    ]
  },
  {
    id: 'struktur-auris',
    name: 'Struktur Auris',
    latinName: 'Auris',
    system: '3. Organ Indera (Organa Sensuum)',
    subSystem: '3.3 Organ Pendengaran (Auris)',
    imageUrl: 'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?auto=format&fit=crop&w=1200&q=80',
    description: 'Organ pendengaran dan keseimbangan tubuh yang dibagi menjadi auris externa, media, dan interna.',
    functionMain: 'Menghantarkan gelombang suara ke koklea, dan mendeteksi orientasi kepala (keseimbangan).',
    vascularization: 'Arteria auricularis posterior, arteria temporalis superficialis.',
    innervation: 'Nervus Vestibulocochlearis (N. VIII) untuk pendengaran-keseimbangan.',
    clinicalNotes: 'Otitis Media Akut adalah infeksi telinga tengah akibat disfungsi ventilasi tuba eustachius.',
    isFree: false,
    pins: [
      { id: 'sa-1-2', title: 'Membrana Tympani', description: 'Gendang telinga yang menggetarkan ossicula auditus.', x: 45, y: 45 },
      { id: 'sa-2', title: 'Cochlea', description: 'Rumah siput berisi organon corti pendeteksi getaran suara.', x: 55, y: 55 }
    ]
  },

  // ==========================================
  // 4. SISTEM RESPIRASI (SYSTEMA RESPIRATORIUM)
  // ==========================================
  {
    id: 'nasus-sinus-respirasi',
    name: 'Nasus & Sinus Paranasalis',
    latinName: 'Cavum Nasi et Sinus Paranasales',
    system: '4. Sistem Respirasi (Systema Respiratorium)',
    subSystem: '4.1 Saluran Napas Atas',
    imageUrl: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=1200&q=80',
    description: 'Gerbang utama pernapasan yang menyaring, menghangatkan, dan melembabkan udara luar.',
    functionMain: 'Melakukan filtrasi mukosiliar udara inspirasi pertama sebelum masuk trakeobronkial.',
    vascularization: 'Arteria sphenopalatina.',
    innervation: 'N. trigeminus (cabang optalmikus dan maksilaris).',
    clinicalNotes: 'Rinitis alergi memicu pembengkakan konka nasalis, menyumbat aliran udara napas.',
    isFree: false,
    pins: [
      { id: 'nsr-1', title: 'Concha Nasalis', description: 'Struktur tulang berlekuk penginduksi turbulensi udara hangat.', x: 48, y: 45 }
    ]
  },
  {
    id: 'pharynx-respirasi',
    name: 'Pharynx',
    latinName: 'Pharynx',
    system: '4. Sistem Respirasi (Systema Respiratorium)',
    subSystem: '4.1 Saluran Napas Atas',
    imageUrl: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=1200&q=80',
    description: 'Saluran fibromuskular penghubung kavum nasi/oris ke laring dan esofagus.',
    functionMain: 'Saluran pencernaan dan respirasi bersama, menyalurkan bolus makanan dan udara.',
    vascularization: 'Arteria pharyngea ascendens.',
    innervation: 'Nervus Glossopharyngeus (IX) dan Nervus Vagus (X).',
    clinicalNotes: 'Hipertrofi tonsila palatina (amandel) dapat mengganggu jalan napas anak saat tidur (sleep apnea).',
    isFree: false,
    pins: [
      { id: 'phr-1', title: 'Oropharynx', description: 'Bagian posterior rongga mulut penampung bolus dan udara.', x: 50, y: 50 }
    ]
  },
  {
    id: 'larynx-respirasi',
    name: 'Larynx',
    latinName: 'Larynx',
    system: '4. Sistem Respirasi (Systema Respiratorium)',
    subSystem: '4.1 Saluran Napas Atas',
    imageUrl: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=1200&q=80',
    description: 'Kotak suara kartilaginosa yang terletak di antara faring dan trakea.',
    functionMain: 'Melindungi trakeobronkial dari aspirasi bolus dan memproduksi suara (fonasi).',
    vascularization: 'Arteria laryngea superior dan inferior.',
    innervation: 'Nervus Laryngeus Recurrens (cabang N. Vagus).',
    clinicalNotes: 'Kerusakan unilateral N. laryngeus recurrens pasca operasi tiroid memicu suara serak.',
    isFree: false,
    pins: [
      { id: 'lar-1', title: 'Epiglottis', description: 'Katup rawan elastis penutup rima glotidis saat menelan.', x: 50, y: 35 },
      { id: 'lar-2', title: 'Plica Vocalis', description: 'Pita suara sejati penghasil nada vokal.', x: 50, y: 55 }
    ]
  },
  {
    id: 'trachea-respirasi',
    name: 'Trachea',
    latinName: 'Trachea',
    system: '4. Sistem Respirasi (Systema Respiratorium)',
    subSystem: '4.2 Saluran Napas Bawah & Paru',
    imageUrl: 'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?auto=format&fit=crop&w=1200&q=80',
    description: 'Pipa udara silindris kartilago yang berlanjut dari laring hingga bifurkasio karina.',
    functionMain: 'Menyalurkan udara napas ke paru-paru dan mengeluarkan debris via eskalator siliar.',
    vascularization: 'Arteria thyroidea inferior.',
    innervation: 'Saraf simpatis torakal dan parasimpatis N. vagus.',
    clinicalNotes: 'Tindakan trakeostomi emergensi dilakukan di sela cincin kartilago trakea ke-2 dan ke-3.',
    isFree: false,
    pins: [
      { id: 'tra-1', title: 'Cartilago Trachealis', description: 'Cincin tulang rawan berbentuk huruf U penjaga kepatenan jalan napas.', x: 50, y: 48 }
    ]
  },
  {
    id: 'pulmo-respirasi',
    name: 'Pulmo',
    latinName: 'Pulmo',
    system: '4. Sistem Respirasi (Systema Respiratorium)',
    subSystem: '4.2 Saluran Napas Bawah & Paru',
    imageUrl: 'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?auto=format&fit=crop&w=1200&q=80',
    description: 'Organ respirasi utama yang terletak di dalam cavitas thoracis, dipisahkan oleh mediastinum.',
    functionMain: 'Tempat pertukaran gas oksigen dan karbon dioksida di membran alveolokapiler.',
    vascularization: 'Arteria pulmonalis (darah non-oksigen) dan Aa. bronchiales (darah nutrisional).',
    innervation: 'Plexus pulmonalis (N. vagus dan trunkus simpatikus).',
    clinicalNotes: 'Pneumonia menyebabkan eksudasi cairan di dalam alveoli, mengganggu difusi oksigen darah.',
    isFree: false,
    pins: [
      { id: 'pul-1', title: 'Bronchus Principalis', description: 'Cabang utama trakea kiri dan kanan yang masuk ke hilus paru.', x: 45, y: 45 },
      { id: 'pul-2', title: 'Alveoli', description: 'Kantung udara terminal tempat pertukaran difusi gas sistemik.', x: 60, y: 65 }
    ]
  },
  {
    id: 'pleura-respirasi',
    name: 'Pleura',
    latinName: 'Pleura',
    system: '4. Sistem Respirasi (Systema Respiratorium)',
    subSystem: '4.2 Saluran Napas Bawah & Paru',
    imageUrl: 'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?auto=format&fit=crop&w=1200&q=80',
    description: 'Membran serosa tipis pelapis dinding dada dalam dan pembungkus luar paru.',
    functionMain: 'Mengurangi gesekan paru saat mengembang dan menjaga tekanan negatif intrapleural.',
    vascularization: 'Arteri intercostalis dan arteri phrenica.',
    innervation: 'N. intercostalis (pleura parietal), serabut otonom (pleura viseral).',
    clinicalNotes: 'Akumulasi udara di cavum pleura (pneumotoraks) mendesak paru hingga kolaps total.',
    isFree: false,
    pins: [
      { id: 'ple-1', title: 'Pleura Parietalis', description: 'Lapisan luar pleura yang sensitif terhadap nyeri.', x: 40, y: 50 }
    ]
  },
  {
    id: 'diafragma-respirasi',
    name: 'Diafragma',
    latinName: 'Diaphragma',
    system: '4. Sistem Respirasi (Systema Respiratorium)',
    subSystem: '4.3 Diafragma & Dinding Thorax',
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
    description: 'Skat kubah muskuloaponeurotik yang memisahkan rongga dada dan rongga perut.',
    functionMain: 'Otot inspirasi utama, memperluas dimensi vertikal toraks saat kontraksi.',
    vascularization: 'Arteria phrenica superior dan inferior.',
    innervation: 'Nervus Phrenicus (C3, C4, C5).',
    clinicalNotes: 'Cedera korda saraf spinal di atas C3 menyebabkan kelumpuhan diafragma dan henti napas akut.',
    isFree: false,
    pins: [
      { id: 'dia-1', title: 'Foramen Vena Cava', description: 'Lubang tembus vena cava inferior setinggi vertebra T8.', x: 50, y: 40 },
      { id: 'dia-2', title: 'Hiatus Aorticus', description: 'Lubang tembus aorta abdominalis setinggi vertebra T12.', x: 50, y: 65 }
    ]
  },
  {
    id: 'dinding-thorax',
    name: 'Dinding Thorax',
    latinName: 'Paries Thoracis',
    system: '4. Sistem Respirasi (Systema Respiratorium)',
    subSystem: '4.3 Diafragma & Dinding Thorax',
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
    description: 'Kerangka tulang osteokartilago dan otot dada pembentuk sangkar pelindung organ toraks.',
    functionMain: 'Memfasilitasi mekanika ventilasi pernapasan via gerakan tulang rusuk.',
    vascularization: 'Arteria thoracica interna dan arteri intercostales posterior.',
    innervation: 'Nervus intercostalis segmentalis.',
    clinicalNotes: 'Fraktur costae multipel dapat memicu gerakan paradoks dinding dada (flail chest).',
    isFree: false,
    pins: [
      { id: 'dth-1', title: 'Sternum', description: 'Tulang dada bagian anterior tempat artikulasi costae sejati.', x: 50, y: 45 }
    ]
  },

  // ==========================================
  // 5. SISTEM KARDIOVASKULAR (SYSTEMA CARDIOVASCULARE)
  // ==========================================
  {
    id: 'makro-anatomi-jantung',
    name: 'Makro Anatomi Jantung',
    latinName: 'Cor',
    system: '5. Sistem Kardiovaskular (Systema Cardiovasculare)',
    subSystem: '5.1 Anatomi Jantung',
    imageUrl: 'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?auto=format&fit=crop&w=1200&q=80',
    description: 'Organ pemompa muscular beruang empat yang dibungkus oleh selaput fibrosa perikardium.',
    functionMain: 'Memompakan darah ke sirkulasi pulmonal dan sirkulasi sistemik tubuh.',
    vascularization: 'Arteria Coronaria Dextra dan Sinistra.',
    innervation: 'Sistem konduksi otonom intrinsik ditalahi simpatis-parasimpatis.',
    clinicalNotes: 'Oklusi akut Arteria Coronaria menyebabkan infark miokard (serangan jantung).',
    isFree: false,
    pins: [
      { id: 'maj-1', title: 'Atrium Sinistrum', description: 'Menerima darah kaya oksigen dari vena pulmonalis.', x: 52, y: 42 },
      { id: 'maj-2', title: 'Ventriculus Sinister', description: 'Memompa darah bertekanan tinggi ke pembuluh Aorta.', x: 48, y: 58 }
    ]
  },
  {
    id: 'persarafan-konduksi',
    name: 'Persarafan & Konduksi',
    latinName: 'Systema Conductionis Cordis',
    system: '5. Sistem Kardiovaskular (Systema Cardiovasculare)',
    subSystem: '5.1 Anatomi Jantung',
    imageUrl: 'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?auto=format&fit=crop&w=1200&q=80',
    description: 'Sistem listrik khusus miokardium yang memicu denyut jantung terkoordinasi secara otonom.',
    functionMain: 'Membangkitkan dan menghantarkan impuls kontraksi ritmis atrium-ventrikel.',
    vascularization: 'Arteri nodus sinus (cabang A. coronaria).',
    innervation: 'Plexus cardiacus (N. vagus dan serabut simpatis).',
    clinicalNotes: 'Blok konduksi pada AV Node dapat menyebabkan bradikardia ekstrem yang membutuhkan pacemaker.',
    isFree: false,
    pins: [
      { id: 'pck-1', title: 'Sinoatrial (SA) Node', description: 'Pacemaker alami jantung di dinding atrium kanan superior.', x: 55, y: 35 }
    ]
  },
  {
    id: 'arteri-utama',
    name: 'Arteri Utama',
    latinName: 'Arteriae Systemicae',
    system: '5. Sistem Kardiovaskular (Systema Cardiovasculare)',
    subSystem: '5.2 Sistem Pembuluh Darah',
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
    description: 'Arteri sistemik utama dari percabangan aorta asendens, arkus aorta, dan aorta desendens.',
    functionMain: 'Menyalurkan darah kaya oksigen bertekanan tinggi ke seluruh organ tubuh.',
    vascularization: 'Cabang-cabang Aorta.',
    innervation: 'Serabut vasomotor simpatis dinding pembuluh.',
    clinicalNotes: 'Diseksi aorta adalah robekan intimal mendadak dinding aorta yang mengancam jiwa.',
    isFree: false,
    pins: [
      { id: 'aru-1', title: 'Arteria Carotis Communis', description: 'Arteri leher penyuplai utama darah otak dan wajah.', x: 48, y: 35 }
    ]
  },
  {
    id: 'vena-utama',
    name: 'Vena Utama',
    latinName: 'Venae Systemicae',
    system: '5. Sistem Kardiovaskular (Systema Cardiovasculare)',
    subSystem: '5.2 Sistem Pembuluh Darah',
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
    description: 'Sistem pembuluh balik utama tubuh termasuk vena cava superior dan inferior.',
    functionMain: 'Mengembalikan darah miskin oksigen dari jaringan tubuh kembali ke atrium kanan.',
    vascularization: 'Darah sistemik balik.',
    innervation: 'Persarafan otonom vasomotor vena.',
    clinicalNotes: 'Deep Vein Thrombosis (DVT) di tungkai bawah berisiko lepas menjadi Emboli Paru fatal.',
    isFree: false,
    pins: [
      { id: 'veu-1', title: 'Vena Cava Superior', description: 'Muara vena dari kepala, leher, dan ekstremitas superior.', x: 50, y: 40 }
    ]
  },
  {
    id: 'jalur-sirkulasi',
    name: 'Jalur Sirkulasi',
    latinName: 'Circulus Sanguinis',
    system: '5. Sistem Kardiovaskular (Systema Cardiovasculare)',
    subSystem: '5.2 Sistem Pembuluh Darah',
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
    description: 'Skema aliran sirkulasi sistemik, pulmonal, hepatosirkulasi portal, dan sirkulasi janin.',
    functionMain: 'Mengatur perfusi gas dan nutrisi sistem tubuh secara sirkular.',
    vascularization: 'Sirkuit kardiovaskular terintegrasi.',
    innervation: 'Baroreseptor sinus karotikus regulasi tekanan.',
    clinicalNotes: 'Hipertensi portal pada sirosis memicu varises esofagus yang rentan pecah masif.',
    isFree: false,
    pins: [
      { id: 'jsi-1', title: 'Sistem Sirkulasi Portal', description: 'Vena mengalirkan darah saluran cerna langsung ke hepar untuk filtrasi.', x: 50, y: 60 }
    ]
  },
  {
    id: 'limfatik-kardiovaskular',
    name: 'Limfatik Kardiovaskular',
    latinName: 'Systema Lymphaticum',
    system: '5. Sistem Kardiovaskular (Systema Cardiovasculare)',
    subSystem: '5.3 Limfatik & Embriologi',
    imageUrl: 'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?auto=format&fit=crop&w=1200&q=80',
    description: 'Jaringan pembuluh dan nodulus limfe penampung cairan interstisial.',
    functionMain: 'Mengembalikan cairan ekstraseluler kembali ke sistem sirkulasi vena.',
    vascularization: 'Ductus thoracicus bermuara di angulus venosus.',
    innervation: 'Pleksus saraf simpatik vaskular.',
    clinicalNotes: 'Obstruksi aliran limfe (misal: akibat filariasis) menyebabkan limfedema kaki gajah.',
    isFree: false,
    pins: [
      { id: 'lca-1', title: 'Ductus Thoracicus', description: 'Saluran limfe utama tubuh yang bermuara di vena leher kiri.', x: 48, y: 45 }
    ]
  },
  {
    id: 'embriologi-kardiovaskular',
    name: 'Embriologi Kardiovaskular',
    latinName: 'Embryologia Cordis',
    system: '5. Sistem Kardiovaskular (Systema Cardiovasculare)',
    subSystem: '5.3 Limfatik & Embriologi',
    imageUrl: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=1200&q=80',
    description: 'Proses pelipatan tabung jantung embrio membentuk sekat-sekat ruang jantung sedia kala.',
    functionMain: 'Pembentukan struktur anatomis jantung dan pembuluh darah besar janin.',
    vascularization: 'Pembuluh vitelina dan tali pusat embrio.',
    innervation: 'Perkembangan pleksus jantung intrinsik.',
    clinicalNotes: 'Defek penutupan sekat septum memicu Atrial/Ventricular Septal Defect (bocor jantung).',
    isFree: false,
    pins: [
      { id: 'eku-1', title: 'Foramen Ovale Janin', description: 'Lubang sirkuit fungsional pengalir darah atrium kanan langsung ke kiri.', x: 50, y: 50 }
    ]
  },

  // ==========================================
  // 6. SISTEM PENCERNAAN (SYSTEMA DIGESTORIUM)
  // ==========================================
  {
    id: 'topografi-regio-abdomen',
    name: 'Topografi & Regio',
    latinName: 'Regiones Abdominis',
    system: '6. Sistem Pencernaan (Systema Digestorium)',
    subSystem: '6.1 Dinding & Cavum Abdomen',
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
    description: 'Pembagian klinis dinding perut menjadi 4 kuadran atau 9 regio untuk lokalisasi organ.',
    functionMain: 'Mendasari pemetaan pemeriksaan fisik inspeksi, palpasi, perkusi, auskultasi.',
    vascularization: 'Arteri epigastrica superior dan inferior.',
    innervation: 'Dermatom saraf spinal T7 - L1.',
    clinicalNotes: 'Nyeri alih (referred pain) kuadran kanan bawah sangat spesifik untuk apendisitis akut.',
    isFree: false,
    pins: [
      { id: 'tra-1-1', title: 'Epigastrium', description: 'Regio tengah atas, letak proyeksi organ gaster dan hepar.', x: 50, y: 45 },
      { id: 'tra-2', title: 'Fossa Iliaca Dextra', description: 'Regio kanan bawah, letak dari caecum dan apendiks.', x: 42, y: 65 }
    ]
  },
  {
    id: 'lapisan-dinding-abdomen',
    name: 'Lapisan Dinding Abdomen',
    latinName: 'Paries Abdominalis',
    system: '6. Sistem Pencernaan (Systema Digestorium)',
    subSystem: '6.1 Dinding & Cavum Abdomen',
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
    description: 'Lapisan struktur anterolateral abdomen termasuk kulit, fascia Camper/Scarpa, muskuli, dan fascia transversalis.',
    functionMain: 'Menjaga tekanan intraabdominal dan melindungi organ visceral.',
    vascularization: 'Arteria epigastrica inferior.',
    innervation: 'Nervus iliohypogastricus dan ilioinguinalis.',
    clinicalNotes: 'Kelemahan dinding aponeurosis di Trigonum Hesselbach mencetuskan Hernia Inguinalis Direk.',
    isFree: false,
    pins: [
      { id: 'lda-1', title: 'Kanalis Inguinalis', description: 'Saluran lewatnya funiculus spermaticus pada pria.', x: 45, y: 72 }
    ]
  },
  {
    id: 'rongga-peritoneum',
    name: 'Rongga Peritoneum',
    latinName: 'Cavitas Peritonealis',
    system: '6. Sistem Pencernaan (Systema Digestorium)',
    subSystem: '6.1 Dinding & Cavum Abdomen',
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
    description: 'Ruang potensial pembatas peritoneum parietal dan viseral berisi cairan pelumas.',
    functionMain: 'Mencegah perlekatan antar-organ cerna dan memungkinkan mobilitas peristaltik.',
    vascularization: 'Arteri mesenterica superior.',
    innervation: 'Saraf otonom viseral aferen.',
    clinicalNotes: 'Akumulasi eksudat infeksius di kantung dalam (Cavum Douglas) sering dievaluasi klinis.',
    isFree: false,
    pins: [
      { id: 'rpe-1', title: 'Morison Pouches', description: 'Ruang antara hepar dan ginjal kanan, pengumpul asites terendah berbaring.', x: 48, y: 55 }
    ]
  },
  {
    id: 'cavitas-oris-faring',
    name: 'Cavitas Oris & Faring',
    latinName: 'Cavitas Oris et Pharynx',
    system: '6. Sistem Pencernaan (Systema Digestorium)',
    subSystem: '6.2 Saluran Cerna Top to Bottom',
    imageUrl: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=1200&q=80',
    description: 'Rongga awal pencernaan makanan mekanis yang berlanjut ke saluran faring.',
    functionMain: 'Mengunyah makanan, insalivasi amilase awal, serta menelan bolus.',
    vascularization: 'Arteria lingualis dan arteria facialis.',
    innervation: 'Nervus Hypoglossus (XII) motorik lidah, N. Trigeminal sensorik.',
    clinicalNotes: 'Faringitis akut sering menyebar ke tonsila palatina membentuk amandel bernanah.',
    isFree: false,
    pins: [
      { id: 'cof-1', title: 'Kelenjar Parotis', description: 'Kelenjar ludah terbesar penyuplai amilase saliva.', x: 44, y: 40 }
    ]
  },
  {
    id: 'esofagus-gaster',
    name: 'Esofagus & Gaster',
    latinName: 'Oesophagus et Gaster',
    system: '6. Sistem Pencernaan (Systema Digestorium)',
    subSystem: '6.2 Saluran Cerna Top to Bottom',
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
    description: 'Saluran pencernaan berotot penyalur makanan ke lambung tempat pengasaman bolus.',
    functionMain: 'Transportasi bolus via gerak peristaltik lambung untuk pelumatan kimiawi asam lambung.',
    vascularization: 'Arteria gastrica sinistra cabang truncus celiacus.',
    innervation: 'Nervus Vagus (X) parasimpatik stimulasi sekresi Hcl.',
    clinicalNotes: 'Kerusakan sfingter esofagus bawah mencetuskan Gastroesophageal Reflux Disease (GERD).',
    isFree: false,
    pins: [
      { id: 'esg-1', title: 'Sfingter Pilorus', description: 'Otot polos sirkular pengatur pengosongan kimus ke duodenum.', x: 50, y: 62 }
    ]
  },
  {
    id: 'usus-halus',
    name: 'Usus Halus',
    latinName: 'Intestinum Tenue',
    system: '6. Sistem Pencernaan (Systema Digestorium)',
    subSystem: '6.2 Saluran Cerna Top to Bottom',
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
    description: 'Saluran cerna terpanjang yang terdiri atas duodenum, jejunum, dan ileum.',
    functionMain: 'Pusat pencernaan enzimatik dan penyerapan sebagian besar nutrisi makanan.',
    vascularization: 'Arteria mesenterica superior.',
    innervation: 'Plexus myentericus Auerbach dan submucosa Meissner.',
    clinicalNotes: 'Kerusakan vili usus halus akibat intoleransi gluten dijumpai pada Celiac Disease.',
    isFree: false,
    pins: [
      { id: 'ush-1', title: 'Papila Duodeni Major', description: 'Muara bersama saluran empedu dan pankreas di duodenum.', x: 50, y: 55 }
    ]
  },
  {
    id: 'usus-besar-anus',
    name: 'Usus Besar & Anus',
    latinName: 'Intestinum Crassum et Anus',
    system: '6. Sistem Pencernaan (Systema Digestorium)',
    subSystem: '6.2 Saluran Cerna Top to Bottom',
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
    description: 'Saluran cerna lanjutan penyerap air sisa kimus dan rektum penyimpan feses sebelum anus.',
    functionMain: 'Reabsorpsi air dan elektrolit, serta defekasi pembuangan sisa makanan.',
    vascularization: 'Arteria mesenterica inferior dan superior.',
    innervation: 'Sistem otonom enterik simpatik-parasimpatik.',
    clinicalNotes: 'Pelebaran pleksus vena di bantalan rektum bawah memicu wasir atau hemoroid.',
    isFree: false,
    pins: [
      { id: 'uba-1', title: 'Apendiks Vermiformis', description: 'Usus buntu di sekum, kaya jaringan limfoid lokal.', x: 42, y: 68 }
    ]
  },
  {
    id: 'vaskularisasi-saluran-cerna',
    name: 'Vaskularisasi Saluran Cerna',
    latinName: 'Vascularisatio Systematis Digestorii',
    system: '6. Sistem Pencernaan (Systema Digestorium)',
    subSystem: '6.3 Vaskularisasi & Organ Aksesoris',
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
    description: 'Sistem sirkulasi utama penyuplai foregut, midgut, dan hindgut dari cabang aorta abdominalis.',
    functionMain: 'Menyuplai oksigen organ cerna dan membawa nutrisi serap via portal hepar.',
    vascularization: 'Truncus celiacus, A. mesenterica superior, A. mesenterica inferior.',
    innervation: 'Serabut vasomotor splanchnicus otonom.',
    clinicalNotes: 'Oklusi akut arteri mesenterica dapat menyebabkan iskemia usus hebat (mesenteric ischemia).',
    isFree: false,
    pins: [
      { id: 'vsc-1', title: 'Truncus Celiacus', description: 'Arteri utama penyuplai organ foregut (lambung, limpa, hati).', x: 50, y: 48 }
    ]
  },
  {
    id: 'organ-aksesoris',
    name: 'Organ Aksesoris',
    latinName: 'Organa Accessoria Digestoria',
    system: '6. Sistem Pencernaan (Systema Digestorium)',
    subSystem: '6.3 Vaskularisasi & Organ Aksesoris',
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
    description: 'Organ penunjang pencernaan non-saluran yang mencakup hepar, kantung empedu, dan pankreas.',
    functionMain: 'Sekresi empedu pengemulsi lemak dan kelenjar eksokrin-endokrin pencernaan.',
    vascularization: 'Arteria hepatica propria, Vena portae hepatis.',
    innervation: 'Saraf otonom pleksus hepatikus.',
    clinicalNotes: 'Penyumbatan duktus koledokus oleh batu empedu memicu sklera kuning (ikterus obstruktif).',
    isFree: false,
    pins: [
      { id: 'oax-1', title: 'Vesica Fellea', description: 'Kantung empedu penampung cairan empedu hepar.', x: 48, y: 52 },
      { id: 'oax-2', title: 'Caput Pancreatis', description: 'Kepala pankreas di lekukan duodenum penampung duktus.', x: 52, y: 58 }
    ]
  },
  {
    id: 'spleen-lien-lokasi',
    name: 'Spleen/Lien (Anatomi & Lokasi)',
    latinName: 'Lien',
    system: '6. Sistem Pencernaan (Systema Digestorium)',
    subSystem: '6.3 Vaskularisasi & Organ Aksesoris',
    imageUrl: 'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?auto=format&fit=crop&w=1200&q=80',
    description: 'Organ limfoid terbesar tubuh berwarna ungu kemerahan di kuadran kiri atas abdomen.',
    functionMain: 'Filtrasi sel darah merah tua dan penyimpan cadangan trombosit.',
    vascularization: 'Arteria splenica tortuosa dari truncus celiacus.',
    innervation: 'Plexus splenicus otonom.',
    clinicalNotes: 'Trauma tumpul abdomen kiri rentan memicu ruptur limpa berujung perdarahan fatal.',
    isFree: false,
    pins: [
      { id: 'sll-1', title: 'Pulpa Rubra', description: 'Jaringan penyaring darah dari eritrosit tua.', x: 50, y: 50 }
    ]
  },

  // ==========================================
  // 7. SISTEM KEMIH (SYSTEMA URINARIUM)
  // ==========================================
  {
    id: 'dinding-posterior-abdomen',
    name: 'Dinding Posterior Abdomen',
    latinName: 'Paries Posterior Abdominis',
    system: '7. Sistem Kemih (Systema Urinarium)',
    subSystem: '7.1 Topografi & Dasar Pelvis',
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
    description: 'Struktur muskuloskeletal pembatas perut belakang, tempat melekatnya ginjal retroperitoneal.',
    functionMain: 'Stabilisasi postur tubuh dan menyangga kedudukan organ kemih.',
    vascularization: 'Arteria lumbalis dan phrenica inferior.',
    innervation: 'Plexus lumbalis (L1-L4).',
    clinicalNotes: 'Ketegangan m. psoas major akibat abses tuberkulosis menimbulkan nyeri psoas sign.',
    isFree: false,
    pins: [
      { id: 'dpa-1', title: 'Musculus Psoas Major', description: 'Otot fleksor paha besar di dinding abdomen belakang.', x: 45, y: 60 }
    ]
  },
  {
    id: 'cavum-pelvis',
    name: 'Cavum Pelvis',
    latinName: 'Cavitas Pelvis',
    system: '7. Sistem Kemih (Systema Urinarium)',
    subSystem: '7.1 Topografi & Dasar Pelvis',
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
    description: 'Rongga panggul tempat organ genitalia dalam dan organ kemih bawah.',
    functionMain: 'Menampung kantung kemih dan organ reproduksi internal.',
    vascularization: 'Arteria iliaca interna.',
    innervation: 'Plexus sacralis dan saraf pudendus.',
    clinicalNotes: 'Kelemahan otot diafragma pelvis (prolaps organ) memicu inkontinensia urine.',
    isFree: false,
    pins: [
      { id: 'cvp-1', title: 'Musculus Levator Ani', description: 'Otot dasar panggul penopang organ viseral pelvis.', x: 50, y: 70 }
    ]
  },
  {
    id: 'ginjal-kemih',
    name: 'Ginjal',
    latinName: 'Ren / Nephros',
    system: '7. Sistem Kemih (Systema Urinarium)',
    subSystem: '7.2 Organ Sistem Kemih',
    imageUrl: 'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?auto=format&fit=crop&w=1200&q=80',
    description: 'Sepasang organ retroperitoneal kacang merah di dinding perut belakang.',
    functionMain: 'Filtrasi sisa urea darah, osmoregulasi cairan, dan sintesis eritropoietin.',
    vascularization: 'Arteria renalis cabang langsung aorta abdominalis.',
    innervation: 'Plexus renalis simpatis.',
    clinicalNotes: 'Penyumbatan kaliks ginjal oleh batu kalsium menyebabkan nyeri kolik hebat.',
    isFree: false,
    pins: [
      { id: 'gjk-1', title: 'Kortex Renalis', description: 'Lapisan luar tempat jutaan nefron filtrasi darah.', x: 45, y: 40 },
      { id: 'gjk-2', title: 'Pelvis Renalis', description: 'Corong pengumpul urine sebelum masuk ke ureter.', x: 52, y: 55 }
    ]
  },
  {
    id: 'ureter-kemih',
    name: 'Ureter',
    latinName: 'Ureter',
    system: '7. Sistem Kemih (Systema Urinarium)',
    subSystem: '7.2 Organ Sistem Kemih',
    imageUrl: 'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?auto=format&fit=crop&w=1200&q=80',
    description: 'Saluran kemih muskular penghubung pelvis renalis ginjal ke vesika urinaria.',
    functionMain: 'Mengalirkan urine via gerakan gelombang peristaltik ureter.',
    vascularization: 'Arteria ureterica dari A. renalis dan A. iliaca.',
    innervation: 'Plexus otonom pelvis.',
    clinicalNotes: 'Terdapat tiga titik penyempitan ureter yang rentan menjadi lokasi tersangkutnya batu.',
    isFree: false,
    pins: [
      { id: 'urk-1', title: 'Penyempitan Ureteropelvik', description: 'Penyempitan pertama di perbatasan pelvis renalis dan ureter.', x: 48, y: 45 }
    ]
  },
  {
    id: 'vesica-urinaria',
    name: 'Vesica Urinaria',
    latinName: 'Vesica Urinaria',
    system: '7. Sistem Kemih (Systema Urinarium)',
    subSystem: '7.2 Organ Sistem Kemih',
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
    description: 'Kantung penampung urine muscular berongga di kavum pelvis anterior.',
    functionMain: 'Reservoir urine sementara sebelum dikeluarkan via refleks berkemih.',
    vascularization: 'Arteria vesicalis superior dan inferior.',
    innervation: 'Saraf parasimpatik splanchnicus pelvis (kontraksi m. detrusor).',
    clinicalNotes: 'Retensi urine akut terjadi pada pria lansia akibat sumbatan hipertrofi prostat.',
    isFree: false,
    pins: [
      { id: 'vur-1', title: 'Musculus Detrusor', description: 'Otot polos dinding vesika urinaria penggerak refleks miksi.', x: 50, y: 50 }
    ]
  },
  {
    id: 'uretra-kemih',
    name: 'Uretra',
    latinName: 'Urethra',
    system: '7. Sistem Kemih (Systema Urinarium)',
    subSystem: '7.2 Organ Sistem Kemih',
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
    description: 'Saluran pembuangan urine dari vesika urinaria keluar dari tubuh.',
    functionMain: 'Ekskresi urine sistemik (dan jalur semen pada pria).',
    vascularization: 'Arteria urethralis cabang iliaca.',
    innervation: 'Nervus pudendus somatik (sfingter uretra eksternal).',
    clinicalNotes: 'Uretra wanita yang pendek berisiko tinggi memicu infeksi saluran kemih (sistitis).',
    isFree: false,
    pins: [
      { id: 'utk-1', title: 'Sfingter Uretra Eksternal', description: 'Otot rangka volunter penahan urine sadar.', x: 50, y: 65 }
    ]
  },
  {
    id: 'development-kemih',
    name: 'Development',
    latinName: 'Embryologia Systematis Urinarii',
    system: '7. Sistem Kemih (Systema Urinarium)',
    subSystem: '7.3 Embriologi Traktus Urinarium',
    imageUrl: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=1200&q=80',
    description: 'Perkembangan sistem urinarius embrio dari mesoderm intermediet (pronefros, mesonefros, metanefros).',
    functionMain: 'Pembentukan nefron fungsional ginjal metanefros permanen.',
    vascularization: 'Sirkulasi aorta dorsal embrio.',
    innervation: 'Inisiasi saraf simpatis lokal.',
    clinicalNotes: 'Kegagalan migrasi ginjal ke kranial memicu kelainan ginjal panggul (pelvic kidney) atau ginjal tapal kuda.',
    isFree: false,
    pins: [
      { id: 'dvk-1', title: 'Metanefros', description: 'Bakal ginjal permanen yang mulai berfungsi minggu ke-5.', x: 50, y: 55 }
    ]
  },

  // ==========================================
  // 8. SISTEM GENITALIA (SYSTEMA GENITALI)
  // ==========================================
  {
    id: 'embriologi-dasar-genitalia',
    name: 'Embriologi Dasar',
    latinName: 'Embryologia Genitalium Basic',
    system: '8. Sistem Genitalia (Systema Genitali)',
    subSystem: '8.1 Embriologi Sistem Genitalia',
    imageUrl: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=1200&q=80',
    description: 'Proses gametogenesis, ovulasi, implantasi blastokista, hingga penentuan seks genetik.',
    functionMain: 'Mempersiapkan materi genetik reproduksi diploid dari penyatuan gamet.',
    vascularization: 'Pembuluh vitelina awal.',
    innervation: 'Belum terinervasi saraf perifer.',
    clinicalNotes: 'Kegagalan meiosis kromosom saat gametogenesis memicu Sindrom Down (Trisomi 21).',
    isFree: false,
    pins: [
      { id: 'edg-1', title: 'Implantasi Blastokista', description: 'Proses penempelan embrio di endometrium uteri.', x: 50, y: 40 }
    ]
  },
  {
    id: 'embriologi-genitalia',
    name: 'Embriologi Genitalia',
    latinName: 'Organogenesis Genitalium',
    system: '8. Sistem Genitalia (Systema Genitali)',
    subSystem: '8.1 Embriologi Sistem Genitalia',
    imageUrl: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=1200&q=80',
    description: 'Diferensiasi kelenjar gonad indiferen menjadi testis atau ovarium karena pengaruh gen SRY.',
    functionMain: 'Diferensiasi saluran Wolffian (pria) atau saluran Mullerian (wanita).',
    vascularization: 'Arteria ovarica / testicularis primordial.',
    innervation: 'Saraf simpatis segmen bawah.',
    clinicalNotes: 'Kegagalan testis turun dari rongga perut ke skrotum memicu kriptorkismus.',
    isFree: false,
    pins: [
      { id: 'egg-1', title: 'Kanalis Inguinalis Embrio', description: 'Jalur penurunan testis atau ligamentum teres uteri.', x: 48, y: 60 }
    ]
  },
  {
    id: 'organ-dalam-pria',
    name: 'Organ Dalam',
    latinName: 'Organa Genitalia Masculina Interna',
    system: '8. Sistem Genitalia (Systema Genitali)',
    subSystem: '8.2 Sistem Reproduksi Masculina',
    imageUrl: 'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?auto=format&fit=crop&w=1200&q=80',
    description: 'Struktur reproduksi pria dalam termasuk testis, epididimis, duktus deferens, dan prostat.',
    functionMain: 'Spermatogenesis, penyimpanan sperma matur, dan sekresi cairan semen.',
    vascularization: 'Arteria testicularis cabang langsung aorta abdominalis.',
    innervation: 'Plexus prostaticus otonom simpatik-parasimpatik.',
    clinicalNotes: 'Karsinoma prostat sering berkembang di zona perifer kelenjar prostat.',
    isFree: false,
    pins: [
      { id: 'odp-1', title: 'Testis', description: 'Tubulus seminiferus tempat produksi sel sperma dan testosteron.', x: 45, y: 68 },
      { id: 'odp-2', title: 'Kelenjar Prostat', description: 'Sekresi cairan prostat alkali pengaktif sperma.', x: 52, y: 55 }
    ]
  },
  {
    id: 'organ-luar-pria',
    name: 'Organ Luar',
    latinName: 'Organa Genitalia Masculina Externa',
    system: '8. Sistem Genitalia (Systema Genitali)',
    subSystem: '8.2 Sistem Reproduksi Masculina',
    imageUrl: 'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?auto=format&fit=crop&w=1200&q=80',
    description: 'Struktur reproduksi luar pria yang mencakup penis dan skrotum.',
    functionMain: 'Kopulasi pengantar semen ke vagina dan proteksi suhu testis.',
    vascularization: 'Arteria profunda penis cabang pudenda.',
    innervation: 'Nervus pudendus (somatik), saraf kavernosus parasimpatis ereksi.',
    clinicalNotes: 'Disfungsi ereksi dapat dipicu oleh stenosis mikroarteri pudenda.',
    isFree: false,
    pins: [
      { id: 'olp-1', title: 'Corpus Cavernosum', description: 'Jaringan erektil utama berongga yang terisi darah saat ereksi.', x: 50, y: 55 }
    ]
  },
  {
    id: 'organ-dalam-wanita',
    name: 'Organ Dalam',
    latinName: 'Organa Genitalia Feminina Interna',
    system: '8. Sistem Genitalia (Systema Genitali)',
    subSystem: '8.3 Sistem Reproduksi Feminina',
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
    description: 'Sistem reproduksi dalam wanita yang mencakup ovarium, tuba falopii, uterus, dan vagina.',
    functionMain: 'Oogenesis, ovulasi, fertilisasi oosit, dan kehamilan (gestasi) janin.',
    vascularization: 'Arteria uterina (cabang iliaca interna) dan arteria ovarica.',
    innervation: 'Plexus uterovaginalis otonom.',
    clinicalNotes: 'Mioma uteri adalah tumor jinak sel otot polos dinding miometrium uterus.',
    isFree: false,
    pins: [
      { id: 'odw-1', title: 'Uterus', description: 'Organ muskular berdinding endometrium penampung kehamilan.', x: 50, y: 50 },
      { id: 'odw-2', title: 'Ovarium', description: 'Kelenjar gonad wanita penghasil sel telur dan estrogen.', x: 38, y: 45 }
    ]
  },
  {
    id: 'organ-luar-mammae-wanita',
    name: 'Organ Luar & Mammae',
    latinName: 'Organa Genitalia Feminina Externa et Mamma',
    system: '8. Sistem Genitalia (Systema Genitali)',
    subSystem: '8.3 Sistem Reproduksi Feminina',
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
    description: 'Genitalia eksterna (vulva) dan payudara glandula mammae sebagai aparatus laktasi.',
    functionMain: 'Kopulasi luar, proteksi infeksi, serta sekresi nutrisi ASI laktasi.',
    vascularization: 'Arteria thoracica interna (mammae) dan arteria pudenda interna.',
    innervation: 'Saraf intercostalis T4 lateral (mammae) dan nervus pudendus.',
    clinicalNotes: 'Kanker payudara (adenokarsinoma) paling sering berawal di duktus laktiferus payudara.',
    isFree: false,
    pins: [
      { id: 'olw-1', title: 'Lobulus Mammae', description: 'Kelenjar alveoli penghasil ASI di payudara.', x: 48, y: 40 }
    ]
  },

  // ==========================================
  // 9. KELENJAR ENDOKRIN (GLANDULAE ENDOCRINAE)
  // ==========================================
  {
    id: 'organogenesis-endokrin',
    name: 'Organogenesis',
    latinName: 'Organogenesis Systematis Endokrin',
    system: '9. Kelenjar Endokrin (Glandulae Endocrinae)',
    subSystem: '9.1 Pengantar & Otak',
    imageUrl: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=1200&q=80',
    description: 'Proses diferensiasi ektoderm (hipofisis) dan endoderm (tiroid) membentuk kelenjar sekresi buntu.',
    functionMain: 'Pembentukan struktur pelindung fungsional hormon sirkulasi.',
    vascularization: 'Pleksus vaskular kapiler fenestrata.',
    innervation: 'Saraf otonom vasomotor kelenjar.',
    clinicalNotes: 'Kegagalan kantung Rathke migrasi memicu kista hipofisis kongenital.',
    isFree: false,
    pins: [
      { id: 'oen-1', title: 'Kantung Rathke', description: 'Ektoderm atap mulut embrio pembentuk lobus anterior hipofisis.', x: 50, y: 30 }
    ]
  },
  {
    id: 'hipotalamus-hipofisis-pineal',
    name: 'Hipotalamus, Hipofisis, Pineal',
    latinName: 'Hypothalamus, Hypophysis et Glandula Pinealis',
    system: '9. Kelenjar Endokrin (Glandulae Endocrinae)',
    subSystem: '9.1 Pengantar & Otak',
    imageUrl: 'https://images.unsplash.com/photo-1559757175-73677c29b50c?auto=format&fit=crop&w=1200&q=80',
    description: 'Kompleks kelenjar pengatur neuroendokrin utama di dasar otak tengah.',
    functionMain: 'Pusat integrasi umpan balik hormonal, pertumbuhan, sirkadian, dan metabolisme.',
    vascularization: 'Sistem porta hipofiseal.',
    innervation: 'Jalur traktus hipotalamohipofiseal saraf.',
    clinicalNotes: 'Adenoma hipofisis dapat menekan kiasma optikum, menyebabkan hemianopsia bitemporal (buta samping).',
    isFree: false,
    pins: [
      { id: 'hhp-1', title: 'Hipofisis (Kelenjar Pituitari)', description: 'Master gland pengendali hormon kelenjar perifer tubuh.', x: 48, y: 48 }
    ]
  },
  {
    id: 'tiroid-paratiroid',
    name: 'Tiroid & Paratiroid',
    latinName: 'Glandula Thyroidea et Parathyroidea',
    system: '9. Kelenjar Endokrin (Glandulae Endocrinae)',
    subSystem: '9.2 Leher & Abdomen',
    imageUrl: 'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?auto=format&fit=crop&w=1200&q=80',
    description: 'Kelenjar di leher depan pembentuk hormon tiroid dan pengatur homeostasis kalsium.',
    functionMain: 'Mengatur laju metabolisme basal tubuh dan kalsium darah.',
    vascularization: 'Arteria thyroidea superior dan inferior.',
    innervation: 'Ganglion servikal simpatis.',
    clinicalNotes: 'Penyakit Graves adalah autoimun hipertiroidisme yang ditandai mata menonjol (eksoftalmus).',
    isFree: false,
    pins: [
      { id: 'tpt-1', title: 'Glandula Thyroidea', description: 'Kelenjar dua lobus berbentuk kupu-kupu di depan trakea.', x: 50, y: 35 }
    ]
  },
  {
    id: 'pankreas-suprarenal',
    name: 'Pankreas & Suprarenal',
    latinName: 'Insulae Pancreaticae et Glandula Suprarenalis',
    system: '9. Kelenjar Endokrin (Glandulae Endocrinae)',
    subSystem: '9.2 Leher & Abdomen',
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
    description: 'Kelenjar insulin abdomen (pankreas) dan adrenal di atas kutub ginjal.',
    functionMain: 'Sekresi insulin, kortisol stres, aldosteron, dan adrenalin.',
    vascularization: 'Arteria suprarenalis superior, media, dan inferior.',
    innervation: 'Serabut simpatis preganglionik splanchnicus.',
    clinicalNotes: 'Kerusakan destruksi autoimun sel beta pankreas memicu Diabetes Mellitus tipe 1.',
    isFree: false,
    pins: [
      { id: 'pas-1', title: 'Glandula Suprarenalis', description: 'Kelenjar anak ginjal, pelepas kortisol dan aldosteron.', x: 48, y: 52 }
    ]
  },
  {
    id: 'ovarium-testis-endokrin',
    name: 'Ovarium & Testis',
    latinName: 'Gonades Endocrinae',
    system: '9. Kelenjar Endokrin (Glandulae Endocrinae)',
    subSystem: '9.3 Gonad & Thymus',
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
    description: 'Kelenjar seks penghasil hormon steroid progesteron, estrogen, dan testosteron.',
    functionMain: 'Memicu tanda perkembangan seks sekunder dan maturasi sel gamet.',
    vascularization: 'Arteria ovarica / testicularis.',
    innervation: 'Pleksus saraf gonad otonom.',
    clinicalNotes: 'Sindrom ovarium polikistik (PCOS) memicu anovulasi kronis dan hiperandrogenisme.',
    isFree: false,
    pins: [
      { id: 'ote-1', title: 'Folikel Ovarium', description: 'Pabrik penghasil hormon estrogen di ovarium.', x: 45, y: 55 }
    ]
  },
  {
    id: 'glandula-thymus',
    name: 'Thymus',
    latinName: 'Thymus',
    system: '9. Kelenjar Endokrin (Glandulae Endocrinae)',
    subSystem: '9.3 Gonad & Thymus',
    imageUrl: 'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?auto=format&fit=crop&w=1200&q=80',
    description: 'Kelenjar limfoid-endokrin di kavitas mediastinum superior anterior dada.',
    functionMain: 'Tempat diferensiasi maturasi sel T imun dan atrofi setelah pubertas.',
    vascularization: 'Arteria thoracica interna.',
    innervation: 'Saraf otonom simpatis.',
    clinicalNotes: 'Meskipun atrofi saat dewasa, tumor timus (timoma) dikaitkan erat dengan miastenia gravis.',
    isFree: false,
    pins: [
      { id: 'gty-1', title: 'Kortex Timus', description: 'Situs seleksi positif proliferasi sel limfosit T.', x: 50, y: 42 }
    ]
  },

  // ==========================================
  // 10. SISTEM LIMFatik (SYSTEMA LYMPHOIDEUM)
  // ==========================================
  {
    id: 'tonsil-thymus-limfa',
    name: 'Tonsil & Thymus',
    latinName: 'Tonsillae et Thymus',
    system: '10. Sistem Limfatik (Systema Lymphoideum)',
    subSystem: '10.1 Organ Limfoid Utama (RES)',
    imageUrl: 'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?auto=format&fit=crop&w=1200&q=80',
    description: 'Organ limfoid mukosa faring (cincin Waldeyer) dan timus mediastinal.',
    functionMain: 'Gerbang pertahanan imun udara-makanan awal dan edukasi sel T.',
    vascularization: 'Arteria tonsillaris cabang fasialis.',
    innervation: 'Nervus glossopharyngeus.',
    clinicalNotes: 'Tonsilitis kronis berulang membutuhkan tindakan bedah pengangkatan (tonsilektomi).',
    isFree: false,
    pins: [
      { id: 'ttl-1', title: 'Tonsila Palatina', description: 'Kelenjar tonsil di lateral orofaring.', x: 50, y: 40 }
    ]
  },
  {
    id: 'limfonodi-hepar-limfa',
    name: 'Limfonodi & Hepar',
    latinName: 'Nodi Lymphoidei et Hepar',
    system: '10. Sistem Limfatik (Systema Lymphoideum)',
    subSystem: '10.1 Organ Limfoid Utama (RES)',
    imageUrl: 'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?auto=format&fit=crop&w=1200&q=80',
    description: 'Stasiun penyaring limfe regional (limfonodi) dan sel Kupffer hati.',
    functionMain: 'Menyaring antigen patogen sirkulasi dan fagositosis eritrosit rusak.',
    vascularization: 'Arteria hepatica propria.',
    innervation: 'Pleksus hepatikus otonom.',
    clinicalNotes: 'Pembengkakan limfonodus leher (limfadenopati) merupakan penanda infeksi atau metastasis sel tumor.',
    isFree: false,
    pins: [
      { id: 'lhl-1', title: 'Limfonodus Sentinal', description: 'Stasiun kelenjar getah bening pertama penyaring tumor payudara.', x: 44, y: 48 }
    ]
  },
  {
    id: 'lien-sumsum-vena',
    name: 'Lien, Sumsum Tulang, Vena',
    latinName: 'Lien et Medulla Ossium',
    system: '10. Sistem Limfatik (Systema Lymphoideum)',
    subSystem: '10.1 Organ Limfoid Utama (RES)',
    imageUrl: 'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?auto=format&fit=crop&w=1200&q=80',
    description: 'Pusat imun hematopoietik (sumsum tulang) dan penyaring darah (limpa).',
    functionMain: 'Memproduksi seluruh sel darah somatik dan menyaring darah dari patogen.',
    vascularization: 'Arteria splenica.',
    innervation: 'Saraf otonom lienalis.',
    clinicalNotes: 'Kerusakan sumsum tulang akibat kemoterapi memicu pansitopenia (kurang seluruh sel darah).',
    isFree: false,
    pins: [
      { id: 'lsv-1', title: 'Pulpa Alba', description: 'Bagian limpa berisi sel limfosit untuk pertahanan imun darah.', x: 48, y: 55 }
    ]
  },

  // ==========================================
  // 11. SISTEM MUSKULOSKELETAL
  // ==========================================
  {
    id: 'sub-disiplin-ilmu-muskulo',
    name: 'Sub-Disiplin Ilmu',
    latinName: 'Introductio Muskuloskeletal',
    system: '11. Sistem Muskuloskeletal',
    subSystem: '11.1 Sub-Disiplin & Konsep Dasar',
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
    description: 'Prinsip kinesiologi, sendi, tendon, ligamen, serta pertumbuhan skeletal normal.',
    functionMain: 'Mendasari studi mekanika gerakan tubuh sadar manusia.',
    vascularization: 'Sistem arteri nutrisional perifer.',
    innervation: 'Saraf motorik motor end plate.',
    clinicalNotes: 'Cedera tendon achilles membatasi dorsofleksi kaki bawah secara fatal.',
    isFree: false,
    pins: [
      { id: 'sdm-1', title: 'Cartilago Articularis', description: 'Tulang rawan pelapis ujung persendian peredam gesekan.', x: 50, y: 50 }
    ]
  },
  {
    id: 'bagian-tulang-aksial',
    name: 'Bagian Tulang & Aksial',
    latinName: 'Osteologia Axialis',
    system: '11. Sistem Muskuloskeletal',
    subSystem: '11.2 Osteologi & Articulatio',
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
    description: 'Kerangka aksial tubuh termasuk kolumna vertebralis, kranium, dan tulang iga.',
    functionMain: 'Melindungi susunan saraf pusat dan membentuk struktur postur tubuh tegak.',
    vascularization: 'Arteri spinalis segmental.',
    innervation: 'Cabang meningeal spinalis.',
    clinicalNotes: 'Skoliosis adalah pembengkokan patologis lateral tulang belakang melebihi 10 derajat.',
    isFree: false,
    pins: [
      { id: 'bta-1', title: 'Discus Intervertebralis', description: 'Bantalan rawan fibrosa elastis sela vertebra.', x: 50, y: 55 }
    ]
  },
  {
    id: 'membri-superior',
    name: 'Membri Superior',
    latinName: 'Articulatio Membri Superioris',
    system: '11. Sistem Muskuloskeletal',
    subSystem: '11.2 Osteologi & Articulatio',
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
    description: 'Tulang dan persendian ekstremitas atas (bahu, siku, pergelangan tangan).',
    functionMain: 'Memfasilitasi pergerakan manipulatif luas lengan atas dan manus.',
    vascularization: 'Arteria axillaris, radialis, dan ulnaris.',
    innervation: 'Plexus brachialis (N. radialis, medianus, ulnaris).',
    clinicalNotes: 'Dislokasi sendi bahu sering bergeser ke arah anterior akibat cedera abduksi rotasi luar.',
    isFree: false,
    pins: [
      { id: 'msu-1', title: 'Articulatio Humeri', description: 'Sendi peluru bahu berdaya gerak bebas terluas.', x: 45, y: 40 }
    ]
  },
  {
    id: 'membri-inferior',
    name: 'Membri Inferior',
    latinName: 'Articulatio Membri Inferioris',
    system: '11. Sistem Muskuloskeletal',
    subSystem: '11.2 Osteologi & Articulatio',
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
    description: 'Tulang dan sendi penyokong ekstremitas bawah termasuk artikulasio coxae dan sendi lutut.',
    functionMain: 'Mendukung tegak beban aksial tubuh dan pemindahan gerakan lokomotif.',
    vascularization: 'Arteria femoralis dan poplitea.',
    innervation: 'Nervus ischiadicus dan femoralis.',
    clinicalNotes: 'Cedera robekan Anterior Cruciate Ligament (ACL) sangat sering terjadi pada atlet lutut.',
    isFree: false,
    pins: [
      { id: 'min-1', title: 'Anterior Cruciate Ligament', description: 'Ligamen penahan pergeseran anterior tibia terhadap femur.', x: 48, y: 48 },
      { id: 'min-2', title: 'Meniscus Medialis', description: 'Cincin rawan fibrosa C peredam benturan lutut.', x: 52, y: 58 }
    ]
  },
  {
    id: 'otot-kepala-wajah-leher',
    name: 'Otot Kepala, Wajah, Leher',
    latinName: 'Musculi Capitis, Faciei et Colli',
    system: '11. Sistem Muskuloskeletal',
    subSystem: '11.3 Miologi (Otot Rangka)',
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
    description: 'Otot ekspresi wajah, otot pengunyah mastikasi, dan otot leher anterior/posterior.',
    functionMain: 'Mengekspresikan emosi wajah, mengunyah, serta memutar kepala.',
    vascularization: 'Arteria facialis dan carotis externa.',
    innervation: 'Nervus Facialis (VII) ekspresi, N. Trigeminal (V3) mastikasi.',
    clinicalNotes: 'Kelumpuhan akut unilateral Nervus Facialis memicu wajah asimetris (Bell’s Palsy).',
    isFree: false,
    pins: [
      { id: 'okw-1', title: 'Musculus Masseter', description: 'Otot pengunyah terkuat penutup mandibula rahang.', x: 50, y: 45 }
    ]
  },
  {
    id: 'otot-batang-tubuh',
    name: 'Otot Batang Tubuh',
    latinName: 'Musculi Trunci',
    system: '11. Sistem Muskuloskeletal',
    subSystem: '11.3 Miologi (Otot Rangka)',
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
    description: 'Otot dinding dada (pektoralis), otot perut (rektus abdominis), dan otot punggung erektor.',
    functionMain: 'Menjaga kestabilan postur tubuh aksial dan memutar pinggang.',
    vascularization: 'Arteri segmental intercostal.',
    innervation: 'Saraf spinal segmentalis.',
    clinicalNotes: 'Robekan fasia m. rectus abdominis menimbulkan pemisahan garis tengah (diastasis recti).',
    isFree: false,
    pins: [
      { id: 'obt-1', title: 'Musculus Rectus Abdominis', description: 'Otot perut memanjang penunjang fleksi lumbal.', x: 50, y: 55 }
    ]
  },
  {
    id: 'otot-ekstremitas',
    name: 'Otot Ekstremitas',
    latinName: 'Musculi Membrorum',
    system: '11. Sistem Muskuloskeletal',
    subSystem: '11.3 Miologi (Otot Rangka)',
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
    description: 'Struktur otot rangka penggerak lengan (biceps, triceps) dan tungkai bawah (quadriceps, gluteus).',
    functionMain: 'Melakukan fleksi, ekstensi, abduksi, rotasi ekstremitas gerak.',
    vascularization: 'Kapiler segmental pembuluh darah nutrisional otot.',
    innervation: 'Saraf motorik somatik aferen korda spinalis.',
    clinicalNotes: 'Atrofi otot terjadi sangat cepat pada pasien tirah baring lama tanpa rehabilitasi.',
    isFree: false,
    pins: [
      { id: 'oek-1', title: 'Musculus Biceps Brachii', description: 'Otot fleksor lengan atas penarik sendi siku.', x: 45, y: 42 }
    ]
  },

  // ==========================================
  // 12. FORENSIK DAN MEDIKOLEGAL
  // ==========================================
  {
    id: 'penerapan-kedokteran-kehakiman',
    name: 'Penerapan Kedokteran Kehakiman',
    latinName: 'Anatomia Forensis et Medicolegalis',
    system: '12. Forensik dan Medikolegal',
    subSystem: '12.1 Forensik Anatomi',
    imageUrl: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=1200&q=80',
    description: 'Aplikasi ilmu antropologi fisik tulang dan thanatologi lebam mayat untuk kepentingan peradilan hukum.',
    functionMain: 'Membantu perkiraan waktu kematian (postmortem interval), jenis kelamin biologis, dan tinggi badan skeletal.',
    vascularization: 'Tidak berlaku langsung (Identifikasi pascamatis).',
    innervation: 'Tidak berlaku langsung.',
    clinicalNotes: 'Tulang panggul (pelvis) adalah bagian skeletal terakurat membedakan jenis kelamin pria vs wanita.',
    isFree: false,
    pins: [
      { id: 'pkk-1', title: 'Angulus Subpubicus Pelvis', description: 'Sudut lebar (>90 derajat) menunjukkan wanita biologis, sempit (<70 derajat) menunjukkan pria.', x: 50, y: 65 },
      { id: 'pkk-2', title: 'Livor Mortis (Lebam Mayat)', description: 'Pengendapan darah di area terendah jenazah akibat gravitasi pasif.', x: 50, y: 25 }
    ]
  }
];
