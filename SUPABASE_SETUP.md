# Supabase Setup Guide for COM7 Ping Pong League 2026

## 1. Create Supabase Project
1. ไปที่ [Supabase Dashboard](https://supabase.com/dashboard)
2. สร้างโปรเจคใหม่
3. ตั้งชื่อโปรเจค: `com7-pingpong-league-2026`
4. ตั้งรหัสผ่านสำหรับ database
5. เลือก region ที่ใกล้ที่สุด (Singapore หรือ Tokyo)

## 2. Run SQL Script
1. ไปที่ SQL Editor ใน Supabase Dashboard
2. คัดลอกเนื้อหาจากไฟล์ `database.sql` ในโปรเจคนี้
3. รัน SQL script เพื่อสร้าง tables และ policies

## 3. Get Project Credentials
1. ไปที่ Project Settings → API
2. คัดลอกค่า:
   - **Project URL**: `https://pknenhrslavkmslgwktk.supabase.co`
   - **anon/public key**: `sb_publishable_T6-ODWSx8BM-SUIWLJ4g8Q_YveoLTm9`

## 4. Update Configuration
แก้ไขไฟล์ `supabase-config.js`:
```javascript
const SUPABASE_URL = 'https://pknenhrslavkmslgwktk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_T6-ODWSx8BM-SUIWLJ4g8Q_YveoLTm9';
```

## 5. Create Storage Bucket
1. ไปที่ Storage ใน Supabase Dashboard
2. สร้าง bucket ใหม่ชื่อ `images`
3. ตั้งค่าเป็น public bucket
4. ตั้งค่า RLS policies:
   ```sql
   -- Allow public read access
   CREATE POLICY "Public can view images" ON storage.objects
   FOR SELECT USING (bucket_id = 'images');
   
   -- Allow authenticated users to upload
   CREATE POLICY "Authenticated users can upload images" ON storage.objects
   FOR INSERT WITH CHECK (
     bucket_id = 'images' AND auth.role() = 'authenticated'
   );
   ```

## 6. Create Admin User
1. ไปที่ Authentication → Users
2. สร้าง user ใหม่สำหรับ admin:
   - Email: `admin@com7-pingpong.com`
   - Password: `com7admin2026` (หรือตั้งรหัสผ่านที่ต้องการ)
3. เปลี่ยนรหัสผ่านในไฟล์ `admin.html` ให้ตรงกับที่ตั้งไว้

## 7. Test the Application
1. เปิด `index.html` ใน browser
2. ระบบควรโหลดข้อมูลจาก Supabase ได้
3. เปิด `admin.html` และล็อกอินด้วย email/password ที่สร้างไว้

## 8. Real-time Features
ระบบจะอัพเดทข้อมูลแบบ real-time โดยอัตโนมัติเมื่อ:
- มีการเพิ่ม/แก้ไข/ลบผู้เล่น
- มีการเพิ่ม/แก้ไข/ลบการแข่งขัน
- มีการอัพโหลดรูปภาพ

## Troubleshooting

### ถ้าไม่เห็นข้อมูล
1. ตรวจสอบว่า SQL script รันสำเร็จ
2. ตรวจสอบว่า tables ถูกสร้างใน Database → Tables
3. ตรวจสอบว่า RLS policies ถูกตั้งค่าถูกต้อง

### ถ้าไม่สามารถล็อกอินได้
1. ตรวจสอบว่า user ถูกสร้างใน Authentication → Users
2. ตรวจสอบ email และ password
3. ลองล้าง cache ของ browser

### ถ้าไม่สามารถอัพโหลดรูปได้
1. ตรวจสอบว่า storage bucket `images` ถูกสร้าง
2. ตรวจสอบ RLS policies สำหรับ storage

## Security Notes
- **anon key** ใช้สำหรับอ่านข้อมูลเท่านั้น (public access)
- การเขียนข้อมูลต้องใช้ authenticated user
- ควรเปลี่ยนรหัสผ่าน admin เป็นรหัสที่แข็งแรง
- ควรตั้งค่า CORS ใน Supabase Dashboard ให้อนุญาตโดเมนของเว็บไซต์