const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const xlsx = require('xlsx');

class TextExtractionService {
  async extractText(filePath) {
    const ext = path.extname(filePath).toLowerCase();

    try {
      switch (ext) {
        case '.txt':
          return await this.extractFromTxt(filePath);
        case '.pdf':
          return await this.extractFromPdf(filePath);
        case '.docx':
          return await this.extractFromDocx(filePath);
        case '.xlsx':
        case '.xls':
          return await this.extractFromXlsx(filePath);
        case '.csv':
          return await this.extractFromCsv(filePath);
        default:
          throw new Error(`Unsupported file type: ${ext}`);
      }
    } catch (error) {
      console.error(`Error extracting text from ${filePath}:`, error);
      throw new Error(`Failed to extract text: ${error.message}`);
    }
  }

  async extractFromTxt(filePath) {
    return fs.readFileSync(filePath, 'utf8');
  }

  async extractFromPdf(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  }

  async extractFromDocx(filePath) {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  async extractFromXlsx(filePath) {
    const workbook = xlsx.readFile(filePath);
    let text = '';
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      text += xlsx.utils.sheet_to_csv(worksheet) + '\n';
    });
    return text;
  }

  async extractFromCsv(filePath) {
    return fs.readFileSync(filePath, 'utf8');
  }
}

module.exports = new TextExtractionService();
