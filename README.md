# 🏸 Smash League v2

โปรแกรมเก็บแต้มและจัดอันดับการแข่งแบดมินตัน พร้อมระบบ login + admin

## ฟีเจอร์

**ผู้ใช้ทั่วไป**
- 🔐 Login ด้วยชื่อ + PIN 4-6 หลัก
- 📝 สมัครเองได้ (ตั้ง emoji + PIN)
- 🏆 ดูอันดับทั้งหมด
- 🎯 ดูแมตช์ที่ admin จัดให้เล่น
- 📜 ดูประวัติแมตช์ทั้งหมด

**Admin**
- 🆚 จัดคู่แมตช์ (พร้อม label รอบ)
- ✏️ บันทึกผลแมตช์ (จากที่จัดไว้ หรือบันทึก ad-hoc ก็ได้)
- ⚙️ ปรับ K-factor (ความผันผวน ELO) และ starting rating
- 👤 จัดการผู้เล่น (ลบ, เปลี่ยน role, ปรับเรตติ้งพร้อม audit log)

## Tech Stack

- React 18 + Vite + Tailwind CSS + React Router
- Supabase (PostgreSQL + Realtime + Custom RPC auth)
- Custom auth ผ่าน `pgcrypto` (bcrypt PIN hash + session tokens)

---

## 📋 ขั้นตอนการติดตั้ง

### 1. ติดตั้ง dependencies
```bash
npm install
```

### 2. สร้างโปรเจกต์ Supabase ใหม่
- ไปที่ https://supabase.com → สร้าง project ใหม่ (ห้ามใช้ตัวเก่าจาก v1)
- region: **Singapore**
- เปิด SQL Editor → New query → copy **ทั้งหมด** จาก `supabase/schema.sql` → Run
- คัดลอก `Project URL` และ `anon public key` จาก Settings → API

### 3. ตั้งค่า `.env.local`
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

### 4. รันโปรเจกต์
```bash
npm run dev
```

### 5. 🔑 สร้าง Admin คนแรก (สำคัญมาก!)

ระบบไม่มี admin ตอนเริ่ม ต้องตั้งคนแรกผ่าน SQL:

1. เปิดเว็บ → กดแท็บ **"สมัคร"** → สมัครบัญชีตัวเอง (ตั้ง PIN ให้จำได้)
2. กลับมา Supabase **SQL Editor** → รัน:
   ```sql
   update public.players set role = 'admin' where name = 'ชื่อที่คุณตั้ง';
   ```
3. กลับไปเว็บ → Logout → Login ใหม่ → จะเห็นแท็บ admin ปรากฏ

หลังจากนี้ admin คนแรกสามารถเลื่อนคนอื่นเป็น admin ผ่านหน้า "ตั้งค่า" ได้

---

## 📁 โครงสร้างโปรเจกต์

```
smash-league/
├── supabase/
│   └── schema.sql              # ตาราง + RPC functions + RLS
├── src/
│   ├── lib/
│   │   ├── supabase.js         # Supabase client
│   │   ├── auth.jsx            # AuthContext + login/signup
│   │   ├── adminApi.js         # Admin RPC wrappers
│   │   ├── elo.js              # ELO + winner detection
│   │   └── format.js           # date/time/winRate helpers
│   ├── hooks/
│   │   ├── usePlayers.js
│   │   ├── useMatches.js
│   │   ├── useScheduledMatches.js
│   │   └── useSettings.js
│   ├── pages/
│   │   ├── Login.jsx           # หน้า login/signup
│   │   ├── Leaderboard.jsx     # อันดับ (ทุกคน)
│   │   ├── MyMatches.jsx       # แมตช์ที่ต้องเล่น (ผู้ใช้)
│   │   ├── History.jsx         # ประวัติ (ทุกคน)
│   │   └── admin/
│   │       ├── AdminSchedule.jsx   # จัดคู่
│   │       ├── AdminRecord.jsx     # บันทึกผล
│   │       └── AdminSettings.jsx   # ตั้งค่า + จัดการผู้เล่น
│   ├── components/
│   │   ├── PlayerAvatar.jsx
│   │   └── EmptyState.jsx
│   ├── App.jsx                 # Router + auth gate + tabs
│   └── main.jsx
├── index.html
├── package.json
└── .env.local                  # คุณสร้างเอง
```

---

## 🔒 ระบบ Security (สำคัญ)

ทุก action ที่เปลี่ยนข้อมูล (สมัคร, login, จัดคู่, บันทึกผล, override) ผ่าน **Supabase RPC functions** ที่ใช้ `security definer` พร้อมตรวจ session token

- **RLS** เปิดเฉพาะ `SELECT` สำหรับ public — ไม่มีใครเขียน DB ตรงๆ จาก client ได้
- **PIN** เก็บเป็น bcrypt hash (`pgcrypto`)
- **Session tokens** อายุ 30 วัน เก็บใน `localStorage` (จำกัด scope ต่อ browser)
- **Admin checks** อยู่ใน DB ทั้งหมด — client ปลอม role ไม่ได้

### ข้อจำกัด
- PIN 4-6 หลักไม่แข็งแรงเท่า password — เหมาะกับกลุ่มเพื่อนที่เชื่อใจกัน
- ถ้าจะใช้ public/ทัวร์นาเมนต์ใหญ่ พิจารณาเปลี่ยนเป็น Supabase Auth (email/Google)

---

## 🚀 Deploy ขึ้น Vercel

```bash
git init && git add . && git commit -m "init"
# push to GitHub แล้วเชื่อม Vercel
```

ใส่ env vars `VITE_SUPABASE_URL` และ `VITE_SUPABASE_ANON_KEY` ใน Vercel
