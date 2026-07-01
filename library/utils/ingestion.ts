import { Document } from '@langchain/core/documents';
import {
  RecursiveCharacterTextSplitter,
  RecursiveCharacterTextSplitterParams,
} from '@langchain/textsplitters';
import { PDFParse } from 'pdf-parse';
import ollama from 'ollama';
import { v4 as uuid } from 'uuid';

export async function getDocuments(files: string[]): Promise<Document[]> {
  const documents: Document[] = [];
  for (const file of files) {
    const { pageContent, info } = await getPageContent(file);
    documents.push(
      new Document({
        pageContent: pageContent,
        // [IMPORTANT]: Add the source of the document to the metadata for future reference
        metadata: { source: file, ...info },
      }),
    );
  }
  return documents;
}

export async function getChunks(
  documents: Document[],
  options?: Partial<RecursiveCharacterTextSplitterParams>,
): Promise<Document[]> {
  if (!documents || !Array.isArray(documents) || documents.length === 0) {
    throw new Error('Documents must be a non-empty array');
  }
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
    separators: ['\n\n', '\n', ' ', '', '.', '!', '?', ',', ';', ':'],
    ...(options || {}),
  });
  const chunks = await splitter.splitDocuments(documents);
  return chunks;
}

export async function embedChunks(
  chunks: Document[],
  model?: string,
): Promise<number[][]> {
  if (!chunks || !Array.isArray(chunks) || chunks.length === 0) {
    throw new Error('Chunks must be a non-empty array');
  }
  const response = await ollama.embed({
    model: model || 'qwen3-embedding:0.6b',
    input: chunks.map((chunk) => chunk.pageContent),
  });
  return response.embeddings;
}

export async function indexDocuments(
  chunks: Document[],
  model?: string,
): Promise<unknown[]> {
  if (!chunks || !Array.isArray(chunks) || chunks.length === 0) {
    throw new Error('Chunks must be a non-empty array');
  }
  const embeddings = await embedChunks(chunks, model);
  return chunks.map((chunk, index) => ({
    id: uuid(),
    vector: embeddings[index],
    payload: {
      text: chunk.pageContent,
      ...(chunk.metadata || {}),
    },
  }));
}

async function getPageContent(
  file: string,
): Promise<{ pageContent: string; info: Record<string, string | number> }> {
  const extention = file.split('.').pop();
  if (extention === 'pdf') {
    const parser = new PDFParse({ url: file });
    const result = await parser.getText();
    const info = await parser.getInfo();
    await parser.destroy();
    return {
      pageContent: result.text,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      info: { ...(info?.info || {}), total: info?.total },
    };
  } else {
    throw new Error(`Unsupported file type: ${extention}`);
  }
}
