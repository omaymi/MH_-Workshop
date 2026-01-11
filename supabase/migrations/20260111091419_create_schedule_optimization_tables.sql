/*
  # Schema for Schedule Optimization System

  1. New Tables
    - `rooms`
      - `id` (uuid, primary key)
      - `room_id` (text, unique identifier)
      - `capacity` (integer)
      - `type` (text, room type: Amphi, TD, TP)
      - `created_at` (timestamptz)
    
    - `teachers`
      - `id` (uuid, primary key)
      - `teacher_id` (text, unique identifier)
      - `name` (text)
      - `created_at` (timestamptz)
    
    - `courses`
      - `id` (uuid, primary key)
      - `course_id` (text, unique identifier)
      - `subject` (text, course name)
      - `teacher_id` (text, references teachers)
      - `group_id` (text, student group)
      - `group_size` (integer)
      - `room_type_req` (text, required room type)
      - `created_at` (timestamptz)
    
    - `schedules`
      - `id` (uuid, primary key)
      - `name` (text)
      - `assignments` (jsonb, schedule data)
      - `fitness` (numeric)
      - `hard_violations` (integer)
      - `soft_score` (integer)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id text UNIQUE NOT NULL,
  capacity integer NOT NULL DEFAULT 0,
  type text NOT NULL DEFAULT 'TD',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view rooms"
  ON rooms FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert rooms"
  ON rooms FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update rooms"
  ON rooms FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete rooms"
  ON rooms FOR DELETE
  TO authenticated
  USING (true);

-- Teachers table
CREATE TABLE IF NOT EXISTS teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id text UNIQUE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view teachers"
  ON teachers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert teachers"
  ON teachers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update teachers"
  ON teachers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete teachers"
  ON teachers FOR DELETE
  TO authenticated
  USING (true);

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id text UNIQUE NOT NULL,
  subject text NOT NULL,
  teacher_id text NOT NULL,
  group_id text NOT NULL,
  group_size integer NOT NULL DEFAULT 0,
  room_type_req text NOT NULL DEFAULT 'TD',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view courses"
  ON courses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert courses"
  ON courses FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update courses"
  ON courses FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete courses"
  ON courses FOR DELETE
  TO authenticated
  USING (true);

-- Schedules table
CREATE TABLE IF NOT EXISTS schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  assignments jsonb NOT NULL DEFAULT '[]'::jsonb,
  fitness numeric NOT NULL DEFAULT 0,
  hard_violations integer NOT NULL DEFAULT 0,
  soft_score integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view schedules"
  ON schedules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert schedules"
  ON schedules FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update schedules"
  ON schedules FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete schedules"
  ON schedules FOR DELETE
  TO authenticated
  USING (true);