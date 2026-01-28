
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uycxbrcbweeuvizrgpnw.supabase.co';
const supabaseAnonKey = 'sb_publishable_AvaNpR5XsRFbhSu7A6uHhg_W2xzhkRx';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
