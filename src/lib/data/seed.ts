/**
 * Database Seed Script
 *
 * Imports companies from companies.json into the Supabase database.
 * Can be run with: npx ts-node --compiler-options {\"module\":\"CommonJS\"} src/lib/data/seed.ts
 * Or: tsx src/lib/data/seed.ts (if tsx is installed)
 */

import { createClient } from '@supabase/supabase-js'
import companies from './companies.json'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seed() {
  console.log('🌱 Seeding companies into database...')

  let inserted = 0
  let skipped = 0
  let updated = 0

  for (const company of companies as any[]) {
    try {
      // Check if company already exists (by slug + ats_platform)
      const { data: existing } = await supabase
        .from('companies')
        .select('id')
        .eq('slug', company.slug)
        .eq('ats_platform', company.ats_platform)
        .single()

      if (existing) {
        // Update if needed
        await supabase
          .from('companies')
          .update({
            name: company.name,
            careers_url: company.careers_url,
            website_url: company.website_url,
            employee_count: company.employee_count,
            industry: company.industry,
            verified: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)

        skipped++
        updated++
      } else {
        // Insert new company
        await supabase
          .from('companies')
          .insert({
            name: company.name,
            slug: company.slug,
            ats_platform: company.ats_platform,
            careers_url: company.careers_url,
            website_url: company.website_url,
            employee_count: company.employee_count,
            industry: company.industry,
            is_staffing_agency: false,
            staffing_detection_score: 0,
            verified: true,
            last_polled_at: null
          })

        inserted++
      }
    } catch (error) {
      console.error(`Error inserting company ${company.name}:`, error)
    }
  }

  console.log(`\n✅ Seed complete!`)
  console.log(`   Inserted: ${inserted} new companies`)
  console.log(`   Updated: ${updated} existing companies`)
  console.log(`   Total companies in database: ${companies.length}`)
}

seed()
  .then(() => {
    console.log('\n🎉 Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Seed failed:', error)
    process.exit(1)
  })
