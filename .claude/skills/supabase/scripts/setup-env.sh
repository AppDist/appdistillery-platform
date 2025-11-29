#!/bin/bash
# Script to set up Supabase environment variables

echo "Supabase Environment Setup"
echo "=========================="
echo ""
echo "Please provide your Supabase project details:"
echo ""

read -p "Supabase URL (https://xxxxx.supabase.co): " SUPABASE_URL
read -p "Supabase Anon Key: " SUPABASE_ANON_KEY

# Create or update .env file
cat > .env << ENVFILE
# Supabase Configuration
SUPABASE_URL=$SUPABASE_URL
SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY

# Optional: Service Role Key (Backend only - never expose to client!)
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ENVFILE

echo ""
echo "✅ Environment file created: .env"
echo ""
echo "For Next.js projects, create .env.local with:"
echo "NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL"
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY"
echo ""
echo "⚠️  Remember to add .env to your .gitignore file!"
