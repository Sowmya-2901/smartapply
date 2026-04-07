#!/usr/bin/env ts
/**
 * Backfill dedup_key for existing jobs
 *
 * This script should be run once after deploying the dedup_key column
 * to populate the dedup_key field for all existing jobs in the database.
 */

import { createAdminClient } from '../src/lib/supabase/admin'
import { normalizeForDedup } from '../src/lib/utils/dedup'

async function backfillDedupKeys() {
  const supabase = createAdminClient()

  console.log('🔍 Fetching existing jobs...')

  // Fetch all jobs with company information
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select(`
      id,
      company_id,
      title,
      location,
      companies!inner(name)
    `)
    .is('active', true)

  if (error) {
    console.error('❌ Error fetching jobs:', error)
    process.exit(1)
  }

  console.log(`📊 Found ${jobs.length} jobs to process`)

  let processed = 0
  let skipped = 0
  let errors = 0

  for (const job of jobs) {
    try {
      const companyName = job.companies?.[0]?.name || 'Unknown'
      const dedupKey = normalizeForDedup(companyName, job.title, job.location)

      const { error: updateError } = await supabase
        .from('jobs')
        .update({ dedup_key: dedupKey })
        .eq('id', job.id)

      if (updateError) {
        console.error(`❌ Error updating job ${job.id}:`, updateError)
        errors++
      } else {
        processed++
        if (processed <= 10) {
          console.log(`  ✓ ${companyName} - ${job.title} -> ${dedupKey}`)
        }
      }
    } catch (err) {
      console.error(`❌ Error processing job ${job.id}:`, err)
      errors++
    }
  }

  console.log(`\n✅ Done!`)
  console.log(`   Processed: ${processed}`)
  console.log(`   Skipped: ${skipped}`)
  console.log(`   Errors: ${errors}`)

  if (errors > 0) {
    process.exit(1)
  }
}

// Run the backfill
backfillDedupKeys()
  .then(() => {
    console.log('\n🎉 Backfill complete!')
    process.exit(0)
  })
  .catch((err) => {
    console.error('\n❌ Fatal error:', err)
    process.exit(1)
  })
