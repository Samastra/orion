/**
 * Smart Chunker — Paragraph and heading-aware text splitting.
 * 
 * Splits on semantic boundaries (headings, double newlines) instead of
 * raw character counts. This keeps concepts together and produces
 * higher-quality embeddings for retrieval.
 * 
 * Universal — works for any academic discipline.
 */

const DEFAULT_MAX_CHUNK_SIZE = 1500;
const DEFAULT_MIN_CHUNK_SIZE = 200;

/**
 * Split text into semantically coherent chunks.
 * Priority: Heading boundaries > Paragraph boundaries > Sentence boundaries.
 */
export function smartChunk(
  text: string,
  maxSize: number = DEFAULT_MAX_CHUNK_SIZE,
  minSize: number = DEFAULT_MIN_CHUNK_SIZE
): string[] {
  if (!text || text.trim().length === 0) return [];

  // Step 1: Split on heading boundaries (markdown ## or bold **)
  const sections = text.split(/(?=^#{1,4}\s|\n#{1,4}\s)/m);

  const chunks: string[] = [];
  let currentChunk = '';

  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed) continue;

    // If adding this section would exceed maxSize, flush current chunk
    if (currentChunk && (currentChunk.length + trimmed.length + 2) > maxSize) {
      // The current chunk is ready — but it might be huge (a single long section)
      if (currentChunk.length > maxSize) {
        chunks.push(...splitLongSection(currentChunk, maxSize, minSize));
      } else {
        chunks.push(currentChunk.trim());
      }
      currentChunk = trimmed;
    } else {
      currentChunk = currentChunk ? currentChunk + '\n\n' + trimmed : trimmed;
    }
  }

  // Flush remaining
  if (currentChunk.trim()) {
    if (currentChunk.length > maxSize) {
      chunks.push(...splitLongSection(currentChunk, maxSize, minSize));
    } else {
      chunks.push(currentChunk.trim());
    }
  }

  // Merge any trailing tiny chunks into the previous one
  return mergeSmallChunks(chunks, minSize);
}

/**
 * Split a single long section by paragraph boundaries,
 * falling back to sentence boundaries if paragraphs are still too long.
 */
function splitLongSection(text: string, maxSize: number, minSize: number): string[] {
  const paragraphs = text.split(/\n\n+/);
  const chunks: string[] = [];
  let current = '';

  for (const para of paragraphs) {
    const trimmedPara = para.trim();
    if (!trimmedPara) continue;

    if ((current.length + trimmedPara.length + 2) > maxSize && current) {
      chunks.push(current.trim());
      current = trimmedPara;
    } else {
      current = current ? current + '\n\n' + trimmedPara : trimmedPara;
    }
  }

  if (current.trim()) {
    // If still too long after paragraph split, split by sentences
    if (current.length > maxSize) {
      chunks.push(...splitBySentences(current, maxSize));
    } else {
      chunks.push(current.trim());
    }
  }

  return chunks;
}

/**
 * Last-resort split by sentence boundaries.
 */
function splitBySentences(text: string, maxSize: number): string[] {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    if ((current.length + sentence.length + 1) > maxSize && current) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current = current ? current + ' ' + sentence : sentence;
    }
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

/**
 * Merge any chunks smaller than minSize into their neighbors.
 */
function mergeSmallChunks(chunks: string[], minSize: number): string[] {
  if (chunks.length <= 1) return chunks;

  const merged: string[] = [];
  let buffer = '';

  for (const chunk of chunks) {
    if (buffer && (buffer.length + chunk.length + 2) <= minSize * 4) {
      // Merge small buffer with next chunk
      buffer = buffer + '\n\n' + chunk;
    } else {
      if (buffer) merged.push(buffer);
      buffer = chunk;
    }
  }

  if (buffer) {
    if (buffer.length < minSize && merged.length > 0) {
      // Append to last chunk
      merged[merged.length - 1] += '\n\n' + buffer;
    } else {
      merged.push(buffer);
    }
  }

  return merged;
}
