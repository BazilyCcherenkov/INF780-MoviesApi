import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const API = process.env.API_URL || 'http://localhost:3000';
const LIMIT = 500;

async function extractIds() {
  console.log(`Fetching up to ${LIMIT} movie IDs from ${API}/movies ...`);
  const res = await fetch(`${API}/movies`);
  if (!res.ok) {
    console.error(`API returned ${res.status}. Is the backend running?`);
    process.exit(1);
  }
  const movies = await res.json();
  const total = Math.min(movies.length, LIMIT);
  const ids = movies.slice(0, total).map(m => m.id);

  const csv = 'movie_id\n' + ids.join('\n') + '\n';
  const outPath = join(__dirname, '../data/movie-ids.csv');
  writeFileSync(outPath, csv);
  console.log(`Saved ${ids.length} IDs to ${outPath}`);
}

extractIds().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
