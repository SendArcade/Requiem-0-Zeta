import { buildBackfillQueryPlan } from "../src/backfill-query-plan.ts";

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
async function status(q) {
  const url = 'https://auctions.yahoo.co.jp/closedsearch/closedsearch?p=' + encodeURIComponent(q) + '&n=10&b=1';
  const res = await fetch(url, { headers: { 'user-agent': UA, 'accept-language': 'ja', accept: 'text/html' } });
  return res.status;
}

const plan = buildBackfillQueryPlan();
const hyphenQueries = plan.filter(q => q.includes('-'));
console.log('hyphen queries', hyphenQueries.length);
let fail404 = 0, fixedBySpace = 0;
const samples = [];
for (const q of hyphenQueries.slice(0, 80)) {
  const s1 = await status(q);
  if (s1 === 404) {
    fail404++;
    const alt = q.replace(/-/g, ' ');
    const s2 = await status(alt);
    if (s2 === 200) fixedBySpace++;
    if (samples.length < 5) samples.push({ q, alt, s1, s2 });
  }
  await new Promise(r => setTimeout(r, 200));
}
console.log({ scanned: Math.min(80, hyphenQueries.length), fail404, fixedBySpace, samples });
