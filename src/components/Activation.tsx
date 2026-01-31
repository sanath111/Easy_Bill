import React, { useState, useEffect } from 'react';
import { Lock, LogIn } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface ActivationProps {
  onActivated: () => void;
}

const Activation: React.FC<ActivationProps> = ({ onActivated }) => {
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Listen for session from Electron main process
    // @ts-ignore
    window.api.onSessionReceived(async (session: any) => {
      setLoading(true);
      try {
        const { error } = await supabase.auth.setSession({
          access_token: session.accessToken,
          refresh_token: session.refreshToken,
        });

        if (error) throw error;

        // User is logged in, now check/create license
        await checkOrCreateLicense(session.accessToken);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    });
  }, []);

  const checkOrCreateLicense = async (accessToken: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      // 1. Check if user already has a license
      let { data: license } = await supabase
        .from('licenses')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // 2. If not, create a trial license (RPC call)
      if (!license) {
        const { data: newKey, error: rpcError } = await supabase
          .rpc('generate_license_key', { user_uuid: user.id, duration_days: 14 }); // 14 day trial
        
        if (rpcError) throw rpcError;
        
        // Fetch the newly created license
        const { data: newLicense } = await supabase
          .from('licenses')
          .select('*')
          .eq('license_key', newKey)
          .single();
          
        license = newLicense;
      }

      // 3. Activate locally
      if (license) {
        // @ts-ignore
        // Pass the token to the main process so it can authenticate the request
        const result = await window.api.activateLicense({ key: license.license_key, token: accessToken });
        if (result.success) {
          onActivated();
        } else {
          setError(result.message);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    // @ts-ignore
    window.api.openGoogleLogin();
  };

  const handleManualActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // @ts-ignore
      // For manual activation, we might not have a token if the user isn't logged in via Google.
      // This path might still fail RLS if the backend doesn't have a service role key.
      // But for the Google Login flow, this is handled above.
      const result = await window.api.activateLicense({ key });
      if (result.success) {
        onActivated();
      } else {
        setError(result.message || 'Activation failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <div className="flex justify-center mb-4">
          <div className="bg-red-100 p-3 rounded-full">
            <Lock className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center mb-2">Welcome to Easy Bill</h2>
        <p className="text-gray-500 text-center mb-6">Login to start your trial or enter a license key.</p>
        
        <button 
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-50 transition-colors mb-6"
        >
          <LogIn className="w-4 h-4" />
          Login with Google
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or enter key manually</span>
          </div>
        </div>

        <form onSubmit={handleManualActivate}>
          <div className="mb-4">
            <input 
              type="text" 
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="EB-XXXX-XXXX-XXXX"
              value={key}
              onChange={(e) => setKey(e.target.value)}
            />
          </div>
          
          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading || !key}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
          >
            {loading ? 'Activating...' : 'Activate License'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Activation;