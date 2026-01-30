-- Migration: Add tailor_id to fabrics table
-- Run this in Supabase SQL Editor

-- Add tailor_id column to fabrics table
ALTER TABLE fabrics
ADD COLUMN IF NOT EXISTS tailor_id TEXT REFERENCES tailors(id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_fabrics_tailor_id ON fabrics(tailor_id);

-- Optional: Update existing fabrics to assign to a default tailor
-- UPDATE fabrics SET tailor_id = 'your-tailor-id' WHERE tailor_id IS NULL;
