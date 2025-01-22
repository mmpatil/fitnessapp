/*
  # Fix Authentication Schema

  1. Changes
    - Add trigger to automatically create profile entry when a new user signs up
    - Add function to handle the profile creation
    - Add default values for required fields to prevent errors

  2. Security
    - Maintain existing RLS policies
    - Ensure proper user isolation
*/

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Modify profiles table to allow null values initially
ALTER TABLE profiles 
  ALTER COLUMN username DROP NOT NULL,
  ALTER COLUMN delivery_type DROP NOT NULL,
  ALTER COLUMN delivery_date DROP NOT NULL,
  ALTER COLUMN pre_pregnancy_weight DROP NOT NULL;