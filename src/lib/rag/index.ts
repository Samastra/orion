/**
 * RAG Module — Public API barrel export.
 */
export { smartChunk } from './chunker';
export { estimateComplexity } from './scoring';
export { getRelevantContext, getMultiQueryContext } from './retriever';
export type { RetrievalOptions, RetrievedContext } from './retriever';
