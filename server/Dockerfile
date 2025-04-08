# Create a new Dockerfile.server
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies
RUN apk add --no-cache python3 make g++ curl

# Copy package files and create a basic index.js
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy the rest of the code
COPY . .

# Expose the port
EXPOSE 3000

# Command to run the application
CMD node src/app.js