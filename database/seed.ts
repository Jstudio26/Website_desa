import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import { eq } from 'drizzle-orm'
import postgres from 'postgres'
import bcrypt from 'bcryptjs'
import * as schema from './schema'
import {
  DEFAULT_FEATURES,
  DEFAULT_FOOTER,
  DEFAULT_MENU,
  DEFAULT_THEME,
  DEFAULT_VILLAGE,
} from '../config/defaults'

const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL is not set')
const client = postgres(url, { max: 1 })
const db = drizzle(client, { schema })

const slugify = (s: string) =>
  s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

async function seedAdmin() {
  const email = (process.env.SEED_ADMIN_EMAIL || 'admin@desa.local').toLowerCase()
  const existing = await db.query.users.findFirst({ where: eq(schema.users.email, email) })
  if (existing) {
    console.log(`  · admin ${email} already exists — skipped`)
    return
  }
  const passwordHash = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD || 'admin12345', 11)
  await db.insert(schema.users).values({
    name: process.env.SEED_ADMIN_NAME || 'Administrator Desa',
    email,
    passwordHash,
    role: 'SUPER_ADMIN',
    isActive: true,
  })
  console.log(`  ✔ super admin created: ${email} / ${process.env.SEED_ADMIN_PASSWORD || 'admin12345'}`)
}

async function seedSettings() {
  await db.insert(schema.villageSettings).values({ key: 'default', data: DEFAULT_VILLAGE }).onConflictDoNothing()
  await db.insert(schema.themeSettings).values({ key: 'default', data: DEFAULT_THEME }).onConflictDoNothing()
  await db.insert(schema.featureFlags).values({ key: 'default', data: DEFAULT_FEATURES }).onConflictDoNothing()
  await db.insert(schema.footerSettings).values({ key: 'default', data: DEFAULT_FOOTER }).onConflictDoNothing()
  console.log('  ✔ village / theme / features / footer settings')
}

async function seedMenus() {
  const existing = await db.query.menus.findFirst({ where: eq(schema.menus.location, 'primary') })
  if (existing) {
    console.log('  · menus already exist — skipped')
    return
  }
  const [primary] = await db
    .insert(schema.menus)
    .values({ name: 'Menu Utama', location: 'primary' })
    .returning()

  let order = 0
  for (const item of DEFAULT_MENU) {
    const [parent] = await db
      .insert(schema.menuItems)
      .values({ menuId: primary!.id, label: item.label, url: item.url, order: order++ })
      .returning()
    let childOrder = 0
    for (const child of item.children ?? []) {
      await db.insert(schema.menuItems).values({
        menuId: primary!.id,
        parentId: parent!.id,
        label: child.label,
        url: child.url,
        order: childOrder++,
      })
    }
  }

  const [footerMenu] = await db
    .insert(schema.menus)
    .values({ name: 'Menu Footer', location: 'footer' })
    .returning()
  const footerLinks = [
    { label: 'Profil Desa', url: '/profil' },
    { label: 'Pemerintahan', url: '/pemerintahan' },
    { label: 'Berita', url: '/berita' },
    { label: 'Layanan', url: '/layanan' },
    { label: 'Kontak', url: '/kontak' },
  ]
  let fo = 0
  for (const l of footerLinks) {
    await db.insert(schema.menuItems).values({ menuId: footerMenu!.id, label: l.label, url: l.url, order: fo++ })
  }

  const [utility] = await db
    .insert(schema.menus)
    .values({ name: 'Menu Utility', location: 'utility' })
    .returning()
  await db.insert(schema.menuItems).values([
    { menuId: utility!.id, label: 'Transparansi', url: '/transparansi', order: 0 },
    { menuId: utility!.id, label: 'PPID', url: '/ppid', order: 1 },
  ])
  console.log('  ✔ primary / footer / utility menus')
}

async function seedNews() {
  const count = await db.query.news.findMany({ limit: 1 })
  if (count.length) {
    console.log('  · news already exist — skipped')
    return
  }
  const cats = await db
    .insert(schema.newsCategories)
    .values([
      { name: 'Pembangunan', slug: 'pembangunan', color: '#0e7490' },
      { name: 'Kegiatan', slug: 'kegiatan', color: '#15803d' },
      { name: 'Pengumuman', slug: 'pengumuman-berita', color: '#b45309' },
    ])
    .returning()

  const admin = await db.query.users.findFirst()
  const now = Date.now()
  const samples = [
    ['Musyawarah Desa Bahas Rencana Pembangunan Tahun Anggaran Baru', 'Pemerintah desa menggelar musyawarah bersama BPD dan tokoh masyarakat untuk menyusun prioritas pembangunan.', 0],
    ['Gotong Royong Bersihkan Saluran Irigasi Menyambut Musim Tanam', 'Warga bersama perangkat desa turun ke lapangan membersihkan saluran irigasi utama.', 1],
    ['Posyandu Balita dan Lansia Rutin Digelar Setiap Bulan', 'Layanan kesehatan dasar terus ditingkatkan melalui kegiatan posyandu di setiap dusun.', 1],
    ['Pelatihan Digital Marketing untuk Pelaku UMKM Desa', 'Puluhan pelaku usaha mikro mengikuti pelatihan pemasaran digital yang difasilitasi tim KKT.', 0],
    ['Penyaluran Bantuan Langsung Tunai Dana Desa Tahap Ini', 'Penyaluran BLT-DD dilakukan secara transparan dan tepat sasaran kepada keluarga penerima manfaat.', 2],
  ] as const

  await db.insert(schema.news).values(
    samples.map(([title, excerpt, ci], i) => ({
      title,
      slug: slugify(title),
      excerpt,
      content: `<p>${excerpt}</p><p>Konten lengkap berita dapat disunting melalui menu <strong>Admin → Berita</strong>. Teks ini hanya contoh data awal (seed) untuk menampilkan tata letak halaman berita.</p>`,
      categoryId: cats[ci % cats.length]!.id,
      authorId: admin?.id ?? null,
      status: 'published' as const,
      isFeatured: i === 0,
      featuredImage: `https://picsum.photos/seed/desa-news-${i}/1200/800`,
      publishedAt: new Date(now - i * 86400_000 * 2),
    })),
  )
  console.log('  ✔ 3 categories + 5 news articles')
}

async function seedAnnouncementsEvents() {
  if ((await db.query.announcements.findMany({ limit: 1 })).length === 0) {
    await db.insert(schema.announcements).values([
      {
        title: 'Jadwal Pelayanan Administrasi Kantor Desa',
        slug: 'jadwal-pelayanan-administrasi',
        content: '<p>Pelayanan administrasi kependudukan dibuka Senin–Jumat pukul 08.00–15.00 WITA.</p>',
        isPinned: true,
        status: 'published',
        publishedAt: new Date(),
      },
      {
        title: 'Pemadaman Listrik Terjadwal di Wilayah Dusun Tertentu',
        slug: 'pemadaman-listrik-terjadwal',
        content: '<p>Akan dilakukan pemeliharaan jaringan listrik. Mohon persiapan warga.</p>',
        status: 'published',
        publishedAt: new Date(),
        expiresAt: new Date(Date.now() + 14 * 86400_000),
      },
    ])
    console.log('  ✔ 2 announcements')
  }

  if ((await db.query.events.findMany({ limit: 1 })).length === 0) {
    const base = Date.now()
    await db.insert(schema.events).values([
      {
        title: 'Rapat Koordinasi Perangkat Desa',
        slug: 'rapat-koordinasi-perangkat-desa',
        description: 'Evaluasi program bulanan bersama seluruh perangkat desa.',
        location: 'Aula Kantor Desa',
        startAt: new Date(base + 3 * 86400_000),
        endAt: new Date(base + 3 * 86400_000 + 7200_000),
        status: 'published',
      },
      {
        title: 'Kerja Bakti Bersih Desa',
        slug: 'kerja-bakti-bersih-desa',
        description: 'Kegiatan gotong royong bersama seluruh warga.',
        location: 'Balai Dusun',
        startAt: new Date(base + 10 * 86400_000),
        status: 'published',
      },
    ])
    console.log('  ✔ 2 events')
  }
}

async function seedGovernment() {
  if ((await db.query.governmentOfficials.findMany({ limit: 1 })).length) return
  await db.insert(schema.governmentOfficials).values([
    { name: 'Nama Kepala Desa', position: 'Kepala Desa', group: 'kepala_desa', displayOrder: 0, bio: 'Sambutan dan visi kepemimpinan dapat disunting melalui Admin → Pemerintahan.', photo: 'https://picsum.photos/seed/kades/600/700' },
    { name: 'Nama Sekretaris Desa', position: 'Sekretaris Desa', group: 'sekretariat', displayOrder: 1, photo: 'https://picsum.photos/seed/sekdes/600/700' },
    { name: 'Nama Kaur Keuangan', position: 'Kepala Urusan Keuangan', group: 'kepala_urusan', displayOrder: 2 },
    { name: 'Nama Kasi Pemerintahan', position: 'Kepala Seksi Pemerintahan', group: 'kepala_seksi', displayOrder: 3 },
    { name: 'Nama Kepala Dusun I', position: 'Kepala Dusun I', group: 'kepala_dusun', displayOrder: 4 },
    { name: 'Nama Ketua BPD', position: 'Ketua BPD', group: 'bpd', displayOrder: 5 },
  ])
  console.log('  ✔ 6 government officials')
}

async function seedStatistics() {
  if ((await db.query.statisticGroups.findMany({ limit: 1 })).length) return
  const [penduduk] = await db
    .insert(schema.statisticGroups)
    .values({ title: 'Kependudukan', slug: 'kependudukan', chartType: 'pie', unit: 'jiwa', displayOrder: 0 })
    .returning()
  await db.insert(schema.villageStatistics).values([
    { groupId: penduduk!.id, label: 'Laki-laki', value: '2680', color: '#0e7490', displayOrder: 0 },
    { groupId: penduduk!.id, label: 'Perempuan', value: '2741', color: '#be185d', displayOrder: 1 },
  ])
  const [pendidikan] = await db
    .insert(schema.statisticGroups)
    .values({ title: 'Tingkat Pendidikan', slug: 'tingkat-pendidikan', chartType: 'bar', unit: 'orang', displayOrder: 1 })
    .returning()
  await db.insert(schema.villageStatistics).values([
    { groupId: pendidikan!.id, label: 'SD', value: '1200', displayOrder: 0 },
    { groupId: pendidikan!.id, label: 'SMP', value: '980', displayOrder: 1 },
    { groupId: pendidikan!.id, label: 'SMA', value: '870', displayOrder: 2 },
    { groupId: pendidikan!.id, label: 'Diploma/Sarjana', value: '410', displayOrder: 3 },
  ])
  console.log('  ✔ 2 statistic groups')
}

async function seedPotential() {
  if ((await db.query.umkm.findMany({ limit: 1 })).length === 0) {
    await db.insert(schema.umkm).values([
      { name: 'Kopi Rakyat Desa', slug: 'kopi-rakyat-desa', category: 'kuliner', owner: 'Kelompok Tani Kopi', description: 'Kopi robusta olahan petani lokal dengan proses natural.', image: 'https://picsum.photos/seed/umkm-kopi/800/600', isFeatured: true },
      { name: 'Anyaman Bambu Kreatif', slug: 'anyaman-bambu-kreatif', category: 'kerajinan', owner: 'Sanggar Bambu', description: 'Produk kerajinan bambu ramah lingkungan.', image: 'https://picsum.photos/seed/umkm-bambu/800/600' },
      { name: 'Keripik Pisang Aneka Rasa', slug: 'keripik-pisang-aneka-rasa', category: 'kuliner', owner: 'PKK Desa', description: 'Camilan khas dengan berbagai varian rasa.', image: 'https://picsum.photos/seed/umkm-keripik/800/600' },
    ])
    console.log('  ✔ 3 UMKM')
  }
  if ((await db.query.tourism.findMany({ limit: 1 })).length === 0) {
    await db.insert(schema.tourism).values([
      { name: 'Air Terjun Desa', slug: 'air-terjun-desa', category: 'alam', location: 'Dusun Hulu', description: 'Air terjun bertingkat dengan kolam alami yang jernih.', coverImage: 'https://picsum.photos/seed/wisata-airterjun/1200/800', openingHours: '08.00 - 17.00', isFeatured: true },
      { name: 'Bukit Panorama', slug: 'bukit-panorama', category: 'alam', location: 'Dusun Puncak', description: 'Spot terbaik menikmati matahari terbit.', coverImage: 'https://picsum.photos/seed/wisata-bukit/1200/800' },
      { name: 'Sanggar Budaya', slug: 'sanggar-budaya', category: 'budaya', location: 'Pusat Desa', description: 'Pertunjukan tari dan musik tradisional setiap akhir pekan.', coverImage: 'https://picsum.photos/seed/wisata-budaya/1200/800' },
    ])
    console.log('  ✔ 3 destinasi wisata')
  }
}

async function seedGallery() {
  if ((await db.query.galleries.findMany({ limit: 1 })).length) return
  const [g] = await db
    .insert(schema.galleries)
    .values({ title: 'Kehidupan Desa', slug: 'kehidupan-desa', description: 'Dokumentasi kegiatan dan panorama desa.', coverImage: 'https://picsum.photos/seed/galeri-cover/1200/800' })
    .returning()
  await db.insert(schema.galleryItems).values(
    Array.from({ length: 8 }).map((_, i) => ({
      galleryId: g!.id,
      imageUrl: `https://picsum.photos/seed/galeri-${i}/900/${i % 2 ? 1200 : 700}`,
      caption: `Dokumentasi ${i + 1}`,
      displayOrder: i,
    })),
  )
  console.log('  ✔ gallery with 8 photos')
}

async function seedServices() {
  if ((await db.query.services.findMany({ limit: 1 })).length) return
  await db.insert(schema.services).values([
    {
      name: 'Surat Keterangan Domisili', slug: 'surat-keterangan-domisili', icon: 'home',
      description: 'Surat keterangan tempat tinggal bagi warga desa.',
      requirements: ['Fotokopi KTP', 'Fotokopi Kartu Keluarga', 'Surat pengantar RT/RW'],
      formSchema: [
        { name: 'nama', label: 'Nama Lengkap', type: 'text', required: true },
        { name: 'nik', label: 'NIK', type: 'text', required: true },
        { name: 'alamat', label: 'Alamat Lengkap', type: 'textarea', required: true },
        { name: 'keperluan', label: 'Keperluan', type: 'text', required: true },
      ],
      estimatedDays: 2, displayOrder: 0,
    },
    {
      name: 'Surat Keterangan Usaha', slug: 'surat-keterangan-usaha', icon: 'store',
      description: 'Surat keterangan untuk keperluan perizinan dan permodalan usaha.',
      requirements: ['Fotokopi KTP', 'Fotokopi KK', 'Foto lokasi usaha'],
      formSchema: [
        { name: 'nama', label: 'Nama Pemilik', type: 'text', required: true },
        { name: 'nama_usaha', label: 'Nama Usaha', type: 'text', required: true },
        { name: 'jenis_usaha', label: 'Jenis Usaha', type: 'text', required: true },
        { name: 'alamat_usaha', label: 'Alamat Usaha', type: 'textarea', required: true },
      ],
      estimatedDays: 3, displayOrder: 1,
    },
    {
      name: 'Surat Pengantar SKCK', slug: 'surat-pengantar-skck', icon: 'shield',
      description: 'Surat pengantar dari desa untuk pengurusan SKCK di kepolisian.',
      requirements: ['Fotokopi KTP', 'Fotokopi KK', 'Pas foto 4x6'],
      formSchema: [
        { name: 'nama', label: 'Nama Lengkap', type: 'text', required: true },
        { name: 'nik', label: 'NIK', type: 'text', required: true },
        { name: 'keperluan', label: 'Keperluan', type: 'text', required: true },
      ],
      estimatedDays: 1, displayOrder: 2,
    },
  ])
  console.log('  ✔ 3 digital services')
}

async function seedDocuments() {
  if ((await db.query.documents.findMany({ limit: 1 })).length) return
  const year = new Date().getFullYear()
  await db.insert(schema.documents).values([
    { title: `APBDes ${year}`, category: 'apbdes', year, fileUrl: '#', fileType: 'pdf', description: 'Anggaran Pendapatan dan Belanja Desa.' },
    { title: `Laporan Realisasi Anggaran ${year - 1}`, category: 'realisasi', year: year - 1, fileUrl: '#', fileType: 'pdf' },
    { title: `Peraturan Desa tentang RKPDes ${year}`, category: 'perdes', year, fileUrl: '#', fileType: 'pdf' },
  ])
  console.log('  ✔ 3 transparency documents')
}

async function seedPages() {
  const { defaultSectionSettings } = await import('../shared/types/sections')
  const mk = (over: Record<string, unknown> = {}) => ({ ...defaultSectionSettings(), ...over })

  if (!(await db.query.pages.findFirst({ where: eq(schema.pages.slug, 'home') }))) {
    const [home] = await db
      .insert(schema.pages)
      .values({ title: 'Beranda', slug: 'home', status: 'published', isSystem: true, publishedAt: new Date().toISOString() })
      .returning()
    await db.insert(schema.pageSections).values([
      { pageId: home!.id, type: 'hero', order: 0, data: { title: 'Selamat Datang di {village}', subtitle: '{tagline}', image: 'https://picsum.photos/seed/desa-hero/1920/1080', ctas: [{ label: 'Jelajahi Desa', url: '/profil' }, { label: 'Layanan Digital', url: '/layanan' }] }, settings: mk({ container: 'full', spacing: 'none' }) },
      { pageId: home!.id, type: 'statistics', order: 1, data: { title: 'Desa dalam Angka' }, settings: mk({ backgroundType: 'pattern' }) },
      { pageId: home!.id, type: 'imageQuote', order: 2, data: { source: 'headman' }, settings: mk({ backgroundType: 'solid', backgroundColor: '#f6f6f4' }) },
      { pageId: home!.id, type: 'featuredNews', order: 3, data: { title: 'Berita Terbaru', limit: 7 }, settings: mk() },
      { pageId: home!.id, type: 'tourismShowcase', order: 4, data: { title: 'Potensi & Destinasi' }, settings: mk({ backgroundType: 'dark' }) },
      { pageId: home!.id, type: 'umkm', order: 5, data: { title: 'UMKM Desa' }, settings: mk() },
      { pageId: home!.id, type: 'events', order: 6, data: { title: 'Agenda Desa' }, settings: mk({ backgroundType: 'solid', backgroundColor: '#f6f6f4' }) },
      { pageId: home!.id, type: 'masonryGallery', order: 7, data: { title: 'Galeri Kehidupan Desa' }, settings: mk() },
      { pageId: home!.id, type: 'cta', order: 8, data: { title: 'Butuh Layanan Administrasi?', text: 'Akses layanan desa secara digital, tanpa antre.', ctaLabel: 'Lihat Layanan', ctaUrl: '/layanan' }, settings: mk({ backgroundType: 'gradient' }) },
    ])
    console.log('  ✔ system page: home (9 sections)')
  }

  if (!(await db.query.pages.findFirst({ where: eq(schema.pages.slug, 'about-developer') }))) {
    const [dev] = await db
      .insert(schema.pages)
      .values({ title: 'Tim Pengembang', slug: 'about-developer', status: 'published', isSystem: true, seoTitle: 'Tim Pengembang — KKT', publishedAt: new Date().toISOString() })
      .returning()
    await db.insert(schema.pageSections).values([
      { pageId: dev!.id, type: 'kktTeam', order: 0, data: {}, settings: mk({ container: 'wide' }) },
    ])
    console.log('  ✔ system page: about-developer')
  }
}

async function seedKkt() {
  await db
    .insert(schema.kktSettings)
    .values({
      key: 'default',
      programName: 'Kuliah Kerja Terpadu (KKT)',
      universityName: 'Universitas',
      facultyName: '',
      year: String(new Date().getFullYear()),
      period: 'Semester Ganjil',
      postName: 'Posko KKT',
      location: 'Desa',
      villageName: DEFAULT_VILLAGE.villageName,
      description:
        'Website Sistem Informasi Desa ini dikembangkan sebagai bagian dari Program Kerja Kuliah Kerja Terpadu (KKT).',
      footerCredit: 'Dikembangkan dalam rangka Program Kerja Kuliah Kerja Terpadu (KKT).',
      heroImage: 'https://picsum.photos/seed/kkt-hero/1600/900',
    })
    .onConflictDoNothing()

  if ((await db.query.kktFields.findMany({ limit: 1 })).length === 0) {
    const fields = await db
      .insert(schema.kktFields)
      .values([
        { name: 'Bidang Teknologi dan Informasi', slug: 'teknologi-informasi', description: 'Bertanggung jawab terhadap pengembangan teknologi dan digitalisasi program kerja.', displayOrder: 0 },
        { name: 'Bidang Pendidikan', slug: 'pendidikan', description: 'Program peningkatan mutu pendidikan dan literasi masyarakat.', displayOrder: 1 },
        { name: 'Bidang Kesehatan', slug: 'kesehatan', description: 'Program promotif dan preventif kesehatan masyarakat desa.', displayOrder: 2 },
        { name: 'Bidang Lingkungan', slug: 'lingkungan', description: 'Program pelestarian lingkungan dan pengelolaan sampah.', displayOrder: 3 },
      ])
      .returning()

    await db.insert(schema.kktMembers).values([
      { name: 'Nama Koordinator Posko', role: 'KOORDINATOR', position: 'Koordinator Posko', displayOrder: 0, photo: 'https://i.pravatar.cc/400?img=12' },
      { name: 'Nama Sekretaris Posko', role: 'SEKRETARIS', position: 'Sekretaris Posko', displayOrder: 1, photo: 'https://i.pravatar.cc/400?img=45' },
      { name: 'Nama Bendahara Posko', role: 'BENDAHARA', position: 'Bendahara Posko', displayOrder: 2, photo: 'https://i.pravatar.cc/400?img=32' },
      { name: 'Anggota TI 1', role: 'ANGGOTA', fieldId: fields[0]!.id, displayOrder: 0, photo: 'https://i.pravatar.cc/400?img=5' },
      { name: 'Anggota TI 2', role: 'ANGGOTA', fieldId: fields[0]!.id, displayOrder: 1, photo: 'https://i.pravatar.cc/400?img=8' },
      { name: 'Anggota Pendidikan 1', role: 'ANGGOTA', fieldId: fields[1]!.id, displayOrder: 0, photo: 'https://i.pravatar.cc/400?img=15' },
      { name: 'Anggota Pendidikan 2', role: 'ANGGOTA', fieldId: fields[1]!.id, displayOrder: 1, photo: 'https://i.pravatar.cc/400?img=23' },
      { name: 'Anggota Kesehatan 1', role: 'ANGGOTA', fieldId: fields[2]!.id, displayOrder: 0, photo: 'https://i.pravatar.cc/400?img=41' },
      { name: 'Anggota Lingkungan 1', role: 'ANGGOTA', fieldId: fields[3]!.id, displayOrder: 0, photo: 'https://i.pravatar.cc/400?img=51' },
    ])
    console.log('  ✔ KKT: settings + 4 fields + 9 members')
  }
}

async function main() {
  console.log('▶ Seeding database...\n')
  await seedAdmin()
  await seedSettings()
  await seedMenus()
  await seedNews()
  await seedAnnouncementsEvents()
  await seedGovernment()
  await seedStatistics()
  await seedPotential()
  await seedGallery()
  await seedServices()
  await seedDocuments()
  await seedPages()
  await seedKkt()
  console.log('\n✔ Seed complete.')
  await client.end()
}

main().catch(async (err) => {
  console.error('\n✖ Seed failed:', err)
  await client.end()
  process.exit(1)
})
