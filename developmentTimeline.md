# The following are the future plans for development of the FitSync application

# Step 1: Overhaul Home Screen UI //COMPLETED
The home screen UI needs to be updated to include A dashboard, incluing the following, updated daily:
- Current daily steps walked
- Caloric intake
- Calories burned
- Workouts completed

# 1a
There should be a button at the top of the screen "Detailed Report" that, when clicked, will bring up a detailed listing of collected data over a period of time. The time period can be specified by the user, with the options: Last 30 days, Last 7 days, Last 90 days, and All Time. The data will include graphs of the following:
- A line graph of users weight over time (Which must be manually logged in their profile)
- A bar graph of daily total steps walked
- A bar graph of daily exersise duration in minutes
- A line graph containing 2 lines: Caloric goal, and Daily Caloric Net
- A muscle distribution chart, showing which muscle groups on the body are worked the most

# 1b
The first dashboard header should be a description of the users goal, either a caloric surplus, defecit, or maintenence. Depending on what the user choses, the calorie goal will be automatically calculated following rules to be defined later. It will then display the  caloric goal, and the current net calories the user has consumed (which is calorieIntake - calorieExpenditure). If the users current net caloric intake is lower than the set goal, it will indicate how many calories left to consume. If the users net caloric intake is higher than the set goal, it will indicate how many calories to burn.

The second dashboard box should be a breakdown of the consumed macronutrients that day, showing how many more to go to reach the goal.

The third and fourth dashbord boxes should be mini half-screen boxes side by side, where the left shows the user how many steps they have walked that day (will be live) and the right box shows the number of calories burned that day (calorieExpenditure)

The fifth box should display a summary of the workout(s) logged that day, and a list of the main muscles worked.

# Step 2: Overhaul Workouts Screen UI
The Workouts Screen UI needs to be updated to have more functioanlity, including the following:
- A "New Workout" button, which will bring up an "Active Workout" interface screen. 
- A Routines section, where users can create and name custom routines.

# 2a
The "Active Workout" interface screen will contain the following: 
- In the top of the screen, will be a minimize button to pause the active workout and show the main workout screen. "Active Workout" will be displayed next to this minimize icon, and on the right side, will be the "Finish" button, which will save the workout details and return to the Workouts screen on click. 
- Under this top section, the workout Duration, Volume, and Sets will be tracked, and will be updated as the workout progresses. 
- In the main area, initially, there will be a "Add Exersise" button, which will bring up the list of all avalible Exersises for the user to select from. 
- After adding Exersise, the "Add Exersise" button will move below all the Exersises, allowing the user to add as many Exersises as they like. 
- Under the "Add Exersise" button will be a "Discard Workout" button, to cancel the workout and return to the Workouts screen.

# 2b 
Within the routines section, there will be a "New Routine" button, which will bring up a screen Similar to the "Active Workout" interface screen in 2a, however, there will be no tracking metrics for duration, volume, or sets, and will instead only have "Add Exersise" button, and a field to name the routine. The Users can also create a folder(s) in this section, to categorize their routines in custom named folders. There cannot be nested folders, as they are only used to categorize routines.

# 2c // Completion
Add more options to routines and folders. Routines should have a horizontal hamburger button to signify more options (...). The options should be:
- Rename Folder
- Delete Folder
- Add new routine
The Routines should be clickable, so that clicking on a routine will bring up its details for editing. There should also be a "Start Routine" button 
The "Folders" storing routines should be updated to be collapsible, with a dropdown arrow as the icon signifying open or closed instead of a folder icon.
Example (Closed):
> Folder1 ...

Example (Open):
v Folder1 ...
Routine1 ...
Start Routine

Routine2 ...
Start Routine

# 2d //Completed
There is a new screen ExerciseScreen.tsx that should list all exercises stored within my supabase database backend. WorkoutTrackerScreen needs to be updated to bring up this screen, and import workouts from it when adding exercises into a New Workout or in a Routine.

# Step 3 Database Configuration
The "fitness" schema needs to be updated to support the apps Workout Screen and its functionality.
Originally, must allow:
- API endpoint for schema 'fitness' //Completed


# 3a //Completed
- Set up the list of all default exercises in exercises table. 
- Establish RLS to allow integration with API
- Service key access for seeding initial database 
- Create RLS policies to enable querying

# 3b
- Set up the tables for user routines
- workout_exercises table contains 

# Step 4: Implement DB tracking for workout data //Completed
When completing an active workout, be it from a routine or from a new workout, the database needs to be updated to hold the users workout information, including the exercises completed, their sets, reps, and weight values.

# Notes
- Default Exercises data for sets, weight, and reps is untracked, fix to where users can duplicate for their own routines
- Maybe have a default section for users to chose an import 
- ScrollView is very buggy throughout Workout Sceen, sometimes scrolls, sometimes doesnt

# Step 5

# Future Developments
- Update all screens to use react-native-gesture-handler and KeyboardAvoidingView to update and make more efficient
- Cardio Tracker Screen
- DB is not set up to handle Imperial/Metric Units, fix this later
- The "Units" togglable button is not completely intuitive, lets switch the toggle button
Workout Screen:
- Change "None" to Body weight
- Classify Band exercises under other
- Make "Notes" section in database and propagate to it - for exercise notes
- Repair Active Workout Screen to have "Notes" section (Only Edit Routine does currently)
- Ensure both degree and notes propagate in all screens