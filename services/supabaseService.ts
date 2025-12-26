import { createClient } from '@supabase/supabase-js';
import { Accommodation } from '../types';

// Support both Vite's import.meta.env and process.env (as fallback)
// Fix: Cast import.meta to any to avoid TS error "Property 'env' does not exist on type 'ImportMeta'"
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseKey);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

export const createTrip = async (places: Accommodation[]) => {
  if (!supabase) throw new Error("Supabase is not configured");

  const { data, error } = await supabase
    .from('trips')
    .insert([{ places }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateTrip = async (id: string, places: Accommodation[]) => {
  if (!supabase) throw new Error("Supabase is not configured");

  const { error } = await supabase
    .from('trips')
    .update({ places, updated_at: new Date().toISOString() })
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