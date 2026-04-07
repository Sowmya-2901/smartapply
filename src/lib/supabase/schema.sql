-- ============================================================================
-- SmartApply Database Schema
-- ============================================================================
-- Run this in your Supabase dashboard:
-- 1. Go to SQL Editor (https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql)
-- 2. Paste this entire file
-- 3. Click "Run" to execute
-- ============================================================================

-- ============================================================================
-- ENABLE UUID EXTENSION
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: companies
-- Stores tech company information and ATS platform details
-- ============================================================================
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,                    -- Board token for ATS API (e.g., "stripe" for Greenhouse)
  ats_platform TEXT NOT NULL CHECK (ats_platform IN ('greenhouse', 'lever', 'ashby', 'remoteok', 'other')),
  careers_url TEXT,
  website_url TEXT,
  employee_count INTEGER,
  industry TEXT,
  is_staffing_agency BOOLEAN DEFAULT false,
  staffing_detection_score INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  last_polled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for companies
CREATE INDEX IF NOT EXISTS idx_companies_ats_platform ON companies(ats_platform);
CREATE INDEX IF NOT EXISTS idx_companies_is_staffing_agency ON companies(is_staffing_agency);
CREATE INDEX IF NOT EXISTS idx_companies_last_polled ON companies(last_polled_at);

-- ============================================================================
-- TABLE: jobs
-- Stores job listings ingested from ATS APIs
-- ============================================================================
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,             -- Job ID from ATS API
  dedup_key TEXT,                        -- Normalized company::title::location for dedup
  title TEXT NOT NULL,
  description_html TEXT,                  -- Raw HTML from API
  description_text TEXT,                  -- Cleaned plain text
  location TEXT,
  remote_type TEXT CHECK (remote_type IN ('remote', 'hybrid', 'onsite') OR remote_type IS NULL),
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency TEXT DEFAULT 'USD',
  department TEXT,
  employment_type TEXT CHECK (employment_type IN ('full_time', 'contract', 'part_time', 'intern')),
  required_skills TEXT[],                 -- Array of skills extracted from JD
  parsed_experience_years INTEGER,       -- Years of experience parsed from JD
  seniority_level TEXT,
  apply_url TEXT NOT NULL,               -- Direct application link
  source_api TEXT NOT NULL,
  filter_tags TEXT[],                    -- Tags: 'requires_us_citizenship', 'contract_job', etc.
  is_active BOOLEAN DEFAULT true,
  posted_at TIMESTAMPTZ,
  discovered_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Prevent duplicate jobs from the same company
  UNIQUE (company_id, external_id),
  UNIQUE (dedup_key)                     -- Prevent duplicate jobs across sources
);

-- Indexes for jobs
CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_is_active ON jobs(is_active);
CREATE INDEX IF NOT EXISTS idx_jobs_discovered_at ON jobs(discovered_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_filter_tags ON jobs USING GIN(filter_tags);
CREATE INDEX IF NOT EXISTS idx_jobs_employment_type ON jobs(employment_type);
CREATE INDEX IF NOT EXISTS idx_jobs_company_title_location ON jobs(company_id, title, location);

-- ============================================================================
-- TABLE: profiles
-- Stores user profile, preferences, and resume rules
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  current_salary INTEGER,
  expected_salary INTEGER,
  work_authorization TEXT,
  willing_to_relocate BOOLEAN,
  notice_period TEXT,
  screening_answers JSONB DEFAULT '{}',

  -- Job search preferences
  job_titles TEXT[],                     -- Array of preferred job titles
  locations TEXT[],                      -- Array of preferred locations
  remote_preference TEXT CHECK (remote_preference IN ('remote', 'hybrid', 'onsite', 'any')),
  min_salary INTEGER,
  experience_years INTEGER,
  seniority_preferences TEXT[],
  no_new_grad BOOLEAN DEFAULT true,
  no_contract BOOLEAN DEFAULT true,
  visa_sponsorship_required BOOLEAN DEFAULT false,
  us_citizen_only_filter BOOLEAN DEFAULT false,
  excluded_companies TEXT[],
  company_size_preference TEXT[],
  freshness_preference TEXT DEFAULT 'all',
  match_threshold INTEGER DEFAULT 60,

  -- Resume rules
  formatting_rules TEXT,
  content_rules TEXT,
  banned_words TEXT[],
  custom_rules TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_experience_years ON profiles(experience_years);

-- ============================================================================
-- TABLE: resumes
-- Stores user resume files (raw, master optimized, and job-tailored versions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('raw_base', 'master_optimized', 'job_tailored')),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,  -- Only for 'job_tailored' type
  file_url TEXT,                        -- Supabase Storage URL for .docx
  pdf_url TEXT,                         -- Supabase Storage URL for .pdf
  parsed_text TEXT,                     -- Full text content
  parsed_skills TEXT[],                  -- Extracted skills array
  change_summary JSONB,                  -- For tailored versions: skills added, bullets modified, etc.
  is_current BOOLEAN DEFAULT true,      -- For base/master: marks the active version
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for resumes
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_type ON resumes(type);
CREATE INDEX IF NOT EXISTS idx_resumes_is_current ON resumes(is_current);
CREATE INDEX IF NOT EXISTS idx_resumes_job_id ON resumes(job_id);

-- ============================================================================
-- TABLE: applications
-- Stores user job application tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('saved', 'applied', 'phone_screen', 'interview', 'offer', 'accepted', 'rejected', 'withdrawn')) DEFAULT 'saved',
  match_score_at_application INTEGER,
  applied_at TIMESTAMPTZ,
  status_updated_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT,
  follow_up_date DATE,
  jd_snapshot TEXT NOT NULL             -- Full JD text saved at application time
);

-- Indexes for applications
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_applied_at ON applications(applied_at DESC);

-- ============================================================================
-- TABLE: user_job_matches
-- Caches match scores per user per job for fast dashboard loading
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_job_matches (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  match_score INTEGER NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
  skill_matches JSONB,                   -- {matched: [], missing: [], adjacent: []}
  breakdown JSONB DEFAULT '{"skills":0,"experience":0,"location":0,"title":0,"salary":0}',
  gate_failed TEXT,                      -- "skills" | "title" | null
  calculated_at TIMESTAMPTZ DEFAULT now(),

  PRIMARY KEY (user_id, job_id)
);

-- Indexes for user_job_matches
CREATE INDEX IF NOT EXISTS idx_user_job_matches_match_score ON user_job_matches(match_score);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_job_matches ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- COMPANIES: Read-only for all authenticated users
-- ============================================================================
CREATE POLICY "Allow authenticated users to read companies"
ON companies FOR SELECT
TO authenticated
USING (true);

-- ============================================================================
-- JOBS: Read-only for all authenticated users
-- ============================================================================
CREATE POLICY "Allow authenticated users to read jobs"
ON jobs FOR SELECT
TO authenticated
USING (true);

-- ============================================================================
-- PROFILES: Users can only access their own profile
-- ============================================================================
CREATE POLICY "Allow users to view their own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Allow users to insert their own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow users to update their own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ============================================================================
-- RESUMES: Users can only access their own resumes
-- ============================================================================
CREATE POLICY "Allow users to view their own resumes"
ON resumes FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert their own resumes"
ON resumes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own resumes"
ON resumes FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own resumes"
ON resumes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================================================
-- APPLICATIONS: Users can only access their own applications
-- ============================================================================
CREATE POLICY "Allow users to view their own applications"
ON applications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert their own applications"
ON applications FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own applications"
ON applications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own applications"
ON applications FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================================================
-- USER_JOB_MATCHES: Users can only read their own matches
-- ============================================================================
CREATE POLICY "Allow users to view their own job matches"
ON user_job_matches FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Allow service role to manage job matches"
ON user_job_matches FOR ALL
TO service_role
USING (true);

-- ============================================================================
-- SUPABASE STORAGE: Create 'resumes' bucket
-- ============================================================================
-- This will be created via the Supabase dashboard UI or a separate API call
-- See instructions below

-- ============================================================================
-- FUNCTIONS: Automatic timestamp updates
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTION: Auto-create profile on user signup
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto-profile creation
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- COMPLETE!
-- ============================================================================
-- Your database schema is now ready!
--
-- Next steps:
-- 1. Create the 'resumes' storage bucket in Supabase Storage
-- 2. Set up storage policies (see instructions below)
-- ============================================================================

-- ============================================================================
-- STORAGE BUCKET SETUP (Run this separately in Supabase Storage UI)
-- ============================================================================
-- 1. Go to Storage in your Supabase dashboard
-- 2. Click "Create a new bucket"
-- 3. Name it: "resumes"
-- 4. Make it: Private (not public)
-- 5. Click "Create bucket"
--
-- Then run these SQL commands in the SQL Editor for storage policies:

-- INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', false);

-- CREATE POLICY "Users can upload their own resumes"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can view their own resumes"
-- ON storage.objects FOR SELECT
-- TO authenticated
-- USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can delete their own resumes"
-- ON storage.objects FOR DELETE
-- TO authenticated
-- USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
