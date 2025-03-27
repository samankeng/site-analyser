# Build stage
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Install missing ESLint plugins
RUN npm install --save-dev eslint-plugin-prettier eslint-config-prettier --legacy-peer-deps

# Copy all client files
COPY . ./

# Build the React application with ESLint disabled
ENV DISABLE_ESLINT_PLUGIN=true
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files from build stage to nginx serve directory
COPY --from=build /app/build /usr/share/nginx/html

# Create a default nginx configuration for React routing
RUN echo 'server { \
    listen       80; \
    server_name  localhost; \
    location / { \
        root   /usr/share/nginx/html; \
        index  index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
    error_page   500 502 503 504  /50x.html; \
    location = /50x.html { \
        root   /usr/share/nginx/html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Command to run when container starts
CMD ["nginx", "-g", "daemon off;"]