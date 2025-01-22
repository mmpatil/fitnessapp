/*
  # Add weight unit preference

  1. Changes
    - Add weight_unit column to profiles table
    - Set default weight unit to 'kg'
    
  2. Security
    - Maintains existing RLS policies
*/

ALTER TABLE profiles
ADD COLUMN weight_unit text NOT NULL DEFAULT 'kg'
CHECK (weight_unit IN ('kg', 'lbs'));