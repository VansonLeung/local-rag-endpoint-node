const express = require('express');
const documentService = require('../services/documentService');
const db = require('../utils/database');

module.exports = (upload) => {
  const router = express.Router();

  // Placeholder routes
  router.get('/', (req, res) => {
    res.json({ message: 'API endpoints will be added here' });
  });

  // Upload endpoint
  router.post('/upload', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { filename, path: filePath } = req.file;
      const result = await documentService.saveDocument(filename, filePath);

      res.json({
        message: 'File uploaded and processed successfully',
        documentId: result.id,
        preview: result.content.substring(0, 200) + '...'
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Failed to process file' });
    }
  });

  // Search endpoint
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

  // List documents endpoint
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
