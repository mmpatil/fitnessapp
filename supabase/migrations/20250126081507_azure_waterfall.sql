/*
  # Add hydration tracking

  1. New Tables
    - `hydration_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `date` (date)
      - `water_intake_ml` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `hydration_logs` table
    - Add policy for users to manage their own logs
*/

CREATE TABLE IF NOT EXISTS hydration_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  water_intake_ml integer NOT NULL DEFAULT 0 CHECK (water_intake_ml >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE hydration_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage own hydration logs"
  ON hydration_logs FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
