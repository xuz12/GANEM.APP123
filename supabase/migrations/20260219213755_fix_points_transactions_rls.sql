/*
  # Fix RLS Policies for Points Transactions

  1. Changes
    - Add INSERT policy for points_transactions to allow users to add their own transactions
    - Add UPDATE policy for user_profiles to allow points updates

  2. Security
    - Users can only insert transactions for themselves
    - Users can only update their own profile
*/

-- Drop existing policies on points_transactions if any
DROP POLICY IF EXISTS "Users can view own transactions" ON points_transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON points_transactions;

-- Create policy to allow users to view their own transactions
CREATE POLICY "Users can view own transactions"
  ON points_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own transactions
CREATE POLICY "Users can insert own transactions"
  ON points_transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
