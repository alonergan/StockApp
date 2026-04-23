# Aidan Lonergan - Sprint 2 Reflection

Aidan Lonergan, alonergan, aflonergan@gmail.com, StockApp Group

## What I Planned To Do
- Create python function to load the algorithm trade file
- Create python function to process trade signals for each account
- Create bash script to run this processing in the same instance as our backend app service

## What I Did Not Do
- N/A - All tasks accomplished

## Issues Completed
- Create python function to load the algorithm trade file
- Create python function to process trade signals for each account
- Create bash script to run this processing in the same instance as our backend app service
- Add backend API calls to handle the trades made by the script
- Resolve integration issues with azure
- Create web job to run this script

## Files You Worked On
- Backend/api/management/commands/process_daily_signals.py
- Backend/api/services/pricing.py
- Backend/api/services/trading.py
- Backend/api/services/signal_processor.py
- Backend/api/services/signal_source.py


## Use of AI / 3rtd Party Software

- AI

In my professional work we have access to many advanced models through Github CoPilot. In this case I only had access to ChatGPT, so I 
mainly utilized it for writing boiler plate components, identifying obscure bugs, and providing insight into Azure deployment issues.

- 3rd Party

We utilize the ANT Design React UI library for astectic reuseable frontend components. No other 3rd party code is used.


## What I Accomplished
All of the above tasks were accomplished. I was able to successfully create a way for us to process and perform the trades signaled by the algorithm. 
It took quite a bit of time to get this working with Azure, in fact most of my time was spent resolving issues with the integration of a webjob and
our backend app service. The algorithm team also has a working version of the algorithm which is a major accomplishment and the final main piece we needed.


I'd say this was a productive sprint, now that we have a working algorithm and can process trade signals from it we just need to find a way to
host the algorithm and run it on a schedule. This may prove to be a large challenge as it is computationally intensive and we do not have the 
funds to reasonably host this within azure.