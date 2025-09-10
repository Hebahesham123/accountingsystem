# Domain Deployment Fix Guide

## Problem
The accounting system has loading issues when accessed from a domain instead of localhost.

## Root Causes Identified

1. **Missing Environment Variables**: No `.env.local` file with Supabase credentials
2. **Supabase Domain Configuration**: Supabase not configured for your domain
3. **Authentication Redirect URLs**: Missing domain-specific redirect URLs
4. **CORS Issues**: Domain not allowed in Supabase settings

## Solutions

### 1. Create Environment Variables

Create a `.env.local` file in your project root with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2. Configure Supabase for Your Domain

In your Supabase dashboard:

1. **Go to Authentication > Settings**
2. **Add your domain to "Site URL"**:
   - For production: `https://yourdomain.com`
   - For staging: `https://staging.yourdomain.com`

3. **Add redirect URLs**:
   - `https://yourdomain.com/auth/verify-email`
   - `https://yourdomain.com/auth/callback`
   - `https://yourdomain.com/auth/reset-password`

4. **Configure CORS**:
   - Add your domain to allowed origins
   - Enable CORS for your domain

### 3. Update Next.js Configuration

The system has been updated with better domain handling in `next.config.mjs`.

### 4. Test Domain Configuration

1. **Check Environment Variables**:
   ```bash
   # Verify variables are loaded
   echo $NEXT_PUBLIC_SUPABASE_URL
   ```

2. **Test Authentication**:
   - Try logging in from your domain
   - Check browser console for errors
   - Verify Supabase connection

3. **Check Network Tab**:
   - Look for failed requests to Supabase
   - Check for CORS errors
   - Verify authentication flow

### 5. Common Domain Issues

#### Issue: "Invalid redirect URL"
**Solution**: Add your domain to Supabase redirect URLs

#### Issue: "CORS error"
**Solution**: Configure CORS in Supabase settings

#### Issue: "Authentication not working"
**Solution**: Check Site URL configuration in Supabase

#### Issue: "Session not persisting"
**Solution**: Verify cookie domain settings

### 6. Production Checklist

- [ ] Environment variables set correctly
- [ ] Supabase Site URL configured
- [ ] Redirect URLs added
- [ ] CORS configured
- [ ] HTTPS enabled
- [ ] Domain DNS configured
- [ ] SSL certificate valid

### 7. Debugging Steps

1. **Check Browser Console**:
   ```javascript
   // Test Supabase connection
   console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
   ```

2. **Test Authentication**:
   ```javascript
   // Check if auth is working
   const { data, error } = await supabase.auth.getSession()
   console.log('Session:', data, 'Error:', error)
   ```

3. **Check Network Requests**:
   - Open DevTools > Network tab
   - Look for failed Supabase requests
   - Check response headers for CORS issues

### 8. Quick Fix Commands

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Start production server
npm start
```

## Next Steps

After implementing these fixes:

1. Test authentication from your domain
2. Verify all features work correctly
3. Check performance and loading times
4. Monitor for any remaining issues

## Support

If issues persist:
1. Check Supabase logs
2. Review browser console errors
3. Verify domain configuration
4. Test with different browsers

