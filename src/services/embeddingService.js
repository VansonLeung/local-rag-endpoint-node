const axios = require('axios');

class EmbeddingService {
  constructor() {
    this.embeddingUrl = process.env.EMBEDDING_SERVICE_URL || 'http://localhost:13303/embed';
  }

  async generateEmbedding(text) {
    try {
      const response = await axios.post(this.embeddingUrl, { text });
      return response.data.embedding;
    } catch (error) {
      console.error('Error calling embedding service:', error);
      throw new Error('Failed to generate embedding');
    }
  }

  chunkText(text, chunkSize = 2000) {
    // Simple chunking by character count (approx tokens)
    const chunks = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize));
    }
    return chunks;
  }

  async generateEmbeddingsForDocument(content) {
    const chunks = this.chunkText(content);
    const embeddings = [];

    for (const chunk of chunks) {
      const embedding = await this.generateEmbedding(chunk);
      embeddings.push(embedding);
    }

    // Average the embeddings
    if (embeddings.length === 0) return null;

    const avgEmbedding = embeddings[0].map((_, i) =>
      embeddings.reduce((sum, emb) => sum + emb[i], 0) / embeddings.length
    );

    return avgEmbedding;
  }
}

module.exports = new EmbeddingService();
