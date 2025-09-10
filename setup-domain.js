#!/usr/bin/env node

/**
 * Domain Setup Script for Accounting System
 * This script helps configure the system for domain deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Accounting System - Domain Setup');
console.log('=====================================\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
const envExists = fs.existsSync(envPath);

if (!envExists) {
  console.log('❌ .env.local file not found');
  console.log('📝 Creating .env.local template...\n');
  
  const envTemplate = `# Supabase Configuration
# Replace these with your actual Supabase project credentials
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Example:
# NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Domain Configuration
# Add your domain-specific settings here if needed
# NEXT_PUBLIC_APP_URL=https://yourdomain.com
`;

  try {
    fs.writeFileSync(envPath, envTemplate);
    console.log('✅ .env.local template created');
    console.log('📋 Please update the values in .env.local with your actual Supabase credentials\n');
  } catch (error) {
    console.log('❌ Failed to create .env.local:', error.message);
    console.log('📝 Please create .env.local manually with your Supabase credentials\n');
  }
} else {
  console.log('✅ .env.local file exists');
  
  // Check if it has the required variables
  const envContent = fs.readFileSync(envPath, 'utf8');
  const hasSupabaseUrl = envContent.includes('NEXT_PUBLIC_SUPABASE_URL=');
  const hasSupabaseKey = envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY=');
  
  if (!hasSupabaseUrl || !hasSupabaseKey) {
    console.log('⚠️  .env.local is missing required Supabase variables');
    console.log('📋 Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY\n');
  } else {
    console.log('✅ Required environment variables found\n');
  }
}

console.log('🌐 Domain Deployment Checklist:');
console.log('================================');
console.log('');
console.log('1. ✅ Environment Variables');
console.log('   - NEXT_PUBLIC_SUPABASE_URL set');
console.log('   - NEXT_PUBLIC_SUPABASE_ANON_KEY set');
console.log('');
console.log('2. 🔧 Supabase Configuration');
console.log('   - Go to Supabase Dashboard > Authentication > Settings');
console.log('   - Set Site URL to your domain (e.g., https://yourdomain.com)');
console.log('   - Add redirect URLs:');
console.log('     * https://yourdomain.com/auth/verify-email');
console.log('     * https://yourdomain.com/auth/callback');
console.log('     * https://yourdomain.com/auth/reset-password');
console.log('');
console.log('3. 🔒 Security Settings');
console.log('   - Enable HTTPS on your domain');
console.log('   - Configure CORS in Supabase');
console.log('   - Add your domain to allowed origins');
console.log('');
console.log('4. 🧪 Testing');
console.log('   - Test authentication from your domain');
console.log('   - Check browser console for errors');
console.log('   - Verify all features work correctly');
console.log('');
console.log('📚 Additional Resources:');
console.log('========================');
console.log('- Domain Deployment Fix Guide: DOMAIN_DEPLOYMENT_FIX.md');
console.log('- Domain Configuration Script: scripts/62-domain-configuration.sql');
console.log('- Authentication Setup Guide: AUTHENTICATION_SETUP_GUIDE.md');
console.log('');
console.log('🚀 Ready for domain deployment!');
console.log('Run: npm run build && npm start');
console.log('');

