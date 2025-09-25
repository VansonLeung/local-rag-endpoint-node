const db = require('../utils/database');
const textExtractionService = require('./textExtraction');
const embeddingService = require('./embeddingService');

class DocumentService {
  async saveDocument(filename, filePath) {
    return new Promise(async (resolve, reject) => {
      try {
        // Extract text
        const content = await textExtractionService.extractText(filePath);

        // Generate preview (first 500 characters)
        const contentPreview = content.substring(0, 500) + (content.length > 500 ? '...' : '');

        // Insert into database
        db.run(
          'INSERT INTO documents (filename, content_preview, upload_date) VALUES (?, ?, datetime("now"))',
          [filename, contentPreview],
          async function(err) {
            if (err) {
              reject(err);
            } else {
              const docId = this.lastID;

              try {
                // Generate embeddings
                const embedding = await embeddingService.generateEmbeddingsForDocument(content);

                if (embedding) {
                  // Save embedding as Float32Array BLOB for sqlite-vec
                  const float32Array = new Float32Array(embedding);
                  const embeddingBuffer = Buffer.from(float32Array.buffer);
                  db.run(
                    'INSERT INTO embeddings (doc_id, vector) VALUES (?, ?)',
                    [docId, embeddingBuffer],
                    (err) => {
                      if (err) {
                        console.error('Error saving embedding:', err);
                      }
                    }
                  );
                }

                resolve({ id: docId, content });
              } catch (embeddingError) {
                console.error('Error generating embedding:', embeddingError);
                resolve({ id: docId, content }); // Still resolve, embedding failed
              }
            }
          }
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  async searchDocuments(query, limit = 10, offset = 0) {
    return new Promise(async (resolve, reject) => {
      try {
        // Generate embedding for query
        const queryEmbedding = await embeddingService.generateEmbedding(query);
        const queryFloat32Array = new Float32Array(queryEmbedding);
        const queryBuffer = Buffer.from(queryFloat32Array.buffer);

        // Query for similar documents using KNN
        const sql = `
          SELECT d.id, d.filename, d.content_preview, d.upload_date,
                 vec_distance_cosine(e.vector, ?) as distance
          FROM documents d
          JOIN embeddings e ON d.id = e.doc_id
          ORDER BY distance ASC
          LIMIT ? OFFSET ?
        `;

        db.all(sql, [queryBuffer, limit, offset], (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows.map(row => ({
              id: row.id,
              filename: row.filename,
              preview: row.content_preview,
              uploadDate: row.upload_date,
              similarity: 1 - row.distance // Convert distance to similarity
            })));
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = new DocumentService();
