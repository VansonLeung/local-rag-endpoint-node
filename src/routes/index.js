const express = require('express');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const documentService = require('../services/documentService');
const db = require('../utils/database');

module.exports = (upload) => {
  const router = express.Router();

  /**
   * @swagger
   * /api/:
   *   get:
   *     summary: API Root
   *     description: Returns a welcome message for the API
   *     tags: [General]
   *     responses:
   *       200:
   *         description: Welcome message
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: API endpoints will be added here
   */
  router.get('/', (req, res) => {
    res.json({ message: 'API endpoints will be added here' });
  });

  /**
   * @swagger
   * /api/upload:
   *   post:
   *     summary: Upload Document File
   *     description: Upload a document file and get a file URL for later processing. Supported formats - .txt, .pdf, .docx, .xlsx, .csv
   *     tags: [Documents]
   *     consumes:
   *       - multipart/form-data
   *     parameters:
   *       - in: formData
   *         name: file
   *         type: file
   *         description: The document file to upload
   *         required: true
   *     responses:
   *       200:
   *         description: File uploaded successfully
   *         schema:
   *           $ref: '#/definitions/UploadFileResponse'
   *       400:
   *         description: Bad request - no file uploaded or invalid file type
   *         schema:
   *           $ref: '#/definitions/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         schema:
   *           $ref: '#/definitions/ErrorResponse'
   */
  router.post('/upload', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { filename, path: filePath } = req.file;
      // Return the file URL instead of processing immediately
      const fileUrl = `/uploads/${filename}`;

      res.json({
        message: 'File uploaded successfully',
        fileUrl: fileUrl,
        filename: filename
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Failed to upload file' });
    }
  });

  /**
   * @swagger
   * /api/download:
   *   post:
   *     summary: Download File from URL
   *     description: Download a file from a given URL and save it to the uploads folder
   *     tags: [Documents]
   *     parameters:
   *       - in: body
   *         name: downloadRequest
   *         description: Download file request
   *         required: true
   *         schema:
   *           $ref: '#/definitions/DownloadFileRequest'
   *     responses:
   *       200:
   *         description: File downloaded and saved successfully
   *         schema:
   *           $ref: '#/definitions/DownloadFileResponse'
   *       400:
   *         description: Bad request - fileUrl is required
   *         schema:
   *           $ref: '#/definitions/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         schema:
   *           $ref: '#/definitions/ErrorResponse'
   */
  router.post('/download', async (req, res) => {
    try {
      const { fileUrl } = req.body;
      if (!fileUrl) {
        return res.status(400).json({ error: 'fileUrl is required' });
      }

      // Download the file
      const response = await axios.get(fileUrl, { responseType: 'stream' });
      
      // Generate filename with timestamp
      const urlParts = fileUrl.split('/');
      const originalFilename = urlParts[urlParts.length - 1] || 'downloaded_file';
      const extension = path.extname(originalFilename) || '.txt';
      const timestamp = Date.now();
      const filename = `${timestamp}-${originalFilename}`;
      const filePath = path.join('./uploads', filename);

      // Save the file
      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      res.json({
        message: 'File downloaded and saved successfully',
        filename: filename,
        fileUrl: `/uploads/${filename}`
      });
    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({ error: 'Failed to download file' });
    }
  });

  /**
   * @swagger
   * /api/process:
   *   post:
   *     summary: Process Document
   *     description: Process a document file from the uploads folder and add it to the search index
   *     tags: [Documents]
   *     parameters:
   *       - in: body
   *         name: processRequest
   *         description: Process document request
   *         required: true
   *         schema:
   *           $ref: '#/definitions/ProcessDocumentRequest'
   *     responses:
   *       200:
   *         description: Document processed and indexed successfully
   *         schema:
   *           $ref: '#/definitions/ProcessDocumentResponse'
   *       400:
   *         description: Bad request - filename is required
   *         schema:
   *           $ref: '#/definitions/ErrorResponse'
   *       404:
   *         description: File not found
   *         schema:
   *           $ref: '#/definitions/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         schema:
   *           $ref: '#/definitions/ErrorResponse'
   */
  router.post('/process', async (req, res) => {
    try {
      const { filename } = req.body;
      if (!filename) {
        return res.status(400).json({ error: 'filename is required' });
      }

      const filePath = path.join('./uploads', filename);

      console.log(__dirname, filePath);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
      }

      const result = await documentService.saveDocument(filename, filePath);

      res.json({
        message: 'Document processed and indexed successfully',
        documentId: result.id,
        preview: result.content.substring(0, 200) + '...'
      });
    } catch (error) {
      console.error('Process error:', error);
      res.status(500).json({ error: 'Failed to process document' });
    }
  });

  /**
   * @swagger
   * /api/search:
   *   post:
   *     summary: Search Documents
   *     description: Perform semantic search across all uploaded documents using natural language queries
   *     tags: [Search]
   *     parameters:
   *       - in: body
   *         name: searchRequest
   *         description: Search parameters
   *         required: true
   *         schema:
   *           $ref: '#/definitions/SearchRequest'
   *     responses:
   *       200:
   *         description: Search results returned successfully
   *         schema:
   *           $ref: '#/definitions/SearchResponse'
   *       400:
   *         description: Bad request - query is required
   *         schema:
   *           $ref: '#/definitions/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         schema:
   *           $ref: '#/definitions/ErrorResponse'
   */
  router.post('/search', async (req, res) => {
    try {
      const { query, limit = 10, page = 1 } = req.body;
      if (!query) {
        return res.status(400).json({ error: 'Query is required' });
      }

      const offset = (page - 1) * limit;
      const results = await documentService.searchDocuments(query, limit, offset);
      res.json({ results, page, limit });
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: 'Failed to perform search' });
    }
  });

  /**
   * @swagger
   * /api/documents:
   *   get:
   *     summary: List Documents
   *     description: Retrieve a paginated list of all uploaded documents
   *     tags: [Documents]
   *     parameters:
   *       - in: query
   *         name: limit
   *         type: integer
   *         default: 50
   *         maximum: 100
   *         description: Number of documents per page
   *       - in: query
   *         name: page
   *         type: integer
   *         default: 1
   *         minimum: 1
   *         description: Page number for pagination
   *     responses:
   *       200:
   *         description: Documents list returned successfully
   *         schema:
   *           $ref: '#/definitions/DocumentsResponse'
   *       500:
   *         description: Internal server error
   *         schema:
   *           $ref: '#/definitions/ErrorResponse'
   */
  router.get('/documents', async (req, res) => {
    try {
      const { limit = 50, page = 1 } = req.query;
      const offset = (page - 1) * parseInt(limit);

      const documents = await new Promise((resolve, reject) => {
        db.all(
          'SELECT id, filename, content_preview, upload_date FROM documents ORDER BY upload_date DESC LIMIT ? OFFSET ?',
          [parseInt(limit), offset],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      });

      res.json({
        documents: documents.map(doc => ({
          id: doc.id,
          filename: doc.filename,
          preview: doc.content_preview,
          uploadDate: doc.upload_date
        })),
        page: parseInt(page),
        limit: parseInt(limit)
      });
    } catch (error) {
      console.error('List documents error:', error);
      res.status(500).json({ error: 'Failed to list documents' });
    }
  });

  return router;
};
