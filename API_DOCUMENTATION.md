# Local RAG Endpoint API Documentation

This document provides comprehensive API documentation for third-party applications to integrate with the Local RAG (Retrieval-Augmented Generation) Endpoint. This service allows you to upload documents, perform semantic search across them, and retrieve document information.

## OpenAPI/Swagger Specification

The API is fully documented using OpenAPI 2.0 (Swagger) specification and can be accessed at:
- **Swagger JSON**: `http://localhost:13301/swagger.json`

This specification can be imported into API management tools, documentation generators, and platforms like Dify for automated integration.

## Overview

- **Base URL**: `http://localhost:13301`
- **Protocol**: HTTP
- **Authentication**: None required (for local development)
- **CORS**: Enabled (allows cross-origin requests)
- **Rate Limiting**: None implemented
- **Content-Type**: `application/json` (except for file uploads)
- **Supported File Types**: `.txt`, `.pdf`, `.docx`, `.xlsx`, `.csv`

## API Endpoints

### Health Check

**GET** `/health`

Check if the service is running and operational.

**Response (200 OK)**:
```json
{
  "status": "OK",
  "message": "Local RAG Endpoint is running"
}
```

### Upload Document File

**POST** `/api/upload`

Upload a document file and receive a file URL for later processing. This endpoint only handles file storage and returns a URL.

**Content-Type**: `multipart/form-data`

**Parameters**:
- `file` (file, required): The document file to upload

**Supported File Types**:
- Text files (.txt)
- PDF documents (.pdf)
- Word documents (.docx)
- Excel spreadsheets (.xlsx)
- CSV files (.csv)

**File Size Limit**: 10MB

**Success Response (200 OK)**:
```json
{
  "message": "File uploaded successfully",
  "fileUrl": "/uploads/1758765824314-document.pdf",
  "filename": "1758765824314-document.pdf"
}
```

**Note**: Uploaded files are accessible via public URLs at `http://localhost:13301/uploads/{filename}`

**Error Responses**:
- `400 Bad Request`: `{"error": "No file uploaded"}`
- `400 Bad Request`: `{"error": "Invalid file type. Only txt, pdf, docx, xlsx, csv are allowed."}`
- `500 Internal Server Error`: `{"error": "Failed to upload file"}`

### Download File from URL

**POST** `/api/download`

Download a file from a given URL and save it to the uploads folder for later processing.

**Request Body**:
```json
{
  "fileUrl": "string"  // Required: URL of the file to download
}
```

**Success Response (200 OK)**:
```json
{
  "message": "File downloaded and saved successfully",
  "filename": "1758765824314-document.pdf",
  "fileUrl": "/uploads/1758765824314-document.pdf"
}
```

**Error Responses**:
- `400 Bad Request`: `{"error": "fileUrl is required"}`
- `500 Internal Server Error`: `{"error": "Failed to download file"}`

### Process Document

**POST** `/api/process`

Process a document file from the uploads folder and add it to the search index. This endpoint extracts text, generates embeddings, and makes the document searchable.

**Request Body**:
```json
{
  "filename": "string"  // Required: Name of the file in uploads folder (from /api/upload or /api/download response)
}
```

**Success Response (200 OK)**:
```json
{
  "message": "Document processed and indexed successfully",
  "documentId": 123,
  "preview": "Document content preview text..."
}
```

**Error Responses**:
- `400 Bad Request`: `{"error": "filename is required"}`
- `404 Not Found`: `{"error": "File not found"}`
- `500 Internal Server Error`: `{"error": "Failed to process document"}`

### Search Documents

**POST** `/api/search`

Perform semantic search across all uploaded documents using natural language queries.

**Request Body**:
```json
{
  "query": "string",  // Required: Search query in natural language
  "limit": 10,        // Optional: Number of results to return (default: 10)
  "page": 1          // Optional: Page number for pagination (default: 1)
}
```

**Success Response (200 OK)**:
```json
{
  "results": [
    {
      "id": 123,
      "filename": "document.pdf",
      "content": "Relevant content snippet...",
      "similarity": 0.95,
      "uploadDate": "2024-01-15T10:30:00.000Z"
    }
  ],
  "page": 1,
  "limit": 10
}
```

**Error Responses**:
- `400 Bad Request`: `{"error": "Query is required"}`
- `500 Internal Server Error`: `{"error": "Failed to perform search"}`

### List Documents

**GET** `/api/documents`

Retrieve a paginated list of all uploaded documents.

**Query Parameters**:
- `limit` (integer, optional): Number of documents per page (default: 50, max: 100)
- `page` (integer, optional): Page number (default: 1)

**Success Response (200 OK)**:
```json
{
  "documents": [
    {
      "id": 123,
      "filename": "document.pdf",
      "preview": "Content preview text...",
      "uploadDate": "2024-01-15T10:30:00.000Z"
    }
  ],
  "page": 1,
  "limit": 50
}
```

**Error Response**:
- `500 Internal Server Error`: `{"error": "Failed to list documents"}`

## Integration Examples

### Python Integration

#### Upload and Process a Document (Two-Step Process)
```python
import requests

# Step 1: Upload the file
upload_url = "http://localhost:13301/api/upload"
files = {"file": open("document.pdf", "rb")}
upload_response = requests.post(upload_url, files=files)

if upload_response.status_code == 200:
    upload_data = upload_response.json()
    print("Upload successful:", upload_data)
    
    # Step 2: Process the uploaded file
    process_url = "http://localhost:13301/api/process"
    process_data = {"filename": upload_data["filename"]}
    process_response = requests.post(process_url, json=process_data)
    
    if process_response.status_code == 200:
        print("Processing successful:", process_response.json())
    else:
        print("Processing failed:", process_response.json())
else:
    print("Upload failed:", upload_response.json())
```

#### Download and Process a Document from URL
```python
import requests

# Step 1: Download file from URL
download_url = "http://localhost:13301/api/download"
download_data = {"fileUrl": "https://pdfobject.com/pdf/sample.pdf"}
download_response = requests.post(download_url, json=download_data)

if download_response.status_code == 200:
    download_data = download_response.json()
    print("Download successful:", download_data)
    
    # Step 2: Process the downloaded file
    process_url = "http://localhost:13301/api/process"
    process_data = {"filename": download_data["filename"]}
    process_response = requests.post(process_url, json=process_data)
    
    if process_response.status_code == 200:
        print("Processing successful:", process_response.json())
    else:
        print("Processing failed:", process_response.json())
else:
    print("Download failed:", download_response.json())
```#### Search Documents
```python
import requests

url = "http://localhost:13301/api/search"
data = {
    "query": "machine learning fundamentals",
    "limit": 5
}
response = requests.post(url, json=data)

if response.status_code == 200:
    results = response.json()["results"]
    for result in results:
        print(f"Found in {result['filename']}: {result['content'][:100]}...")
else:
    print("Search failed:", response.json())
```

#### List Documents
```python
import requests

url = "http://localhost:13301/api/documents"
params = {"limit": 10, "page": 1}
response = requests.get(url, params=params)

if response.status_code == 200:
    documents = response.json()["documents"]
    for doc in documents:
        print(f"{doc['id']}: {doc['filename']} - {doc['uploadDate']}")
else:
    print("List failed:", response.json())
```

### JavaScript/Node.js Integration

```javascript
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

// Upload and process document (two-step process)
async function uploadAndProcessDocument(filePath) {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));

  try {
    // Step 1: Upload the file
    const uploadResponse = await axios.post('http://localhost:13301/api/upload', form, {
      headers: form.getHeaders()
    });
    console.log('Upload successful:', uploadResponse.data);
    
    // Step 2: Process the uploaded file
    const processResponse = await axios.post('http://localhost:13301/api/process', {
      filename: uploadResponse.data.filename
    });
    console.log('Processing successful:', processResponse.data);
    
  } catch (error) {
    console.error('Upload/Process failed:', error.response.data);
  }
}

// Download and process document from URL
async function downloadAndProcessDocument(fileUrl) {
  try {
    // Step 1: Download the file
    const downloadResponse = await axios.post('http://localhost:13301/api/download', {
      fileUrl: fileUrl
    });
    console.log('Download successful:', downloadResponse.data);
    
    // Step 2: Process the downloaded file
    const processResponse = await axios.post('http://localhost:13301/api/process', {
      filename: downloadResponse.data.filename
    });
    console.log('Processing successful:', processResponse.data);
    
  } catch (error) {
    console.error('Download/Process failed:', error.response.data);
  }
}// Search documents
async function searchDocuments(query) {
  try {
    const response = await axios.post('http://localhost:13301/api/search', {
      query: query,
      limit: 10
    });
    console.log('Search results:', response.data.results);
  } catch (error) {
    console.error('Search failed:', error.response.data);
  }
}

// List documents
async function listDocuments(page = 1, limit = 50) {
  try {
    const response = await axios.get('http://localhost:13301/api/documents', {
      params: { page, limit }
    });
    console.log('Documents:', response.data.documents);
  } catch (error) {
    console.error('List failed:', error.response.data);
  }
}
```

### cURL Examples

#### Health Check
```bash
curl -X GET http://localhost:13301/health
```

#### Upload and Process Document (Two-Step Process)
```bash
# Step 1: Upload the file
UPLOAD_RESPONSE=$(curl -X POST http://localhost:13301/api/upload \
  -F "file=@document.pdf")

echo "Upload response: $UPLOAD_RESPONSE"

# Extract filename from response (you would need to parse this properly in a script)
# For this example, assuming the filename is "1758765824314-document.pdf"

# Step 2: Process the uploaded file
curl -X POST http://localhost:13301/api/process \
  -H "Content-Type: application/json" \
  -d '{"filename": "1758765824314-document.pdf"}'
```

#### Download and Process Document from URL
```bash
# Step 1: Download file from URL
DOWNLOAD_RESPONSE=$(curl -X POST http://localhost:13301/api/download \
  -H "Content-Type: application/json" \
  -d '{"fileUrl": "https://pdfobject.com/pdf/sample.pdf"}')

echo "Download response: $DOWNLOAD_RESPONSE"

# Extract filename from response (you would need to parse this properly in a script)
# For this example, assuming the filename is "1758765824314-document.pdf"

# Step 2: Process the downloaded file
curl -X POST http://localhost:13301/api/process \
  -H "Content-Type: application/json" \
  -d '{"filename": "1758765824314-document.pdf"}'
```

#### Search Documents
```bash
curl -X POST http://localhost:13301/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "artificial intelligence", "limit": 5}'
```

#### List Documents
```bash
curl -X GET "http://localhost:13301/api/documents?limit=20&page=1"
```

## Error Handling

All API endpoints return appropriate HTTP status codes and JSON error responses:

- **200 OK**: Success
- **400 Bad Request**: Invalid request parameters
- **500 Internal Server Error**: Server-side error

Error responses follow this format:
```json
{
  "error": "Error message description"
}
```

## Rate Limiting and Best Practices

- No rate limiting is currently implemented
- File uploads are limited to 10MB
- Use pagination for large document lists
- Handle network timeouts gracefully
- Implement retry logic for transient failures

## Dependencies

This service depends on an external embedding service running on `http://localhost:13303`. Ensure both services are running for full functionality:

- **RAG Endpoint**: `http://localhost:13301` (this service)
- **Embedding Service**: `http://localhost:13303` (external dependency)

The embedding service provides text-to-vector conversion using transformer models for semantic search capabilities.

## Support

For issues or questions about this API, please refer to the project documentation or contact the development team.

## Integration with External Tools

### Dify Integration
To integrate this API with Dify:

1. Access the OpenAPI specification at: `http://localhost:13301/swagger.json`
2. Import the specification into Dify's API tool configuration
3. Configure authentication if needed (currently none required)
4. Use the available endpoints in your Dify workflows:
   - Upload documents via `/api/upload`
   - Download documents from URLs via `/api/download`
   - Process documents via `/api/process`
   - Search documents via `/api/search`
   - List documents via `/api/documents`

### Web Application Integration
CORS is enabled, allowing web applications to make direct API calls from browsers:
- Frontend frameworks (React, Vue, Angular) can call these endpoints directly
- No proxy server required for cross-origin requests
- Supports all modern browsers

### Other API Tools
The Swagger JSON can be imported into:
- Postman Collections
- Swagger UI
- API Gateway services
- Code generation tools
- Testing frameworks</content>
<parameter name="filePath">/Users/user/Documents/projects/octopus/codes/local-rag-endpoint-node/API_DOCUMENTATION.md
