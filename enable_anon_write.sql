-- ─────────────────────────────────────────────────────────────────────────────
-- REQUIRED: รัน SQL นี้ใน Supabase SQL Editor เพื่อให้ Admin Panel เพิ่ม/แก้ไข/ลบข้อมูลได้
-- ไปที่: Supabase Dashboard → SQL Editor → New Query → วางโค้ดนี้ → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- ลบ policy เก่าที่บล็อก write
drop policy if exists "Authenticated users can insert players" on players;
drop policy if exists "Authenticated users can update players" on players;
drop policy if exists "Authenticated users can delete players" on players;
drop policy if exists "Authenticated users can insert matches" on matches;
drop policy if exists "Authenticated users can update matches" on matches;
drop policy if exists "Authenticated users can delete matches" on matches;
drop policy if exists "Authenticated users can insert gallery" on gallery;
drop policy if exists "Authenticated users can update gallery" on gallery;
drop policy if exists "Authenticated users can delete gallery" on gallery;
drop policy if exists "Authenticated users can update settings" on settings;

-- เปิด write สำหรับทุกคน (anon + authenticated)
create policy "Allow all insert players" on players for insert with check (true);
create policy "Allow all update players" on players for update using (true);
create policy "Allow all delete players" on players for delete using (true);

create policy "Allow all insert matches" on matches for insert with check (true);
create policy "Allow all update matches" on matches for update using (true);
create policy "Allow all delete matches" on matches for delete using (true);

create policy "Allow all insert gallery" on gallery for insert with check (true);
create policy "Allow all update gallery" on gallery for update using (true);
create policy "Allow all delete gallery" on gallery for delete using (true);

create policy "Allow all update settings" on settings for update using (true);
