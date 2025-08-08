/**
 * Production smoke test for student assignment create → draft save → submit → verify state changes.
 * Run with: ts-node scripts/prod-test-assignment.ts
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // eslint-disable-next-line no-console
  console.error('Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  const testEmail = 'shlok.bhatt@shikhaacademy.org';
  // 1) Resolve student profile
  const { data: profile, error: pErr } = await supabase
    .from('profiles')
    .select('id, email, role')
    .eq('email', testEmail)
    .single();
  if (pErr || !profile) throw new Error('Profile not found: ' + (pErr?.message || '')); 

  // 2) Create draft assignment
  const draft = {
    student_id: profile.id,
    title: `[TEST] Auto Smoke ${new Date().toISOString()}`,
    subject: 'Science',
    grade: '9',
    status: 'DRAFT',
    artifact_type: 'Project',
    month: new Date().toLocaleString('default', { month: 'long' }),
    selected_skills: ['Critical Thinking'],
    skills_justification: 'Demonstrated problem-solving.',
    pride_reason: 'First working prototype.',
    creation_process: 'Followed steps A→B→C.',
    learnings: 'Understood oscillation basics.',
    challenges: 'Measurement noise.',
    improvements: 'Better sensors.',
    acknowledgments: 'Teacher and peers.',
  };
  const { data: created, error: cErr } = await supabase
    .from('assignments')
    .insert(draft)
    .select('*')
    .single();
  if (cErr || !created) throw new Error('Create failed: ' + (cErr?.message || ''));

  // 3) Validate required fields persisted
  const required = ['title','subject','artifact_type','status'];
  for (const key of required) {
    if (!created[key]) throw new Error(`Missing required persisted field: ${key}`);
  }

  // 4) Submit assignment
  const { data: submitted, error: sErr } = await supabase
    .from('assignments')
    .update({ status: 'SUBMITTED', submitted_at: new Date().toISOString() })
    .eq('id', created.id)
    .eq('student_id', profile.id)
    .select('*')
    .single();
  if (sErr || !submitted) throw new Error('Submit failed: ' + (sErr?.message || ''));
  if (submitted.status !== 'SUBMITTED') throw new Error('Status did not change to SUBMITTED');

  // 5) Re-fetch and sanity check
  const { data: fetched, error: fErr } = await supabase
    .from('assignments')
    .select('*')
    .eq('id', created.id)
    .single();
  if (fErr || !fetched) throw new Error('Fetch after submit failed: ' + (fErr?.message || ''));
  if (!fetched.submitted_at) throw new Error('submitted_at not set');

  // eslint-disable-next-line no-console
  console.log('PASS: Created → Submitted OK', { id: created.id, title: created.title });
}

run().catch((e) => {
  // eslint-disable-next-line no-console
  console.error('FAIL:', e);
  process.exit(1);
});

