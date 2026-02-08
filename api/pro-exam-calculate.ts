import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://uycxbrcbweeuvizrgpnw.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; 
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).end();
  
  const { examId, userId, answers } = req.body;

  try {
    const { data: questions } = await supabaseAdmin
      .from('exam_sys_questions')
      .select('id, correct_index')
      .eq('exam_id', examId);

    if (!questions) throw new Error("Questions not found");

    let correct = 0;
    const details = questions.map(q => {
      const isCorrect = answers[q.id] === q.correct_index;
      if (isCorrect) correct++;
      return { question_id: q.id, is_correct: isCorrect, selected_index: answers[q.id] };
    });

    return res.status(200).json({
      score: correct,
      total: questions.length,
      details
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}