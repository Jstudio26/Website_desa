import type { PotensiProfile } from '~/types/database'

/**
 * Isi bawaan halaman Potensi Kelurahan (versi kajian yang setiap klaimnya bersumber).
 * Tampil selama admin belum menyimpan versinya sendiri di Admin → Potensi Kelurahan.
 * Paragraf dipisahkan baris kosong; sumber satu per baris.
 */
export const DEFAULT_POTENSI_PROFILE: PotensiProfile = {
  summary: `Potensi utama Kelurahan Matani Tiga terletak pada sumber daya manusia dan lingkungan perkotaannya, bukan pada sumber daya alam berskala besar seperti pertanian atau pertambangan. Potensi ini didukung oleh posisi strategis di Kecamatan Tomohon Tengah, jumlah penduduk 2.023 jiwa, akses pendidikan dan pelayanan, jaringan transportasi, aktivitas perdagangan dan jasa, serta peluang pemanfaatan pekarangan dan ruang lingkungan secara produktif.`,

  highlights: [
    { value: '2.023', label: 'Jiwa penduduk' },
    { value: '1.017', label: 'Laki-laki' },
    { value: '1.006', label: 'Perempuan' },
    { value: '3,85 km²', label: 'Luas wilayah (15,16% Kec. Tomohon Tengah)' },
  ],

  sdm: {
    overview: `Kelurahan Matani Tiga memiliki potensi sumber daya manusia yang cukup besar untuk mendukung kegiatan sosial dan ekonomi masyarakat karena memiliki jumlah penduduk sebanyak 2.023 jiwa, yang terdiri atas 1.017 laki-laki dan 1.006 perempuan. Data tersebut menunjukkan komposisi penduduk yang relatif seimbang berdasarkan jenis kelamin. Dengan jumlah penduduk tersebut, Matani Tiga memiliki basis masyarakat yang cukup untuk mendukung kegiatan pelayanan publik, usaha masyarakat, kegiatan sosial, serta pengembangan program pemberdayaan.

Selain itu, lokasi Matani Tiga yang berada di Kecamatan Tomohon Tengah memberikan keuntungan berupa akses yang relatif dekat terhadap berbagai fasilitas pendidikan, pelayanan publik, perdagangan, dan jasa. Data BPS menunjukkan bahwa di Kecamatan Tomohon Tengah terdapat 12 TK swasta, 1 SD negeri, 9 SD swasta, 1 SMP negeri, 3 SMP swasta, dan 2 SMA swasta. Namun, angka tersebut merupakan data pada tingkat kecamatan dan tidak dapat secara langsung dianggap sebagai jumlah fasilitas pendidikan yang berada di Kelurahan Matani Tiga. Keberadaan berbagai fasilitas tersebut tetap menunjukkan bahwa masyarakat Matani Tiga berada dalam lingkungan perkotaan dengan akses pendidikan dan pelayanan yang relatif baik.

Potensi SDM tersebut dapat dikembangkan melalui peningkatan keterampilan, kewirausahaan, kegiatan kepemudaan, serta pemberdayaan masyarakat berbasis kebutuhan lokal.`,
    strengths: [],
    weaknesses: [],
  },

  sda: {
    overview: `Potensi sumber daya alam Kelurahan Matani Tiga perlu dipahami dalam konteks karakter wilayahnya yang telah berkembang sebagai kawasan perkotaan. Berdasarkan Kecamatan Tomohon Tengah Dalam Angka 2025, Matani Tiga memiliki luas wilayah sekitar 3,85 km², atau sekitar 15,16 persen dari luas Kecamatan Tomohon Tengah. Dengan luas tersebut dan jumlah penduduk 2.023 jiwa, pemanfaatan ruang di Matani Tiga lebih tepat diarahkan pada pemanfaatan lingkungan permukiman, pekarangan, serta ruang terbuka secara produktif dan berkelanjutan daripada pengembangan pertanian atau eksploitasi sumber daya alam dalam skala besar.

Penelitian mengenai pengelolaan pekarangan di Kelurahan Matani Tiga juga menunjukkan adanya perhatian terhadap pengelolaan lingkungan dan pencegahan banjir melalui pemanfaatan pekarangan. Hal ini dapat menjadi dasar untuk mengembangkan potensi lingkungan melalui penghijauan, pemanfaatan pekarangan untuk tanaman pangan atau hortikultura skala rumah tangga, pengelolaan air hujan, serta ruang terbuka yang mendukung kualitas lingkungan permukiman.

Dengan demikian, potensi SDA Matani Tiga tidak harus dimaknai sebagai keberadaan sumber daya alam berskala besar, tetapi dapat diarahkan pada pemanfaatan lahan dan lingkungan perkotaan secara produktif, ekologis, dan berkelanjutan.`,
    strengths: [],
    weaknesses: [],
  },

  support: {
    title: 'Potensi Wilayah sebagai Pendukung Pengembangan SDM dan SDA',
    text: `Selain potensi penduduk dan lingkungan, posisi Matani Tiga di Kecamatan Tomohon Tengah menjadi salah satu faktor pendukung pengembangannya. Data BPS mencatat bahwa keseluruhan jalan di Kecamatan Tomohon Tengah telah diaspal dan wilayah kecamatan tersebut telah dilalui angkutan umum. Kondisi ini memberikan keuntungan bagi mobilitas penduduk, distribusi barang, serta akses masyarakat terhadap pusat pelayanan dan kegiatan ekonomi.

Dokumen Komisi Pemilihan Umum Kota Tomohon juga mengidentifikasi sejumlah fasilitas dan infrastruktur yang berada di Matani Tiga, antara lain fasilitas pendidikan, perbankan, tempat ibadah, kantor kelurahan, serta jaringan jalan dan utilitas. Kondisi tersebut menunjukkan bahwa potensi utama Matani Tiga lebih kuat pada SDM, aktivitas ekonomi perkotaan, fasilitas pelayanan, dan pemanfaatan lingkungan permukiman dibandingkan pada eksploitasi SDA dalam skala besar.`,
  },

  recommendations: [],
  recommendationsNote: '',

  sources: `Badan Pusat Statistik Kota Tomohon, Kecamatan Tomohon Tengah Dalam Angka 2025.
Kajian Pengelolaan Pekarangan untuk Pencegahan Banjir di Kelurahan Matani 3.
Komisi Pemilihan Umum Kota Tomohon.
Data kependudukan Kelurahan Matani Tiga (jumlah penduduk dan jenis kelamin).`,
}
