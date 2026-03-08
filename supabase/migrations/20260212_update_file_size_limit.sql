-- Migration to update max file size from 5MB to 50MB
-- Run this migration in your Supabase SQL editor

-- Drop the old constraint
ALTER TABLE images DROP CONSTRAINT IF EXISTS valid_file_size;

-- Add new constraint with 50MB limit (52,428,800 bytes)
ALTER TABLE images ADD CONSTRAINT valid_file_size 
  CHECK (file_size_bytes > 0 AND file_size_bytes <= 52428800);
