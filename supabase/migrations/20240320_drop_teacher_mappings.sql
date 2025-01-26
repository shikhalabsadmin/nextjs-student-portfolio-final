-- Drop the teacher_mappings table and related objects
drop trigger if exists handle_updated_at on public.teacher_mappings;
drop function if exists public.handle_updated_at();
drop table if exists public.teacher_mappings; 