-- Fix Opening Balances Table Script
-- This script creates the opening_balances table and fixes 406 errors

-- STEP 1: Check if opening_balances table exists
SELECT 
    'Checking opening_balances table:' as info,
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_name = 'opening_balances';

-- STEP 2: Create opening_balances table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.opening_balances (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    balance numeric(15,2) NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT NOW(),
    updated_at timestamptz DEFAULT NOW(),
    UNIQUE(account_id)
);

-- STEP 3: Enable RLS on opening_balances
ALTER TABLE public.opening_balances ENABLE ROW LEVEL SECURITY;

-- STEP 4: Drop existing policies
DROP POLICY IF EXISTS "Users can view opening balances" ON public.opening_balances;
DROP POLICY IF EXISTS "Users can insert opening balances" ON public.opening_balances;
DROP POLICY IF EXISTS "Users can update opening balances" ON public.opening_balances;
DROP POLICY IF EXISTS "Users can delete opening balances" ON public.opening_balances;

-- STEP 5: Create RLS policies for opening_balances
CREATE POLICY "Users can view opening balances" ON public.opening_balances
    FOR SELECT USING (true);

CREATE POLICY "Users can insert opening balances" ON public.opening_balances
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update opening balances" ON public.opening_balances
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete opening balances" ON public.opening_balances
    FOR DELETE USING (true);

-- STEP 6: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_opening_balances_account_id ON public.opening_balances(account_id);

-- STEP 7: Insert default opening balances for existing accounts
INSERT INTO public.opening_balances (account_id, balance)
SELECT 
    a.id,
    0.00
FROM public.accounts a
WHERE NOT EXISTS (
    SELECT 1 FROM public.opening_balances ob 
    WHERE ob.account_id = a.id
);

-- STEP 8: Check the results
SELECT 
    'Opening balances created:' as info,
    COUNT(*) as total_balances,
    SUM(balance) as total_amount
FROM public.opening_balances;

-- STEP 9: Show sample opening balances
SELECT 
    'Sample opening balances:' as info,
    ob.account_id,
    a.name as account_name,
    a.code as account_code,
    ob.balance
FROM public.opening_balances ob
JOIN public.accounts a ON ob.account_id = a.id
ORDER BY a.code
LIMIT 10;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '=== OPENING BALANCES TABLE FIXED ===';
    RAISE NOTICE '1. opening_balances table created/verified';
    RAISE NOTICE '2. RLS policies created';
    RAISE NOTICE '3. Default opening balances inserted';
    RAISE NOTICE '4. 406 errors should be resolved';
END $$;
