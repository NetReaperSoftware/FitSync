import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { defaultExercises } from './defaultExercises.ts';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'fitness'
  }
});

async function seedExercises() {
  // First, let's test if we can connect to the database
  const { data: testData, error: testError } = await supabase
    .from('exercises')
    .select('*')
    .limit(1);

  if (testError) {
    console.error('Cannot connect to exercises table:', testError);
    return;
  }

  console.log('Connection successful. Current exercises count:', testData?.length || 0);

  const { data, error } = await supabase
    .from('exercises')
    .upsert(defaultExercises, { 
      onConflict: 'name',
      ignoreDuplicates: false 
    });

  if (error) {
    console.error('Error upserting exercises:', error);
  } else {
    console.log('Upserted default exercises:', data);
  }
}

seedExercises();
