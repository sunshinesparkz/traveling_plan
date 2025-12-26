import { createClient } from '@supabase/supabase-js';
import { Accommodation } from '../types';

// process.env is defined in vite.config.ts
declare const process: any;

const supabaseUrl = process.env.VITE_SUPABASE_URL || (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

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