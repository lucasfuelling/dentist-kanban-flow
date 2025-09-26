# Stage 1: Build the app
FROM node:24-alpine AS build-stage

WORKDIR /app

# Copy package files and install dependencies
COPY package.json ./
RUN npm install

# Copy app source code
COPY . .

# Build the app
RUN npm run build

# Stage 2: Serve the app with a lightweight server
FROM nginx:alpine AS production-stage

# Copy built files from the build stage
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Copy custom nginx config if needed (optional)
# COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80 to serve the app
EXPOSE 80

# Start nginx server
CMD ["nginx", "-g", "daemon off;"]
