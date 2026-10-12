import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(resolve(root, 'jogos/compatibilidade.json'), 'utf8'));
const invitations = [
  '?sala=AB12CD&mp=1#entrada',
  '?grupo=1&forma=f#personagem',
  '?demo=solo&partida=ensaio&jogador=2#ra',
  '?from=celular&sala=AB12CD&pergunta=peso#relatorio',
];
test('endereços antigos preservam integralmente convites, parâmetros de modo e fragmentos', () => {
  for (const [oldPath, target] of Object.entries(manifest.html_aliases)) {
    assert.ok(existsSync(resolve(root, target)), target);
    const html = readFileSync(resolve(root, oldPath), 'utf8');
    const code = html.match(/<script>([\s\S]*?)<\/script>/)[1];
    for (const invite of invitations) {
      const url = new URL(oldPath + invite, 'https://drmarionascimento.github.io/Dragon/');
      let destination;
      runInNewContext(code, { location: { search: url.search, hash: url.hash, replace: value => { destination = new URL(value, url); } } });
      assert.equal(destination.pathname, '/Dragon/' + target);
      assert.equal(destination.search, url.search);
      assert.equal(destination.hash, url.hash);
    }
  }
});
test('as duas imagens consumidas pelo portal pessoal continuam idênticas nos endereços antigos', () => {
  assert.deepEqual(Object.keys(manifest.asset_aliases).sort(), ['solo/tiles/carta-costa.jpg', 'v1/img/Orizontal.jpg']);
  for (const [oldPath, target] of Object.entries(manifest.asset_aliases)) {
    assert.deepEqual(readFileSync(resolve(root, oldPath)), readFileSync(resolve(root, target)), oldPath);
  }
});
test('o catálogo mantém cinco versões e VestChip somente O Impostor', () => {
  const home = readFileSync(resolve(root, 'index.html'), 'utf8');
  assert.equal((home.match(/<article class="game">/g) || []).length, 3);
  assert.equal((home.match(/class="ver"/g) || []).length, 5);
  const vestchip = home.split('<h3>O Eco do Amanhã</h3>')[1].split('</article>')[0];
  assert.doesNotMatch(vestchip, /A Mesa/);
});
