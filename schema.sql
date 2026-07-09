create extension if not exists "uuid-ossp";

create table if not exists organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamptz default now()
);

create table if not exists projects (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id),
  name text not null,
  status text,
  health integer default 0,
  owner text,
  gc text,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists equipment (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade,
  item text not null,
  manufacturer text,
  model text,
  serial text,
  room text,
  elevation text,
  dimensions jsonb default '{}',
  weight_lbs numeric,
  startup_status text default 'Unknown',
  delivery_status text default 'Unknown',
  warranty_status text default 'Unknown',
  utilities jsonb default '{}',
  logistics jsonb default '{}',
  notes text[],
  qr_code text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists mep_verifications (
  id uuid primary key default uuid_generate_v4(),
  equipment_id uuid references equipment(id) on delete cascade,
  utility_type text not null,
  status text not null check (status in ('Verified','Missing','Needed','Unknown','N/A')),
  notes text,
  photo_url text,
  drawing_reference text,
  schedule_reference text,
  verified_by text,
  verified_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists documents (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade,
  equipment_id uuid references equipment(id),
  filename text not null,
  document_type text,
  storage_path text,
  extracted_text text,
  summary text,
  ai_tags text[],
  created_at timestamptz default now()
);

create table if not exists action_items (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade,
  equipment_id uuid references equipment(id),
  title text not null,
  priority text default 'Normal',
  owner text,
  status text default 'Open',
  due_date date,
  source text,
  created_at timestamptz default now()
);

create table if not exists audit_log (
  id uuid primary key default uuid_generate_v4(),
  actor text,
  action text not null,
  entity_type text,
  entity_id text,
  before jsonb,
  after jsonb,
  created_at timestamptz default now()
);

create table if not exists ai_answers (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade,
  question text not null,
  answer text not null,
  citations jsonb default '[]',
  confidence numeric,
  created_at timestamptz default now()
);
