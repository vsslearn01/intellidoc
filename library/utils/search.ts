import ollama from 'ollama';
import { client } from './vector-db';

export async function embedQuery(query: string, model?: string) {
  const res = await ollama.embed({
    model: model || 'qwen3-embedding:0.6b',
    input: query,
  });
  return res.embeddings[0];
}

export async function retrieval(query: string, collectionName: string) {
  const vector = await embedQuery(query);

  const result = await client.query(collectionName, {
    query: vector,
    limit: 5,
    with_payload: true,
    filter: {},
  });

  return result.points;
}

export async function askLLM(question: string, context: string[]) {
  const prompt = `You are a helpful assistant. Context: ${context.join('\n\n')} Question: ${question} Answer clearly:`;

  const res = await ollama.chat({
    model: 'qwen3.5:latest',
    messages: [{ role: 'user', content: prompt }],
  });

  return res.message.content;
}

export async function rag(query: string, collectionName: string) {
  const results = await retrieval(query, collectionName);
  const context = results.map((r) => r.payload?.text as string);
  return await askLLM(query, context);
}
