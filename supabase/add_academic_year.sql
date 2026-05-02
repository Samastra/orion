-- Migration to add academic_year to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS academic_year text NULL;

-- Update RLS if necessary (usually not needed for adding a column if policies use * or specific names already included)
