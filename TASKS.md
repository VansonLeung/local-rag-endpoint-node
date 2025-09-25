# Task List for Local RAG Endpoint

This task list is derived from the architecture and plan in `PREPARATIONS.md`. Use checkboxes to track progress. Estimated total effort: 16-24 hours.

## Phase 1: Project Setup (2-4 hours)
- [x] Initialize Node.js Project
  - Create `package.json`, install core deps: `express`, `sqlite3`, `sqlite-vec`, `multer`.
  - Set up basic Express server with a health-check endpoint.
  - Create directory structure: `src/` (routes, services, utils), `uploads/`, `db/`.
- [x] Database Setup
  - Install sqlite-vec extension (download from GitHub, load via sqlite3).
  - Create schema: `documents` table (id, filename, content_preview, upload_date), `embeddings` table (doc_id, vector BLOB).
  - Script to initialize DB on startup.
- [x] Environment Config
  - Add `.env` for API keys (e.g., OpenAI), DB path.
  - Basic logging setup.

## Phase 2: Document Upload and Processing (6-8 hours)
- [ ] Implement Upload Endpoint
  - POST `/upload`: Accept multipart files, validate formats, store temporarily.
  - Use multer for file handling; limit file size (e.g., 10MB).
- [ ] Text Extraction Services
  - Create service classes for each format:
    - Plaintext: Read file as string.
    - PDF: Use `pdf-parse` to extract text.
    - DOCX: Use `mammoth` to convert to HTML/text.
    - XLSX/CSV: Use `xlsx` to parse sheets/cells into text.
  - Handle errors (e.g., corrupted files) and fallback to OCR if text extraction fails.
- [ ] Embedding Generation
  - Integrate embedding service (e.g., OpenAI API call or local model).
  - Chunk long documents (e.g., 512 tokens) and average embeddings.
  - Store vectors as BLOBs in SQLite.

## Phase 3: KNN Search and API Completion (4-6 hours)
- [ ] Implement Search Endpoint
  - POST `/search`: Accept query string, generate embedding, query KNN.
  - Use sqlite-vec's `vec_knn_cosine` or similar for top-K results.
  - Return JSON: List of documents with similarity scores, previews.
- [ ] API Enhancements
  - Add GET `/documents` for listing uploaded docs.
  - Error handling, input validation (e.g., Joi or express-validator).
  - Pagination for search results.

## Phase 4: Testing and Optimization (4-6 hours)
- [ ] Unit/Integration Tests
  - Test text extraction for each format.
  - Mock embeddings and DB for search tests.
  - Use Jest or Mocha.
- [ ] Performance Optimization
  - Index vectors in sqlite-vec for faster KNN.
  - Batch uploads/searches.
  - Monitor memory usage for large files.
- [ ] Documentation and Deployment
  - Write API docs (e.g., Swagger).
  - Create Dockerfile, README with setup/run instructions.

## Future Migration Notes
- [ ] Plan PostgreSQL Migration
  - Replace sqlite3 with pg (PostgreSQL client).
  - Use pgvector for vector storage (install extension, use vector data type).
  - Update KNN queries to use pgvector functions (e.g., `<=>` for cosine similarity).
  - Adjust schema for PostgreSQL (e.g., use JSONB for metadata).
  - Script to export SQLite data and import into PostgreSQL.
