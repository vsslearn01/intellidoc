import { getChunks, getDocuments, getQdrantPoints } from '@library/utils';
import { Injectable } from '@nestjs/common';

@Injectable()
export class IngestionService {
  constructor() {}

  async initialize(): Promise<void> {
    const files = [
      'https://www.oreilly.com/ai/free/files/fundamentals-of-deep-learning-sampler.pdf',
    ];
    const documents = await getDocuments(files);
    const chunks = await getChunks(documents);
    const points = await getQdrantPoints(chunks);
  }
}
