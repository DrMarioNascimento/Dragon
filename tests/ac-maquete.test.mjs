/* A maquete: motor e geometria.

   O motor é conferido sozinho, e a geometria é conferida contra o GLB
   PUBLICADO, montado de verdade dentro do Node (`ajuda-maquete.mjs`). É essa
   segunda metade que pega a classe de defeito que nenhuma leitura pega: um
   alvo enterrado dentro do móvel, uma fechadura que o modelo mudou de lugar,
   um candidato que simplesmente não existe na casa. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import {
  startMaquette, actMaquette, maquetteView, maquetteViewSolo, papelDoToqueSolo, ordemDosCandidatos, ordemDosAlvos,
  papelDaFechadura, CAPITULOS, FECHADURAS, TOLERANCIA, SEGUNDA_PISTA
} from '../ferramentas/ac-maquete-state.mjs';
import { createRoom, apply, snapshot } from '../ferramentas/ac-cooperacao.mjs';
import { montarMundo } from './ajuda-maquete.mjs';

const ler = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const ESCONDERIJOS = CAPITULOS.map((c) => c.esconderijo);

/* ------------------------------------------------------------------ motor */

/* Leva uma camada até o fim pelo caminho que o jogo usa: cada lado acha o seu
   objeto, a chave anda até a fechadura e encaixa. */
function abrirCamada(sala, nivel, ponta = FECHADURAS[nivel], t = 1000) {
  const c = CAPITULOS[nivel];
  apply(sala, c.chaveiro, { type: 'maquete_examinar', object: c.esconderijo }, t);
  apply(sala, papelDaFechadura(c), { type: 'maquete_examinar', object: c.fechadura }, t);
  apply(sala, c.chaveiro, { type: 'maquete_mover', tip: ponta }, t + 1);
  return apply(sala, c.chaveiro, { type: 'maquete_encaixar' }, t + 2);
}
function salaDaMaquete() {
  const sala = createRoom();
  sala.stage = 'registrado';
  apply(sala, 'conhecimento', { type: 'iniciar_maquete' });
  sala.peers.set('a', { role: 'luz' }); sala.peers.set('b', { role: 'conhecimento' });
  return sala;
}

test('ato 1: a pista é a MESMA nos dois aparelhos e diz o recorte, não o objeto', () => {
  const s = startMaquette();
  for (const [i, capitulo] of CAPITULOS.entries()) {
    s.level = i;
    const daChave = maquetteView(s, capitulo.chaveiro), daFechadura = maquetteView(s, papelDaFechadura(capitulo));
    assert.equal(daChave.pista, daFechadura.pista, capitulo.id + ': as duas pistas têm de ser idênticas');
    assert.equal(daChave.pista, capitulo.recorte);
    assert.doesNotMatch(daChave.pista, /chave|fechadura|maçaneta|pedra|armário|relógio|lareira|chaminé/i,
      capitulo.id + ': a pista entregou o objeto em vez do recorte');
    assert.equal(daChave.ato, 1);
  }
});

test('ninguém é avisado do papel: a vista não traz texto de papel nem a outra metade', () => {
  const s = startMaquette();
  const c = CAPITULOS[0];
  const daChave = maquetteView(s, c.chaveiro), daFechadura = maquetteView(s, papelDaFechadura(c));
  /* O aparelho de quem tem a chave não conhece a fechadura em lugar nenhum:
     nem na lista de pontos, nem no nome, nem acesa. */
  assert.ok(!JSON.stringify(daChave).includes(c.fechadura), 'o identificador da fechadura vazou para quem tem a chave');
  assert.ok(!daChave.alvos.includes(c.fechadura));
  assert.ok(daFechadura.alvos.includes(c.fechadura), 'a fechadura é um dos pontos de quem a procura');
  assert.equal(daFechadura.fechadura, null, 'antes de achada, a fechadura não acende');
  /* Os mesmos pontos acesos — o esconderijo está entre eles — para que a
     lista de quem procura a fechadura não aponte qual é o esconderijo. */
  for (const id of c.candidatos) assert.ok(daFechadura.alvos.includes(id));
  for (const v of [daChave, daFechadura]) {
    assert.equal(v.clue, undefined, 'o manuscrito com a dica saiu: a pista agora é a mesma nos dois');
    assert.equal(v.achado, null);
  }
});

test('cada um acha o SEU objeto: o esconderijo é vazio para quem procura a fechadura', () => {
  const s = startMaquette();
  const c = CAPITULOS[0], chaveiro = c.chaveiro, dono = papelDaFechadura(c);
  /* O mesmo toque, no mesmo lugar, dá coisas diferentes em cada aparelho. */
  assert.equal(actMaquette(s, dono, { type: 'maquete_examinar', object: c.esconderijo }, 1000), true);
  assert.equal(s.key, false, 'quem procura a fechadura não pode achar a chave');
  assert.equal(s.mistakes, 1);
  assert.equal(actMaquette(s, chaveiro, { type: 'maquete_examinar', object: c.fechadura }, 1000), false,
    'a fechadura não existe no aparelho de quem tem a chave');
  assert.equal(actMaquette(s, chaveiro, { type: 'maquete_examinar', object: c.esconderijo }, 1000), true);
  assert.equal(s.key, true);
  assert.equal(maquetteView(s, chaveiro).achado, c.achado.chave);
  assert.equal(maquetteView(s, chaveiro).ato, 1, 'um lado só não abre o segundo ato');
  assert.equal(actMaquette(s, dono, { type: 'maquete_examinar', object: c.fechadura }, 2000), true);
  assert.equal(s.lock, true);
  assert.equal(maquetteView(s, dono).fechadura, c.fechadura, 'achada, a fechadura acende para quem a achou');
  assert.equal(maquetteView(s, chaveiro).fechadura, null, 'e continua não existindo para quem tem a chave');
});

test('ato 2: quando os dois acharam, chega a segunda pista — igual nos dois', () => {
  const s = startMaquette();
  const c = CAPITULOS[0];
  actMaquette(s, c.chaveiro, { type: 'maquete_examinar', object: c.esconderijo }, 1000);
  actMaquette(s, papelDaFechadura(c), { type: 'maquete_examinar', object: c.fechadura }, 1000);
  const a = maquetteView(s, c.chaveiro), b = maquetteView(s, papelDaFechadura(c));
  assert.equal(a.pista, SEGUNDA_PISTA);
  assert.equal(b.pista, SEGUNDA_PISTA);
  assert.equal(a.ato, 2);
});

test('nenhum dos dois termina sozinho — nem pelo caminho mais lento', () => {
  const c = CAPITULOS[0];
  /* Só a chave: não anda nem encaixa. */
  const sala = salaDaMaquete();
  apply(sala, c.chaveiro, { type: 'maquete_examinar', object: c.esconderijo }, 1000);
  assert.equal(apply(sala, c.chaveiro, { type: 'maquete_mover', tip: FECHADURAS[0] }, 1001), false,
    'a chave não pode andar antes de a outra metade existir');
  assert.equal(apply(sala, c.chaveiro, { type: 'maquete_encaixar' }, 1002), false);
  /* Quem achou a fechadura não move nada nem encaixa nada. */
  apply(sala, papelDaFechadura(c), { type: 'maquete_examinar', object: c.fechadura }, 1003);
  assert.equal(apply(sala, papelDaFechadura(c), { type: 'maquete_mover', tip: FECHADURAS[0] }, 1004), false);
  assert.equal(apply(sala, papelDaFechadura(c), { type: 'maquete_encaixar' }, 1005), false);
  /* E o evento antigo, de ler o manuscrito, não existe mais. */
  assert.equal(apply(sala, papelDaFechadura(c), { type: 'maquete_orientar' }, 1006), false);
});

test('os lados se invertem a cada camada, e as três abrem em ordem', () => {
  const s = startMaquette();
  const papeis = [];
  for (const [i, capitulo] of CAPITULOS.entries()) {
    const chaveiro = capitulo.chaveiro, dono = papelDaFechadura(capitulo);
    papeis.push(chaveiro);
    assert.equal(actMaquette(s, chaveiro, { type: 'maquete_encaixar' }), false, 'encaixar sem chave');
    actMaquette(s, chaveiro, { type: 'maquete_examinar', object: capitulo.esconderijo });
    actMaquette(s, dono, { type: 'maquete_examinar', object: capitulo.fechadura });
    actMaquette(s, chaveiro, { type: 'maquete_encaixar' });
    assert.deepEqual(maquetteView(s, chaveiro).camadasAbertas, CAPITULOS.slice(0, i + 1).map((c) => c.camada));
    assert.equal(maquetteView(s, chaveiro).complete, i === CAPITULOS.length - 1);
  }
  assert.notEqual(papeis[0], papeis[1], 'quem teve a chave na primeira camada não pode tê-la na segunda');
  assert.notEqual(papeis[1], papeis[2]);
  assert.equal(s.score, 24);
  assert.deepEqual(s.evidence, CAPITULOS.map((c) => c.evidencia));
  assert.equal(actMaquette(s, 'luz', { type: 'maquete_encaixar' }), false);
  assert.equal(s.score, 24, 'a maquete concluída não paga de novo');
});

test('engano tira ponto sem travar a camada; o toque repetido é de cada jogador', () => {
  const s = startMaquette();
  const c = CAPITULOS[0], dono = papelDaFechadura(c);
  const errado = c.candidatos.find((id) => id !== c.esconderijo);
  assert.equal(actMaquette(s, c.chaveiro, { type: 'maquete_examinar', object: errado }, 1000), true);
  assert.equal(actMaquette(s, c.chaveiro, { type: 'maquete_examinar', object: errado }, 1100), false,
    'dois toques do MESMO jogador em 700 ms são o mesmo toque');
  /* Os dois procuram ao mesmo tempo: o toque do colega no mesmo instante não
     pode ser engolido pela trava do outro. */
  assert.equal(actMaquette(s, dono, { type: 'maquete_examinar', object: errado }, 1100), true);
  for (let i = 2; i < 12; i++) actMaquette(s, c.chaveiro, { type: 'maquete_examinar', object: errado }, i * 1000);
  actMaquette(s, c.chaveiro, { type: 'maquete_examinar', object: c.esconderijo }, 13000);
  actMaquette(s, dono, { type: 'maquete_examinar', object: c.fechadura }, 13000);
  actMaquette(s, c.chaveiro, { type: 'maquete_encaixar' }, 14000);
  assert.equal(s.score, 2, 'o piso de 2 pontos vale mesmo depois de doze enganos');
});

test('o encaixe é conferido contra a fechadura DAQUELE capítulo, não contra um ponto fixo', () => {
  const sala = salaDaMaquete();
  assert.equal(abrirCamada(sala, 0), true);
  /* A fechadura da primeira camada não abre a segunda. Antes de 17/09/2026 o
     motor comparava com UM ponto só, e a mesma posição servia para as três. */
  assert.equal(abrirCamada(sala, 1, FECHADURAS[0], 3000), false, 'a fechadura da camada anterior não pode servir');
  assert.equal(sala.maquete.level, 1);
  assert.equal(abrirCamada(sala, 1, FECHADURAS[1], 5000), true);
  assert.equal(sala.maquete.level, 2);
});

test('a ponta da chave só chega ao aparelho de quem NÃO a está movendo', () => {
  const sala = salaDaMaquete();
  const c = CAPITULOS[0];
  apply(sala, c.chaveiro, { type: 'maquete_examinar', object: c.esconderijo }, 1000);
  apply(sala, papelDaFechadura(c), { type: 'maquete_examinar', object: c.fechadura }, 1000);
  apply(sala, c.chaveiro, { type: 'maquete_mover', tip: FECHADURAS[0] }, 1001);
  assert.equal(snapshot(sala, 1002, c.chaveiro).keyMotion, null);
  assert.deepEqual(snapshot(sala, 1002, papelDaFechadura(c)).keyMotion.tip, FECHADURAS[0]);
});

test('Solo: a mesma pessoa ocupa as duas metades, sem mecânica substituta', () => {
  const s = startMaquette();
  const c = CAPITULOS[0];
  const v = maquetteViewSolo(s);
  assert.equal(v.papel, 'ambos');
  assert.ok(v.alvos.includes(c.fechadura) && v.alvos.includes(c.esconderijo), 'o Solo vasculha os dois objetos');
  /* O toque vale pelo lado que ainda procura aquele ponto. */
  assert.equal(papelDoToqueSolo(s, c.esconderijo), c.chaveiro);
  assert.equal(papelDoToqueSolo(s, c.fechadura), papelDaFechadura(c));
  actMaquette(s, c.chaveiro, { type: 'maquete_examinar', object: c.esconderijo }, 1000);
  assert.equal(papelDoToqueSolo(s, c.esconderijo), papelDaFechadura(c),
    'achada a chave, os outros pontos viram vazios da procura pela fechadura');
  actMaquette(s, papelDaFechadura(c), { type: 'maquete_examinar', object: c.fechadura }, 1000);
  assert.equal(maquetteViewSolo(s).pista, SEGUNDA_PISTA);
  assert.equal(maquetteViewSolo(s).fechadura, c.fechadura, 'no Solo a fechadura achada acende');
  assert.equal(papelDoToqueSolo(s, c.fechadura), null);
});

test('a lista por nome é sorteada: o esconderijo não nasce sempre em cima', () => {
  for (const capitulo of CAPITULOS) {
    assert.equal(capitulo.candidatos[0], capitulo.esconderijo,
      'o arquivo continua escrito com a verdade em primeiro — é por isso que o sorteio existe');
    let primeiro = 0;
    const salas = 4000;
    const posicoes = new Set();
    for (let i = 0; i < salas; i++) {
      const ordem = ordemDosCandidatos(capitulo, 'SALA-' + i);
      assert.equal(ordem.length, capitulo.candidatos.length);
      assert.deepEqual([...ordem].sort(), [...capitulo.candidatos].sort(), 'o sorteio não pode perder nem repetir');
      const pos = ordem.indexOf(capitulo.esconderijo);
      posicoes.add(pos);
      if (pos === 0) primeiro++;
    }
    const taxa = primeiro / salas, esperado = 1 / capitulo.candidatos.length;
    /* Mede-se a FREQUÊNCIA contra o acaso, nunca a ausência. */
    assert.ok(Math.abs(taxa - esperado) < 0.05, capitulo.id + ' caiu em primeiro em ' + (taxa * 100).toFixed(1) + '%');
    assert.equal(posicoes.size, capitulo.candidatos.length, capitulo.id + ': alguma posição nunca sai');
    /* A lista de quem procura a fechadura também é sorteada: a fechadura
       sempre por último entregaria qual é. */
    let ultima = 0;
    for (let i = 0; i < salas; i++) {
      const lista = maquetteView({ ...startMaquette(), level: CAPITULOS.indexOf(capitulo) }, papelDaFechadura(capitulo)).alvos;
      const ordem = ordemDosAlvos(lista, capitulo.id, 'SALA-' + i);
      if (ordem[ordem.length - 1] === capitulo.fechadura) ultima++;
    }
    assert.ok(Math.abs(ultima / salas - 1 / 5) < 0.05, capitulo.id + ': a fechadura cai por último em ' + (ultima / salas * 100).toFixed(1) + '%');
  }
  const a = ordemDosCandidatos(CAPITULOS[0], 'MESMA'), b = ordemDosCandidatos(CAPITULOS[0], 'MESMA');
  assert.deepEqual(a, b, 'a mesma sala tem de ver a mesma ordem ao reabrir a lista');
});

/* -------------------------------------------------------------- geometria */

test('o modelo publicado está no repositório e a página pede ele', () => {
  assert.ok(existsSync(new URL('../v1/assets/ac/casa-da-costa-pisos.glb', import.meta.url)),
    'o GLB da maquete precisa estar publicado em v1/assets/ac/');
  const html = ler('v1/AC-maquete.html');
  for (const script of ['ac-maquete-mundo.js', 'ac-maquete-ra.js', 'ac-maquete.js', 'vendor/GLTFLoader.js'])
    assert.ok(html.includes(script), 'a página precisa carregar ' + script);
  assert.ok(ler('v1/js/ac-maquete-mundo.js').includes('assets/ac/casa-da-costa-pisos.glb'));
});

test('geometria real: fechaduras, alvos, camadas e o relógio do caso', async () => {
  const { THREE, mundo } = await montarMundo();

  /* 1. As três fechaduras do MOTOR são os três pontos do MODELO. Se alguém
        reexportar o GLB com a mesa de mapas noutro canto, é aqui que aparece. */
  assert.equal(mundo.ancoras.length, FECHADURAS.length);
  mundo.ancoras.forEach((ancora, i) => {
    const distancia = ancora.ponto.position.distanceTo(new THREE.Vector3(...FECHADURAS[i]));
    assert.ok(distancia < 1e-4,
      ancora.id + ' está a ' + distancia.toFixed(5) + ' da fechadura que o motor confere ('
      + FECHADURAS[i].join(', ') + '). Meça de novo e atualize FECHADURAS.');
    assert.equal(ancora.id, CAPITULOS[i].fechadura);
  });

  /* 2. Todo candidato de todo capítulo existe, na camada que o capítulo abre
        ou numa camada que já está aberta quando ele é jogado. */
  const ordemDasCamadas = mundo.ordemDasCamadas;
  CAPITULOS.forEach((capitulo, nivel) => {
    const abertas = CAPITULOS.slice(0, nivel).map((c) => c.camada);
    for (const id of capitulo.candidatos) {
      const alvo = mundo.alvos[id];
      assert.ok(alvo, 'o capítulo ' + capitulo.id + ' oferece "' + id + '", que não existe na maquete');
      assert.ok(alvo.pecas.length > 0, id + ' não recolheu nenhuma peça do GLB');
      assert.ok(!abertas.includes(alvo.camada),
        id + ' está na camada ' + alvo.camada + ', que já foi retirada quando o capítulo ' + capitulo.id + ' começa');
      assert.ok(ordemDasCamadas.includes(alvo.camada));
    }
    const fechadura = mundo.fechaduras[capitulo.fechadura];
    assert.ok(fechadura && fechadura.pecas.length, capitulo.fechadura + ' não achou peça no modelo');
    assert.ok(!abertas.includes(fechadura.camada),
      'a fechadura de ' + capitulo.id + ' está numa camada já retirada');
  });

  /* 3. (Havia aqui uma distância mínima entre centros. Saiu: é um proxy que
        mente nos dois sentidos. A pedra do portão estava a 0,033 do pilar e
        passava em qualquer limiar; a escrivaninha e o candelabro estão a
        0,028 e são perfeitamente distinguíveis, porque um está EM CIMA do
        outro. O que decide é o item 4b: mirar no alvo acerta o alvo.) */

  /* 4. Com as camadas anteriores retiradas, cada alvo E CADA FECHADURA são
        ALCANÇÁVEIS: existe um punhado de direções de onde o raio bate neles
        antes de bater noutra coisa. É o teste que pegou, na primeira volta,
        dois quartos escondidos atrás da torre, a mesa de mapas fechada dentro
        dela e o alçapão debaixo do assoalho — nada disso aparece lendo código.

        As direções vão de 20° a 89° acima do horizonte porque é assim que se
        olha para uma maquete pousada numa mesa: de cima, inclinando a cabeça. */
  const direcoes = [];
  for (const graus of [20, 40, 55, 70, 80, 89]) {
    for (let a = 0; a < 12; a++) {
      const t = (a / 12) * Math.PI * 2, e = graus * Math.PI / 180;
      direcoes.push(new THREE.Vector3(Math.cos(t) * Math.cos(e), Math.sin(e), Math.sin(t) * Math.cos(e)).normalize());
    }
  }
  const PISO_DE_VISIBILIDADE = 12;
  const visivel = (o) => { for (let n = o; n; n = n.parent) if (!n.visible) return false; return true; };
  const raio = new THREE.Raycaster();
  const anel = (o) => o.geometry && o.geometry.type === 'RingGeometry';

  function quantasDirecoesVeem(grupo, id, chave) {
    let melhor = 0;
    for (const peca of grupo.children.filter((c) => c.isMesh && !anel(c)).slice(0, 8)) {
      const centro = peca.getWorldPosition(new THREE.Vector3());
      let vistas = 0;
      for (const direcao of direcoes) {
        raio.set(centro.clone().addScaledVector(direcao, 0.55), direcao.clone().negate());
        const acertos = raio.intersectObject(grupo.parent.parent || grupo, true)
          .filter((h) => visivel(h.object) && h.object.geometry && !anel(h.object));
        let dono = acertos.length ? acertos[0].object : null;
        while (dono && !(dono.userData && dono.userData[chave])) dono = dono.parent;
        if (dono && dono.userData[chave] === id) vistas++;
      }
      if (vistas > melhor) melhor = vistas;
    }
    return melhor;
  }

  CAPITULOS.forEach((capitulo, nivel) => {
    const abertas = CAPITULOS.slice(0, nivel).map((c) => c.camada);
    for (const nome of ordemDasCamadas) mundo.camadas[nome].visible = !abertas.includes(nome);
    mundo.chave.visible = false;
    for (const alvo of Object.values(mundo.alvos)) alvo.halo.visible = false;
    for (const ancora of mundo.ancoras) ancora.halo.visible = false;
    mundo.raiz.updateMatrixWorld(true);

    for (const id of capitulo.candidatos) {
      const vistas = quantasDirecoesVeem(mundo.alvos[id].grupo, id, 'object');
      assert.ok(vistas >= PISO_DE_VISIBILIDADE, 'capítulo ' + capitulo.id + ': o alvo "' + id + '" é atingível de '
        + vistas + ' das ' + direcoes.length + ' direções (mínimo ' + PISO_DE_VISIBILIDADE + ') — está enterrado');
    }
    const fechadura = mundo.fechaduras[capitulo.fechadura];
    const vistasFechadura = quantasDirecoesVeem(fechadura.grupo, capitulo.fechadura, 'fechadura');
    assert.ok(vistasFechadura >= PISO_DE_VISIBILIDADE, 'capítulo ' + capitulo.id + ': a fechadura "' + capitulo.fechadura
      + '" é atingível de ' + vistasFechadura + ' das ' + direcoes.length + ' direções — quem guia não consegue vê-la');
  });
  for (const nome of ordemDasCamadas) mundo.camadas[nome].visible = true;

  /* 4b. MIRAR NO ALVO ACERTA O ALVO. A distância entre centros é só um proxy:
         em 17/09/2026 a pedra do portão estava a 0,033 do pilar — passava em
         qualquer limiar razoável — e um toque de verdade, mirado no centro da
         pedra, acertava o pilar, que é alto e fica na frente. O jogador perdia
         ponto por defeito de posição. Aqui a pergunta é a do dedo: apontando
         para este alvo, quantas vezes eu pego OUTRO candidato do capítulo? */
  CAPITULOS.forEach((capitulo, nivel) => {
    const abertas = CAPITULOS.slice(0, nivel).map((c) => c.camada);
    for (const nome of ordemDasCamadas) mundo.camadas[nome].visible = !abertas.includes(nome);
    mundo.chave.visible = false;
    for (const alvo of Object.values(mundo.alvos)) { alvo.halo.visible = false; alvo.pino.visible = false; }
    for (const ancora of mundo.ancoras) { ancora.halo.visible = false; ancora.pino.visible = false; }
    mundo.raiz.updateMatrixWorld(true);

    for (const id of capitulo.candidatos) {
      const alvo = mundo.alvos[id];
      const centro = alvo.grupo.localToWorld(alvo.centro.clone());
      let acertos = 0, trocas = 0, trocouPor = '';
      for (const direcao of direcoes) {
        raio.set(centro.clone().addScaledVector(direcao, 0.55), direcao.clone().negate());
        const hits = raio.intersectObject(mundo.raiz, true).filter((h) => visivel(h.object) && h.object.geometry && !anel(h.object));
        let dono = hits.length ? hits[0].object : null;
        while (dono && !(dono.userData && dono.userData.object)) dono = dono.parent;
        if (!dono) continue;
        if (dono.userData.object === id) acertos++;
        else if (capitulo.candidatos.includes(dono.userData.object)) { trocas++; trocouPor = dono.userData.object; }
      }
      assert.ok(acertos > 0, capitulo.id + ': mirar em "' + id + '" nunca acerta "' + id + '"');
      assert.ok(trocas <= acertos * 0.2, capitulo.id + ': mirar em "' + id + '" acerta "' + trocouPor + '" em '
        + trocas + ' direções contra ' + acertos + ' certas — os dois alvos estão colados e o toque vira sorteio');
    }
  });
  for (const nome of ordemDasCamadas) mundo.camadas[nome].visible = true;

  /* 5. A chave alcança cada fechadura: a ponta é o que o motor confere, e ela
        fica a uma distância fixa do corpo da chave. */
  for (const [i, ponto] of FECHADURAS.entries()) {
    const alvo = new THREE.Vector3(...ponto);
    mundo.raiz.updateMatrixWorld(true);
    const deslocamento = mundo.chavePonta.getWorldPosition(new THREE.Vector3())
      .sub(mundo.chave.getWorldPosition(new THREE.Vector3()));
    mundo.chave.position.copy(alvo).sub(mundo.raiz.worldToLocal(mundo.raiz.localToWorld(new THREE.Vector3()).add(deslocamento)));
    mundo.raiz.updateMatrixWorld(true);
    const ponta = mundo.raiz.worldToLocal(mundo.chavePonta.getWorldPosition(new THREE.Vector3()));
    assert.ok(ponta.distanceTo(alvo) < TOLERANCIA,
      'a ponta da chave não chega à fechadura ' + i + ': ' + ponta.distanceTo(alvo).toFixed(4));
  }

  /* 6. O relógio do caso. F20 e F26 dizem 21h29; o GLB veio noutra hora, e a
        dica do terceiro capítulo cita o horário. */
  assert.ok(mundo.relogio, 'os ponteiros do relógio não foram encontrados no modelo');
  const alvoHora = ((21 % 12) + 29 / 60) * 30, alvoMinuto = 29 * 6;
  const horas = mundo.relogio.find((g) => g.nome === 'ponteiro-das-horas');
  const minutos = mundo.relogio.find((g) => g.nome === 'ponteiro-dos-minutos');
  assert.ok(Math.abs(horas.para - alvoHora) < 0.01 && Math.abs(minutos.para - alvoMinuto) < 0.01);
  assert.ok(Math.abs(horas.de - horas.para) > 5,
    'se o modelo já viesse em 21h29 este acerto seria ruído — confira antes de remover');

  /* 7. A fusão: o telefone não aguenta 2.472 chamadas de desenho por quadro. */
  assert.ok(mundo.desenhos > 0 && mundo.desenhos <= 120,
    'a fusão por camada e material devolveu ' + mundo.desenhos + ' malhas; acima de 120 a RA no telefone cai');
  assert.ok(mundo.altura > 0.9 && mundo.altura < 1.3, 'a maquete normalizada tem altura ' + mundo.altura);
  assert.ok(mundo.baseY >= 0, 'a base da maquete não pode ficar abaixo de zero: pousaria dentro da mesa');
});

/* ------------------------------------------------------------------ fiação */

test('o Solo lê o mesmo motor da Mesa, sem cópia dos capítulos', () => {
  const coop = ler('v1/js/ac-cooperacao.js');
  assert.match(coop, /ac-maquete-state\.mjs/, 'o Solo precisa importar o motor, não recriá-lo');
  assert.match(coop, /M\.actMaquette/);
  assert.match(coop, /M\.FECHADURAS/);
  for (const capitulo of CAPITULOS) {
    assert.ok(!coop.includes(capitulo.recorte),
      'a pista de "' + capitulo.id + '" está copiada dentro de ac-cooperacao.js: duas verdades, uma delas fica velha');
    assert.ok(!coop.includes("'" + capitulo.esconderijo + "'"),
      'o esconderijo de "' + capitulo.id + '" está copiado dentro de ac-cooperacao.js');
  }
});

test('a maquete publicada guarda os dois olhares na tela', () => {
  const js = ler('v1/js/ac-maquete.js');
  assert.match(js, /idFechadura && anc\.id === idFechadura/, 'a fechadura acende pelo que o motor mandou, não por nível');
  assert.match(js, /function podeMoverChave\(\)[^}]*temLadoDaChave\(\) && ambosAcharam\(\)/, 'só quem tem a chave move, e só com as duas metades achadas');
  /* A recusa tem de ser VISTA, em dois tempos: chacoalha, e só insistindo aparece a frase. */
  assert.match(js, /function recusar\(\)[\s\S]{0,400}tentativasNaFixa >= 2/, 'a frase da recusa só na segunda tentativa');
  assert.match(js, /Essa não sai da sua mão — a outra metade está com seu colega\./);
  /* Nenhum texto de tela anuncia o papel. */
  for (const frase of ['Você tem a chave', 'Você tem a fechadura', 'Só você pode', 'Segure o manuscrito']) {
    assert.ok(!js.includes(frase), 'a tela voltou a avisar o papel: "' + frase + '"');
  }
  assert.match(js, /posta\(\)/, 'a atividade depende da maquete estar posta no ambiente');
  const ra = ler('v1/js/ac-maquete-ra.js');
  for (const modo of ['webxr', 'camera', 'mesa']) assert.ok(ra.includes("'" + modo + "'"), 'falta o modo ' + modo);
  assert.match(ra, /getUserMedia/, 'o iPhone não tem WebXR: sem câmera não há RA nele');
  assert.match(ra, /requestPermission/, 'a orientação no iOS precisa ser pedida por gesto');
});
