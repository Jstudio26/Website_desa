/**
 * Struktur organisasi Posko KKT: jabatan, jumlah orang per jabatan, dan tingkatan
 * pada bagan (1 = paling atas). Ubah di sini bila susunan posko berubah.
 */
export const POSKO_POSITIONS = [
  { key: 'kepalaP3kknt', label: 'Kepala P3KKNT', capacity: 1, tier: 1 },
  { key: 'dosenPengawas', label: 'Dosen Pengawas Lapangan', capacity: 1, tier: 2 },
  { key: 'dosenPembimbing', label: 'Dosen Pembimbing Lapangan', capacity: 1, tier: 2 },
  { key: 'koordinator', label: 'Koordinator Posko', capacity: 1, tier: 3 },
  { key: 'sekretaris', label: 'Sekretaris Posko', capacity: 1, tier: 4 },
  { key: 'bendahara', label: 'Bendahara Posko', capacity: 1, tier: 4 },
  { key: 'pelaporan', label: 'Bidang Pelaporan', capacity: 3, tier: 5 },
  { key: 'pdd', label: 'Bidang PDD', capacity: 3, tier: 5 },
  { key: 'programPerlengkapan', label: 'Bidang Program dan Perlengkapan', capacity: 4, tier: 5 },
  { key: 'humas', label: 'Bidang Humas', capacity: 3, tier: 5 },
] as const

export type PoskoPositionKey = typeof POSKO_POSITIONS[number]['key']

/** Tingkat mulai dari koordinator ke bawah = mahasiswa peserta KKT. */
export const STUDENT_TIER_FROM = 3
