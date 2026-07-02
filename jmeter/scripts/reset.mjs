import { execSync } from 'child_process';
import { existsSync, unlinkSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');
const RESULTS = join(__dirname, '../results');

const PG = {
  user: 'movies_user',
  pass: '123456',
  host: 'localhost',
  port: '5432',
  db: 'movies_api',
};

function run(cmd, opts = {}) {
  console.log(`  $ ${cmd}`);
  execSync(cmd, { stdio: 'inherit', ...opts });
}

function sql(query) {
  const cmd = `PGPASSWORD=${PG.pass} psql -U ${PG.user} -h ${PG.host} -p ${PG.port} -d ${PG.db} -c "${query}"`;
  execSync(cmd, { stdio: 'inherit' });
}

async function reset() {
  console.log('=== Reset completo del entorno de pruebas JMeter ===\n');

  // 1. Verificar backend
  console.log('[1/4] Verificando backend...');
  try {
    const res = await fetch('http://localhost:3000/movies');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const count = (await res.json()).length;
    console.log(`  Backend OK — ${count} películas actualmente\n`);
  } catch {
    console.error('  ERROR: Backend no disponible en http://localhost:3000');
    console.error('  Ejecute primero: npm run start:dev\n');
    process.exit(1);
  }

  // 2. Limpiar resultados
  console.log('[2/4] Limpiando resultados anteriores...');
  let removed = 0;
  const jtlFiles = ['smoke.jtl', 'carga.jtl', 'estres-100.jtl', 'estres-200.jtl', 'estres-400.jtl', 'picos.jtl', 'seed-result.json'];
  for (const f of jtlFiles) {
    const p = join(RESULTS, f);
    if (existsSync(p)) { unlinkSync(p); removed++; }
  }
  const dashboards = ['smoke-dashboard', 'carga-dashboard', 'estres-100-dashboard', 'estres-200-dashboard', 'estres-400-dashboard', 'picos-dashboard'];
  for (const d of dashboards) {
    const p = join(RESULTS, d);
    if (existsSync(p)) { rmSync(p, { recursive: true, force: true }); removed++; }
  }
  console.log(`  Eliminados ${removed} archivos de resultados\n`);

  // 3. Truncar BD (más rápido que DELETE uno por uno)
  console.log('[3/4] Limpiando base de datos (TRUNCATE)...');
  try {
    sql('TRUNCATE TABLE movies CASCADE;');
    console.log('  Tabla movies truncada\n');
  } catch {
    console.error('  ERROR: No se pudo truncar la tabla.');
    console.error('  Asegúrese de que el usuario movies_user tiene permisos.\n');
    process.exit(1);
  }

  // 4. Sembrar datos frescos y extraer IDs
  console.log('[4/4] Sembrando 5000 películas nuevas...');
  run('node seed.mjs', { cwd: join(__dirname) });
  console.log('\nExtrayendo IDs...');
  run('node extract-ids.mjs', { cwd: join(__dirname) });

  console.log('\n══════════════════════════════════════════════════');
  console.log('  Reset completado. Estado inicial listo.');
  console.log('══════════════════════════════════════════════════\n');
  console.log('Para ejecutar todas las pruebas:');
  console.log('');
  console.log('# Smoke Test');
  console.log(`  jmeter -n -t ${join(__dirname, 'smoke.jmx')} -l ${join(RESULTS, 'smoke.jtl')} -e -o ${join(RESULTS, 'smoke-dashboard')}`);
  console.log('');
  console.log('# Load Test (50 usuarios)');
  console.log(`  jmeter -n -t ${join(__dirname, 'carga.jmx')} -l ${join(RESULTS, 'carga.jtl')} -e -o ${join(RESULTS, 'carga-dashboard')}`);
  console.log('');
  console.log('# Stress Tests (3 niveles)');
  console.log(`  jmeter -n -t ${join(__dirname, 'estres.jmx')} -Jthreads=100 -Jrampup=30 -Jduration=120 -l ${join(RESULTS, 'estres-100.jtl')} -e -o ${join(RESULTS, 'estres-100-dashboard')}`);
  console.log(`  jmeter -n -t ${join(__dirname, 'estres.jmx')} -Jthreads=200 -Jrampup=60 -Jduration=120 -l ${join(RESULTS, 'estres-200.jtl')} -e -o ${join(RESULTS, 'estres-200-dashboard')}`);
  console.log(`  jmeter -n -t ${join(__dirname, 'estres.jmx')} -Jthreads=400 -Jrampup=120 -Jduration=120 -l ${join(RESULTS, 'estres-400.jtl')} -e -o ${join(RESULTS, 'estres-400-dashboard')}`);
  console.log('');
  console.log('# Spike Test');
  console.log(`  jmeter -n -t ${join(__dirname, 'picos.jmx')} -l ${join(RESULTS, 'picos.jtl')} -e -o ${join(RESULTS, 'picos-dashboard')}`);
}

reset().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
