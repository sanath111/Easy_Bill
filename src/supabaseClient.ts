import { createClient } from '@supabase/supabase-js';

// TODO: Replace these with your actual Supabase credentials
// These must match the ones in electron/main/config.ts
const SUPABASE_URL = 'https://cmetivqpdxiuxqdscumh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtZXRpdnFwZHhpdXhxZHNjdW1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NDk2NjIsImV4cCI6MjA4NTQyNTY2Mn0.mr6ahayZVrF-9ofOJu0oSY_KLw2MdamWY12CcqdfXio';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);