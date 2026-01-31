// Configuration for the Electron Main Process

// TODO: Replace these with your actual Supabase credentials
export const SUPABASE_URL = 'https://cmetivqpdxiuxqdscumh.supabase.co'; 
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtZXRpdnFwZHhpdXhxZHNjdW1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NDk2NjIsImV4cCI6MjA4NTQyNTY2Mn0.mr6ahayZVrF-9ofOJu0oSY_KLw2MdamWY12CcqdfXio';

export const APP_PROTOCOL = 'easybill';
export const LOCAL_SERVER_PORT = 3000;
export const LOCAL_CALLBACK_URL = `http://localhost:${LOCAL_SERVER_PORT}/auth/callback`;

export function isConfigured() {
  // Check if values are not the default placeholders AND not empty
  const isUrlConfigured = SUPABASE_URL && 
                          SUPABASE_URL !== 'https://cmetivqpdxiuxqdscumh.supabase.co' &&
                          !SUPABASE_URL.includes('YOUR_PROJECT_ID');
                          
  const isKeyConfigured = SUPABASE_ANON_KEY && 
                          SUPABASE_ANON_KEY !== 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtZXRpdnFwZHhpdXhxZHNjdW1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NDk2NjIsImV4cCI6MjA4NTQyNTY2Mn0.mr6ahayZVrF-9ofOJu0oSY_KLw2MdamWY12CcqdfXio';

  return isUrlConfigured && isKeyConfigured;
}