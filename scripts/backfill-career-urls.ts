/**
 * Backfill Career Page URLs
 *
 * This script generates career page URLs for all companies
 * that are missing them or have empty values.
 *
 * Run: npx tsx scripts/backfill-career-urls.ts
 */

import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Get the directory of this script
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables from .env.local in project root
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

import { createAdminClient } from '../src/lib/supabase/admin'

/**
 * Generate career page URL based on ATS platform and slug
 */
function generateCareersUrl(atsPlatform: string, slug: string): string {
  switch (atsPlatform) {
    case 'greenhouse':
      return `https://boards.greenhouse.io/${slug}`
    case 'lever':
      return `https://jobs.lever.co/${slug}`
    case 'ashby':
      return `https://jobs.ashbyhq.com/${slug}`
    default:
      return ''
  }
}

async function backfillCareerUrls() {
  const supabase = createAdminClient()

  console.log('🔍 Fetching companies without career URLs...')

  // Fetch companies with missing or empty careers_url
  const { data: companies, error } = await supabase
    .from('companies')
    .select('id, name, slug, ats_platform, careers_url')
    .or('careers_url.is.null,careers_url.eq.')

  if (error) {
    console.error('❌ Error fetching companies:', error)
    process.exit(1)
  }

  if (!companies || companies.length === 0) {
    console.log('✅ All companies already have career URLs!')
    process.exit(0)
  }

  console.log(`📊 Found ${companies.length} companies without career URLs`)

  let updated = 0
  let skipped = 0

  for (const company of companies) {
    if (!company.slug || !company.ats_platform) {
      console.log(`⚠️  Skipping ${company.name}: missing slug or ats_platform`)
      skipped++
      continue
    }

    const generatedUrl = generateCareersUrl(company.ats_platform, company.slug)

    if (!generatedUrl) {
      console.log(`⚠️  Skipping ${company.name}: unsupported ATS platform '${company.ats_platform}'`)
      skipped++
      continue
    }

    // Update company with generated careers_url
    const { error: updateError } = await supabase
      .from('companies')
      .update({ careers_url: generatedUrl })
      .eq('id', company.id)

    if (updateError) {
      console.error(`❌ Error updating ${company.name}:`, updateError)
    } else {
      console.log(`✅ ${company.name}: ${generatedUrl}`)
      updated++
    }
  }

  console.log('\n📈 Summary:')
  console.log(`  ✅ Updated: ${updated} companies`)
  console.log(`  ⚠️  Skipped: ${skipped} companies`)
  console.log(`  📊 Total processed: ${companies.length}`)
}

// Run the backfill
backfillCareerUrls()
  .then(() => {
    console.log('\n✨ Backfill complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Backfill failed:', error)
    process.exit(1)
  })
