const fs = require('fs');
const textExtractionService = require('../src/services/textExtraction');

// Mock fs
jest.mock('fs', () => ({
  readFileSync: jest.fn(),
}));

describe('TextExtractionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('extractFromTxt should return file content', () => {
    const mockContent = 'This is a test text file.';
    fs.readFileSync.mockReturnValue(mockContent);

    const result = textExtractionService.extractFromTxt('test.txt');
    expect(result).toBe(mockContent);
    expect(fs.readFileSync).toHaveBeenCalledWith('test.txt', 'utf8');
  });

  // Add more tests for other formats if needed
});
