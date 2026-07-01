import {
  getChunks,
  getDocuments,
  indexDocuments,
  storePoints,
} from '@library/utils';
import { Injectable } from '@nestjs/common';

@Injectable()
export class IngestionService {
  constructor() {}

  async initialize(): Promise<void> {
    const files = [
      'https://houseofangular.io/wp-content/uploads/2024/07/The_Ultimate_Guide_To_Angular_Evolution_Angular18.pdf',
    ];
    const documents = await getDocuments(files);
    const chunks = await getChunks(documents);
    console.log('Chunks:', chunks.length, chunks[0]);
    const points = await indexDocuments(chunks);
    console.log('Points:', points);
    await storePoints(points, 'documents');
  }
}
