const express = require('express');
const dotenv = require('dotenv');
const winston = require('winston');
const multer = require('multer');
const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const cors = require('cors');

// Load environment variables
dotenv.config();

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 13301;

// Swagger configuration
const swaggerOptions = {
  definition: {
    swagger: '2.0',
    info: {
      title: 'Local RAG Endpoint API',
      description: 'A Node.js RAG endpoint with SQLite and vector embeddings for document upload, search, and retrieval',
      version: '1.0.0',
      contact: {
        name: 'Local RAG Endpoint Support'
      }
    },
    host: `localhost:${PORT}`,
    basePath: '/',
    schemes: ['http'],
    consumes: ['application/json'],
    produces: ['application/json'],
    definitions: {
      HealthResponse: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            example: 'OK'
          },
          message: {
            type: 'string',
            example: 'Local RAG Endpoint is running'
          }
        }
      },
      UploadResponse: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'File uploaded and processed successfully'
          },
          documentId: {
            type: 'integer',
            example: 123
          },
          preview: {
            type: 'string',
            example: 'Document content preview text...'
          }
        }
      },
      SearchRequest: {
        type: 'object',
        required: ['query'],
        properties: {
          query: {
            type: 'string',
            description: 'Search query in natural language',
            example: 'machine learning fundamentals'
          },
          limit: {
            type: 'integer',
            description: 'Number of results to return',
            default: 10,
            example: 10
          },
          page: {
            type: 'integer',
            description: 'Page number for pagination',
            default: 1,
            example: 1
          }
        }
      },
      SearchResult: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            example: 123
          },
          filename: {
            type: 'string',
            example: 'document.pdf'
          },
          content: {
            type: 'string',
            example: 'Relevant content snippet...'
          },
          similarity: {
            type: 'number',
            format: 'float',
            example: 0.95
          },
          uploadDate: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-15T10:30:00.000Z'
          }
        }
      },
      SearchResponse: {
        type: 'object',
        properties: {
          results: {
            type: 'array',
            items: {
              $ref: '#/definitions/SearchResult'
            }
          },
          page: {
            type: 'integer',
            example: 1
          },
          limit: {
            type: 'integer',
            example: 10
          }
        }
      },
      Document: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            example: 123
          },
          filename: {
            type: 'string',
            example: 'document.pdf'
          },
          preview: {
            type: 'string',
            example: 'Content preview text...'
          },
          uploadDate: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-15T10:30:00.000Z'
          }
        }
      },
      DocumentsResponse: {
        type: 'object',
        properties: {
          documents: {
            type: 'array',
            items: {
              $ref: '#/definitions/Document'
            }
          },
          page: {
            type: 'integer',
            example: 1
          },
          limit: {
            type: 'integer',
            example: 50
          }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            example: 'Error message description'
          }
        }
      },
      UploadFileResponse: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'File uploaded successfully'
          },
          fileUrl: {
            type: 'string',
            example: '/uploads/document.pdf'
          },
          filename: {
            type: 'string',
            example: 'document.pdf'
          }
        }
      },
      ProcessDocumentRequest: {
        type: 'object',
        required: ['filename'],
        properties: {
          filename: {
            type: 'string',
            description: 'Name of the file in uploads folder to process',
            example: '1758765824314-document.pdf'
          }
        }
      },
      ProcessDocumentResponse: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Document processed and indexed successfully'
          },
          documentId: {
            type: 'integer',
            example: 123
          },
          preview: {
            type: 'string',
            example: 'Document content preview text...'
          }
        }
      },
      DownloadFileRequest: {
        type: 'object',
        required: ['fileUrl'],
        properties: {
          fileUrl: {
            type: 'string',
            description: 'URL of the file to download',
            example: 'https://pdfobject.com/pdf/sample.pdf'
          }
        }
      },
      DownloadFileResponse: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'File downloaded and saved successfully'
          },
          filename: {
            type: 'string',
            example: '1758765824314-document.pdf'
          },
          fileUrl: {
            type: 'string',
            example: '/uploads/1758765824314-document.pdf'
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js', './src/server.js'] // Path to the API routes and server
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /txt|pdf|docx|xlsx|csv/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    // Accept based on extension, or if mimetype is text/plain for txt files
    const mimetype = file.mimetype === 'text/plain' || allowedTypes.test(file.mimetype);
    if (extname && (mimetype || path.extname(file.originalname).toLowerCase() === '.txt')) {
      return cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Only txt, pdf, docx, xlsx, csv are allowed. Got: ${file.mimetype}, ext: ${path.extname(file.originalname)}`));
    }
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health Check
 *     description: Check if the service is running and operational
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         schema:
 *           $ref: '#/definitions/HealthResponse'
 */
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Local RAG Endpoint is running' });
});

// Swagger API documentation endpoints
app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Placeholder for routes (to be added later)
app.use('/api', require('./routes')(upload));

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
app.listen(PORT, () => {
  logger.info(`http://localhost:${PORT} Server running on port ${PORT}`);
});

module.exports = app;
