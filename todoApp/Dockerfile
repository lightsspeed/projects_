# Use the official Nginx image as the base image
FROM nginx:alpine

# Copy the website files from the src/ directory to the Nginx HTML directory
COPY src/ /usr/share/nginx/html

# Expose port 80 for the web server
EXPOSE 80

# Start Nginx when the container starts
CMD ["nginx", "-g", "daemon off;"]