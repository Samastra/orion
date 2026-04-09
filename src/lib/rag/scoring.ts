/**
 * Universal Complexity Scorer — $0 heuristic, no AI calls.
 * 
 * Estimates the technical depth of a text chunk using structural
 * patterns that work across ALL academic disciplines:
 * - Data density (numbers, units, formulas)
 * - Vocabulary complexity (word length distribution)
 * - Structural indicators (tables, equations, citations)
 * 
 * Returns a score from 1 (basic definitions) to 10 (dense technical data).
 */

export function estimateComplexity(text: string): number {
  if (!text || text.length < 50) return 5;

  let score = 5; // Baseline

  // --- DATA DENSITY ---
  // Numbers with units (works for any field: mg, km, Hz, °C, %, etc.)
  const unitMatches = text.match(/\d+\.?\d*\s*(mg|mcg|µg|kg|mL|L|mol|mmol|nm|µm|mm|cm|m|km|Hz|kHz|MHz|GHz|°C|°F|K|Pa|kPa|atm|cal|kcal|kJ|MJ|eV|V|mV|A|mA|Ω|dB|ppm|ppb|%|M\b|mM\b)/gi) || [];
  if (unitMatches.length >= 3) score += 2;
  else if (unitMatches.length >= 1) score += 1;

  // Raw number density (lots of numbers = data-heavy)
  const numberCount = (text.match(/\d+\.?\d*/g) || []).length;
  const numberDensity = numberCount / (text.length / 1000); // per 1000 chars
  if (numberDensity > 8) score += 1;

  // --- FORMULAS & EQUATIONS ---
  // LaTeX/KaTeX indicators
  if (/\$[^$]+\$/.test(text)) score += 1;
  // Chemical/math notation patterns
  if (/[A-Z][a-z]?\d|→|⇌|∆|Σ|∫|≈|≥|≤|±|×10/.test(text)) score += 1;

  // --- STRUCTURAL COMPLEXITY ---
  // Table-like structures (pipes or tab-separated data)  
  const pipeCount = (text.match(/\|/g) || []).length;
  if (pipeCount > 6) score += 1;

  // Citations or references (academic rigor)
  if (/\(\d{4}\)|\[\d+\]|et al\./i.test(text)) score += 1;

  // --- SIMPLICITY INDICATORS (reduce score) ---
  // Definition patterns suggest introductory content
  const defPatterns = (text.match(/is defined as|refers to|is a type of|is known as|also called|in other words|simply put/gi) || []).length;
  if (defPatterns >= 2) score -= 2;
  else if (defPatterns >= 1) score -= 1;

  // Short sentences = simpler content
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const avgSentenceLength = sentences.reduce((sum, s) => sum + s.trim().split(/\s+/).length, 0) / Math.max(sentences.length, 1);
  if (avgSentenceLength < 10) score -= 1;
  if (avgSentenceLength > 25) score += 1;

  // --- VOCABULARY COMPLEXITY ---
  // Proportion of long words (>8 chars) as a proxy for technical vocabulary
  const words = text.split(/\s+/).filter(w => w.length > 1);
  const longWords = words.filter(w => w.replace(/[^a-zA-Z]/g, '').length > 8);
  const longWordRatio = longWords.length / Math.max(words.length, 1);
  if (longWordRatio > 0.25) score += 1;
  if (longWordRatio < 0.08) score -= 1;

  // Clamp to 1-10
  return Math.max(1, Math.min(10, Math.round(score)));
}
