import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const createMockClient = () => {
  console.warn('Supabase environment variables missing. Using mock client.');

  const mockChain = () => ({
    select: () => Promise.resolve({ data: [], error: null }),
    insert: () => Promise.resolve({ data: [], error: null }),
    update: () => Promise.resolve({ data: [], error: null }),
    delete: () => ({
      neq: () => Promise.resolve({ data: [], error: null }),
      eq: () => Promise.resolve({ data: [], error: null }),
    }),
    eq: () => Promise.resolve({ data: [], error: null }),
    neq: () => Promise.resolve({ data: [], error: null }),
  });

  return {
    from: (table: string) => {
      console.log(`[Mock Supabase] Operation on table '${table}'`);
      return mockChain();
    },
  } as any;
};

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMockClient();
