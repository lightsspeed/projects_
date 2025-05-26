FROM node:18-alpine

#Install curl for health check
RUN apk add --no-cache curl

WORKDIR /app

#Create non-root user and group
RUN addgroup -g 1001 -S nodejs

RUN adduser -S nodejs -u 1001 -G nodejs

#Create logs directory and set permissions
RUN mkdir -p /app/logs && chown nodejs:nodejs /app/logs

#Copy package files
COPY package*.json ./

#Install dependencies
RUN npm ci --omit=dev

#Copy source code
COPY . .

#Set ownership of /app directory
RUN chown nodejs:nodejs /app

#Switch to non-root user
USER nodejs

#Expose port
EXPOSE 3001

#Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

#Start application
CMD ["npm", "start"]