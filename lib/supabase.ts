
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ilkuiwtwfjexwvdoitya.supabase.co';
// Updated supabaseAnonKey with the one provided by the user.
const supabaseAnonKey = 'sb_publishable_85ji8v9eDdxLovGx7UNu9Q_71dM6jZj';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
