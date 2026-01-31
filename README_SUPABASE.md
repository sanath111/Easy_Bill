# Phase 1: Supabase Cloud Setup (Free Tier)

We are using **Supabase** because it provides a generous free tier that includes:
*   **Database**: 500MB (plenty for license metadata).
*   **Auth**: 50,000 monthly active users (Google Login included).
*   **Storage**: 1GB (enough for differential backups for many users).
*   **Edge Functions**: 500k invocations/month (for license validation).

## Step-by-Step Setup Guide

### 1. Create Project
1.  Go to [Supabase.com](https://supabase.com/) and sign up/login.
2.  Click **"New Project"**.
3.  Name: `Easy_Bill_Backend`.
4.  Region: Choose one close to you (e.g., Mumbai, Singapore).
5.  Set a strong database password.

### 2. Database Schema Setup
1.  In the Supabase Dashboard, go to the **SQL Editor** (icon on the left).
2.  Click **"New Query"**.
3.  Copy the content of `D:/Easy_Bill/supabase_schema.sql` (I have created this file for you).
4.  Paste it into the editor and click **Run**.
    *   *This creates the Profiles, Licenses, and Backups tables with proper security policies.*

### 3. Configure Google Login
1.  Go to **Authentication** -> **Providers**.
2.  Enable **Google**.
3.  You need a **Client ID** and **Secret** from Google Cloud Console.
    *   Go to [Google Cloud Console](https://console.cloud.google.com/).
    *   Create a new project.
    *   Go to **APIs & Services** -> **Credentials** -> **Create Credentials** -> **OAuth Client ID**.
    *   Application Type: **Web application**.
    *   **Authorized Redirect URIs**: Copy the "Callback URL" from the Supabase Google Provider page (it looks like `https://<project-ref>.supabase.co/auth/v1/callback`).
    *   Copy the Client ID and Secret back to Supabase and save.

### 4. Configure Storage (For Backups)
1.  Go to **Storage**.
2.  Create a new Bucket named `backups`.
3.  Toggle **"Private bucket"** (We don't want public access).
4.  We will handle upload permissions via the RLS policies created in step 2.

### 5. Get API Keys
1.  Go to **Project Settings** (Cog icon) -> **API**.
2.  Copy the `Project URL` and `anon` (public) key.
3.  **Do not** expose the `service_role` (secret) key in the Electron app code.

## Next Steps (Phase 2)
Once this backend is ready, we will install the Supabase client in the Electron app and implement the Login/License check logic.
