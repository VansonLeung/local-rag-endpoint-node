# Local RAG Endpoint: Architecture and Task Plan

## Overview
This document outlines the architecture and task breakdown for building a Node.js-based Retrieval-Augmented Generation (RAG) endpoint. The system supports document uploads (plaintext, DOCX, XLSX, CSV, PDF), vector embedding storage, and KNN-based similarity search for document retrieval.

**Current Implementation Plan**: Use SQLite with sqlite-vec for vector storage (simple, file-based, no external DB required).  
**Future Migration Plan**: Transition to PostgreSQL with pgvector for better scalability and performance in production.

## Architecture Overview

### High-Level Components
1. **API Layer (Express.js)**:
   - RESTful endpoints for document upload and KNN search.
   - Middleware for file handling, validation, and error handling.
   - CORS support for frontend integration (if needed).

2. **Document Processing Layer**:
   - Parsers for each supported format to extract plain text.
   - Preprocessing (e.g., chunking text for embeddings).

3. **Embedding Layer**:
   - Integration with an embedding model (e.g., OpenAI's text-embedding-ada-002 for simplicity, or a local model like Sentence Transformers via transformers.js).
   - Batch processing for efficiency.

4. **Storage Layer (SQLite + sqlite-vec)**:
   - SQLite database with vec0 extension for vector operations.
   - Tables: One for document metadata, one for vector embeddings.
   - KNN search using cosine similarity or Euclidean distance.
   - *Future*: Migrate to PostgreSQL + pgvector for advanced indexing and distributed queries.

5. **Search Layer**:
   - Query processing: Generate embedding for user query, perform KNN on stored vectors.
   - Return top-K similar documents with metadata.

### Data Flow
1. User uploads a document → API receives file → Extract text → Generate embeddings → Store in SQLite.
2. User queries for documents → API generates query embedding → KNN search in SQLite → Return results.

### Tech Stack Choices
- **Node.js/Express**: Lightweight, async-friendly for I/O-heavy tasks like file processing.
- **SQLite + sqlite-vec**: Simple, file-based DB; sqlite-vec provides fast vector KNN without external services.
- **Document Parsers**:
  - Plaintext: Direct read.
  - PDF: `pdf-parse` or `pdf2pic` + OCR if needed.
  - DOCX: `mammoth` or `docx`.
  - XLSX/CSV: `xlsx` or `csv-parser`.
- **Embeddings**: OpenAI API (requires API key) or local (e.g., `transformers.js` with a model like all-MiniLM-L6-v2).
- **File Upload**: `multer` for multipart handling.
- **Other**: `dotenv` for config, `winston` for logging.

### Deployment Considerations
- Run locally (e.g., via `npm start`).
- For production: Containerize with Docker, add authentication (e.g., JWT), rate limiting.
- Scalability: If vector DB grows, consider migrating to pgvector (PostgreSQL) or Pinecone later.

## Task Breakdown

Break this into phases: Setup, Core Implementation, Testing, and Optimization. Each task includes subtasks, dependencies, and estimated effort (in hours, assuming 1 developer).

### Phase 1: Project Setup (2-4 hours)
1. **Initialize Node.js Project**
   - Create `package.json`, install core deps: `express`, `sqlite3`, `sqlite-vec`, `multer`.
   - Set up basic Express server with a health-check endpoint.
   - Create directory structure: `src/` (routes, services, utils), `uploads/`, `db/`.

2. **Database Setup**
   - Install sqlite-vec extension (download from GitHub, load via sqlite3).
   - Create schema: `documents` table (id, filename, content_preview, upload_date), `embeddings` table (doc_id, vector BLOB).
   - Script to initialize DB on startup.

3. **Environment Config**
   - Add `.env` for API keys (e.g., OpenAI), DB path.
   - Basic logging setup.

### Phase 2: Document Upload and Processing (6-8 hours)
4. **Implement Upload Endpoint**
   - POST `/upload`: Accept multipart files, validate formats, store temporarily.
   - Use multer for file handling; limit file size (e.g., 10MB).

5. **Text Extraction Services**
   - Create service classes for each format:
     - Plaintext: Read file as string.
     - PDF: Use `pdf-parse` to extract text.
     - DOCX: Use `mammoth` to convert to HTML/text.
     - XLSX/CSV: Use `xlsx` to parse sheets/cells into text.
   - Handle errors (e.g., corrupted files) and fallback to OCR if text extraction fails.

6. **Embedding Generation**
   - Integrate embedding service (e.g., OpenAI API call or local model).
   - Chunk long documents (e.g., 512 tokens) and average embeddings.
   - Store vectors as BLOBs in SQLite.

### Phase 3: KNN Search and API Completion (4-6 hours)
7. **Implement Search Endpoint**
   - POST `/search`: Accept query string, generate embedding, query KNN.
   - Use sqlite-vec's `vec_knn_cosine` or similar for top-K results.
   - Return JSON: List of documents with similarity scores, previews.

8. **API Enhancements**
   - Add GET `/documents` for listing uploaded docs.
   - Error handling, input validation (e.g., Joi or express-validator).
   - Pagination for search results.

### Phase 4: Testing and Optimization (4-6 hours)
9. **Unit/Integration Tests**
   - Test text extraction for each format.
   - Mock embeddings and DB for search tests.
   - Use Jest or Mocha.

10. **Performance Optimization**
    - Index vectors in sqlite-vec for faster KNN.
    - Batch uploads/searches.
    - Monitor memory usage for large files.

11. **Documentation and Deployment**
    - Write API docs (e.g., Swagger).
    - Create Dockerfile, README with setup/run instructions.

### Total Effort: 16-24 hours
- **Dependencies**: Node.js 18+, SQLite 3.41+ (for vec extension).
- **Risks**: Embedding model choice (local vs. API); file parsing accuracy for complex PDFs.
- **Future Migration Notes**: 
  - Replace sqlite3 with pg (PostgreSQL client).
  - Use pgvector for vector storage (install extension, use vector data type).
  - Update KNN queries to use pgvector functions (e.g., `<=>` for cosine similarity).
  - Adjust schema for PostgreSQL (e.g., use JSONB for metadata).

### Next Steps
- Start with Phase 1 to scaffold the project.
- If implementing, focus on one format at a time for text extraction.
- For migration to PostgreSQL: Plan a separate script to export SQLite data and import into PostgreSQL.
