/*
  # Initial Schema for Postpartum Recovery Tracker

  1. New Tables
    - `profiles`
      - User profile information including delivery details
    - `measurements`
      - Weekly body measurements
    - `exercise_logs`
      - Exercise tracking
    - `supplement_logs`
      - Supplement tracking

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  username text NOT NULL,
  delivery_type text NOT NULL CHECK (delivery_type IN ('c-section', 'vaginal')),
  delivery_date date NOT NULL,
  pre_pregnancy_weight numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create measurements table
CREATE TABLE IF NOT EXISTS measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  date date NOT NULL,
  weight numeric,
  waist_size numeric,
  hip_size numeric,
  bust_size numeric,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create exercise_logs table
CREATE TABLE IF NOT EXISTS exercise_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  date date NOT NULL,
  exercise_type text NOT NULL,
  duration_minutes integer NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create supplement_logs table
CREATE TABLE IF NOT EXISTS supplement_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  date date NOT NULL,
  supplement_name text NOT NULL,
  taken boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplement_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Measurements policies
CREATE POLICY "Users can manage own measurements"
  ON measurements FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Exercise logs policies
CREATE POLICY "Users can manage own exercise logs"
  ON exercise_logs FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Supplement logs policies
CREATE POLICY "Users can manage own supplement logs"
  ON supplement_logs FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);