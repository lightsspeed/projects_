// server.js - Node.js Backend for Secure File Upload to AWS S3
const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const crypto = require('crypto');
const path = require('path');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const redis = require('redis');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Redis client
const redisClient = redis.createClient({
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
});
redisClient.connect().catch(console.error);

app.use(express.static('public'));

// Configure session middleware
app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));



// Security middleware
app.use(  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // allow inline scripts
        mediaSrc: ["'self'", "https://ssl.gstatic.com"], // allow Google audio
        imgSrc: ["'self'", "data:"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
  }));
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true // Required for cookies/session
}));

// Rate limiting
const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50,
    message: 'Too many upload attempts, please try again later.'
});

// Configure AWS S3
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'ap-south-1'
});

const s3 = new AWS.S3({
    signatureVersion: 'v4',
    serverSideEncryption: 'AES256'
});

// Configure multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
        files: 10 // Maximum 10 files per request
    },
    fileFilter: (req, file, cb) => {
        if (file.size > 100 * 1024 * 1024) {
            return cb(new Error('File too large'), false);
        }
        cb(null, true);
    }
});

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Helper Functions
function generateEncryptedPath(sessionId, filename) {
    const timestamp = Date.now();
    const randomHash = crypto.randomBytes(16).toString('hex');
    const fileExtension = path.extname(filename);
    const baseName = path.basename(filename, fileExtension);
    
    const encryptedFilename = crypto
        .createHash('sha256')
        .update(baseName + timestamp + randomHash)
        .digest('hex');
    
    return `encrypted-uploads/${sessionId}/${encryptedFilename}${fileExtension}`;
}

function generatePresignedUrl(bucketName, key, operation = 'getObject') {
    const params = {
        Bucket: bucketName,
        Key: key,
        Expires: 3600,
        ServerSideEncryption: 'AES256'
    };
    
    return s3.getSignedUrl(operation, params);
}

async function logUploadEvent(sessionId, filename, s3Key, clientIP, userAgent) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        sessionId,
        originalFilename: filename,
        s3Key,
        clientIP,
        userAgent,
        event: 'file_upload'
    };
    
    console.log('Upload Event:', JSON.stringify(logEntry, null, 2));
}

// Routes
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Endpoint to get session ID
app.get('/api/session', (req, res) => {
    if (!req.session.id) {
        req.session.id = crypto.randomUUID(); // Generate a unique session ID
    }
    res.json({ sessionId: req.session.id });
});

// Get presigned URL for direct upload
app.post('/api/presigned-url', uploadLimiter, async (req, res) => {
    try {
        const { filename, contentType } = req.body;
        const sessionId = req.session.id; // Use session ID from session
        
        if (!filename || !sessionId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const s3Key = generateEncryptedPath(sessionId, filename);
        
        const params = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: s3Key,
            Expires: 3600,
            ContentType: contentType,
            ServerSideEncryption: 'AES256',
            Metadata: {
                'original-filename': filename,
                'session-id': sessionId,
                'upload-timestamp': Date.now().toString()
            }
        };
        
        const presignedUrl = s3.getSignedUrl('putObject', params);
        
        res.json({
            uploadUrl: presignedUrl,
            s3Key: s3Key,
            expiresIn: 3600
        });
        
    } catch (error) {
        console.error('Presigned URL Error:', error.stack);
        res.status(500).json({ error: 'Failed to generate upload URL' });
    }
});

// Direct file upload endpoint
app.post('/api/upload', uploadLimiter, upload.array('files', 10), async (req, res) => {
    try {
        const sessionId = req.session.id; // Use session ID from session
        const files = req.files;
        
        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No files provided' });
        }
        
        if (!sessionId) {
            return res.status(400).json({ error: 'Session ID required' });
        }
        
        const uploadResults = [];
        
        for (const file of files) {
            try {
                const s3Key = generateEncryptedPath(sessionId, file.originalname);
                
                const uploadParams = {
                    Bucket: process.env.AWS_S3_BUCKET,
                    Key: s3Key,
                    Body: file.buffer,
                    ContentType: file.mimetype,
                    ServerSideEncryption: 'AES256',
                    StorageClass: 'STANDARD_IA',
                    Metadata: {
                        'original-filename': file.originalname,
                        'session-id': sessionId,
                        'upload-timestamp': Date.now().toString(),
                        'file-size': file.size.toString(),
                        'content-type': file.mimetype
                    },
                    Tagging: `SessionId=${sessionId}&UploadDate=${new Date().toISOString().split('T')[0]}`
                };
                
                const uploadResult = await s3.upload(uploadParams).promise();
                
                await logUploadEvent(
                    sessionId,
                    file.originalname,
                    s3Key,
                    req.ip,
                    req.get('User-Agent')
                );
                
                uploadResults.push({
                    originalName: file.originalname,
                    s3Key: s3Key,
                    location: uploadResult.Location,
                    size: file.size,
                    contentType: file.mimetype,
                    uploadedAt: new Date().toISOString(),
                    downloadUrl: generatePresignedUrl(process.env.AWS_S3_BUCKET, s3Key)
                });
                
            } catch (fileError) {
                console.error(`Error uploading ${file.originalname}:`, fileError.stack);
                uploadResults.push({
                    originalName: file.originalname,
                    error: 'Upload failed',
                    details: fileError.message
                });
            }
        }
        
        res.json({
            sessionId: sessionId,
            uploadResults: uploadResults,
            summary: {
                total: files.length,
                successful: uploadResults.filter(r => !r.error).length,
                failed: uploadResults.filter(r => r.error).length
            }
        });
        
    } catch (error) {
        console.error('Upload Error:', error.stack);
        res.status(500).json({ 
            error: 'Upload failed',
            details: error.message 
        });
    }
});

// List uploaded files for a session
app.get('/api/files/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        if (sessionId !== req.session.id) {
            return res.status(403).json({ error: 'Unauthorized access to session' });
        }
        
        const params = {
            Bucket: process.env.AWS_S3_BUCKET,
            Prefix: `encrypted-uploads/${sessionId}/`
        };
        
        const objects = await s3.listObjectsV2(params).promise();
        
        const files = objects.Contents.map(obj => ({
            key: obj.Key,
            size: obj.Size,
            lastModified: obj.LastModified,
            downloadUrl: generatePresignedUrl(process.env.AWS_S3_BUCKET, obj.Key)
        }));
        
        res.json({
            sessionId,
            files,
            count: files.length
        });
        
    } catch (error) {
        console.error('List Files Error:', error.stack);
        res.status(500).json({ error: 'Failed to list files' });
    }
});

// Download file endpoint
app.get('/api/download/:sessionId/:filename', async (req, res) => {
    try {
        const { sessionId, filename } = req.params;
        if (sessionId !== req.session.id) {
            return res.status(403).json({ error: 'Unauthorized access to session' });
        }
        
        const s3Key = `encrypted-uploads/${sessionId}/${filename}`;
        
        const downloadUrl = generatePresignedUrl(process.env.AWS_S3_BUCKET, s3Key);
        
        await logUploadEvent(
            sessionId,
            filename,
            s3Key,
            req.ip,
            req.get('User-Agent')
        );
        
        res.json({ downloadUrl });
        
    } catch (error) {
        console.error('Download Error:', error.stack);
        res.status(500).json({ error: 'Download failed' });
    }
});

// Delete file endpoint
app.delete('/api/files/:sessionId/:filename', async (req, res) => {
    try {
        const { sessionId, filename } = req.params;
        if (sessionId !== req.session.id) {
            return res.status(403).json({ error: 'Unauthorized access to session' });
        }
        
        const s3Key = `encrypted-uploads/${sessionId}/${filename}`;
        
        const deleteParams = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: s3Key
        };
        
        await s3.deleteObject(deleteParams).promise();
        
        res.json({ message: 'File deleted successfully' });
        
    } catch (error) {
        console.error('Delete Error:', error.stack);
        res.status(500).json({ error: 'Delete failed' });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 100MB.' });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ error: 'Too many files. Maximum is 10 files per upload.' });
        }
    }
    
    console.error('Unhandled Error:', error.stack);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Secure File Upload Server running on port ${PORT}`);
    console.log(`📁 S3 Bucket: ${process.env.AWS_S3_BUCKET}`);
    console.log(`🔒 Encryption: AES-256 Server-Side`);
});

module.exports = app;