# Use an official lightweight nginx image
FROM nginx:alpine

# Set working directory
WORKDIR /usr/share/nginx/html

# Copy all necessary files
COPY index.html .
COPY script.js .
COPY style.css .

# Create images directory and copy image assets
RUN mkdir -p images
COPY images/notes.png images/
COPY images/edit.png images/
COPY images/delete.png images/

# Create custom nginx configuration to ensure proper file serving
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Verify file copying
RUN ls -la

# Expose port
EXPOSE 80

# Default CMD from nginx image will start nginx