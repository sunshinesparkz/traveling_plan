import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Accommodation, TripDetails } from '../types';

// process.env is defined in vite.config.ts
declare const process: any;

// Helper to get config from Env or LocalStorage
const getSupabaseConfig = () => {
  let envUrl = '';
  let envKey = '';

  // 1. Try Vite standard import.meta.env
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    envUrl = import.meta.env.VITE_SUPABASE_URL || '';
    envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
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

const { url: supabaseUrl, key: supabaseKey, source: configSource } = getSupabaseConfig();

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
    if (configSource === 'local') {
        localStorage.removeItem('kohlarn_supabase_config');
        window.location.reload();
    } else {
        alert("การตั้งค่านี้มาจากไฟล์ .env ไม่สามารถลบผ่านหน้าเว็บได้");
    }
};

// --- Trip Functions (Anonymous / Link Based) ---

const checkSupabase = () => {
  if (!supabase) throw new Error("ยังไม่ได้ตั้งค่า Database");
};

export const createTrip = async (places: Accommodation[], tripDetails: TripDetails | null) => {
  checkSupabase();
  
  const payload: any = { 
    places, 
    trip_details: tripDetails || {},
    // No user_id needed anymore
  };

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

  const { error } = await supabase!
    .from('trips')
    .update({ 
      places, 
      trip_details: tripDetails || {},
      updated_at: new Date().toISOString() 
    })
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

export const getUserTrips = async (userId: string) => {
  checkSupabase();

  const { data, error } = await supabase!
    .from('trips')
    .select('*')
    .eq('user_id', userId)
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