class SecureFileUploader {
    constructor() {
        this.files = [];
        this.sessionId = null;
        this.initializeElements();
        this.bindEvents();
        this.initializeSession();
    }

    async initializeSession() {
        try {
            const response = await fetch('/api/session', { credentials: 'include' });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            this.sessionId = data.sessionId;
            console.log('Session ID:', this.sessionId);
        } catch (error) {
            console.error('Failed to get session ID:', error);
            alert('Failed to initialize session. Please refresh the page.');
        }
    }

    initializeElements() {
        this.uploadArea = document.getElementById('uploadArea');
        this.clickArea = document.querySelector('#uploadArea .click-area');
        this.fileInput = document.getElementById('fileInput');
        this.fileList = document.getElementById('fileList');
        this.uploadBtn = document.getElementById('uploadBtn');
        if (!this.uploadArea || !this.clickArea || !this.fileInput) {
            console.error('DOM elements not found:', {
                uploadArea: !!this.uploadArea,
                clickArea: !!this.clickArea,
                fileInput: !!this.fileInput
            });
        }
    }

    bindEvents() {
        // Click to browse
        this.clickArea.addEventListener('click', (e) => {
            console.log('Click area clicked', e.target);
            e.stopPropagation();
            this.fileInput.click();
        });

        // File input change
        this.fileInput.addEventListener('change', (e) => {
            console.log('File input changed, files selected:', e.target.files.length);
            this.handleFiles(e.target.files);
            this.fileInput.value = ''; // Clear input
        });

        // Drag and drop
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('dragover');
        });

        this.uploadArea.addEventListener('dragleave', () => {
            this.uploadArea.classList.remove('dragover');
        });

        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('dragover');
            console.log('Files dropped:', e.dataTransfer.files.length);
            this.handleFiles(e.dataTransfer.files);
        });

        // Upload button
        this.uploadBtn.addEventListener('click', () => {
            console.log('Upload button clicked');
            this.uploadFiles();
        });
    }

    handleFiles(filesList) {
        Array.from(filesList).forEach(file => {
            if (file.size > 100 * 1024 * 1024) { // 100MB limit
                alert(`File ${file.name} is too large. Maximum size is 100MB.`);
                return;
            }

            const fileObj = {
                file: file,
                id: Date.now() + Math.random(),
                status: 'pending',
                progress: 0
            };

            this.files.push(fileObj);
            this.renderFileItem(fileObj);
        });

        this.updateUploadButton();
    }

    renderFileItem(fileObj) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.id = `file-${fileObj.id}`;

        const fileIcon = this.getFileIcon(fileObj.file.type);
        const fileSize = this.formatFileSize(fileObj.file.size);

        fileItem.innerHTML = `
            <div class="file-info">
                <div class="file-icon">${fileIcon}</div>
                <div class="file-details">
                    <h4>${fileObj.file.name}</h4>
                    <p>${fileSize} • ${fileObj.file.type || 'Unknown type'}</p>
                    <div class="progress-bar" style="display: none;">
                        <div class="progress-fill"></div>
                    </div>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <span class="status ${fileObj.status}">${this.getStatusText(fileObj.status)}</span>
                <button class="remove-btn" onclick="uploader.removeFile('${fileObj.id}')">Remove</button>
            </div>
        `;

        this.fileList.appendChild(fileItem);
    }

    getFileIcon(mimeType) {
        if (mimeType.startsWith('image/')) return '🖼️';
        if (mimeType.startsWith('video/')) return '🎥';
        if (mimeType.startsWith('audio/')) return '🎵';
        if (mimeType.includes('pdf')) return '📄';
        if (mimeType.includes('document') || mimeType.includes('msword')) return '📝';
        if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊';
        if (mimeType.includes('zip') || mimeType.includes('rar')) return '🗜️';
        return '📄';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    getStatusText(status) {
        const statusMap = {
            'pending': 'Pending',
            'uploading': 'Uploading...',
            'success': 'Uploaded',
            'error': 'Failed'
        };
        return statusMap[status] || status;
    }

    removeFile(fileId) {
        this.files = this.files.filter(f => f.id != fileId);
        const fileElement = document.getElementById(`file-${fileId}`);
        if (fileElement) {
            fileElement.remove();
        }
        this.updateUploadButton();
    }

    updateUploadButton() {
        const pendingFiles = this.files.filter(f => f.status === 'pending');
        this.uploadBtn.disabled = pendingFiles.length === 0;
        this.uploadBtn.textContent = `🚀 Upload ${pendingFiles.length} Selected Files`;
    }

    async uploadFiles() {
        if (!this.sessionId) {
            alert('Session not initialized. Please refresh the page.');
            return;
        }
        const pendingFiles = this.files.filter(f => f.status === 'pending');
        for (const fileObj of pendingFiles) {
            await this.uploadSingleFile(fileObj);
        }
    }

    async uploadSingleFile(fileObj) {
        const fileElement = document.getElementById(`file-${fileObj.id}`);
        const statusElement = fileElement.querySelector('.status');
        const progressBar = fileElement.querySelector('.progress-bar');
        const progressFill = fileElement.querySelector('.progress-fill');

        fileObj.status = 'uploading';
        statusElement.className = 'status uploading';
        statusElement.textContent = 'Uploading...';
        progressBar.style.display = 'block';

        try {
            await this.performRealUpload(fileObj, (progress) => {
                progressFill.style.width = progress + '%';
            });

            fileObj.status = 'success';
            statusElement.className = 'status success';
            statusElement.textContent = 'Uploaded';
            progressFill.style.width = '100%';

            console.log(`File ${fileObj.file.name} uploaded successfully to encrypted folder: ${this.sessionId}`);
        } catch (error) {
            fileObj.status = 'error';
            statusElement.className = 'status error';
            statusElement.textContent = 'Failed';
            console.error(`Upload failed for ${fileObj.file.name}:`, error);
            alert(`Upload failed for ${fileObj.file.name}: ${error.message}`);
        }

        this.updateUploadButton();
    }

    async performRealUpload(fileObj, progressCallback) {
        const API_BASE_URL = 'http://localhost:3001'; // Match server.js port

        const formData = new FormData();
        formData.append('files', fileObj.file);

        const xhr = new XMLHttpRequest();
        
        return new Promise((resolve, reject) => {
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const percentComplete = (e.loaded / e.total) * 100;
                    progressCallback(percentComplete);
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status === 200) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        console.log('Upload response:', response);
                        resolve(response);
                    } catch (e) {
                        reject(new Error('Invalid response format'));
                    }
                } else {
                    reject(new Error(`Upload failed with status ${xhr.status}`));
                }
            });

            xhr.addEventListener('error', () => {
                reject(new Error('Network error during upload'));
            });

            xhr.open('POST', `${API_BASE_URL}/api/upload`);
            xhr.withCredentials = true; // Include session cookie
            xhr.send(formData);
        });
    }
}

// Initialize the uploader
const uploader = new SecureFileUploader();