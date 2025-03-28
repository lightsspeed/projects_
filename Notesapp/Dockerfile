# Use an official lightweight nginx image
FROM nginx:alpine

# Set working directory
WORKDIR /usr/share/nginx/html

# Copy application files
COPY index.html .
COPY script.js .
COPY style.css .

# Create images directory and copy image assets
RUN mkdir -p images
COPY images/notes.png images/
COPY images/edit.png images/
COPY images/delete.png images/

# Optional: Create a custom nginx configuration to support single-page application routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# No need for CMD as nginx:alpine image already has default CMD to start nginx