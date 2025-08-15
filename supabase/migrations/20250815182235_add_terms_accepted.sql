-- Add missing terms_accepted column to dealer_applications table
ALTER TABLE dealer_applications 
ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT FALSE;

-- Update existing records to have terms_accepted = true (assuming they were accepted when created)
UPDATE dealer_applications SET terms_accepted = TRUE WHERE terms_accepted IS NULL;
