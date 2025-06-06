# The following are the future plans for development of the FitSync application

# Step 1: Overhaul Home Screen UI
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