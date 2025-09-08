# Deployment Guide - Fix Sign-In Issues

## Problem
When you deploy your accounting system to GitHub (GitHub Pages, Vercel, Netlify, etc.), the sign-in functionality doesn't work because the Supabase environment variables are missing.

## Solution

### 1. Create Environment Variables File

Create a `.env.local` file in your project root with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**To get these values:**
1. Go to your Supabase project dashboard
2. Click on "Settings" → "API"
3. Copy the "Project URL" and "anon public" key

### 2. Configure Your Deployment Platform

#### For Vercel:
1. Go to your Vercel dashboard
2. Select your project
3. Go to "Settings" → "Environment Variables"
4. Add these variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = your_supabase_url
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your_supabase_anon_key
5. Redeploy your project

#### For Netlify:
1. Go to your Netlify dashboard
2. Select your site
3. Go to "Site settings" → "Environment variables"
4. Add the same variables as above
5. Redeploy your site

#### For GitHub Pages:
GitHub Pages doesn't support environment variables directly. You have two options:

**Option A: Use GitHub Actions with Vercel**
1. Connect your GitHub repo to Vercel
2. Set environment variables in Vercel
3. Deploy automatically from GitHub

**Option B: Build with environment variables**
1. Create a `.env.production` file with your variables
2. Use GitHub Actions to build and deploy

### 3. Update Supabase Settings

In your Supabase project dashboard:

1. **Authentication Settings:**
   - Go to "Authentication" → "Settings"
   - Add your production domain to "Site URL"
   - Add your production domain to "Redirect URLs"

2. **CORS Settings:**
   - Go to "Settings" → "API"
   - Add your production domain to "Additional origins"

### 4. Test Your Deployment

After setting up environment variables:

1. **Check the browser console** for any Supabase connection errors
2. **Test the sign-in functionality** on your deployed site
3. **Verify that the authentication state persists** across page refreshes

### 5. Common Issues and Solutions

#### Issue: "Invalid API key"
**Solution:** Double-check your `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct

#### Issue: "Invalid URL"
**Solution:** Ensure your `NEXT_PUBLIC_SUPABASE_URL` includes `https://` and ends with `.supabase.co`

#### Issue: "CORS error"
**Solution:** Add your production domain to Supabase CORS settings

#### Issue: "Session not persisting"
**Solution:** Check that your domain is added to Supabase redirect URLs

### 6. Security Considerations

- Never commit your `.env.local` file to Git
- Use different Supabase projects for development and production
- Regularly rotate your API keys
- Monitor authentication logs in Supabase

### 7. Quick Fix Script

If you're using Vercel, you can also set environment variables via CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY

# Deploy
vercel --prod
```

## Verification Checklist

- [ ] Environment variables are set in your deployment platform
- [ ] Supabase project URL and key are correct
- [ ] Production domain is added to Supabase settings
- [ ] Site is redeployed after adding environment variables
- [ ] Sign-in form appears and functions correctly
- [ ] Authentication state persists across page refreshes
- [ ] No console errors related to Supabase

## Need Help?

If you're still having issues:

1. Check the browser console for specific error messages
2. Verify your Supabase project is active and not paused
3. Test with a fresh browser session (incognito mode)
4. Check Supabase logs in your project dashboard

The most common cause is missing environment variables, so make sure those are properly configured in your deployment platform!
