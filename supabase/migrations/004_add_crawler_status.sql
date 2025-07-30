-- Add success and error_message columns to crawler_results
ALTER TABLE crawler_results 
ADD COLUMN IF NOT EXISTS success BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS error_message TEXT;