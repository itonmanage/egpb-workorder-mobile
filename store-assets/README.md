# Eastin Work Order — Google Play Store Assets

โฟลเดอร์นี้รวบรวมทุกอย่างที่ต้องใช้สำหรับ submit แอปขึ้น Google Play Store

---

## โครงสร้างไฟล์

```
store-assets/
├── images/
│   ├── app-icon-512x512.png          ← App Icon (อัปโหลดใน Play Console)
│   ├── feature-graphic-1024x500.png  ← Feature Graphic Banner
│   ├── screenshot-1-home.png         ← Screenshot 1: หน้าแรก / Dashboard
│   ├── screenshot-2-create-ticket.png ← Screenshot 2: สร้าง Ticket
│   ├── screenshot-3-ticket-detail.png ← Screenshot 3: รายละเอียด Ticket
│   └── screenshot-4-summary.png      ← Screenshot 4: รายงานสถิติ (Admin)
└── texts/
    ├── store-listing.md              ← ชื่อ, คำอธิบาย Short/Full, Keywords
    ├── privacy-policy.html           ← Privacy Policy Page (อัปโหลดขึ้นเว็บ)
    └── data-safety-answers.md        ← คำตอบสำหรับแบบฟอร์ม Data Safety
```

---

## Checklist การ Submit

### ขั้นตอนที่ 1 — โฮสต์ Privacy Policy (ไม่มีเว็บ ใช้ GitHub Pages ฟรี)
- [ ] สร้าง GitHub repo ใหม่ชื่อ `egpb-ticket-privacy`
- [ ] เปลี่ยนชื่อ `texts/privacy-policy.html` → `index.html` แล้วอัปโหลด
- [ ] เปิด GitHub Pages: Settings → Pages → Deploy from main
- [ ] ได้ URL สาธารณะ เช่น `https://[username].github.io/egpb-ticket-privacy/`
- [ ] นำ URL นี้ไปกรอกใน Play Console ช่อง Privacy Policy URL

### ขั้นตอนที่ 2 — สร้าง App ใน Play Console
- [ ] ไปที่ [play.google.com/console](https://play.google.com/console)
- [ ] กด "Create app"
- [ ] กรอก App name: `Eastin Work Order`
- [ ] เลือก Default language: Thai (ภาษาไทย)
- [ ] App type: App
- [ ] Free or paid: Free

### ขั้นตอนที่ 3 — Store Listing
- [ ] ดูข้อมูลจาก `texts/store-listing.md`
- [ ] กรอก Short description (ภาษาไทย)
- [ ] กรอก Full description (ภาษาไทย)
- [ ] อัปโหลด App icon: `images/app-icon-512x512.png`
- [ ] อัปโหลด Feature graphic: `images/feature-graphic-1024x500.png`
- [ ] อัปโหลด Screenshots (อย่างน้อย 2 รูป):
  - `images/screenshot-1-home.png`
  - `images/screenshot-2-create-ticket.png`
  - `images/screenshot-3-ticket-detail.png`
  - `images/screenshot-4-summary.png`

### ขั้นตอนที่ 4 — App Content
- [ ] **Privacy Policy URL:** `https://egpb.com/privacy-policy`
- [ ] **Data Safety:** กรอกตาม `texts/data-safety-answers.md`
- [ ] **Content Rating:** ทำแบบสอบถาม (เลือก Business/Productivity, ตอบ No ทุกคำถามเกี่ยวกับความรุนแรง)
- [ ] **Target audience:** 18+ (พนักงานองค์กร)

### ขั้นตอนที่ 5 — Build & Upload
- [ ] Build `.aab` production: `eas build --platform android --profile production`
- [ ] สร้าง Release ใน Internal Testing ก่อน
- [ ] Upload `.aab` ไฟล์
- [ ] ทดสอบใน Internal track
- [ ] Promote ไป Production

---

## ข้อมูลสำคัญ

| รายการ | ค่า |
|---|---|
| App Name | Eastin Work Order |
| Package Name | com.egpb.ticket |
| Version | 1.0.0 |
| Category | Business |
| Developer Email | it@eastingrandphayathai.com |
| Privacy Policy | ต้องโฮสต์ก่อน (ดู store-listing.md) |
| Content Rating | Everyone |

---

## หมายเหตุ

> **App Icon:** ควรนำไปปรับแต่งเพิ่มเติมด้วย Figma หรือ Photoshop ให้ pixel-perfect ก่อนใช้งานจริง
> 
> **Screenshots:** เป็น mockup สำหรับอ้างอิง — แนะนำให้ถ่ายจาก device จริงหรือ emulator เพื่อความน่าเชื่อถือ
> 
> **Privacy Policy:** อัปเดต email เป็น `it@eastingrandphayathai.com` แล้ว — ต้องโฮสต์ขึ้นเว็บก่อน (แนะนำ GitHub Pages ดูรายละเอียดใน `store-listing.md`)
