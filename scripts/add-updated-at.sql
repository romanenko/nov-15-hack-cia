-- Add updated_at column to users table if it doesn't exist
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Update existing rows to have updated_at same as created_at
UPDATE public.users
SET updated_at = created_at
WHERE updated_at IS NULL;
