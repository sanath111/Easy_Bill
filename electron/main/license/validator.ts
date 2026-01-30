import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

const LICENSE_FILE = path.join(app.getPath('userData'), 'license.json');

interface LicenseData {
  key: string;
  lastOnlineCheck: number; // Timestamp
  status: 'active' | 'expired' | 'grace_period';
}

export async function checkLicense(): Promise<LicenseData['status']> {
  // 1. Load local license file
  let data: LicenseData;
  try {
    if (fs.existsSync(LICENSE_FILE)) {
      data = JSON.parse(fs.readFileSync(LICENSE_FILE, 'utf-8'));
    } else {
      // For development/first run, return grace_period or active to unblock
      return 'grace_period';
    }
  } catch (e) {
    return 'expired';
  }

  const now = Date.now();
  const GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

  // 2. Check if we need to re-verify online
  // In a real app, you'd try to ping the server here.
  // If server is reachable -> validate & update lastOnlineCheck
  // If server unreachable -> check grace period
  
  const isServerReachable = false; // Mock

  if (isServerReachable) {
    // Validate with server...
    // Update local file
    return 'active';
  } else {
    // Offline check
    if (now - data.lastOnlineCheck < GRACE_PERIOD_MS) {
      return 'grace_period'; // Allow access but warn user
    } else {
      return 'expired'; // Grace period over
    }
  }
}