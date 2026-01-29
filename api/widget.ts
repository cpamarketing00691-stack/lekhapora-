import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://uycxbrcbweeuvizrgpnw.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; 
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: any, res: any) {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    // Fetch state from user_data table
    const { data, error } = await supabaseAdmin
      .from('user_data')
      .select('state')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      return res.status(404).json({ error: 'User not found' });
    }

    const state = data.state as any;

    // Calculate Summary Stats for Widget
    const today = new Date().toISOString().split('T')[0];
    const dailyTasks = state.dailyTasks || [];
    const pendingTasks = dailyTasks.filter((t: any) => !t.isCompleted).length;
    
    const subjects = state.subjects || [];
    const totalChapters = subjects.reduce((acc: number, s: any) => acc + (s.chapters?.length || 0), 0);
    const doneChapters = subjects.reduce((acc: number, s: any) => acc + (s.chapters?.filter((c: any) => c.isCompleted).length || 0), 0);
    const syllabusProgress = totalChapters > 0 ? Math.round((doneChapters / totalChapters) * 100) : 0;

    const streak = state.streaks || 0;

    // Return the specific object structure for Native Widgets
    return res.status(200).json({
      lastUpdate: new Date().getTime(),
      widgetData: {
        streak: streak,
        progress: `${syllabusProgress}%`,
        tasksPending: pendingTasks,
        greeting: `Hi, ${state.profile?.fullName || 'Student'}!`,
        quote: "Success is the sum of small efforts."
      }
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}