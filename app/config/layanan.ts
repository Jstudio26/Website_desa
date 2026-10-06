import type { ComplaintStatus, LetterRequestStatus, LetterTypeConfig } from '~/types/database'

/** Shared option lists and status labels for the letter-request and complaint flows (public + admin). */

/**
 * Jenis surat bawaan, dipakai sampai admin menyimpan daftarnya sendiri di
 * Admin → Layanan Surat. Persyaratan sengaja kosong: diisi admin sesuai ketentuan kantor.
 */
export const DEFAULT_LETTER_TYPES: LetterTypeConfig[] = [
  { name: 'Surat Keterangan Domisili', requirements: '', duration: '' },
  { name: 'Surat Pengantar', requirements: '', duration: '' },
  { name: 'Surat Keterangan Tidak Mampu (SKTM)', requirements: '', duration: '' },
  { name: 'Surat Keterangan Usaha', requirements: '', duration: '' },
]

/** Selalu ada di akhir pilihan; pemohon wajib menyebut suratnya di kolom keperluan. */
export const OTHER_LETTER_TYPE = 'Lainnya'

export const COMPLAINT_CATEGORIES = [
  'Infrastruktur',
  'Lingkungan & Kebersihan',
  'Keamanan & Ketertiban',
  'Sosial & Kemasyarakatan',
  'Lainnya',
]

/**
 * Status tampil lewat ikon + label + intensitas merah (lihat StatusBadge), bukan warna
 * berbeda-beda: palet situs hanya Merah–Putih.
 */
export type StatusTone = 'muted' | 'soft' | 'solid' | 'danger'
export type StatusMeta = { label: string, tone: StatusTone, icon: string, hint: string }

export const LETTER_STATUS: Record<LetterRequestStatus, StatusMeta> = {
  diajukan: { label: 'Diajukan', tone: 'muted', icon: 'inbox', hint: 'Permohonan diterima dan menunggu diperiksa petugas.' },
  diproses: { label: 'Diproses', tone: 'soft', icon: 'clock', hint: 'Petugas sedang memverifikasi dan menyiapkan surat.' },
  selesai: { label: 'Selesai', tone: 'solid', icon: 'check', hint: 'Surat sudah siap. Ambil di kantor kelurahan pada jam pelayanan.' },
  ditolak: { label: 'Ditolak', tone: 'danger', icon: 'close', hint: 'Permohonan tidak dapat diproses. Lihat catatan petugas.' },
}

export const COMPLAINT_STATUS: Record<ComplaintStatus, StatusMeta> = {
  diterima: { label: 'Diterima', tone: 'muted', icon: 'inbox', hint: 'Pengaduan sudah diterima petugas.' },
  diproses: { label: 'Diproses', tone: 'soft', icon: 'clock', hint: 'Pengaduan sedang ditindaklanjuti.' },
  selesai: { label: 'Selesai', tone: 'solid', icon: 'check', hint: 'Pengaduan sudah ditangani.' },
}

/** Requirement text (one per line) → list items. */
export const requirementList = (text: string) => text.split('\n').map((l) => l.trim()).filter(Boolean)
