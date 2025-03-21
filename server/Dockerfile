# FROM node:18-alpine

# # Set working directory
# WORKDIR /app

# # Install dependencies for node-gyp and other native modules
# RUN apk add --no-cache python3 make g++ curl

# # Copy package.json and package-lock.json
# COPY package*.json ./

# # Install dependencies (using npm install instead of npm ci)
# RUN npm install

# # Copy the rest of the code
# COPY . .

# # Expose the port the app will run on
# EXPOSE 3000

# # Set environment variables
# ENV NODE_ENV=production

# # Command to run the application
# CMD ["npm", "start"]


# Create a new Dockerfile.server
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies
RUN apk add --no-cache python3 make g++ curl

# Copy package files and create a basic index.js
COPY package*.json ./
RUN npm install --legacy-peer-deps
RUN echo 'const express = require("express"); \
const app = express(); \
const port = process.env.PORT || 3000; \
app.get("/", (req, res) => { \
  res.json({ message: "Server is running" }); \
}); \
app.listen(port, () => { \
  console.log(`Server running on port ${port}`); \
});' > index.js

# Copy the rest of the code
COPY . .

# Expose the port
EXPOSE 3000

# Command to run the application
CMD ["node", "index.js"]