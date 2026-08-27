/*
  # Fix RLS Policies for User Registration

  The previous RLS policies were too restrictive and prevented new users from creating their profiles.
  This migration updates the policies to allow:
  - New users to create their own profile during registration
  - Users to read and update their own profile
  - Public read access to clubs, matches, and partners
*/

-- Drop existing restrictive policies on user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

-- Create new permissive policies for user_profiles
CREATE POLICY "Users can create their own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow unauthenticated users to view clubs (for public browsing)
DROP POLICY IF EXISTS "Anyone can view clubs" ON clubs;
CREATE POLICY "Anyone can view clubs"
  ON clubs FOR SELECT
  USING (true);

-- Allow authenticated users to view matches
DROP POLICY IF EXISTS "Anyone can view matches" ON matches;
CREATE POLICY "Anyone can view matches"
  ON matches FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to view active partners
DROP POLICY IF EXISTS "Anyone can view active partners" ON partners;
CREATE POLICY "Anyone can view active partners"
  ON partners FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Allow authenticated users to view active offers
DROP POLICY IF EXISTS "Anyone can view active offers" ON partner_offers;
CREATE POLICY "Anyone can view active offers"
  ON partner_offers FOR SELECT
  TO authenticated
  USING (is_active = true AND (valid_until IS NULL OR valid_until > now()));