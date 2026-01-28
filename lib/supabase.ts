
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uycxbrcbweeuvizrgpnw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5Y3hicmNid2VldXZpenJncG53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1MTQ0MzcsImV4cCI6MjA4NTA5MDQzN30.PMtYejPByxn1lWf-946DvgTn1hId5Yb4JoRpM-inxsU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
