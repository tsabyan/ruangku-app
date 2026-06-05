# Ruangku App — Status & Remaining Work

> Dokumen ini adalah versi live dari `../PLAN.md` yang disesuaikan untuk `ruangku-app`.
> Mencerminkan kondisi aktual kode — bukan rencana awal.

---

## Stack Aktual

```
Framework     : Next.js 16.2.6 (App Router)
Language      : TypeScript
Styling       : TailwindCSS v4
Animation     : Framer Motion (motion/react)
Icons         : Lucide React
Charts        : Recharts (finance analytics)
Rich Text     : TipTap v3 (notes editor)
AI            : Google Gemini (@google/genai) via Next.js API Routes
                  — model fallback: gemini-2.5-flash → 2.0-flash → 2.0-flash-lite
Backend/DB    : Supabase (Postgres + Row Level Security)
Auth          : Supabase Auth — email/password (sudah aktif)
Deploy        : Vercel (recommended)
State         : useState + custom hooks (Zustand di-install tapi tidak dipakai)
```

### Environment Variables (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
GEMINI_API_KEY=AIzaSy...
```

---

## Supabase Schema

> Tabel-tabel ini harus dibuat manual di Supabase Dashboard. Belum ada file migrasi.

```sql
-- FINANCE MODULE
CREATE TABLE transactions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type         TEXT CHECK (type IN ('EXPENSE', 'INCOME')) NOT NULL,
  amount       BIGINT NOT NULL,
  category     TEXT NOT NULL,
  notes        TEXT,
  input_method TEXT CHECK (input_method IN ('AI', 'SCAN', 'MANUAL')) DEFAULT 'MANUAL',
  date         TIMESTAMPTZ DEFAULT NOW(),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE category_budgets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category     TEXT NOT NULL,
  budget_limit BIGINT NOT NULL DEFAULT 0,
  UNIQUE(user_id, category)
);

CREATE TABLE user_settings (
  user_id        UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  monthly_budget BIGINT DEFAULT 5000000,
  display_name   TEXT,
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- GOAL MODULE
CREATE TABLE goals (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title                TEXT NOT NULL,
  status               TEXT CHECK (status IN ('ongoing', 'pending', 'achieved')) DEFAULT 'ongoing',
  achievement_log_text TEXT DEFAULT '',
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tasks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id          UUID REFERENCES goals(id) ON DELETE CASCADE NOT NULL,
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title            TEXT NOT NULL,
  is_completed     BOOLEAN DEFAULT FALSE,
  current_due_date DATE,
  recurring_days   INT[] DEFAULT '{}',
  last_generated   DATE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- NOTE MODULE
CREATE TABLE notes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title        TEXT DEFAULT '',
  content_html TEXT DEFAULT '',
  content_text TEXT DEFAULT '',
  tags         TEXT[] DEFAULT '{}',
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ROW LEVEL SECURITY
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user owns data" ON transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user owns data" ON category_budgets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user owns data" ON user_settings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user owns data" ON goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user owns data" ON tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user owns data" ON notes FOR ALL USING (auth.uid() = user_id);
```

---

## Status Implementasi

### ✅ Auth

- Login / register via `supabase.auth.signInWithPassword` + `signUp`
- Middleware redirect ke `/login` untuk semua route yang belum auth
- Profile page: tampil email + tombol logout

### ✅ Home Hub (`/`)

- 3 module card (Finance, Goals, Notes)
- Navigasi ke masing-masing modul

### ✅ Modul Notes (`/notes`, `/notes/[id]`)

- Note list dengan search, tag filter, pin sorting
- TipTap v3 rich editor: bold/italic/heading/list/alignment
- Auto-save debounced + cloud save indicator
- Hashtag extraction otomatis dari konten
- CRUD lengkap via `useNoteStore` → Supabase `notes` table

### ✅ Modul Goals (`/goals`, `/goals/[id]`)

- Goals board: ongoing / pending / achieved
- Goal detail + tasks harian
- Recurring task generation (per hari-dalam-seminggu)
- Task rollover: task overdue → dipindah ke hari ini
- Achievement log dengan debounced autosave
- TaskHeatmap: grid keberhasilan task per hari dalam bulan
- CRUD lengkap via `useGoalStore` → Supabase `goals` + `tasks` tables

### ✅ Modul Finance (`/finance`) — ~90%

- HomeView: ringkasan bulanan (pemasukan − pengeluaran), transaksi terakhir
- AddView: 3 mode input — AI text parse, OCR scan struk, manual form
- AnalyticsView: PieChart per kategori, navigasi bulan
- HistoryView: list transaksi dengan search, filter, edit, delete
- API routes: `/api/chat-process` + `/api/scan-receipt` (Gemini AI)
- Data via `useFinanceStore` → Supabase `transactions`, `user_settings`, `category_budgets`

---

## Yang Belum Selesai

### 🔲 Finance — SettingsView

- **File**: `components/finance/SettingsView.tsx`
- **Kondisi sekarang**: placeholder "Coming soon"
- **Yang perlu dibuat**:
  - Input untuk edit `monthly_budget` (dari `user_settings`)
  - Input per kategori untuk `budget_limit` (dari `category_budgets`)
  - Save ke Supabase via `useFinanceStore`
  - Data layer di hook sudah siap — tinggal buat UI

### 🔲 Supabase Migrations

- Belum ada file `.sql` di repo
- Schema harus dibuat manual setiap setup environment baru
- **Yang perlu dibuat**: folder `supabase/migrations/` dengan file SQL schema di atas

### 🔲 Profile — Edit Display Name

- **File**: `app/profile/page.tsx`
- Sekarang hanya tampil email + logout
- Bisa tambah: edit `display_name` di tabel `user_settings`

### 🔲 PWA — Service Worker

- `public/manifest.json` sudah ada
- Belum ada service worker / `next-pwa` setup
- Opsional: `next-pwa` untuk installable app + offline support

### 🔲 Zustand — Cleanup

- Zustand di-install (`package.json`) tapi tidak dipakai sama sekali
- Semua state pakai `useState` + custom hooks
- Bisa di-remove dari dependencies untuk kebersihan

---

## Struktur Folder

```
ruangku-app/
├── app/
│   ├── layout.tsx              ✅ Root layout (font, providers)
│   ├── page.tsx                ✅ Home Hub — 3 module cards
│   ├── login/page.tsx          ✅ Auth — email/password
│   ├── profile/page.tsx        ✅ Email + logout (display name edit: pending)
│   ├── finance/page.tsx        ✅ Finance shell
│   ├── goals/
│   │   ├── page.tsx            ✅ Goals dashboard
│   │   └── [id]/page.tsx       ✅ Goal detail
│   ├── notes/
│   │   ├── page.tsx            ✅ Note list
│   │   └── [id]/page.tsx       ✅ Note editor
│   └── api/
│       ├── chat-process/route.ts  ✅ Gemini AI text → transaction
│       └── scan-receipt/route.ts  ✅ Gemini Vision OCR → transaction
│
├── components/
│   ├── home/                   ⚠️  Folder kosong (home logic inline di page.tsx)
│   ├── finance/
│   │   ├── FinanceShell.tsx    ✅
│   │   ├── HomeView.tsx        ✅
│   │   ├── AddView.tsx         ✅
│   │   ├── AnalyticsView.tsx   ✅
│   │   ├── HistoryView.tsx     ✅
│   │   ├── TransactionDetail.tsx ✅
│   │   ├── SettingsView.tsx    🔲 Placeholder — perlu diimplementasi
│   │   └── categoryIcons.tsx   ✅
│   ├── goals/
│   │   ├── GoalDashboard.tsx   ✅
│   │   ├── GoalDetail.tsx      ✅
│   │   ├── TaskHeatmap.tsx     ✅
│   │   └── ConfirmModal.tsx    ✅
│   ├── notes/
│   │   ├── NoteList.tsx        ✅
│   │   └── NoteEditor.tsx      ✅
│   └── ui/
│       └── ModuleHeader.tsx    ✅
│
├── hooks/
│   ├── useFinanceStore.ts      ✅ Supabase-backed
│   ├── useGoalStore.ts         ✅ Supabase-backed
│   └── useNoteStore.ts         ✅ Supabase-backed
│
├── lib/
│   ├── utils.ts                ✅
│   └── supabase/
│       ├── client.ts           ✅ createBrowserClient
│       ├── server.ts           ✅ createServerClient
│       └── middleware.ts       ✅ createServerClient (untuk middleware)
│
├── types/
│   ├── finance.ts              ✅
│   ├── goals.ts                ✅
│   └── notes.ts                ✅
│
├── middleware.ts               ✅ Auth redirect
└── public/
    └── manifest.json           ✅ PWA manifest (SW belum ada)
```

---

## Deployment

### Vercel (Recommended)

```bash
# Push ke GitHub, connect repo ke Vercel, set env vars di dashboard
git push origin main
# → Auto-deploy ke production URL
```

### Environment Variables yang perlu di-set di Vercel:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
GEMINI_API_KEY
```

---

## Design System

Semua modul menggunakan **Zinc Minimalist**:

| Token        | Value                         |
| ------------ | ----------------------------- |
| Background   | `zinc-50`                     |
| Surface      | `white`                       |
| Border       | `zinc-100` / `zinc-200`       |
| Text primary | `zinc-900`                    |
| Text muted   | `zinc-400`                    |
| Accent       | `zinc-900` (dark button)      |
| Error        | `red-500`                     |
| Success      | `emerald-500`                 |
| Font         | Inter (Google Fonts)          |
| Radius       | `rounded-2xl` / `rounded-3xl` |
