import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {runInNewContext} from 'node:vm';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const html=readFileSync(resolve(root,'index.html'),'utf8');
const tracked=new Set(execFileSync('git',['ls-files','-z'],{cwd:root,encoding:'utf8'}).split('\0'));
test('Eita e Mosaico Card estão abertos e os três casos MOSAICO continuam identificados como fechados',()=>{
 const cards=[...html.matchAll(/<article\b[^>]*class="game[^>]*>[\s\S]*?<\/article>/g)].map(m=>m[0]);assert.equal(cards.length,5);
 for(const card of cards){assert.match(card,/id="(?:eita-quiz|mosaico-card)"/.test(card)?/status-aberto">Testes abertos/:/status-fechado">Testes fechados/);}
 assert.match(cards.find(s=>/id="eita-quiz"/.test(s)),/Google/);
 assert.match(html,/https:\/\/www.drmarionascimento.com.br\/#acesso-publico/);
});
test('recursos locais do catálogo são arquivos publicados e links de jogos usam HTTPS',()=>{
 for(const [,ref] of html.matchAll(/(?:src|href)="([^"]+)"/g)){
  if(/^(?:#|data:|mailto:)/.test(ref))continue;
  if(/^https?:/.test(ref)){assert.ok(ref.startsWith('https:'),ref);continue;}
  const path=decodeURI(ref.split(/[?#]/)[0]).replace(/^\.\//,'').replace(/^\//,'');if(!path)continue;
  assert.ok(tracked.has(path)||tracked.has(path+'index.html'),ref);
 }
});
test('convites antigos atravessam a migração e chegam ao domínio do jogo sem perder parâmetros',()=>{
 const manifest=JSON.parse(readFileSync(resolve(root,'jogos/compatibilidade.json'),'utf8'));
 const origins={'jogos/casa-da-costa/':'https://casa-da-costa.dragongames.dev.br/','jogos/a-manha-do-carro-forte/':'https://carro-forte.dragongames.dev.br/','jogos/o-eco-do-amanha/':'https://eco-do-amanha.dragongames.dev.br/'};
 for(const [old,target] of Object.entries(manifest.html_aliases)){
  const prefix=Object.keys(origins).find(p=>target.startsWith(p));assert.ok(prefix,target);
  for(const query of ['?sala=AB12CD&mp=1','#entrada','?sala=AB12CD&nome=Ana%20Maria#personagem']){
   let url=new URL(old+query,'https://dragongames.dev.br/');const initial=new URL(url);
   for(let hop=0;hop<4 && url.origin==='https://dragongames.dev.br';hop++){
    const source=readFileSync(resolve(root,url.pathname.slice(1)),'utf8');
    const code=[...source.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('location.replace'));
    assert.ok(code,url.href);let next;runInNewContext(code,{location:{search:url.search,hash:url.hash,replace:value=>next=new URL(value,url)}});assert.ok(next);url=next;
   }
   assert.equal(url.origin,new URL(origins[prefix]).origin,old);assert.equal(url.pathname.replace(/index\.html$/, ""),new URL(old === "carro-forte/index.html" ? "a-mesa/celular.html" : target.slice(prefix.length),origins[prefix]).pathname.replace(/index\.html$/, ""),old);assert.equal(url.search,initial.search,old);assert.equal(url.hash,initial.hash,old);
  }
 }
});

test('fontes de desenvolvimento não são publicadas como entradas alternativas de jogo',()=>{
 assert.ok(!tracked.has('.nojekyll'), 'o catálogo depende das exclusões do Jekyll');
 assert.match(readFileSync(resolve(root,'_config.yml'),'utf8'), /exclude:[\s\S]*- desenvolvimento\//);
});
