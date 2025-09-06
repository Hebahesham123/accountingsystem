-- Add image support to journal entry lines
-- This script adds an image field to store base64 encoded images

-- Add image field to journal_entry_lines table
ALTER TABLE journal_entry_lines 
ADD COLUMN IF NOT EXISTS image_data TEXT;

-- Add comment to explain the image field
COMMENT ON COLUMN journal_entry_lines.image_data IS 'Base64 encoded image data for receipts, invoices, or other supporting documents';

-- Create index for better performance when querying entries with images
CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_image ON journal_entry_lines(image_data) WHERE image_data IS NOT NULL;
