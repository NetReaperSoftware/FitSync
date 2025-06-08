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

# 2c //Partial Completion
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

# 2d //NYI
A new screen needs to be created that will list all availible exersises stored in the app. This screen will be pulled up after selecting "Add Exersise" button from the "Active Workout" and "New Workout" screens. Once clicking an exersize, it will be added to the routine or workout. By default, this screen will have no workouts initially until adding later.