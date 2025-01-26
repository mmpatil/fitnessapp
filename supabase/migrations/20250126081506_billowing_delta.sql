/*
  # Add Mood and Mental Health Journal

  1. New Tables
    - `mood_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `date` (date)
      - `mood_rating` (integer, 1-5)
      - `energy_level` (integer, 1-5)
      - `journal_entry` (text)
      - `gratitude_notes` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `mood_logs` table
    - Add policy for authenticated users to manage their own logs
*/

CREATE TABLE IF NOT EXISTS mood_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  mood_rating integer NOT NULL CHECK (mood_rating BETWEEN 1 AND 5),
  energy_level integer NOT NULL CHECK (energy_level BETWEEN 1 AND 5),
  journal_entry text,
  gratitude_notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE mood_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage own mood logs"
  ON mood_logs FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);