import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { dirname, resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(resolve(root, 'jogos/compatibilidade.json'), 'utf8'));
function local(path) {
  const full = resolve(root, path);
  const rel = relative(root, full);
  if (!rel || rel.startsWith('..') || isAbsolute(rel)) throw new Error(`Caminho fora do repositório: ${path}`);
  return full;
}
for (const [oldPath, newPath] of Object.entries(manifest.html_aliases)) {
  const target = local(newPath), old = local(oldPath);
  if (!existsSync(target)) throw new Error(`Entrada ausente: ${newPath}`);
  const link = relative(dirname(old), target).replaceAll('\\', '/');
  const safe = link.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
  mkdirSync(dirname(old), { recursive: true });
  writeFileSync(old, `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0; url=${safe}"><title>MOSAICO · endereço atualizado</title><script>location.replace(${JSON.stringify(link)} + location.search + location.hash);</script></head><body><p><a href="${safe}">Abrir o jogo</a></p></body></html>\n`);
}
for (const [oldPath, newPath] of Object.entries(manifest.asset_aliases)) {
  const target = local(newPath), old = local(oldPath);
  if (!existsSync(target)) throw new Error(`Imagem ausente: ${newPath}`);
  mkdirSync(dirname(old), { recursive: true });
  copyFileSync(target, old);
}
console.log('Endereços e imagens de compatibilidade atualizados.');
