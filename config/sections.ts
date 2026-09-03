import type { SectionMeta, SectionType } from '../shared/types/sections'

/**
 * Registry that powers the Page Builder palette (Admin) and the section
 * renderer (Public). Adding a section = add an entry here + a component in
 * app/components/sections/<Type>.vue. Nothing else to wire.
 */
export const SECTION_REGISTRY: Record<SectionType, SectionMeta> = {
  hero: { type: 'hero', label: 'Hero Immersive', group: 'Hero', icon: 'photo', description: 'Gambar layar penuh, judul besar, tombol CTA, indikator scroll.' },
  heroSlider: { type: 'heroSlider', label: 'Hero Slider', group: 'Hero', icon: 'images', description: 'Beberapa slide gambar bergantian dengan teks.' },
  videoHero: { type: 'videoHero', label: 'Hero Video', group: 'Hero', icon: 'video', description: 'Video latar dengan overlay dan judul.' },
  text: { type: 'text', label: 'Teks', group: 'Konten', icon: 'text', description: 'Blok teks kaya (heading + paragraf + list).' },
  editorial: { type: 'editorial', label: 'Editorial', group: 'Konten', icon: 'layout', description: 'Layout majalah: gambar besar + teks mengalir.' },
  asymmetric: { type: 'asymmetric', label: 'Konten Asimetris', group: 'Konten', icon: 'columns', description: 'Grid tidak simetris gambar + teks.' },
  splitScreen: { type: 'splitScreen', label: 'Split Screen', group: 'Konten', icon: 'split', description: 'Dua panel 50/50, gambar & konten.' },
  image: { type: 'image', label: 'Gambar', group: 'Media', icon: 'image', description: 'Satu gambar dengan caption opsional.' },
  fullWidthImage: { type: 'fullWidthImage', label: 'Gambar Full Width', group: 'Media', icon: 'panorama', description: 'Gambar selebar layar, efek parallax opsional.' },
  imageGallery: { type: 'imageGallery', label: 'Galeri Gambar', group: 'Media', icon: 'grid', description: 'Grid galeri dengan lightbox.' },
  bentoGrid: { type: 'bentoGrid', label: 'Bento Grid', group: 'Media', icon: 'bento', description: 'Grid bento ukuran campuran.' },
  masonryGallery: { type: 'masonryGallery', label: 'Galeri Masonry', group: 'Media', icon: 'masonry', description: 'Galeri masonry tinggi bervariasi.' },
  statistics: { type: 'statistics', label: 'Statistik', group: 'Data Desa', icon: 'chart', description: 'Kartu angka statistik desa.' },
  statisticsShowcase: { type: 'statisticsShowcase', label: 'Statistik Showcase', group: 'Data Desa', icon: 'chart-big', description: 'Angka besar + animated counter + pola latar.' },
  featureCards: { type: 'featureCards', label: 'Kartu Fitur', group: 'Konten', icon: 'cards', description: 'Kartu ikon + judul + deskripsi.' },
  news: { type: 'news', label: 'Berita', group: 'Konten', icon: 'news', description: 'Daftar berita terbaru.' },
  featuredNews: { type: 'featuredNews', label: 'Berita Editorial', group: 'Konten', icon: 'news-star', description: '1 berita unggulan besar + grid berita.' },
  announcements: { type: 'announcements', label: 'Pengumuman', group: 'Konten', icon: 'megaphone', description: 'Daftar pengumuman aktif.' },
  events: { type: 'events', label: 'Agenda', group: 'Konten', icon: 'calendar', description: 'Agenda / kegiatan desa mendatang.' },
  timeline: { type: 'timeline', label: 'Timeline', group: 'Konten', icon: 'timeline', description: 'Rangkaian peristiwa berurutan.' },
  officials: { type: 'officials', label: 'Perangkat Desa', group: 'Data Desa', icon: 'users', description: 'Struktur & foto perangkat desa.' },
  tourism: { type: 'tourism', label: 'Wisata', group: 'Potensi', icon: 'mountain', description: 'Kartu destinasi wisata.' },
  tourismShowcase: { type: 'tourismShowcase', label: 'Wisata Showcase', group: 'Potensi', icon: 'mountain-big', description: 'Kartu visual besar + horizontal scroll.' },
  umkm: { type: 'umkm', label: 'UMKM', group: 'Potensi', icon: 'store', description: 'Kartu UMKM & produk lokal.' },
  culturalShowcase: { type: 'culturalShowcase', label: 'Budaya', group: 'Potensi', icon: 'temple', description: 'Sorotan budaya & identitas lokal.' },
  video: { type: 'video', label: 'Video', group: 'Media', icon: 'video', description: 'Embed video (YouTube/MP4).' },
  imageQuote: { type: 'imageQuote', label: 'Gambar + Kutipan', group: 'Konten', icon: 'quote', description: 'Kutipan besar dengan gambar pendamping.' },
  faq: { type: 'faq', label: 'FAQ', group: 'Interaksi', icon: 'question', description: 'Accordion tanya jawab.' },
  cta: { type: 'cta', label: 'CTA', group: 'Interaksi', icon: 'cursor', description: 'Ajakan bertindak dengan latar warna utama.' },
  contact: { type: 'contact', label: 'Kontak', group: 'Interaksi', icon: 'mail', description: 'Info kontak + form pesan.' },
  map: { type: 'map', label: 'Peta', group: 'Interaksi', icon: 'map', description: 'Peta lokasi desa (embed).' },
  horizontalSlider: { type: 'horizontalSlider', label: 'Slider Horizontal', group: 'Media', icon: 'slider', description: 'Kartu yang di-scroll horizontal.' },
  parallax: { type: 'parallax', label: 'Parallax', group: 'Media', icon: 'parallax', description: 'Section dengan latar parallax + teks.' },
  kktTeam: { type: 'kktTeam', label: 'Tim KKT', group: 'KKT', icon: 'graduation', description: 'Tampilkan tim pengembang KKT.' },
  customHtml: { type: 'customHtml', label: 'HTML Kustom', group: 'Lainnya', icon: 'code', description: 'Sisipkan HTML mentah (disanitasi).' },
}

export const SECTION_GROUPS = ['Hero', 'Konten', 'Media', 'Data Desa', 'Potensi', 'Interaksi', 'KKT', 'Lainnya'] as const
