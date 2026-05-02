
/**
 * Highlight matched characters or substring in a string based on a query.
 * - If query is empty, returns the original text.
 * - If query is a contiguous substring (case-insensitive), highlights the substring.
 * - Otherwise attempts a sequential fuzzy match and highlights matched characters.
 *
 * Returns an array of React nodes (strings and <span> wrappers).
 */
export function highlightMatchedText(text, query, highlightClass = "bg-yellow-200") {
  const original = String(text ?? "");
  const q = String(query ?? "").trim();
  if (!q) return original;

  const lower = original.toLowerCase();
  const qLower = q.toLowerCase();

  // Prefer contiguous substring highlight
  const substrIndex = lower.indexOf(qLower);
  if (substrIndex >= 0) {
    const before = original.slice(0, substrIndex);
    const match = original.slice(substrIndex, substrIndex + q.length);
    const after = original.slice(substrIndex + q.length);
    return [before, <span key={0} className={highlightClass}>{match}</span>, after];
  }

  // Fallback: sequential character highlighting
  const nodes = [];
  let qIdx = 0;
  let currentChunk = "";
  for (let i = 0; i < original.length; i++) {
    const ch = original[i];
    const chLower = ch.toLowerCase();
    if (qIdx < qLower.length && chLower === qLower[qIdx]) {
      // flush currentChunk
      if (currentChunk) {
        nodes.push(currentChunk);
        currentChunk = "";
      }
      // push highlighted char
      nodes.push(
        <span key={i} className={highlightClass}>
          {ch}
        </span>
      );
      qIdx++;
    } else {
      currentChunk += ch;
    }
  }

  if (currentChunk) nodes.push(currentChunk);

  // If not all query characters matched, return original to avoid misleading highlights
  if (qIdx < qLower.length) return original;
  return nodes;
}

export default highlightMatchedText;
