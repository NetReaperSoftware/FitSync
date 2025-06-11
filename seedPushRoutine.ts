import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

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

// Default Push Day routine exercises
const pushDayExercises = [
  { name: 'Bench Press', sets: 4, reps: 8, weight_lbs: 135, order: 1 },
  { name: 'Incline Dumbbell Press', sets: 3, reps: 10, weight_lbs: 60, order: 2 },
  { name: 'Shoulder Press', sets: 3, reps: 10, weight_lbs: 95, order: 3 },
  { name: 'Tricep Dips', sets: 3, reps: 12, weight_lbs: 0, order: 4 },
  { name: 'Lateral Raises', sets: 3, reps: 15, weight_lbs: 20, order: 5 },
  { name: 'Push-ups', sets: 3, reps: 15, weight_lbs: 0, order: 6 },
  { name: 'Overhead Tricep Extension', sets: 3, reps: 12, weight_lbs: 30, order: 7 },
];

async function seedPushRoutine() {
  try {
    // Test connection
    const { data: testData, error: testError } = await supabase
      .from('workout_routines')
      .select('*')
      .limit(1);

    if (testError) {
      console.error('Cannot connect to workout_routines table:', testError);
      return;
    }

    console.log('Connection successful. Current routines count:', testData?.length || 0);

    // Create or get "Default Routines" folder
    let defaultFolderId = null;
    
    // Check if folder table exists and try to work with folders
    try {
      // Check if folder already exists
      const { data: existingFolder, error: folderCheckError } = await supabase
        .from('workout_routine_folders')
        .select('id')
        .eq('name', 'Default Routines')
        .eq('is_default', true)
        .single();

      if (folderCheckError && folderCheckError.code !== 'PGRST116') {
        console.log('Folder table may not exist or error checking folder:', folderCheckError.message);
        console.log('Proceeding without folder assignment...');
      } else if (existingFolder) {
        defaultFolderId = existingFolder.id;
        console.log('Default Routines folder already exists:', defaultFolderId);
      } else {
        // Create the Default Routines folder
        const { data: folderData, error: folderError } = await supabase
          .from('workout_routine_folders')
          .insert([{
            name: 'Default Routines',
            description: 'Pre-built workout routines provided by the app',
            is_default: true,
            created_by: null
          }])
          .select()
          .single();

        if (folderError) {
          console.log('Error creating folder (table may not exist):', folderError.message);
          console.log('Proceeding without folder assignment...');
        } else {
          defaultFolderId = folderData.id;
          console.log('Created Default Routines folder:', defaultFolderId);
        }
      }
    } catch (error) {
      console.log('Folder functionality not available, proceeding without folders...');
    }

    // Check if "Push Day" routine already exists
    const { data: existingRoutine, error: checkError } = await supabase
      .from('workout_routines')
      .select('id')
      .eq('name', 'Push Day')
      .eq('is_default', true)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking for existing routine:', checkError);
      return;
    }

    if (existingRoutine) {
      console.log('Push Day routine already exists. Skipping...');
      return;
    }

    // Create the Push Day routine
    const { data: routineData, error: routineError } = await supabase
      .from('workout_routines')
      .insert([{
        name: 'Push Day',
        description: 'A default push day routine focusing on chest, shoulders, and triceps',
        is_default: true,
        folder_id: defaultFolderId,
        created_by: null // No specific user - it's a default routine
      }])
      .select()
      .single();

    if (routineError) {
      console.error('Error creating Push Day routine:', routineError);
      return;
    }

    console.log('Created Push Day routine:', routineData);

    // Get exercise IDs for the exercises in our routine
    const exerciseNames = pushDayExercises.map(ex => ex.name);
    const { data: exercisesData, error: exercisesError } = await supabase
      .from('exercises')
      .select('id, name')
      .in('name', exerciseNames);

    if (exercisesError) {
      console.error('Error fetching exercises:', exercisesError);
      return;
    }

    console.log('Found exercises:', exercisesData);

    // Create a map of exercise names to IDs
    const exerciseMap = new Map();
    exercisesData.forEach(exercise => {
      exerciseMap.set(exercise.name, exercise.id);
    });

    // Prepare routine exercises data
    const routineExercisesData = pushDayExercises
      .filter(ex => exerciseMap.has(ex.name)) // Only include exercises that exist in DB
      .map(ex => ({
        routine_id: routineData.id,
        exercise_id: exerciseMap.get(ex.name),
        sets: ex.sets,
        reps: ex.reps,
        weight_lbs: ex.weight_lbs,
        order_in_routine: ex.order
      }));

    if (routineExercisesData.length === 0) {
      console.error('No exercises found in database for Push Day routine');
      return;
    }

    // Insert routine exercises
    const { error: routineExercisesError } = await supabase
      .from('workout_routine_exercises')
      .insert(routineExercisesData);

    if (routineExercisesError) {
      console.error('Error creating routine exercises:', routineExercisesError);
      return;
    }

    console.log(`Successfully created Push Day routine with ${routineExercisesData.length} exercises`);
    console.log('Missing exercises (not found in database):', 
      pushDayExercises
        .filter(ex => !exerciseMap.has(ex.name))
        .map(ex => ex.name)
    );

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

seedPushRoutine();