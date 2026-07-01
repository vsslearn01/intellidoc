import { OpenAIEmbeddings } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import cosineSimilarity from 'compute-cosine-similarity';
import { v4 as uuid } from 'uuid';

const embeddings = new OpenAIEmbeddings();

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 800,
  chunkOverlap: 100,
});

interface IStructureChunk {
  id: string;
  title: string;
  content: string;
  level: number;
}

interface IChunk {
  id: string;
  parentId?: string;
  content: string;
}

/**
 * @description
 * Splits raw text into structured sections based on markdown-style headings.
 * Each section represents a logical unit of the document.
 *
 * Helps preserve document hierarchy for better retrieval and context understanding.
 *
 * @param text - Raw document text (markdown, parsed HTML, or cleaned PDF text)
 * @returns Array of structured chunks with title, content, and heading level
 *
 * @example
 * const text = `
 * # Introduction
 * This is intro content
 * ## Details
 * More detailed content
 * `;
 *
 * const sections = structureChunker(text);
 * console.log(sections[0].title); // "Introduction"
 */
export function structureChunker(text: string): IStructureChunk[] {
  const lines = text.split('\n');

  const chunks: IStructureChunk[] = [];
  let current: IStructureChunk | null = null;

  const headingRegex = /^(#{1,6})\s+(.*)/;

  for (const line of lines) {
    const match = line.match(headingRegex);

    if (match) {
      if (current) chunks.push(current);

      current = {
        id: uuid(),
        title: match[2],
        level: match[1].length,
        content: '',
      };
    } else if (current) {
      current.content += line + '\n';
    }
  }

  if (current) chunks.push(current);

  return chunks;
}

/**
 * @description
 * Performs semantic chunking by grouping text segments based on embedding similarity.
 * Adjacent paragraphs are merged if their semantic similarity exceeds a given threshold.
 *
 * This ensures chunks are meaningful rather than arbitrarily split by size.
 *
 * @param paragraphs - Array of text segments (typically from recursive chunking)
 * @param threshold - Cosine similarity threshold (default: 0.75)
 * @returns Array of semantically grouped chunks
 *
 * @example
 * const paragraphs = [
 *   "Transformers are neural networks.",
 *   "They use attention mechanisms.",
 *   "MongoDB is a NoSQL database."
 * ];
 *
 * const chunks = await semanticChunker(paragraphs, 0.75);
 * // First two may merge, third becomes separate
 */
export async function semanticChunker(
  paragraphs: string[],
  threshold = 0.75
) {
  const vectors = await embeddings.embedDocuments(paragraphs);

  const chunks: string[] = [];
  let currentChunk = paragraphs[0];

  for (let i = 1; i < paragraphs.length; i++) {
    const similarity = cosineSimilarity(vectors[i - 1], vectors[i]);

    if (similarity < threshold) {
      chunks.push(currentChunk);
      currentChunk = paragraphs[i];
    } else {
      currentChunk += '\n' + paragraphs[i];
    }
  }

  chunks.push(currentChunk);

  return chunks;
}

/**
 * @description
 * Hybrid chunking pipeline combining:
 * 1. Structure-based chunking (headings)
 * 2. Recursive chunking (size control)
 * 3. Semantic refinement (meaning-based grouping)
 *
 * Designed for production-grade RAG systems to improve retrieval accuracy.
 *
 * @param text - Raw document text
 * @returns Array of final chunks with metadata (title, level)
 *
 * @example
 * const chunks = await hybridChunkingPipeline(documentText);
 *
 * console.log(chunks[0]);
 * // {
 * //   id: "...",
 * //   content: "...",
 * //   metadata: { title: "Introduction", level: 1 }
 * // }
 */
export async function hybridChunkingPipeline(text: string) {
  const structured = structureChunker(text);

  const finalChunks = [];

  for (const section of structured) {
    const recursiveChunks = await splitter.splitText(section.content);

    const refined = await semanticChunker(recursiveChunks, 0.75);

    for (const chunk of refined) {
      finalChunks.push({
        id: uuid(),
        content: chunk,
        metadata: {
          title: section.title,
          level: section.level,
        },
      });
    }
  }

  return finalChunks;
}

/**
 * @description
 * Splits text while preserving code blocks (fenced with ```).
 * Prevents breaking code logic across chunks, which is critical for developer docs.
 *
 * Falls back to fixed-size chunking for large non-code blocks.
 *
 * @param text - Raw text containing code blocks
 * @returns Array of chunks with preserved code integrity
 *
 * @example
 * const text = `
 * Here is some explanation
 * \`\`\`js
 * function test() {
 *   return true;
 * }
 * \`\`\`
 * More explanation
 * `;
 *
 * const chunks = codeAwareChunking(text);
 */
export function codeAwareChunking(text: string) {
  const blocks = text.match(/```[\s\S]*?```|[^`]+/g) || [];

  const chunks: string[] = [];

  for (const block of blocks) {
    if (block.trim().length < 800) {
      chunks.push(block);
    } else {
      chunks.push(...block.match(/.{1,800}/g)!);
    }
  }

  return chunks;
}

/**
 * @description
 * Creates parent-child relationships between chunks.
 * All child chunks are linked to a single parent ID.
 *
 * Useful for hierarchical retrieval:
 * - Retrieve child chunk → expand to parent
 * - Improves context completeness in RAG systems
 *
 * @param chunks - Array of chunk strings
 * @returns Array of chunks with parentId mapping
 *
 * @example
 * const chunks = ["chunk1", "chunk2"];
 * const mapped = createParentChild(chunks);
 *
 * console.log(mapped[0].parentId === mapped[1].parentId); // true
 */
export function createParentChild(chunks: string[]): IChunk[] {
  const parentId = uuid();

  return chunks.map((chunk) => ({
    id: uuid(),
    parentId,
    content: chunk,
  }));
}
