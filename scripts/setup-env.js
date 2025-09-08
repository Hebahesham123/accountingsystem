#!/usr/bin/env node

/**
 * Environment Setup Script
 * This script helps you set up environment variables for deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Accounting System - Environment Setup\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
const envExists = fs.existsSync(envPath);

if (envExists) {
  console.log('✅ .env.local file already exists');
  
  // Read and validate the file
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const hasSupabaseUrl = envContent.includes('NEXT_PUBLIC_SUPABASE_URL=');
  const hasSupabaseKey = envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY=');
  
  if (hasSupabaseUrl && hasSupabaseKey) {
    console.log('✅ Supabase environment variables are configured');
  } else {
    console.log('❌ Missing Supabase environment variables');
    console.log('Please add the following to your .env.local file:');
    console.log('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key');
  }
} else {
  console.log('❌ .env.local file not found');
  console.log('\n📝 Create a .env.local file with the following content:');
  console.log('\n# Supabase Configuration');
  console.log('NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key');
  console.log('\n💡 Get these values from your Supabase project dashboard:');
  console.log('   1. Go to Settings → API');
  console.log('   2. Copy the Project URL and anon public key');
}

console.log('\n🚀 For deployment, make sure to:');
console.log('   1. Set environment variables in your deployment platform');
console.log('   2. Add your production domain to Supabase settings');
console.log('   3. Redeploy your application');

console.log('\n📖 See DEPLOYMENT_GUIDE.md for detailed instructions');
