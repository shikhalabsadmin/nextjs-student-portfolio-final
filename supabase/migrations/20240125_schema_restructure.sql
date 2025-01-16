-- Drop existing tables if they exist
DROP TABLE IF EXISTS teacher_assessments CASCADE;
DROP TABLE IF EXISTS verifications CASCADE;
DROP TABLE IF EXISTS responses CASCADE;
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS assignment_skills CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS assignment_groups CASCADE;
DROP TABLE IF EXISTS template_questions CASCADE;
DROP TABLE IF EXISTS assignment_templates CASCADE;
DROP TABLE IF EXISTS skills CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Create tables
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role TEXT NOT NULL CHECK (role IN ('TEACHER', 'STUDENT')),
    grade TEXT,
    subjects TEXT[],
    full_name TEXT NOT NULL,
    grade_levels TEXT[],
    teaching_subjects JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE assignment_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic TEXT NOT NULL,
    normalized_topic TEXT GENERATED ALWAYS AS (
        lower(regexp_replace(trim(topic), '\s+', ' ', 'g'))
    ) STORED,
    keywords TEXT[],
    subject TEXT NOT NULL,
    description TEXT,
    teacher_id UUID REFERENCES profiles(id),
    grade_levels TEXT[],
    topic_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', topic || ' ' || COALESCE(description, ''))
    ) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES assignment_groups(id),
    student_id UUID REFERENCES profiles(id),
    teacher_id UUID REFERENCES profiles(id),
    type TEXT NOT NULL CHECK (type IN ('TEACHER_CREATED', 'STUDENT_INITIATED')),
    title TEXT NOT NULL,
    description TEXT,
    subject TEXT NOT NULL,
    grade TEXT NOT NULL,
    status TEXT NOT NULL,
    template_data JSONB,
    artifact_url TEXT,
    artifact_type TEXT,
    is_team_work BOOLEAN DEFAULT false,
    is_original_work BOOLEAN DEFAULT true,
    display_layout JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID REFERENCES assignments(id),
    student_id UUID REFERENCES profiles(id),
    status TEXT NOT NULL CHECK (status IN ('DRAFT', 'SUBMITTED', 'VERIFIED', 'PUBLISHED')),
    feedback JSONB,
    submitted_at TIMESTAMP WITH TIME ZONE,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID REFERENCES assignments(id),
    question_key TEXT NOT NULL,
    response_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID REFERENCES assignments(id),
    teacher_id UUID REFERENCES profiles(id),
    status TEXT NOT NULL,
    verification_skills JSONB,
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE teacher_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    verification_id UUID REFERENCES verifications(id),
    selected_skills TEXT[],
    skills_justification TEXT,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE assignment_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    grade INTEGER,
    metadata JSONB,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE template_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID REFERENCES assignment_templates(id),
    type TEXT NOT NULL,
    label TEXT NOT NULL,
    hint TEXT,
    tags TEXT[],
    required BOOLEAN DEFAULT false,
    order_index INTEGER,
    options TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    subject TEXT[],
    grade_level TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE assignment_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID REFERENCES assignments(id),
    skill_id UUID REFERENCES skills(id),
    level TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_assignment_groups_topic ON assignment_groups (normalized_topic);
CREATE INDEX idx_assignment_groups_topic_vector ON assignment_groups USING gin(topic_vector);
CREATE INDEX idx_assignments_group ON assignments(group_id);
CREATE INDEX idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX idx_verifications_assignment ON verifications(assignment_id);
CREATE INDEX idx_assignment_skills_assignment ON assignment_skills(assignment_id);
CREATE INDEX idx_assignment_skills_skill ON assignment_skills(skill_id);

-- Create topic matching function
CREATE OR REPLACE FUNCTION find_matching_assignment_group(
    p_topic text,
    p_grade text,
    p_subject text
) RETURNS uuid 
LANGUAGE plpgsql
AS $function$
DECLARE
    v_group_id uuid;
BEGIN
    -- First try exact match
    SELECT id INTO v_group_id
    FROM assignment_groups
    WHERE normalized_topic = lower(regexp_replace(trim(p_topic), '\s+', ' ', 'g'))
    AND p_grade = ANY(grade_levels)
    AND subject = p_subject;
    
    -- If no exact match, try fuzzy match using text search
    IF v_group_id IS NULL THEN
        SELECT id INTO v_group_id
        FROM assignment_groups
        WHERE topic_vector @@ to_tsquery('english', regexp_replace(trim(p_topic), '\s+', ' & ', 'g'))
        AND p_grade = ANY(grade_levels)
        AND subject = p_subject
        ORDER BY ts_rank(topic_vector, to_tsquery('english', regexp_replace(trim(p_topic), '\s+', ' & ', 'g'))) DESC
        LIMIT 1;
    END IF;
    
    RETURN v_group_id;
END;
$function$; 