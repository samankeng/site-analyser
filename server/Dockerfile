FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies for node-gyp and other native modules
RUN apk add --no-cache python3 make g++ curl

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the code
COPY . .

# Expose the port the app will run on
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production

# Use the entrypoint script
COPY ./docker/server/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Command to run the application
ENTRYPOINT ["/entrypoint.sh"]
