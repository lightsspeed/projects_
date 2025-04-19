FROM nginx:alpine

#Copy the app files to the container

COPY . /usr/share/nginx/html

#Expose port 80

EXPOSE 80

#Start nginx

CMD ["nginx", "-g", "daemon off;"]