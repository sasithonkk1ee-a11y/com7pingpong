-- COM7 Ping Pong League 2026 Database Schema
-- Run this in Supabase SQL Editor

-- players table
create table players (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  team text,
  gender text check (gender in ('men', 'women')),
  photo_url text,
  wins int default 0,
  losses int default 0,
  sets_won int default 0,
  sets_lost int default 0,
  points int default 0,
  status text default 'active' check (status in ('active', 'eliminated', 'winner')),
  created_at timestamp default now()
);

-- matches table
create table matches (
  id uuid default gen_random_uuid() primary key,
  player1_id uuid references players(id),
  player2_id uuid references players(id),
  player1_name text,
  player2_name text,
  score1 int default 0,
  score2 int default 0,
  sets jsonb,
  gender text check (gender in ('men', 'women')),
  round text,
  status text default 'upcoming' check (status in ('upcoming', 'live', 'finished')),
  scheduled_at timestamp,
  finished_at timestamp,
  created_at timestamp default now()
);

-- gallery table
create table gallery (
  id uuid default gen_random_uuid() primary key,
  image_url text not null,
  caption text,
  match_id uuid references matches(id),
  uploaded_at timestamp default now()
);

-- settings table (for tournament info)
create table settings (
  id uuid default gen_random_uuid() primary key,
  key text unique not null,
  value jsonb,
  updated_at timestamp default now()
);

-- Insert default settings
insert into settings (key, value) values 
('general', '{"tournamentName": "COM7 Ping Pong League 2026", "totalPlayers": 0, "totalMatches": 0}');

-- Enable Row Level Security (RLS)
alter table players enable row level security;
alter table matches enable row level security;
alter table gallery enable row level security;
alter table settings enable row level security;

-- RLS Policies
-- Public can read all tables
create policy "Public can read players" on players for select using (true);
create policy "Public can read matches" on matches for select using (true);
create policy "Public can read gallery" on gallery for select using (true);
create policy "Public can read settings" on settings for select using (true);

-- Only authenticated users can write
create policy "Authenticated users can insert players" on players for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update players" on players for update using (auth.role() = 'authenticated');
create policy "Authenticated users can delete players" on players for delete using (auth.role() = 'authenticated');

create policy "Authenticated users can insert matches" on matches for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update matches" on matches for update using (auth.role() = 'authenticated');
create policy "Authenticated users can delete matches" on matches for delete using (auth.role() = 'authenticated');

create policy "Authenticated users can insert gallery" on gallery for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update gallery" on gallery for update using (auth.role() = 'authenticated');
create policy "Authenticated users can delete gallery" on gallery for delete using (auth.role() = 'authenticated');

create policy "Authenticated users can update settings" on settings for update using (auth.role() = 'authenticated');

-- ─── ADMIN WRITE POLICIES (anon allowed for internal admin tool) ───────────────
-- Run these in Supabase SQL Editor to allow admin operations without auth:
--
-- drop policy if exists "Authenticated users can insert players" on players;
-- drop policy if exists "Authenticated users can update players" on players;
-- drop policy if exists "Authenticated users can delete players" on players;
-- drop policy if exists "Authenticated users can insert matches" on matches;
-- drop policy if exists "Authenticated users can update matches" on matches;
-- drop policy if exists "Authenticated users can delete matches" on matches;
--
-- create policy "Allow all insert players" on players for insert with check (true);
-- create policy "Allow all update players" on players for update using (true);
-- create policy "Allow all delete players" on players for delete using (true);
-- create policy "Allow all insert matches" on matches for insert with check (true);
-- create policy "Allow all update matches" on matches for update using (true);
-- create policy "Allow all delete matches" on matches for delete using (true);
-- create policy "Allow all update settings" on settings for update using (true);

-- Enable realtime for tables
alter publication supabase_realtime add table players;
alter publication supabase_realtime add table matches;
alter publication supabase_realtime add table gallery; 
