import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseSchema = import.meta.env.VITE_SUPABASE_SCHEMA ?? "public";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase environment variables are missing. Set VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, and optionally VITE_SUPABASE_SCHEMA to connect the frontend to Supabase.",
  );
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      db: {
        schema: supabaseSchema,
      },
    })
  : null;
