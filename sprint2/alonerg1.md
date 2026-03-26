# Aidan Lonergan - Sprint 2 Reflection

Aidan Lonergan, alonergan, aflonergan@gmail.com, StockApp Group

## What I Planned To Do
- Update Navigation Bar layout with new tabs and dropdown user menu
- Update Dashboard layout with new skeleton structure
- Implement account overview row in Dashboard to show account statistics and config
- Implement holdings table in dashboard to show current holdings for the account
- Implement trades table in the dashboard to show recent trades

## What I Did Not Do
- N/A - All tasks accomplished

## Issues Completed
- Update Navigation Bar layout with new tabs and dropdown user menu
- Update Dashboard layout with new skeleton structure
- Implement account overview row in Dashboard to show account statistics and config
- Implement holdings table in dashboard to show current holdings for the account
- Implement trades table in the dashboard to show recent trades
- Refined Pie chart to use percentages and hide cluttered labels
- Added stock info popup to the holdings table in the dashboard
- Added front end api wrapper for grabbing account standing history
- Added python scripts for generating dummy data for demo

## Files You Worked On
- Frontend/src/components/Dashboard.jsx
- Frontend/src/components/NavBar.jsx
- Frontend/src/api/account.js
- Backend/api/management/commands/generate_dummy_data.py

## Use of AI / 3rtd Party Software

- AI

In my professional work we have access to many advanced models through Github CoPilot. In this case I only had access to ChatGPT, so I 
mainly utilized it for writing boiler plate components, identifying obscure bugs, and providing insight into Azure deployment issues.

- 3rd Party

We utilize the ANT Design React UI library for astectic reuseable frontend components. No other 3rd party code is used.


## What I Accomplished
All of the above tasks were accomplished. THe frontend team was very efficient in getting the Dashboard UI completed.
This sprint was focused on refining the dashboard to be a proper overview of the users account standings and data. It serves as a 'home page' for the application. The front end
only serves to show the data from the database, so now our focus will be on implementing the backend trading process.


I'd say this was a productive sprint, now that the foundation of the app was complete in sprint 1, we could focus
on making the application more user friendly and align with the original requirements of the app. For the next
sprint we will be focusing on integrating the algorithm with our database to actually perform 'trades'.