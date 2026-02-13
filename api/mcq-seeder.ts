
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).end();
  
  // Example Seeder Logic for Physics Ch 1
  const physicsQ = [
    { 
      subject: 'Physics', chapter: 'Vector', difficulty: 'easy', 
      question: 'Which of the following is a vector quantity?', 
      option_a: 'Mass', option_b: 'Time', option_c: 'Force', option_d: 'Speed', 
      correct_option: 2 
    },
    { 
      subject: 'Physics', chapter: 'Vector', difficulty: 'medium', 
      question: 'What is the angle between two equal vectors if their resultant is also equal to them?', 
      option_a: '0°', option_b: '60°', option_c: '120°', option_d: '180°', 
      correct_option: 2 
    }
  ];

  try {
    const { error } = await supabase.from('mcq_questions').insert(physicsQ);
    if (error) throw error;
    return res.status(200).json({ success: true, count: physicsQ.length });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
