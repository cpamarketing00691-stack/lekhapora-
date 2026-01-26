
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ilkuiwtwfjexwvdoitya.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlsa3Vpd3R3ZmpleHd2ZG9pdHlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDg3OTcsImV4cCI6MjA4NTAyNDc5N30.wdX7Ev_7u42lIsNgnmLdaIi_kEQ3BfyUk9CvG2Z7Xc0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
