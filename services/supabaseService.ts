import { createClient } from '@supabase/supabase-js';
import { Accommodation, TripDetails } from '../types';

// process.env is defined in vite.config.ts
declare const process: any;

const supabaseUrl = process.env.VITE_SUPABASE_URL || (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseKey);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

// --- Auth Functions ---

export const signIn = async (email: string, password: string) => {
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

export const signUp = async (email: string, password: string) => {
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async () => {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// --- Trip Functions ---

export const createTrip = async (places: Accommodation[], tripDetails: TripDetails | null) => {
  if (!supabase) throw new Error("Supabase is not configured");

  const user = await getCurrentUser();
  
  const payload: any = { 
    places, 
    trip_details: tripDetails || {} 
  };

  if (user) {
    payload.user_id = user.id;
  }

  const { data, error } = await supabase
    .from('trips')
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateTrip = async (id: string, places: Accommodation[], tripDetails: TripDetails | null) => {
  if (!supabase) throw new Error("Supabase is not configured");

  const { error } = await supabase
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
  if (!supabase) throw new Error("Supabase is not configured");

  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

// Get the most recent trip for the logged-in user
export const getUserLatestTrip = async (userId: string) => {
  if (!supabase) throw new Error("Supabase is not configured");

  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found" which is fine
    throw error;
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