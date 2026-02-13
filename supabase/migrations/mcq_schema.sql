
-- MCQ Database Schema for Lekhapora
CREATE TABLE IF NOT EXISTS mcq_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject TEXT NOT NULL,
  chapter TEXT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  question TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_option INTEGER NOT NULL, -- 0-3
  explanation TEXT,
  board TEXT,
  year INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optimize for exam generation
CREATE INDEX IF NOT EXISTS idx_mcq_lookup ON mcq_questions (subject, chapter, difficulty);

-- Subscriptions for Push Notifications
CREATE TABLE IF NOT EXISTS push_subscriptions (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  subscription JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reminders Table for Cron Job
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  time BIGINT NOT NULL, -- Unix timestamp in milliseconds
  is_done BOOLEAN DEFAULT FALSE,
  is_triggered BOOLEAN DEFAULT FALSE,
  repeat_type TEXT DEFAULT 'none', -- 'none', 'daily', 'weekly'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reminders_active ON reminders (time, is_triggered, is_done);
