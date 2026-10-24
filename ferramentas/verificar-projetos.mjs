/** Runs the complete contract suite against the current game repositories.
 * Production aliases remain untouched. Missing repositories are an error, never a skip.
 */
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sources = resolve(process.env.DRAGON_TEST_SOURCES || join(root, '..'));
const projects = { 'casa-da-costa':'casa-da-costa', 'carro-forte':'a-manha-do-carro-forte', 'eco-do-amanha':'o-eco-do-amanha' };
for (const name of Object.keys(projects)) {
  const source = join(sources, name);
  if (!existsSync(join(source, 'package.json')) || !existsSync(join(source, 'index.html'))) {
    throw new Error(`Repositório ${name} ausente em ${source}. Defina DRAGON_TEST_SOURCES para a pasta que contém os três checkouts atuais.`);
  }
  console.log(`${name}: ${execFileSync('git',['rev-parse','HEAD'],{cwd:source,encoding:'utf8'}).trim()}`);
}
const run = (args, cwd) => {
  const result = spawnSync(process.execPath, args, {cwd, stdio:'inherit'});
  if (result.error) throw result.error;
  return result.status ?? 1;
};
// Verify the actual catalog/redirects before substituting any game source.
let status = run(['--test','tests/catalogo-publico.test.mjs','tests/migracao-pastas.test.mjs'], root);
if (status) process.exit(status);
const fixture = mkdtempSync(join(tmpdir(),'dragon-current-'));
const filter = (base, source) => {
  const parts = relative(base, source).split(sep);
  return !parts.some(p => ['.git','node_modules','fontes','.fontes'].includes(p));
};
try {
  cpSync(root, fixture, {recursive:true, filter:source=>filter(root,source)});
  for (const [name,target] of Object.entries(projects)) {
    const source = join(sources,name);
    // Start from the exact current tree, not a mixture of obsolete and new files.
    const destination = join(fixture,'jogos',target);
    rmSync(destination,{recursive:true,force:true});
    cpSync(source,destination,{recursive:true,filter:path=>filter(source,path)});
  }
  const command = JSON.parse(readFileSync(join(root,'package.json'),'utf8')).scripts['test:contratos'];
  if (!command.startsWith('node --test ')) throw new Error('Comando de contratos inesperado');
  status = run(command.slice(5).split(/\s+/),fixture);
} finally {
  rmSync(fixture,{recursive:true,force:true});
}
process.exitCode = status;
