import azure.functions as func
import logging
import os
import subprocess
import sys

app = func.FunctionApp()
#For algorithm testing, running chron every min
@app.timer_trigger(schedule="0 * * * * *", arg_name="myTimer", run_on_startup=True,
                   use_monitor=False)

def run_algorithm(myTimer: func.TimerRequest) -> None:
    if myTimer.past_due:
        logging.warning("Warning: Timer is up!")

    logging.info("Trigger started.")

    try:
        #Path to my algorithm 
        script_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../Algorithm/MACross.py"))

        logging.info(f"Running script: {script_path}")

        # Run the script
        result = subprocess.run([sys.executable, script_path], capture_output=True, text=True)

        # Log output
        logging.info(result.stdout)
        if result.stderr:
            logging.error(result.stderr)

        logging.info("Python timer trigger function finished successfully.")

    except Exception as e:
        logging.error(f"Error running script: {e}")