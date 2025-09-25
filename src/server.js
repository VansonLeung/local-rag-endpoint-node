const express = require('express');
const dotenv = require('dotenv');
const winston = require('winston');
const multer = require('multer');
const path = require('path');

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
const PORT = process.env.PORT || 3000;

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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Local RAG Endpoint is running' });
});

// Placeholder for routes (to be added later)
app.use('/api', require('./routes')(upload));

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

module.exports = app;
