# Database Setup Instructions

## How to Run the Schema SQL in Supabase

### Step 1: Open Supabase SQL Editor

1. Go to https://supabase.com/dashboard
2. Click on your **smartapply** project
3. In the left sidebar, click **SQL Editor**
4. Click **"New query"**

### Step 2: Copy and Run the Schema

1. Open the file: `src/lib/supabase/schema.sql`
2. Copy **ALL** the SQL code (it's about 400 lines)
3. Paste it into the Supabase SQL Editor
4. Click the **"Run"** button (or press Cmd/Ctrl + Enter)

### Step 3: Verify Tables Were Created

After running the SQL, you should see these tables in your database:

| Table | Purpose |
|-------|---------|
| `companies` | Tech company info + ATS details |
| `jobs` | Job listings from companies |
| `profiles` | User profiles & preferences |
| `resumes` | User resume files |
| `applications` | Application tracker |
| `user_job_matches` | Cached match scores |

You can verify by:
1. Going to **Table Editor** in Supabase
2. You should see all 6 tables listed

### Step 4: Create Storage Bucket for Resumes

1. In Supabase dashboard, click **Storage** in the left sidebar
2. Click **"Create a new bucket"**
3. Enter bucket name: `resumes`
4. **IMPORTANT:** Uncheck "Make bucket public" (keep it private)
5. Click **"Create bucket"**

### Step 5: Set Up Storage Policies

After creating the bucket, go back to the **SQL Editor** and run these storage policies:

```sql
-- Allow users to upload resumes to their own folder
CREATE POLICY "Users can upload their own resumes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'resumes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their own resumes
CREATE POLICY "Users can view their own resumes"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'resumes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own resumes
CREATE POLICY "Users can delete their own resumes"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'resumes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### Step 6: Enable OAuth Providers (Optional)

If you want Google/GitHub login:

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Find **Google** and click to enable
3. Click **"Get Google Client ID"** and follow the prompts
4. Repeat for **GitHub** if desired

---

## What This Schema Creates

### Tables with Row Level Security (RLS)
- Every table has security policies ensuring users can only access their own data
- `companies` and `jobs` are read-only for all authenticated users

### Automatic Features
- **Auto-profile creation:** When a user signs up, a `profiles` row is created automatically
- **Timestamp updates:** `updated_at` columns update automatically on changes
- **Cascade deletes:** Deleting a company deletes its jobs, etc.

### Storage
- Private `resumes` bucket for storing resume files (.docx, .pdf)
- Files are organized per user: `resumes/{user_id}/{filename}`

---

## Troubleshooting

**Error: "relation already exists"**
- The tables were already created. You can skip the setup or drop tables first.

**Error: "permission denied"**
- Make sure you're running this as the project owner (not an anonymous user).

**Storage bucket creation failed**
- Make sure you have the right permissions in your Supabase project.

---

## After Setup

Once the database is set up, you can:
1. Test the connection by starting the Next.js dev server
2. Run `npm run dev` and visit http://localhost:3000
3. The auth pages (which we'll create next) will use this database

Ready to proceed to **Step 1.4: Setup Auth**?
