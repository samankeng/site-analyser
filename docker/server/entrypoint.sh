#!/bin/sh
set -e

# Wait for MongoDB to be ready
echo "Waiting for MongoDB to be ready..."
# Simple connection test, retrying up to 30 times (5 mins)
RETRIES=30
until [ $RETRIES -eq 0 ] || (echo > /dev/tcp/mongodb/27017) >/dev/null 2>&1; do
  echo "MongoDB is unavailable - retrying..."
  sleep 10
  RETRIES=$((RETRIES-1))
done

if [ $RETRIES -eq 0 ]; then
  echo "Failed to connect to MongoDB within the allocated time"
  exit 1
fi
echo "MongoDB is up and running!"

# Wait for Redis to be ready
echo "Waiting for Redis to be ready..."
RETRIES=30
until [ $RETRIES -eq 0 ] || redis-cli -h redis ping >/dev/null 2>&1; do
  echo "Redis is unavailable - retrying..."
  sleep 5
  RETRIES=$((RETRIES-1))
done

if [ $RETRIES -eq 0 ]; then
  echo "Failed to connect to Redis within the allocated time"
  exit 1
fi
echo "Redis is up and running!"

# Run database migrations if needed
if [ "$NODE_ENV" = "development" ]; then
  echo "Running in development mode..."
  exec npm run dev
else
  echo "Running in production mode..."
  # Run any production-specific commands here
  
  # Start the server
  exec npm start
fi
