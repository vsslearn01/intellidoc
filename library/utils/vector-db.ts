import { ENV } from '@library/environment';
import { QdrantClient } from '@qdrant/js-client-rest';

const client = new QdrantClient({
  url: ENV.QDRANT_HOST,
  apiKey: ENV.QDRANT_API_KEY,
});

export async function storePoints(
  points: unknown[],
  collectionName: string,
): Promise<void> {
  if (!points || !Array.isArray(points) || points.length === 0) {
    throw new Error('Points must be a non-empty array');
  }
  await client.upsert(collectionName, {
    wait: true,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    points: points,
  });
}
