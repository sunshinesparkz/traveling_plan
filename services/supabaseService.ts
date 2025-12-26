import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Accommodation, TripDetails } from '../types';

// process.env is defined in vite.config.ts
declare const process: any;

// Helper to get config from Env, URL Params (Magic Link), or LocalStorage
const getSupabaseConfig = () => {
  // 0. Check for Magic Config in URL first (For sharing across devices)
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const magicConfig = params.get('ConnectConfig');
    
    if (magicConfig) {
      try {
        // Decode Base64 string to get JSON
        const decoded = atob(magicConfig);
        const { url, key } = JSON.parse(decoded);
        
        if (url && key) {
          // Save to local storage immediately
          localStorage.setItem('kohlarn_supabase_config', JSON.stringify({ url, key }));
          
          // Remove the config param from URL to clean it up, but keep other params like tripId
          params.delete('ConnectConfig');
          const newQuery = params.toString();
          const newPath = window.location.pathname + (newQuery ? '?' + newQuery : '');
          window.history.replaceState({}, '', newPath);
          
          return { url, key, source: 'local' }; // Return immediately using this new config
        }
      } catch (e) {
        console.error("Invalid Magic Config", e);
      }
    }
  }

  let envUrl = '';
  let envKey = '';

  // 1. Try Vite standard import.meta.env
  const meta = import.meta as any;
  if (typeof meta !== 'undefined' && meta.env) {
    envUrl = meta.env.VITE_SUPABASE_URL || '';
    envKey = meta.env.VITE_SUPABASE_ANON_KEY || '';
  }

  // 2. Try process.env
  if (!envUrl || !envKey) {
    try {
      if (!envUrl) envUrl = process.env.VITE_SUPABASE_URL || '';
      if (!envKey) envKey = process.env.VITE_SUPABASE_ANON_KEY || '';
    } catch (e) {}
  }
  
  if (envUrl && envKey) {
    return { url: envUrl, key: envKey, source: 'env' };
  }

  // 3. Try Local Storage
  try {
    const stored = localStorage.getItem('kohlarn_supabase_config');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.url && parsed.key) {
        return { url: parsed.url, key: parsed.key, source: 'local' };
      }
    }
  } catch (e) {
    console.error("Error reading supabase config from local storage", e);
  }

  return { url: '', key: '', source: 'none' };
};

// Export config details to be used in UI (e.g. ShareModal)
export const configDetails = getSupabaseConfig();
const { url: supabaseUrl, key: supabaseKey } = configDetails;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

export const configureSupabase = (url: string, key: string) => {
  if (!url || !key) return;
  localStorage.setItem('kohlarn_supabase_config', JSON.stringify({ url, key }));
  window.location.reload();
};

export const clearSupabaseConfig = () => {
    if (configDetails.source === 'local') {
        localStorage.removeItem('kohlarn_supabase_config');
        window.location.reload();
    } else {
        alert("การตั้งค่านี้มาจากไฟล์ .env ไม่สามารถลบผ่านหน้าเว็บได้");
    }
};

// --- Auth Functions ---

export const signUp = async (email: string, password: string, username?: string) => {
  if (!supabase) throw new Error("Database not configured");
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
        data: {
            username: username
        }
    }
  });
  if (error) throw error;
  return data;
};

export const signIn = async (email: string, password: string) => {
  if (!supabase) throw new Error("Database not configured");
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  if (!supabase) return;
  await supabase.auth.signOut();
};

export const getCurrentUser = async () => {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// --- Trip Functions ---

const checkSupabase = () => {
  if (!supabase) throw new Error("ยังไม่ได้ตั้งค่า Database");
};

export const createTrip = async (places: Accommodation[], tripDetails: TripDetails | null) => {
  checkSupabase();
  
  // Get current user to link trip
  const user = await getCurrentUser();

  const payload: any = { 
    places, 
    trip_details: tripDetails || {},
  };

  if (user) {
    payload.user_id = user.id;
  }

  const { data, error } = await supabase!
    .from('trips')
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateTrip = async (id: string, places: Accommodation[], tripDetails: TripDetails | null) => {
  checkSupabase();
  
  // Try to link user if not linked yet (optional enhancement)
  const user = await getCurrentUser();
  const updatePayload: any = {
    places, 
    trip_details: tripDetails || {},
    updated_at: new Date().toISOString() 
  };

  // Only attempt to add user_id if we have one. 
  // Note: If RLS prevents update, this might fail if not owner.
  // We assume simple public/anon usage or owner based RLS.

  const { error } = await supabase!
    .from('trips')
    .update(updatePayload)
    .eq('id', id);

  if (error) throw error;
};

export const getTrip = async (id: string) => {
  checkSupabase();

  const { data, error } = await supabase!
    .from('trips')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

export const getUserTrips = async () => {
  checkSupabase();
  const user = await getCurrentUser();
  if (!user) return [];

  const { data, error } = await supabase!
    .from('trips')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) {
    console.warn("Could not fetch user trips", error);
    return [];
  }
  return data;
};

export const subscribeToTrip = (tripId: string, onUpdate: (payload: any) => void) => {
  if (!supabase) return null;

  const channel = supabase
    .channel(`trip-${tripId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'trips',
        filter: `id=eq.${tripId}`,
      },
      (payload) => {
        onUpdate(payload.new);
      }
    )
    .subscribe();

  return channel;
};