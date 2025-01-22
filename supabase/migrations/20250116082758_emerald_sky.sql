/*
  # Add name fields to profiles table

  1. Changes
    - Add first_name and last_name columns to profiles table
    - Make them nullable initially to support existing data
    - Add migration to split existing username into first_name and last_name
    - Add check constraints to ensure names are not empty when provided
*/

-- Add new columns
ALTER TABLE profiles
ADD COLUMN first_name text,
ADD COLUMN last_name text;

-- Add check constraints
ALTER TABLE profiles
ADD CONSTRAINT first_name_not_empty CHECK (first_name IS NULL OR length(trim(first_name)) > 0),
ADD CONSTRAINT last_name_not_empty CHECK (last_name IS NULL OR length(trim(last_name)) > 0);

-- Split existing usernames into first and last names
DO $$ 
BEGIN
  UPDATE profiles 
  SET 
    first_name = CASE 
      WHEN username LIKE '% %' THEN split_part(username, ' ', 1)
      ELSE username
    END,
    last_name = CASE 
      WHEN username LIKE '% %' THEN split_part(username, ' ', 2)
      ELSE NULL
    END
  WHERE username IS NOT NULL;
END $$;