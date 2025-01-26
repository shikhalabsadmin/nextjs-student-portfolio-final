-- Create teacher_mappings table
create table if not exists public.teacher_mappings (
  id uuid default gen_random_uuid() primary key,
  teacher_id uuid references public.profiles(id) not null,
  subject text not null,
  grade text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(teacher_id, subject, grade)
);

-- Add RLS policies
alter table public.teacher_mappings enable row level security;

create policy "Allow admin to manage teacher mappings"
  on public.teacher_mappings
  for all
  to authenticated
  using (auth.jwt()->>'email' = 'admin@shikha.ai');

create policy "Allow teachers to view their own mappings"
  on public.teacher_mappings
  for select
  to authenticated
  using (teacher_id = auth.uid());

-- Add function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

-- Add trigger to update updated_at
create trigger handle_updated_at
  before update
  on public.teacher_mappings
  for each row
  execute function public.handle_updated_at(); 