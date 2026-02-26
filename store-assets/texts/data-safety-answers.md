# Data Safety Form — Eastin Work Order
> กรอกใน Google Play Console > App content > Data safety

---

## Section 1: Data Collection and Security

**Does your app collect or share any of the required user data types?**
→ ✅ **Yes**

**Is all of the user data collected by your app encrypted in transit?**
→ ✅ **Yes** (ใช้ HTTPS ทุก request)

**Do you provide a way for users to request that their data is deleted?**
→ ✅ **Yes** (ผ่านการติดต่อผู้ดูแลระบบ)

---

## Section 2: Data Types Collected

### ✅ Photos and videos
| รายการ | คำตอบ |
|---|---|
| Data type | Photos |
| Collected? | Yes |
| Shared with third parties? | No |
| Required or optional? | Optional (ผู้ใช้เลือกแนบหรือไม่ก็ได้) |
| Processing purpose | App functionality (แนบรูป Ticket) |
| Ephemeral (not stored beyond session)? | No (อัปโหลดและจัดเก็บใน Server) |

---

### ✅ App activity
| รายการ | คำตอบ |
|---|---|
| Data type | App interactions |
| Collected? | Yes |
| Shared with third parties? | No |
| Required or optional? | Required |
| Processing purpose | App functionality (แสดง Ticket history, สถานะ) |
| Ephemeral? | No |

---

### ❌ ข้อมูลที่ **ไม่**เก็บ (ตอบ No ทั้งหมด)
- Location (ตำแหน่ง GPS)
- Contacts
- Personal info (Name, Email, Phone, etc.)
- Financial info
- Health and fitness
- Messages
- Web browsing
- Device or other IDs (Advertising ID)
- Audio files
- Files and docs

---

## Section 3: Data Sharing

**Is any data shared with third parties?**
→ ❌ **No** — ข้อมูลทั้งหมดอยู่ภายในระบบขององค์กรเท่านั้น

---

## Section 4: Security Practices

**Does your app use secure transmissions (HTTPS)?**
→ ✅ Yes

**Does your app follow the Families Policy?**
→ ❌ No (แอปสำหรับพนักงานองค์กร ไม่ใช่เด็ก)

---

## สรุปสั้น (Summary Badge ที่แสดงใน Play Store)

```
Data collected:
- Photos (optional, for ticket attachments)
- App activity (required, for ticket management)

Data is encrypted in transit.
Data is not shared with third parties.
You can request data deletion.
```

---

## หมายเหตุเพิ่มเติม

- แอปนี้ใช้ **Expo SecureStore** สำหรับเก็บ Auth Token บนอุปกรณ์ (encrypted)
- รูปภาพที่แนบ Ticket จะถูกอัปโหลดไปยัง Server ขององค์กร ไม่ใช่ Google/Firebase/AWS สาธารณะ
- ไม่มีการใช้ Analytics SDK (Firebase Analytics, Mixpanel ฯลฯ)
- ไม่มีการใช้ Ads SDK ใดๆ
- ติดต่อ Developer: it@eastingrandphayathai.com
