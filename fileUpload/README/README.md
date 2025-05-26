# ============================================

# Installation and Setup Instructions

# 1. Clone and setup project

git clone <your-repo-url>
cd secure-file-upload-s3
npm install

# 2. Create .env file with your AWS credentials

cp .env.example .env

# Edit .env with your actual credentials

# 3. Setup AWS S3 bucket (run the AWS CLI commands above)

# 4. Start development server

npm run dev

# 5. For production deployment

npm run build
npm start

# 6. Using Docker

docker-compose up -d

# 7. Setup SSL certificate (using Let's Encrypt)

sudo certbot --nginx -d your-domain.com
