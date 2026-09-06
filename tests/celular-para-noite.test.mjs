/* Ponte Celular (Manhã) → Noite (Captura): contrato de URL, params e sala. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import {
  PERGUNTAS_VALIDAS,
  FROM_CELULAR,
  COLECAO_CELULAR,
  COLECAO_NOITE,
  normalizeSala,
  normalizePergunta,
  parseHandoffSearch,
  buildNoiteHandoffUrl,
  noiteSeedPartida,
  celularPonteFields,
} from '../carro-forte/celular-para-noite-contrato.mjs';

const ler = (p) =>
  readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

test('normaliza sala e pergunta do contrato', () => {
  assert.equal(normalizeSala('ab23cd'), 'AB23CD');
  assert.equal(normalizeSala('curto'), '');
  assert.equal(normalizeSala('ABCDEFG'), '');
  assert.equal(normalizePergunta('Peso'), 'peso');
  assert.equal(normalizePergunta('nope'), '');
  assert.deepEqual([...PERGUNTAS_VALIDAS], ['peso', 'janela', 'roubo', 'antes', 'quem', 'proteger']);
});

test('parseHandoffSearch lê from=celular, sala e pergunta', () => {
  const a = parseHandoffSearch('?from=celular&sala=4CHRML&pergunta=janela');
  assert.equal(a.fromCelular, true);
  assert.equal(a.sala, '4CHRML');
  assert.equal(a.pergunta, 'janela');
  const b = parseHandoffSearch('sala=xx&from=outro');
  assert.equal(b.fromCelular, false);
  assert.equal(b.sala, '');
});

test('buildNoiteHandoffUrl monta deep link estável', () => {
  assert.equal(
    buildNoiteHandoffUrl({ sala: '4chrml', pergunta: 'peso' }),
    'noite/?from=celular&sala=4CHRML&pergunta=peso',
  );
  assert.equal(
    buildNoiteHandoffUrl({ fromCelular: true, pergunta: 'roubo' }),
    'noite/?from=celular&pergunta=roubo',
  );
  assert.equal(FROM_CELULAR, 'celular');
});

test('campos de seed da Noite e marcador da Manhã', () => {
  assert.deepEqual(noiteSeedPartida({ pergunta: 'antes', jogadores: 5 }), {
    pergunta: 'antes',
    origem: 'celular',
    continuidade: { from: 'celular' },
    jogadores: 5,
  });
  assert.throws(() => noiteSeedPartida({ pergunta: 'x' }));
  assert.deepEqual(celularPonteFields({ pergunta: 'quem' }), {
    pergunta: 'quem',
    alvo: COLECAO_NOITE,
  });
  assert.equal(COLECAO_CELULAR, 'mosaico');
  assert.equal(COLECAO_NOITE, 'noite');
});

test('o Celular expõe CTA e carrega a ponte', () => {
  const html = ler('carro-forte/celular.html');
  const game = ler('carro-forte/game.js');
  const ponte = ler('carro-forte/celular-para-noite.js');
  assert.ok(existsSync(new URL('../carro-forte/celular-para-noite.js', import.meta.url)));
  assert.ok(existsSync(new URL('../carro-forte/celular-para-noite-contrato.mjs', import.meta.url)));
  assert.match(html, /id="toNoite"/, 'faltou o botão Ir para a Noite');
  assert.match(html, /celular-para-noite\.js\?v=/, 'celular.html não carrega a ponte');
  assert.match(game, /toNoite/, 'game.js não liga o CTA');
  assert.match(game, /MosaicoCelularParaNoite|goToNoite/, 'game.js não chama a ponte');
  assert.match(ponte, /seedNoiteRoom/, 'a ponte não semeia noite/{sala}');
  assert.match(ponte, /ponteNoite/, 'a ponte não marca mosaico/{sala}');
  assert.match(ponte, /['"]noite['"]/, 'seed deve gravar na coleção noite');
  assert.match(ponte, /['"]mosaico['"]/, 'marcador deve gravar na coleção mosaico');
});

test('a Noite aceita deep link from=celular e herda pergunta', () => {
  const index = ler('carro-forte/noite/index.html');
  const sala = ler('carro-forte/noite/sala-partida.js');
  const nucleo = ler('carro-forte/noite/game-fixed.js');
  assert.match(index, /fromCelular|continuidadeCelular/, 'Noite sem UI de continuidade');
  assert.match(index, /celular-para-noite\.js/, 'Noite não carrega o helper da ponte');
  assert.match(sala, /get\('from'\)/, 'sala-partida ignora from=celular');
  assert.match(sala, /partida\.origem|continuidade/, 'sala-partida não grava origem da ponte');
  assert.match(nucleo, /fromCelular|from['"]?\s*===\s*['"]celular['"]/, 'núcleo não herda pergunta da URL no solo');
});

test('firebase-room preserva Mestre Google ao reassumir a própria sala', () => {
  const sala = ler('firebase-room.js');
  const inicio = sala.indexOf('async function entrar');
  const fim = sala.indexOf('function ', inicio + 30);
  const corpo = sala.slice(inicio, fim > inicio ? fim : undefined);
  assert.match(corpo, /mestreUid/, 'entrar() não confere mestreUid na reassunção');
  assert.match(corpo, /isAnonymous/, 'entrar() não distingue sessão Google de anônimo');
  const autentica = corpo.indexOf('signInAnonymously');
  const le = corpo.indexOf('getDoc(roomRef(code))');
  assert.ok(autentica >= 0 && le >= 0 && autentica < le, 'convidado precisa autenticar antes de ler');
});

test('standalone da Noite e solo do Celular não quebram sem params', () => {
  const index = ler('carro-forte/noite/index.html');
  assert.match(index, /root:'noite'|root:"noite"/, 'Noite saiu da coleção noite');
  const cel = ler('carro-forte/celular.html');
  assert.match(cel, /data-root="mosaico"/, 'Celular saiu da coleção mosaico');
  assert.match(cel, /data-project="noite"/, 'Celular saiu do projeto mosaico-noite');
});
