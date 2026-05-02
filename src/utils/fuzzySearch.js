/**
 * Fuzzy search utility for Farmer_Web.
 * Simple scoring-based fuzzy match to improve search experience.
 */

export function calculateFuzzyScore(query, target) {
  if (!query || !target) return 0;
  const q = String(query).toLowerCase().trim();
  const t = String(target).toLowerCase().trim();
  if (t === q) return 100;
  if (t.includes(q)) return 50 + q.length / t.length;

  let queryIdx = 0;
  let targetIdx = 0;
  let score = 0;
  let consecutive = 0;

  while (queryIdx < q.length && targetIdx < t.length) {
    if (q[queryIdx] === t[targetIdx]) {
      queryIdx++;
      consecutive++;
      score += 1 + consecutive * 0.5;
    } else {
      consecutive = 0;
      score = Math.max(0, score - 0.5);
    }
    targetIdx++;
  }

  if (queryIdx < q.length) return 0;
  return Math.max(0, score);
}

export function fuzzyFilterAndSort(items, query, fields) {
  if (!query || !String(query).trim()) return items;
  const q = String(query).trim();
  const scored = items
    .map((item) => {
      let max = 0;
      for (const f of fields) {
        const v = String(item?.[f] ?? "");
        const s = calculateFuzzyScore(q, v);
        if (s > max) max = s;
      }
      return { item, score: max };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.map((x) => x.item);
}

export default { calculateFuzzyScore, fuzzyFilterAndSort };