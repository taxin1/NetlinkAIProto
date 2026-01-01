-- Create AI trainer memory table to store user-specific training data
create table if not exists public.ai_trainer_memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  memory_type text not null check (memory_type in ('email_style', 'networking_preference', 'communication_pattern', 'contact_insight', 'event_context', 'custom')),
  memory_key text not null,
  memory_value text not null,
  metadata jsonb,
  importance_score integer default 1 check (importance_score >= 1 and importance_score <= 10),
  usage_count integer default 0,
  last_used_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(user_id, memory_type, memory_key)
);

-- Create AI trainer status table
create table if not exists public.ai_trainer_status (
  user_id uuid primary key references auth.users(id) on delete cascade,
  is_training boolean default false,
  last_trained_at timestamp with time zone,
  training_progress integer default 0 check (training_progress >= 0 and training_progress <= 100),
  total_memories integer default 0,
  model_version text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.ai_trainer_memories enable row level security;
alter table public.ai_trainer_status enable row level security;

-- AI trainer memories policies
create policy "Users can view their own AI memories"
  on public.ai_trainer_memories for select
  using (auth.uid() = user_id);

create policy "Users can insert their own AI memories"
  on public.ai_trainer_memories for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own AI memories"
  on public.ai_trainer_memories for update
  using (auth.uid() = user_id);

create policy "Users can delete their own AI memories"
  on public.ai_trainer_memories for delete
  using (auth.uid() = user_id);

-- AI trainer status policies
create policy "Users can view their own AI trainer status"
  on public.ai_trainer_status for select
  using (auth.uid() = user_id);

create policy "Users can insert their own AI trainer status"
  on public.ai_trainer_status for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own AI trainer status"
  on public.ai_trainer_status for update
  using (auth.uid() = user_id);

-- Create indexes
create index if not exists ai_trainer_memories_user_id_idx on public.ai_trainer_memories(user_id);
create index if not exists ai_trainer_memories_type_idx on public.ai_trainer_memories(user_id, memory_type);
create index if not exists ai_trainer_memories_importance_idx on public.ai_trainer_memories(user_id, importance_score desc);

-- Create function to update updated_at timestamp
create trigger update_ai_trainer_memories_updated_at
  before update on public.ai_trainer_memories
  for each row
  execute function update_updated_at_column();

create trigger update_ai_trainer_status_updated_at
  before update on public.ai_trainer_status
  for each row
  execute function update_updated_at_column();
