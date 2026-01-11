/*
  # Add anonymous access policies

  1. Changes
    - Add policies to allow anonymous users to access all tables
    - This enables the app to work without requiring user authentication

  2. Security
    - Policies allow both authenticated and anonymous users
    - Using 'true' for anonymous access as this is a demo/educational app
*/

DROP POLICY IF EXISTS "Users can view rooms" ON rooms;
DROP POLICY IF EXISTS "Users can insert rooms" ON rooms;
DROP POLICY IF EXISTS "Users can update rooms" ON rooms;
DROP POLICY IF EXISTS "Users can delete rooms" ON rooms;

CREATE POLICY "Anyone can view rooms"
  ON rooms FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert rooms"
  ON rooms FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update rooms"
  ON rooms FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete rooms"
  ON rooms FOR DELETE
  USING (true);

DROP POLICY IF EXISTS "Users can view teachers" ON teachers;
DROP POLICY IF EXISTS "Users can insert teachers" ON teachers;
DROP POLICY IF EXISTS "Users can update teachers" ON teachers;
DROP POLICY IF EXISTS "Users can delete teachers" ON teachers;

CREATE POLICY "Anyone can view teachers"
  ON teachers FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert teachers"
  ON teachers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update teachers"
  ON teachers FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete teachers"
  ON teachers FOR DELETE
  USING (true);

DROP POLICY IF EXISTS "Users can view courses" ON courses;
DROP POLICY IF EXISTS "Users can insert courses" ON courses;
DROP POLICY IF EXISTS "Users can update courses" ON courses;
DROP POLICY IF EXISTS "Users can delete courses" ON courses;

CREATE POLICY "Anyone can view courses"
  ON courses FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert courses"
  ON courses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update courses"
  ON courses FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete courses"
  ON courses FOR DELETE
  USING (true);

DROP POLICY IF EXISTS "Users can view schedules" ON schedules;
DROP POLICY IF EXISTS "Users can insert schedules" ON schedules;
DROP POLICY IF EXISTS "Users can update schedules" ON schedules;
DROP POLICY IF EXISTS "Users can delete schedules" ON schedules;

CREATE POLICY "Anyone can view schedules"
  ON schedules FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert schedules"
  ON schedules FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update schedules"
  ON schedules FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete schedules"
  ON schedules FOR DELETE
  USING (true);