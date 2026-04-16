#!/usr/bin/env node
/**
 * Verify ATS platforms and slugs for companies to be added
 * Usage: npx tsx scripts/verify-companies.ts
 */

const companies = [
  { name: "Anthropic", url: "https://www.anthropic.com/careers" },
  { name: "Mistral", url: "https://www.mistral.ai/careers" },
  { name: "Cohere", url: "https://www.cohere.com/careers" },
  { name: "LangChain", url: "https://www.langchain.com/careers" },
  { name: "Pinecone", url: "https://www.pinecone.io/careers" },
  { name: "ElevenLabs", url: "https://www.elevenlabs.io/careers" },
  { name: "Deepgram", url: "https://www.deepgram.com/careers" },
  { name: "Hume AI", url: "https://www.hume.ai/careers" },
  { name: "Retool", url: "https://www.retool.com/careers" },
  { name: "Temporal", url: "https://www.temporal.io/careers" },
  { name: "Glean", url: "https://www.glean.com/careers" },
  { name: "Arize AI", url: "https://www.arize.com/careers" },
  { name: "n8n", url: "https://n8n.io/careers" },
  { name: "Zapier", url: "https://www.zapier.com/jobs" },
  { name: "Factorial", url: "https://factorialhr.com/careers" },
  { name: "Attio", url: "https://www.attio.com/careers" },
  { name: "Tinybird", url: "https://www.tinybird.com/careers" },
  { name: "Sierra AI", url: "https://www.sierra.ai/careers" },
  { name: "Ada", url: "https://www.ada.com/careers" },
  { name: "Weights & Biases", url: "https://www.wandb.com/careers" },
  { name: "Langfuse", url: "https://langfuse.com/careers" }
]

const GREENHOUSE_PATTERNS = [
  'boards.greenhouse.io/',
  'greenhouse.io/',
  'jobs.greenhouse.io/',
]

const LEVER_PATTERNS = [
  'jobs.lever.co/',
  'lever.co/',
]

const ASHBY_PATTERNS = [
  'jobs.ashbyhq.com/',
  'ashbyhq.com/',
]

async function checkCompany(company: { name: string; url: string }) {
  try {
    const response = await fetch(company.url)
    const html = await response.text()

    let atsPlatform: string | null = null
    let slug: string | null = null

    // Check for ATS patterns in HTML
    const lowerHtml = html.toLowerCase()

    for (const pattern of GREENHOUSE_PATTERNS) {
      if (lowerHtml.includes(pattern)) {
        atsPlatform = 'greenhouse'
        break
      }
    }

    for (const pattern of LEVER_PATTERNS) {
      if (lowerHtml.includes(pattern)) {
        atsPlatform = atsPlatform || 'lever'
        break
      }
    }

    for (const pattern of ASHBY_PATTERNS) {
      if (lowerHtml.includes(pattern)) {
        atsPlatform = atsPlatform || 'ashby'
        break
      }
    }

    // Extract slug from ATS URLs
    if (atsPlatform === 'greenhouse') {
      const match = html.match(/boards\.greenhouse\.io\/([^\/"']+)/)
      if (match) slug = match[1]
    } else if (atsPlatform === 'lever') {
      const match = html.match(/jobs\.lever\.co\/([^\/"']+)/)
      if (match) slug = match[1]
    } else if (atsPlatform === 'ashby') {
      const match = html.match(/jobs\.ashbyhq\.com\/([^\/"']+)/)
      if (match) slug = match[1]
    }

    return {
      company: company.name,
      atsPlatform: atsPlatform,
      slug,
      verified: !!atsPlatform
    }
  } catch (error) {
    return {
      company: company.name,
      atsPlatform: null,
      slug: null,
      verified: false,
      error: (error as Error).message
    }
  }
}

async function main() {
  console.log('🔍 Verifying ATS platforms for 22 companies...\n')

  for (const company of companies) {
    const result = await checkCompany(company)

    if (result.verified) {
      console.log(`✅ ${result.company}`)
      console.log(`   ATS: ${result.atsPlatform}`)
      console.log(`   Slug: ${result.slug}`)
    } else {
      console.log(`❌ ${result.company}`)
      console.log(`   Error: ${result.error}`)
    }
    console.log()
  }

  console.log(`\n✅ Verification complete. Add the verified companies above.`)
}

main()
