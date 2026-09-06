/* Ponte Celular (Manhã) → Noite (Captura): contrato, handoff rico e economia v1. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import {
  PERGUNTAS_VALIDAS,
  FROM_CELULAR,
  COLECAO_CELULAR,
  COLECAO_NOITE,
  HANDOFF_VERSION,
  ECONOMIA_STANDALONE,
  ECONOMIA_PONTE_SEM_FECHO,
  normalizeSala,
  normalizePergunta,
  parseHandoffSearch,
  buildNoiteHandoffUrl,
  noiteSeedPartida,
  celularPonteFields,
  buildHandoffPayload,
  normalizeHandoff,
  normalizeFecho,
  deriveNoiteEconomy,
  continuityBannerText,
  handoffStorageKey,
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

test('buildNoiteHandoffUrl monta deep link estável (sem payload rico na URL)', () => {
  assert.equal(
    buildNoiteHandoffUrl({ sala: '4chrml', pergunta: 'peso' }),
    'noite/?from=celular&sala=4CHRML&pergunta=peso',
  );
  assert.equal(
    buildNoiteHandoffUrl({ fromCelular: true, pergunta: 'roubo' }),
    'noite/?from=celular&pergunta=roubo',
  );
  assert.equal(FROM_CELULAR, 'celular');
  assert.ok(!buildNoiteHandoffUrl({ sala: '4CHRML', pergunta: 'peso' }).includes('fecho'));
});

test('schema do handoff v1: fecho, hipótese, fragmentos e nomes', () => {
  const h = buildHandoffPayload({
    pergunta: 'peso',
    sala: '4chrml',
    jogadores: 4,
    nomes: ['Ana', '', 'Bruno'],
    fecho: { total: 72, campos: 36, hipotese: 15, relacoes: 10, leitura: 6, sensorial: 5, revisao: 0, acertos: 4 },
    hipoteseFinal: 'h10',
    hipoteseProv: 'H3',
    fragmentosRevelados: ['f01', 'F01', 'F12', 'xx', 'F99'],
  });
  assert.equal(h.v, HANDOFF_VERSION);
  assert.equal(h.from, 'celular');
  assert.equal(h.sala, '4CHRML');
  assert.equal(h.pergunta, 'peso');
  assert.equal(h.jogadores, 4);
  assert.deepEqual(h.nomes, ['Ana', 'Bruno']);
  assert.equal(h.hipoteseFinal, 'H10');
  assert.equal(h.hipoteseProv, 'H3');
  assert.deepEqual(h.fragmentosRevelados, ['F01', 'F12', 'F99']);
  assert.equal(h.fecho.total, 72);
  assert.equal(normalizeFecho(null), null);
  assert.equal(normalizeFecho({ total: 'x' }), null);
  assert.equal(normalizeHandoff({ pergunta: 'nope' }), null);
  assert.throws(() => buildHandoffPayload({ pergunta: 'x' }));
});

test('normalizeFecho aceita total no teto 100', () => {
  assert.equal(normalizeFecho({ total: 100 }).total, 100);
  assert.equal(normalizeFecho({ total: 0 }).total, 0);
  assert.equal(normalizeFecho({ total: 150 }).total, 100);
});

test('economia v1: herda do fecho quando from=celular; standalone intacto', () => {
  assert.deepEqual(deriveNoiteEconomy(null), {
    coins: 12,
    handSize: 3,
    source: 'standalone',
    rule: 'standalone-experimental-12/3',
  });
  assert.equal(ECONOMIA_STANDALONE.coins, 12);
  assert.equal(ECONOMIA_PONTE_SEM_FECHO.coins, 10);

  const semFecho = deriveNoiteEconomy(
    buildHandoffPayload({ pergunta: 'janela', sala: 'ABCDEF' }),
    { fromCelular: true },
  );
  assert.equal(semFecho.coins, 10);
  assert.equal(semFecho.handSize, 3);
  assert.equal(semFecho.source, 'celular-sem-fecho');

  const baixo = deriveNoiteEconomy(
    buildHandoffPayload({ pergunta: 'peso', fecho: { total: 20 } }),
  );
  assert.equal(baixo.coins, 8); // 8 + floor(20/25)=8
  assert.equal(baixo.handSize, 2);

  const medio = deriveNoiteEconomy(
    buildHandoffPayload({ pergunta: 'peso', fecho: { total: 50 } }),
  );
  assert.equal(medio.coins, 10); // 8+2
  assert.equal(medio.handSize, 3);

  const alto = deriveNoiteEconomy(
    buildHandoffPayload({ pergunta: 'peso', fecho: { total: 100 } }),
  );
  assert.equal(alto.coins, 12); // 8+4
  assert.equal(alto.handSize, 3);
  assert.equal(alto.source, 'celular-fecho');
});

test('noiteSeedPartida e marcador da Manhã incluem handoff', () => {
  const seed = noiteSeedPartida({
    pergunta: 'antes',
    jogadores: 5,
    handoff: {
      pergunta: 'antes',
      fecho: { total: 60 },
      hipoteseFinal: 'H9',
      fragmentosRevelados: ['F03'],
    },
  });
  assert.equal(seed.pergunta, 'antes');
  assert.equal(seed.origem, 'celular');
  assert.equal(seed.continuidade.from, 'celular');
  assert.equal(seed.continuidade.fechoTotal, 60);
  assert.equal(seed.continuidade.hipoteseFinal, 'H9');
  assert.equal(seed.handoff.fecho.total, 60);
  assert.equal(seed.jogadores, 5);

  assert.throws(() => noiteSeedPartida({ pergunta: 'x' }));
  const marcador = celularPonteFields({
    pergunta: 'quem',
    handoff: { pergunta: 'quem', fecho: { total: 40 } },
  });
  assert.equal(marcador.pergunta, 'quem');
  assert.equal(marcador.alvo, COLECAO_NOITE);
  assert.equal(marcador.fechoTotal, 40);
  assert.equal(marcador.handoffV, 1);
  assert.equal(COLECAO_CELULAR, 'mosaico');
  assert.equal(COLECAO_NOITE, 'noite');
});

test('banner de continuidade resume pergunta + fecho + economia', () => {
  const h = buildHandoffPayload({
    pergunta: 'roubo',
    sala: 'ZZZZZZ',
    fecho: { total: 55 },
    hipoteseFinal: 'H10',
  });
  const txt = continuityBannerText(h);
  assert.match(txt, /Continuação da manhã/);
  assert.match(txt, /ZZZZZZ/);
  assert.match(txt, /roubo/);
  assert.match(txt, /55\/100/);
  assert.match(txt, /H10/);
  assert.match(txt, /moedas/);
  assert.equal(handoffStorageKey({ sala: 'zzzzzz', pergunta: 'peso' }), 'mosaico-carro-handoff:ZZZZZZ:peso');
});

test('o Celular expõe CTA e carrega a ponte com handoff', () => {
  const html = ler('carro-forte/celular.html');
  const game = ler('carro-forte/game.js');
  const ponte = ler('carro-forte/celular-para-noite.js');
  assert.ok(existsSync(new URL('../carro-forte/celular-para-noite.js', import.meta.url)));
  assert.ok(existsSync(new URL('../carro-forte/celular-para-noite-contrato.mjs', import.meta.url)));
  assert.match(html, /id="toNoite"/, 'faltou o botão Ir para a Noite');
  assert.match(html, /celular-para-noite\.js\?v=/, 'celular.html não carrega a ponte');
  assert.match(game, /toNoite/, 'game.js não liga o CTA');
  assert.match(game, /MosaicoCelularParaNoite|goToNoite/, 'game.js não chama a ponte');
  assert.match(game, /handoff/, 'game.js não monta o handoff no CTA');
  assert.match(game, /fragmentosRevelados|hipoteseFinal/, 'CTA sem campos de decisão/fragmentos');
  assert.match(ponte, /seedNoiteRoom/, 'a ponte não semeia noite/{sala}');
  assert.match(ponte, /ponteNoite/, 'a ponte não marca mosaico/{sala}');
  assert.match(ponte, /partida\.handoff|handoff:/, 'seed deve gravar partida.handoff');
  assert.match(ponte, /deriveNoiteEconomy/, 'ponte sem regra de economia');
  assert.match(ponte, /['"]noite['"]/, 'seed deve gravar na coleção noite');
  assert.match(ponte, /['"]mosaico['"]/, 'marcador deve gravar na coleção mosaico');
});

test('seedNoiteRoom cria com fase sala e só depois avança para jogo', () => {
  const ponte = ler('carro-forte/celular-para-noite.js');
  const regras = ler('firestore.rules');
  assert.match(regras, /fase == 'sala'/, 'create de sala exige fase sala');
  const i = ponte.indexOf('async function seedNoiteRoom');
  const j = ponte.indexOf('async function goToNoite', i);
  assert.ok(i >= 0 && j > i, 'não achei seedNoiteRoom / goToNoite');
  const fn = ponte.slice(i, j);
  const createStart = fn.indexOf('if (!snap.exists())');
  const elseStart = fn.indexOf('} else {', createStart);
  assert.ok(createStart >= 0 && elseStart > createStart, 'ramo de create sumiu');
  const create = fn.slice(createStart, elseStart);
  assert.match(create, /fase:\s*['"]sala['"]/, 'create deve usar fase sala (regras)');
  assert.ok(!/fase:\s*['"]jogo['"]/.test(create.split('updateDoc')[0]), 'setDoc não pode ir direto para jogo');
  assert.match(create, /updateDoc\([\s\S]*fase:\s*['"]jogo['"]/, 'após create, updateDoc deve avançar para jogo');
  assert.match(create, /handoff/, 'create deve levar partida.handoff');
  assert.match(ponte, /persistHandoffLocal/, 'fallback local do handoff');
  assert.match(ponte, /buildNoiteHandoffUrl/, 'fallback de URL da ponte');
})

test('a Noite aceita deep link from=celular, herda pergunta e economia do handoff', () => {
  const index = ler('carro-forte/noite/index.html');
  const sala = ler('carro-forte/noite/sala-partida.js');
  const nucleo = ler('carro-forte/noite/game-fixed.js');
  assert.match(index, /fromCelular|continuidadeCelular/, 'Noite sem UI de continuidade');
  assert.match(index, /continuidadeCelular|Continuação da manhã|continuityBannerText/, 'lobby sem continuação da manhã');
  assert.match(index, /noiteStandaloneHint|PARTIDA SÓ DE FECHAMENTO|fechamento/, 'standalone sem marcação');
  assert.match(index, /celular-para-noite\.js/, 'Noite não carrega o helper da ponte');
  assert.match(sala, /get\('from'\)/, 'sala-partida ignora from=celular');
  assert.match(sala, /partida\.origem|continuidade/, 'sala-partida não grava origem da ponte');
  assert.match(sala, /handoff/, 'sala-partida não preserva handoff');
  assert.match(nucleo, /fromCelular|from['"]?\s*===\s*['"]celular['"]/, 'núcleo não herda pergunta da URL no solo');
  assert.match(nucleo, /economiaInicial|deriveNoiteEconomy/, 'núcleo não aplica economia do handoff');
  assert.match(nucleo, /handSize|handN/, 'núcleo não varia o tamanho da mão');
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
  const nucleo = ler('carro-forte/noite/game-fixed.js');
  assert.match(nucleo, /coins:\s*12|ECONOMIA_STANDALONE|source:\s*['"]standalone['"]/, 'standalone perdeu default 12');
});
