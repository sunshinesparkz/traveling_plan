import { createClient } from '@supabase/supabase-js';
import { Accommodation } from '../types';

const env = (import.meta as any).env;
const supabaseUrl = env.VITE_SUPABASE_URL || '';
const supabaseKey = env.VITE_SUPABASE_ANON_KEY || '';

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