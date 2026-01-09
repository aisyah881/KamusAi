
# 🚀 Panduan Publish Web KamusAI

Ikuti langkah ini untuk mengubah kode ini menjadi website yang bisa diakses semua orang.

## 1. Persiapan di Komputer
1. Install **Node.js** dari [nodejs.org](https://nodejs.org/).
2. Buat folder baru di komputer Anda, beri nama `kamus-ai`.
3. Salin semua file dari sini ke dalam folder tersebut.

## 2. Cara Menjalankan Secara Lokal
1. Buka terminal (CMD atau VS Code Terminal) di dalam folder tersebut.
2. Jalankan perintah: `npm install`
3. Buat file baru bernama `.env` dan isi: `REACT_APP_GEMINI_API_KEY=IsiDenganApiKeyAnda`
4. Jalankan: `npm start`
5. Aplikasi akan terbuka di `http://localhost:3000`.

## 3. Cara Menjadikan Online (Website Publik)
Untuk membuat website ini bisa diakses orang lain secara GRATIS:

### Opsi A: Vercel (Paling Mudah)
1. Buat akun di [vercel.com](https://vercel.com/).
2. Hubungkan dengan akun GitHub Anda (atau upload folder secara manual).
3. **Penting:** Di bagian "Environment Variables" pada pengaturan Vercel, masukkan:
   - Key: `API_KEY`
   - Value: (Masukkan API Key Gemini Anda)
4. Klik **Deploy**. Selesai! Anda akan mendapat link website.

### Opsi B: Netlify
1. Buat akun di [netlify.com](https://netlify.com/).
2. Drag & Drop folder hasil `npm run build` ke dashboard Netlify.
3. Atur API Key di bagian "Site Settings" > "Environment Variables".

---
**Catatan Keamanan:** Jangan pernah membagikan file `.env` Anda ke publik atau mengunggahnya ke GitHub tanpa mengaturnya di `.gitignore`.
