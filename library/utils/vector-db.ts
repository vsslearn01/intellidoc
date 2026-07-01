import { ENV } from '@library/environment';
import { QdrantClient } from '@qdrant/js-client-rest';

export const client = new QdrantClient({
  url: ENV.QDRANT_HOST,
  apiKey: ENV.QDRANT_API_KEY,
});

async function collectionExists(name: string): Promise<boolean> {
  try {
    await client.getCollection(name);
    return true;
  } catch (err: any) {
    if (err.status === 404) return false;
    throw err;
  }
}

async function ensureCollection(collectionName: string, vectorSize: number) {
  const exists = await collectionExists(collectionName);

  if (!exists) {
    await client.createCollection(collectionName, {
      vectors: {
        size: vectorSize,
        distance: 'Cosine',
      },
    });
  }
}

export async function storePoints(
  points: unknown[],
  collectionName: string,
): Promise<void> {
  if (!points || !Array.isArray(points) || points.length === 0) {
    throw new Error('Points must be a non-empty array');
  }
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const vectorSize = points[0].vector.length as number;
  console.log(
    `Storing ${points.length} points in collection "${collectionName}" with vector size ${vectorSize}`,
  );

  // ensure collection exists
  await ensureCollection(collectionName, vectorSize);
  await client.upsert(collectionName, {
    wait: true,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    points: points,
  });
}
