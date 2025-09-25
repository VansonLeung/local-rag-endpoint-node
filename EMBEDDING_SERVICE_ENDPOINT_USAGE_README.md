# Embedding Service Endpoint Usage for Third-Party Services

This document provides guidance for third-party services and applications on how to integrate with the Embedding Service API hosted at `http://localhost:3001`. This API generates text embeddings using a pre-trained transformer model, suitable for tasks like semantic search, similarity matching, and RAG (Retrieval-Augmented Generation) systems.

## Endpoint Overview

- **Base URL**: `http://localhost:3001`
- **Protocol**: HTTP
- **Authentication**: None required (for local development)
- **Rate Limiting**: None implemented
- **Content-Type**: `application/json`

## API Endpoints

### Health Check
- **URL**: `GET /health`
- **Purpose**: Verify service availability and get model information
- **Response**:
  ```json
  {
    "status": "OK",
    "model": "moka-ai/m3e-base"
  }
  ```

### Generate Embedding
- **URL**: `POST /embed`
- **Purpose**: Generate vector embeddings for input text
- **Request Body**:
  ```json
  {
    "text": "string"  // Required: The text to embed (max 512 tokens)
  }
  ```
- **Success Response (200)**:
  ```json
  {
    "embedding": [float, float, ...]  // 768-dimensional vector
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{"detail": "Text is required"}`
  - `500 Internal Server Error`: `{"detail": "Failed to generate embedding"}`

## Integration Examples

### Python (using requests)

```python
import requests

class EmbeddingClient:
    def __init__(self, base_url="http://localhost:3001"):
        self.base_url = base_url

    def get_embedding(self, text: str) -> list:
        response = requests.post(
            f"{self.base_url}/embed",
            json={"text": text},
            timeout=30
        )
        response.raise_for_status()
        return response.json()["embedding"]

    def health_check(self) -> dict:
        response = requests.get(f"{self.base_url}/health")
        response.raise_for_status()
        return response.json()

# Usage
client = EmbeddingClient()
embedding = client.get_embedding("Hello, world!")
print(f"Embedding dimension: {len(embedding)}")
```

### JavaScript/Node.js (using axios)

```javascript
const axios = require('axios');

class EmbeddingClient {
    constructor(baseUrl = 'http://localhost:3001') {
        this.baseUrl = baseUrl;
        this.client = axios.create({
            baseURL: this.baseUrl,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    async getEmbedding(text) {
        try {
            const response = await this.client.post('/embed', { text });
            return response.data.embedding;
        } catch (error) {
            console.error('Embedding request failed:', error.response?.data || error.message);
            throw error;
        }
    }

    async healthCheck() {
        try {
            const response = await this.client.get('/health');
            return response.data;
        } catch (error) {
            console.error('Health check failed:', error.message);
            throw error;
        }
    }
}

// Usage
const client = new EmbeddingClient();
client.getEmbedding('Hello, world!').then(embedding => {
    console.log(`Embedding dimension: ${embedding.length}`);
});
```

### cURL

```bash
# Health check
curl -X GET "http://localhost:3001/health"

# Generate embedding
curl -X POST "http://localhost:3001/embed" \
     -H "Content-Type: application/json" \
     -d '{"text": "Your text here"}'
```

### Java (using HttpClient)

```java
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URI;
import com.fasterxml.jackson.databind.ObjectMapper;

public class EmbeddingClient {
    private final String baseUrl;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public EmbeddingClient(String baseUrl) {
        this.baseUrl = baseUrl;
        this.httpClient = HttpClient.newHttpClient();
        this.objectMapper = new ObjectMapper();
    }

    public double[] getEmbedding(String text) throws Exception {
        String requestBody = objectMapper.writeValueAsString(Map.of("text", text));

        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(baseUrl + "/embed"))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(requestBody))
            .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            throw new RuntimeException("Request failed: " + response.body());
        }

        Map<String, Object> result = objectMapper.readValue(response.body(), Map.class);
        List<Double> embeddingList = (List<Double>) result.get("embedding");
        return embeddingList.stream().mapToDouble(Double::doubleValue).toArray();
    }
}
```

## Best Practices

1. **Text Preprocessing**: Clean and normalize input text before sending to avoid encoding issues.

2. **Batch Processing**: For multiple texts, send separate requests (API doesn't support batching currently).

3. **Error Handling**: Always implement retry logic with exponential backoff for transient failures.

4. **Caching**: Cache embeddings for frequently used texts to reduce API calls and latency.

5. **Timeout**: Set appropriate timeouts (e.g., 30 seconds) for requests.

6. **Input Validation**: Ensure text is not empty and within reasonable length limits.

7. **Monitoring**: Log API usage and response times for performance monitoring.

## Model Specifications

- **Model**: moka-ai/m3e-base (multilingual embedding model)
- **Dimensions**: 768
- **Max Sequence Length**: 512 tokens
- **Normalization**: L2 normalized
- **Pooling**: Mean pooling over token embeddings

## Troubleshooting

- **Connection Refused**: Ensure the service is running on the specified port.
- **Timeout**: Model inference may take time for long texts; increase timeout if needed.
- **Memory Issues**: Large texts or high concurrency may cause OOM; monitor server resources.
- **Encoding Errors**: Ensure text is properly encoded as UTF-8.

## Security Considerations

For production deployment:
- Implement authentication/authorization
- Use HTTPS instead of HTTP
- Add rate limiting
- Validate and sanitize inputs
- Monitor for abuse

This endpoint is currently configured for local development. For production use, consider deploying behind a reverse proxy with proper security measures.
