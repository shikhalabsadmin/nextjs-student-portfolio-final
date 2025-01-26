-- 1. Check if status constraint was updated
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
    ON cc.constraint_name = tc.constraint_name
WHERE tc.table_name = 'assignments'
AND cc.check_clause LIKE '%status%';

-- 2. Verify column comments were added
SELECT 
    col.column_name,
    pgd.description
FROM pg_catalog.pg_statio_all_tables st
INNER JOIN pg_catalog.pg_description pgd ON pgd.objoid = st.relid
INNER JOIN information_schema.columns col ON 
    col.table_schema = st.schemaname AND 
    col.table_name = st.relname AND 
    col.ordinal_position = pgd.objsubid
WHERE st.relname = 'assignments'
AND col.column_name IN ('selected_skills', 'skills_justification', 'feedback');

-- 3. Verify that unnecessary tables were dropped
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN ('teacher_assessments', 'verifications', 'responses'); 