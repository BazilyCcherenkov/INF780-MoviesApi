import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const GENRES = ['action', 'comedy', 'drama', 'horror', 'sci-fi', 'thriller', 'romance', 'documentary', 'animation'];
const FIRST_NAMES = ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Christopher',
  'Steven', 'Martin', 'Ridley', 'Quentin', 'Peter', 'Tim', 'Clint', 'Federico', 'Akira', 'Pedro',
  'Alejandro', 'Guillermo', 'Alfonso', 'Bong', 'Park', 'Wong', 'Zhang', 'Mira', 'Kathryn', 'Sofia'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris',
  'Nolan', 'Tarantino', 'Scorsese', 'Spielberg', 'Fincher', 'Villeneuve', 'Cuaron', 'del Toro', 'Almodovar', 'Kurosawa'];
const TITLE_PREFIXES = ['The', 'A', 'An', 'My', 'Your', 'His', 'Her', 'Our', 'Their', 'Last',
  'Dark', 'American', 'Great', 'Little', 'Big', 'Lost', 'Secret', 'Final', 'Perfect', 'Broken'];
const TITLE_NOUNS = ['Story', 'Dream', 'Night', 'Day', 'World', 'Heart', 'Soul', 'Love', 'War', 'Peace',
  'Journey', 'Path', 'River', 'Mountain', 'City', 'Shadow', 'Light', 'Fire', 'Storm', 'Ocean',
  'Memories', 'Whispers', 'Echoes', 'Visions', 'Destiny', 'Fate', 'King', 'Queen', 'Legend', 'Hero'];

const TOTAL = 5000;
const API = process.env.API_URL || 'http://localhost:3000';

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max, decimals = 1) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateMovie(index) {
  const prefix = Math.random() > 0.5 ? randomPick(TITLE_PREFIXES) : '';
  const noun1 = randomPick(TITLE_NOUNS);
  const noun2 = Math.random() > 0.7 ? ` of ${randomPick(TITLE_NOUNS)}` : '';
  const title = prefix ? `${prefix} ${noun1}${noun2}` : `${noun1} ${randomPick(TITLE_NOUNS)}`;
  const suffix = index > 3000 ? ` ${Math.floor(index / 100)}` : '';
  return {
    title: (title + suffix).substring(0, 255) || `Movie ${index}`,
    director: `${randomPick(FIRST_NAMES)} ${randomPick(LAST_NAMES)}`,
    genre: randomPick(GENRES),
    year: randomInt(1888, 2030),
    rating: randomFloat(0, 10),
    synopsis: `A story about ${noun1.toLowerCase()} and ${randomPick(TITLE_NOUNS).toLowerCase()} in a world of ${randomPick(TITLE_NOUNS).toLowerCase()}.`,
  };
}

async function seed() {
  console.log(`Seeding ${TOTAL} movies to ${API}...\n`);

  let success = 0;
  let failed = 0;
  const batchSize = 50;

  for (let i = 1; i <= TOTAL; i++) {
    const movie = generateMovie(i);
    try {
      const res = await fetch(`${API}/movies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(movie),
      });
      if (res.ok) {
        success++;
      } else {
        failed++;
        if (failed <= 3) {
          const body = await res.text();
          console.error(`  FAIL #${i}: ${res.status} ${body.substring(0, 100)}`);
        }
      }
    } catch (err) {
      failed++;
      if (failed <= 3) console.error(`  NET ERR #${i}: ${err.message}`);
    }

    if (i % 100 === 0) {
      const pct = ((i / TOTAL) * 100).toFixed(1);
      console.log(`  ${i}/${TOTAL} (${pct}%) — OK: ${success}  FAIL: ${failed}`);
    }

    // Small delay every 500 to avoid overwhelming
    if (i % 500 === 0) await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\nDone. Created: ${success}  Failed: ${failed}`);
  writeFileSync(join(__dirname, 'results/seed-result.json'), JSON.stringify({ total: TOTAL, success, failed, timestamp: new Date().toISOString() }, null, 2));
}

seed().catch(console.error);
