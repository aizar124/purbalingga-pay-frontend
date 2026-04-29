# Purbalingga Pay Frontend

Frontend React + Vite untuk Purbalingga Pay.

## Struktur

```text
src/
  app/        # routing dan entry app
  components/ # komponen kecil yang reusable
  layouts/    # shell/layout halaman
  pages/      # halaman utama aplikasi
  api/        # client ke backend Laravel
  auth/       # session/auth state
  styles/     # global styles
  utils/      # helper umum
```

## Menjalankan

```bash
npm install
npm run dev
```

## Build production

```bash
npm run build
```

## Env

Salin `.env.example` menjadi `.env` lalu set:

- `VITE_API_BASE_URL` ke URL backend lokal, contoh `http://localhost:8000/api`
- `VITE_SSO_LOGIN_URL`, `VITE_SSO_DASHBOARD_URL`, dan `VITE_SSO_LOGOUT_URL` ke frontend SSO, contoh `http://localhost:5174`
