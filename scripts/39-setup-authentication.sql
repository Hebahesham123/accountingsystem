-- Authentication Setup Script for Accounting System
-- This script sets up Supabase Auth integration with custom user profiles

-- Enable RLS (Row Level Security) on auth.users table
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create or update users table to sync with auth.users
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'accountant', 'user')),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_profiles
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        'user'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to get current user profile
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS TABLE (
    id UUID,
    email VARCHAR(255),
    name VARCHAR(255),
    role VARCHAR(50),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.id,
        up.email,
        up.name,
        up.role,
        up.avatar_url,
        up.created_at,
        up.updated_at
    FROM public.user_profiles up
    WHERE up.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update user profile
CREATE OR REPLACE FUNCTION public.update_user_profile(
    p_name VARCHAR(255),
    p_avatar_url TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.user_profiles
    SET 
        name = p_name,
        avatar_url = p_avatar_url,
        updated_at = NOW()
    WHERE id = auth.uid();
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing users table to reference auth.users if it exists
-- This is for backward compatibility
DO $$
BEGIN
    -- Check if the old users table exists and has data
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        -- Migrate existing users to user_profiles if they don't exist
        INSERT INTO public.user_profiles (id, email, name, role, created_at, updated_at)
        SELECT 
            gen_random_uuid() as id,
            u.email,
            u.name,
            u.role,
            u.created_at,
            u.updated_at
        FROM public.users u
        WHERE NOT EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.email = u.email
        );
        
        -- Add a note about the migration
        RAISE NOTICE 'Migrated existing users to user_profiles table';
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.user_profiles TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_profile() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_profile(VARCHAR, TEXT) TO anon, authenticated;

-- Create a test user for development (optional)
-- This will be created when the user signs up through the app
-- INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
-- VALUES (
--     gen_random_uuid(),
--     'admin@accounting.com',
--     crypt('password123', gen_salt('bf')),
--     NOW(),
--     NOW(),
--     NOW()
-- );

COMMENT ON TABLE public.user_profiles IS 'User profiles linked to Supabase auth.users';
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates user profile when new user signs up';
COMMENT ON FUNCTION public.get_current_user_profile() IS 'Returns the current authenticated user profile';
COMMENT ON FUNCTION public.update_user_profile(VARCHAR, TEXT) IS 'Updates the current user profile';
