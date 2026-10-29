# Jadwal IT RSMA

Aplikasi web untuk membuat jadwal kerja, piket, dan libur tim IT RSMA (Tim SIMRS dan Tim Jaringan). Jadwal dibuat otomatis, bisa diedit manual dengan klik sel, dan bisa dicetak ke PDF.

## Fitur

- Jadwal bulanan dalam bentuk matriks (nama petugas x tanggal).
- Pembagian piket dan on-call otomatis yang adil.
- Jadwal bersambung antarbulan tanpa database.
- Edit manual dengan klik sel: kosong, A, P, L, lalu kembali kosong.
- Tombol **Reset Otomatis** untuk mengembalikan jadwal bulan yang dipilih ke hasil otomatis.
- Total P dan A per petugas, dihitung ulang setiap ada perubahan.
- Cetak ke PDF lewat dialog cetak browser.

## Aturan Jadwal

| Kode | Arti | Keterangan |
| ---- | ---- | ---------- |
| P | Piket Sabtu | 07:00 - 16:00 WITA |
| L | Libur Jumat | Otomatis jika Sabtu setelahnya piket |
| A | On-call | 16:00 - 07:00 WITA, Minggu mulai 07:00 WITA |

Aturan yang dipakai:

1. Lima hari kerja, Senin - Jumat (07:00 - 16:00 WITA).
2. Semua anggota mendapat jatah on-call, termasuk Kepala Ruangan.
3. Setiap Sabtu ada piket: 1 orang dari Tim SIMRS dan 1 orang dari Tim Jaringan.
4. Kepala Ruangan Jaringan (Ivandi Shaputra) tidak piket.
5. Anggota perempuan tidak piket Sabtu.
6. Yang piket Sabtu mendapat libur di hari Jumat sebelumnya.
7. Yang piket tidak boleh on-call pada Jumat, Sabtu, dan Minggu di sekitar piketnya.

## Cara Kerja Logika

Logika ada di bagian atas `page.jsx`.

1. **Bulan awal (`ANCHOR_MONTH = "2026-10"`)** memakai logika lama (`generateLegacySchedule`), sehingga jadwal Oktober 2026 tidak berubah.
2. Dari jadwal bulan awal dihitung statistik tiap orang: jumlah piket, jumlah on-call, tanggal piket terakhir, dan tanggal on-call terakhir (`statsFromSchedule`).
3. Bulan berikutnya dibuat berantai oleh `generateFairSchedule`, memakai statistik bulan sebelumnya. `buildSchedule` menjalankan rantai ini sampai bulan yang dipilih.
4. **Piket Sabtu**: dipilih orang dengan total piket paling sedikit. Jika seri, dipilih yang piket terakhirnya paling lama. Pool piket: SIMRS pria dan Jaringan tanpa Ivandi.
5. **On-call harian**: dipilih orang dengan beban terendah, yaitu `A + P x PIKET_WEIGHT`. Jika seri, dipilih yang paling lama tidak on-call. Orang yang on-call kemarin dihindari selama masih ada kandidat lain.
6. Proteksi piket juga berlaku lintas bulan: piket di Sabtu terakhir bulan membuat Minggu tanggal 1 bulan berikutnya bebas on-call.

## Konfigurasi

Ubah konstanta di bagian atas file:

| Konstanta | Fungsi |
| --------- | ------ |
| `ANCHOR_MONTH` | Bulan awal yang memakai jadwal lama sebagai titik lanjut |
| `PIKET_WEIGHT` | Satu kali piket dianggap setara berapa kali on-call. Naikkan (misal 1.5 atau 2) agar yang piket mendapat on-call lebih sedikit |

### Menambah atau mengubah anggota

Edit array berikut:

- `simrsMaleMembers`: anggota SIMRS pria (masuk pool piket).
- `simrsFemaleMembers`: anggota SIMRS perempuan (hanya on-call).
- `jaringanMembers`: semua anggota Jaringan.
- `jaringanPiketMembers`: otomatis semua anggota Jaringan kecuali Ivandi Shaputra. Ubah filter-nya jika Kepala Ruangan berganti.

Catatan: logika bulan awal (`generateLegacySchedule`) memakai nama "Imanollah", "Ivandi Shaputra", dan "Andi Ardiansyah" secara langsung. Jika nama diubah, sesuaikan juga di fungsi tersebut.

## Menjalankan

Kebutuhan: Next.js (App Router), Tailwind CSS, dan `lucide-react`.

```bash
npm install lucide-react
npm run dev
```

Letakkan `page.jsx` di `app/page.jsx` (atau `app/page.tsx`), lalu buka `http://localhost:3000`.

Untuk cetak PDF, pastikan ada aturan berikut di CSS global karena elemen header memakai class `no-print`:

```css
@media print {
  .no-print {
    display: none !important;
  }
}
```

## Batasan

- Edit manual hanya berlaku untuk bulan yang sedang dibuka dan hilang saat bulan diganti atau halaman dimuat ulang. Perubahan manual juga tidak mempengaruhi perhitungan bulan berikutnya. Untuk itu, jadwal perlu disimpan ke database atau localStorage.
- Jika Sabtu jatuh di tanggal 1, libur Jumat berada di bulan sebelumnya dan belum ditandai.
- Bulan sebelum `ANCHOR_MONTH` dihitung dari awal tanpa riwayat.
