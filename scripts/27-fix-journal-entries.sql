-- Quick Fix for Journal Entries Issue
-- This script ensures the journal entries tables exist and are properly structured

-- Check if journal_entries table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'journal_entries') THEN
        -- Create journal_entries table
        CREATE TABLE journal_entries (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            entry_number VARCHAR(50) UNIQUE NOT NULL,
            entry_date DATE NOT NULL,
            description TEXT NOT NULL,
            reference VARCHAR(100),
            total_debit DECIMAL(15,2) DEFAULT 0,
            total_credit DECIMAL(15,2) DEFAULT 0,
            is_balanced BOOLEAN DEFAULT false,
            period_id UUID REFERENCES accounting_periods(id),
            created_by UUID REFERENCES users(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create indexes
        CREATE INDEX idx_journal_entries_date ON journal_entries(entry_date);
        CREATE INDEX idx_journal_entries_number ON journal_entries(entry_number);
        
        RAISE NOTICE 'Created journal_entries table';
    ELSE
        RAISE NOTICE 'journal_entries table already exists';
    END IF;
END $$;

-- Check if journal_entry_lines table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'journal_entry_lines') THEN
        -- Create journal_entry_lines table
        CREATE TABLE journal_entry_lines (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
            account_id UUID REFERENCES accounts(id),
            description TEXT,
            debit_amount DECIMAL(15,2) DEFAULT 0,
            credit_amount DECIMAL(15,2) DEFAULT 0,
            line_number INTEGER,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            image_data TEXT
        );
        
        -- Create indexes
        CREATE INDEX idx_journal_entry_lines_account ON journal_entry_lines(account_id);
        CREATE INDEX idx_journal_entry_lines_entry ON journal_entry_lines(journal_entry_id);
        
        RAISE NOTICE 'Created journal_entry_lines table';
    ELSE
        RAISE NOTICE 'journal_entry_lines table already exists';
    END IF;
END $$;

-- Check if users table exists (needed for foreign key)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        -- Create users table
        CREATE TABLE users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email VARCHAR(255) UNIQUE NOT NULL,
            name VARCHAR(255) NOT NULL,
            role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'accountant', 'user')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        RAISE NOTICE 'Created users table';
    ELSE
        RAISE NOTICE 'users table already exists';
    END IF;
END $$;

-- Check if accounting_periods table exists (needed for foreign key)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'accounting_periods') THEN
        -- Create accounting_periods table
        CREATE TABLE accounting_periods (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(100) NOT NULL,
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            is_locked BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Insert a default period
        INSERT INTO accounting_periods (id, name, start_date, end_date, is_locked) VALUES
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2024', '2024-01-01', '2024-12-31', false);
        
        RAISE NOTICE 'Created accounting_periods table';
    ELSE
        RAISE NOTICE 'accounting_periods table already exists';
    END IF;
END $$;

-- Test the tables
SELECT 'Testing journal entries tables...' as status;

-- Test basic query
SELECT 
    'journal_entries' as table_name,
    COUNT(*) as record_count
FROM journal_entries;

SELECT 
    'journal_entry_lines' as table_name,
    COUNT(*) as record_count
FROM journal_entry_lines;

-- Test if we can query with joins
SELECT 
    je.entry_number,
    je.entry_date,
    je.description,
    COUNT(jel.id) as line_count
FROM journal_entries je
LEFT JOIN journal_entry_lines jel ON je.id = jel.journal_entry_id
GROUP BY je.id, je.entry_number, je.entry_date, je.description
LIMIT 5;

SELECT 'Journal entries tables are ready!' as final_status;
