#!/bin/bash
# SmartApply Deploy Script
# Usage: ./deploy.sh

# Replace this with your actual Vercel deploy hook URL
DEPLOY_HOOK_URL="https://api.vercel.com/v1/integrations/deploy/prj_cY1GcjGkaIyZPbtBT90xL2R1kpez/svpRnxMiKT"

if [ "$DEPLOY_HOOK_URL" = "YOUR_DEPLOY_HOOK_URL_HERE" ]; then
  echo "❌ Please add your Vercel deploy hook URL to this script first!"
  echo ""
  echo "1. Go to Vercel Dashboard → Project → Settings → Git → Deploy Hooks"
  echo "2. Create a new hook (name it 'manual-deploy')"
  echo "3. Copy the URL and paste it in this script (replace YOUR_DEPLOY_HOOK_URL_HERE)"
  exit 1
fi

echo "🚀 Triggering Vercel deployment..."
curl -s -X POST "$DEPLOY_HOOK_URL" > /dev/null

if [ $? -eq 0 ]; then
  echo "✅ Deploy triggered successfully!"
  echo "📊 Check your dashboard: https://vercel.com/dashboard"
else
  echo "❌ Deploy failed. Check your deploy hook URL."
fi
