# gunicorn_config.py

# This is the most important setting.
# It tells Gunicorn to use the eventlet worker, which is designed for
# asynchronous applications like those using Socket.IO.
worker_class = 'eventlet'

# This setting tells the worker how many concurrent requests it can handle.
# For eventlet, this can be a higher number.
worker_connections = 1000

# The number of worker processes. For Render's free tier, 
# keeping this at 1 is the most stable option to conserve memory.
workers = 1

# The timeout for workers. If a worker is silent for this long, it's killed.
# We increase it slightly to be safe.
timeout = 60