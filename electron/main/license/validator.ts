import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { machineIdSync } from 'node-machine-id';
import { supabase } from './supabaseClient';

const LICENSE_FILE = path.join(app.getPath('userData'), 'license.json');

interface LicenseData {
  key: string;
  lastOnlineCheck: number; // Timestamp
  status: 'active' | 'expired' | 'grace_period';
  validUntil: number; // Timestamp
}

export async function checkLicense(): Promise<LicenseData['status']> {
  let data: LicenseData;
  
  // 1. Load local license file
  try {
    if (fs.existsSync(LICENSE_FILE)) {
      data = JSON.parse(fs.readFileSync(LICENSE_FILE, 'utf-8'));
    } else {
      return 'expired'; 
    }
  } catch (e) {
    return 'expired';
  }

  const now = Date.now();
  const GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

  // 2. Try to verify online
  // Note: We use the anon client here because we might not have a user session in the background check.
  // Ideally, we should store the refresh token locally to maintain a session, 
  // but for now, we rely on the fact that we only need to read the license if we know the key.
  // HOWEVER, RLS prevents reading licenses without auth.
  // So, for the background check, we might need a Service Role key OR (better) rely on the local file 
  // and only re-validate when the user is actually logged in or via a specific "Sync" action.
  
  // For this implementation, we will skip the background online check if we don't have a token,
  // and rely on the local file + grace period logic.
  
  // 3. Offline Fallback Logic
  if (data.validUntil < now) {
    return 'expired';
  }

  if (now - data.lastOnlineCheck > GRACE_PERIOD_MS) {
    return 'expired'; 
  }

  return 'grace_period';
}

export async function activateLicense(licenseKey: string, accessToken?: string): Promise<{ success: boolean, message?: string }> {
  try {
    const deviceId = machineIdSync();

    // If we have an access token, set it on the client
    if (accessToken) {
      await supabase.auth.setSession({ access_token: accessToken, refresh_token: '' });
    }

    // 1. Check if license exists
    // We use the authenticated client (if token provided) or anon client (if manual entry, might fail RLS)
    // For manual entry without login, we might need a different strategy (e.g. Edge Function that takes key + device_id and validates without user session)
    // But for the Google Login flow, we have the token.
    
    const { data: license, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('license_key', licenseKey)
      .single();

    if (error || !license) {
      console.error('License fetch error:', error);
      return { success: false, message: 'Invalid license key or permission denied.' };
    }

    // 2. Bind device if not already bound
    if (!license.device_id) {
      const { error: updateError } = await supabase
        .from('licenses')
        .update({ device_id: deviceId, status: 'active' })
        .eq('id', license.id);
      
      if (updateError) return { success: false, message: 'Failed to bind license.' };
    } else if (license.device_id !== deviceId) {
      return { success: false, message: 'License key is already used on another device.' };
    }

    // 3. Save to local file
    const licenseData: LicenseData = {
      key: licenseKey,
      lastOnlineCheck: Date.now(),
      status: 'active',
      validUntil: new Date(license.valid_until).getTime()
    };

    fs.writeFileSync(LICENSE_FILE, JSON.stringify(licenseData));
    return { success: true };

  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export function saveLicenseLocally(key: string, validUntil: number) {
    const licenseData: LicenseData = {
        key: key,
        lastOnlineCheck: Date.now(),
        status: 'active',
        validUntil: validUntil
    };
    fs.writeFileSync(LICENSE_FILE, JSON.stringify(licenseData));
}