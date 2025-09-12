-- Fix security vulnerability in junction_stats table
-- Remove dangerous public write access policies

-- Drop existing policies that allow public write access
DROP POLICY IF EXISTS "Public insert access for junction_stats" ON public.junction_stats;
DROP POLICY IF EXISTS "Public update access for junction_stats" ON public.junction_stats;

-- Keep public read access for dashboard functionality
-- The existing "Public read access for junction_stats" policy can remain

-- Create secure policies that restrict write access to authenticated users only
-- This prevents anonymous manipulation of traffic control data

CREATE POLICY "Authenticated users can insert junction stats" 
ON public.junction_stats 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update junction stats" 
ON public.junction_stats 
FOR UPDATE 
TO authenticated
USING (true);

-- Note: For production systems, consider further restricting to specific service roles
-- that represent legitimate traffic management systems