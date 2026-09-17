/* Motor da atividade da maquete — A Casa da Costa.

   Sem three.js e sem DOM: este arquivo roda no Node (testes e servidor de
   ensaio), dentro do replay do Firestore e no navegador. Ele decide o que
   cada papel PODE fazer e o que cada papel PODE VER; a cena 3D apenas
   obedece.

   A maquete é uma caixa de segredos: três fechaduras seguram as camadas do
   modelo. Cada chave encaixada solta uma camada — telhado, piso de cima,
   térreo — até o porão aparecer com a passagem que a planta da casa não tem.

   O reparto dos dois olhares, que é a regra desta atividade na Mesa:
   um jogador tem a CHAVE (vê a chave, arrasta a chave, toca nos móveis) e o
   outro tem a FECHADURA (vê a fechadura acesa, vê a ponta da chave do colega
   como um ponto de luz, e é o único que sabe onde a chave foi escondida).
   Nenhum dos dois consegue terminar a etapa sozinho. */

/* Posições das fechaduras no modelo NORMALIZADO (pegada de 1×0,77, base em
   y=0). Saíram medidas do próprio `casa-da-costa-pisos.glb`; o teste
   `ac-maquete.test.mjs` recalcula as três a partir do arquivo e reprova se
   alguém mexer no modelo sem mexer aqui. */
export const FECHADURAS = [
  [0.17400, 0.48890, 0.23018],   // maçaneta da portada
  [-0.28721, 0.67227, -0.03854], // peito da chaminé, no corredor dos quartos
  [-0.23533, 0.52942, 0.02151]   // consolo da lareira, na sala escura
];

/* Encaixe: distância máxima entre a ponta da chave e a fechadura, na mesma
   escala do modelo normalizado. 0,03 é ~1,2 cm numa maquete de 40 cm. Abaixo
   disso o arrasto no telefone vira sorte; acima, o colega que guia não faz
   falta nenhuma. */
export const TOLERANCIA = 0.03;

export const CAPITULOS = [
  {
    id: 'portada',
    nome: 'A casa fechada',
    camada: 'telhado',
    chaveiro: 'luz',
    fechadura: 'fechadura-portada',
    fechaduraNome: 'a maçaneta da porta da frente',
    esconderijo: 'pedra-do-portao',
    dica: 'A estrada morre num portão de dois pilares. A última pedra do caminho não assentou como as outras — quem a levantou tinha pressa e não a devolveu no lugar.',
    candidatos: ['pedra-do-portao', 'pilar-do-portao', 'moita-do-caminho', 'laje-de-chegada'],
    rotulos: {
      'pedra-do-portao': 'A pedra solta junto ao portão',
      'pilar-do-portao': 'O pilar do portão',
      'moita-do-caminho': 'A moita ao lado da varanda',
      'laje-de-chegada': 'O lajeado diante da porta'
    },
    evidencia: 'chave-exterior',
    fecho: 'O telhado se soltou. Debaixo dele havia um andar de quartos.'
  },
  {
    id: 'quartos',
    nome: 'O andar dos quartos',
    camada: 'piso-2',
    chaveiro: 'conhecimento',
    fechadura: 'fechadura-chamine',
    fechaduraNome: 'o peito da chaminé, no corredor dos quartos',
    esconderijo: 'armario-do-quarto-distante',
    dica: 'O telhado descobriu dois quartos. No mais distante da torre, o armário tem fundo falso — e o que caiu lá dentro não era roupa.',
    candidatos: ['armario-do-quarto-distante', 'castical-do-quarto-distante', 'armario-do-quarto-vizinho', 'castical-do-quarto-vizinho'],
    rotulos: {
      'armario-do-quarto-distante': 'O armário do quarto mais distante da torre',
      'castical-do-quarto-distante': 'O castiçal do quarto mais distante da torre',
      'armario-do-quarto-vizinho': 'O armário do quarto ao lado',
      'castical-do-quarto-vizinho': 'O castiçal do quarto ao lado'
    },
    evidencia: 'chave-dos-quartos',
    fecho: 'O andar dos quartos saiu inteiro. Embaixo está o térreo, com a sala escura e a despensa.'
  },
  {
    id: 'terreo',
    nome: 'O térreo',
    camada: 'piso-1',
    chaveiro: 'luz',
    fechadura: 'fechadura-lareira',
    fechaduraNome: 'o consolo da lareira, na sala escura',
    esconderijo: 'relogio-de-pendulo',
    dica: 'Na sala escura há um relógio de corda parado às 21h29. Ele não depende da rede elétrica, e a portinhola do mostrador nunca foi trancada.',
    candidatos: ['relogio-de-pendulo', 'escrivaninha', 'candelabro', 'espelho'],
    rotulos: {
      'relogio-de-pendulo': 'O relógio de pêndulo parado',
      'escrivaninha': 'A escrivaninha',
      'candelabro': 'O candelabro com a vela',
      'espelho': 'O espelho na parede'
    },
    evidencia: 'passagem-sob-despensa',
    fecho: 'O térreo se ergueu. Sob a despensa há um porão — e ele não termina onde a casa termina.'
  }
];

/* A maior pontuação é 8 por chave; cada engano tira 1, com piso em 2. Vinte e
   quatro é o teto, e é o número que `ac-pontuacao.js` valida no recibo. */
export const PONTOS_POR_CHAVE = 8;
export const PISO_POR_CHAVE = 2;

export function startMaquette() {
  return { level: 0, ready: false, key: false, mistakes: 0, score: 0, evidence: [], lastAttempt: 0 };
}

/* Quem NÃO tem a chave no capítulo tem a fechadura. Dois papéis, sempre. */
export function papelDaFechadura(capitulo) {
  return capitulo.chaveiro === 'luz' ? 'conhecimento' : 'luz';
}

export function actMaquette(state, role, event, now = Date.now()) {
  if (!state || state.level >= CAPITULOS.length) return false;
  const capitulo = CAPITULOS[state.level];
  const chaveiro = capitulo.chaveiro;

  /* Ler o manuscrito é ato de quem tem a fechadura: é ele que descobre onde a
     chave está e precisa contar para o colega. */
  if (event.type === 'maquete_orientar') {
    if (role === chaveiro || state.ready) return false;
    state.ready = true;
    return true;
  }

  if (role !== chaveiro || !state.ready) return false;

  if (event.type === 'maquete_examinar') {
    if (state.key || typeof event.object !== 'string' || event.object.length > 40) return false;
    if (now - state.lastAttempt < 700) return false;
    state.lastAttempt = now;
    if (event.object === capitulo.esconderijo) state.key = true;
    else state.mistakes++;
    return true;
  }

  if (event.type === 'maquete_encaixar' && state.key) {
    state.score += Math.max(PISO_POR_CHAVE, PONTOS_POR_CHAVE - Math.min(PONTOS_POR_CHAVE - PISO_POR_CHAVE, state.mistakes));
    state.evidence.push(capitulo.evidencia);
    state.level++;
    state.ready = false;
    state.key = false;
    state.mistakes = 0;
    state.lastAttempt = 0;
    return true;
  }

  return false;
}

/* O que cada aparelho recebe. O que não está aqui não existe para aquele
   jogador: o esconderijo só sai para quem tem a fechadura, e a posição da
   fechadura só sai para quem NÃO tem a chave. */
export function maquetteView(state, role) {
  if (!state) return null;
  const capitulo = CAPITULOS[state.level];
  if (!capitulo) {
    return { ...state, complete: true, name: 'A passagem revelada', chaveiro: null, papel: null,
      capitulo: null, clue: null, fechadura: null, fechaduraNome: null, candidatos: [], rotulos: {},
      camadasAbertas: CAPITULOS.map(c => c.camada) };
  }
  const temChave = role === capitulo.chaveiro;
  return {
    ...state,
    complete: false,
    capitulo: capitulo.id,
    name: capitulo.nome,
    chaveiro: capitulo.chaveiro,
    papel: temChave ? 'chave' : 'fechadura',
    /* A dica é do lado da fechadura, e só depois de o manuscrito ser lido é
       que ela vale como orientação a ser dita em voz alta. */
    clue: temChave ? null : capitulo.dica,
    fechadura: temChave ? null : capitulo.fechadura,
    fechaduraNome: temChave ? null : capitulo.fechaduraNome,
    candidatos: capitulo.candidatos.slice(),
    rotulos: { ...capitulo.rotulos },
    camadasAbertas: CAPITULOS.slice(0, state.level).map(c => c.camada)
  };
}

/* A lista de objetos por nome (a alternativa a tocar na cena) nasceria com a
   verdade sempre em cima, porque o esconderijo é o primeiro item do capítulo.
   Aqui ela é sorteada por partida — nunca reordenada à mão no arquivo.
   Ver a lição repetida do MOSAICO: sortear na hora de mostrar. */
export function ordemDosCandidatos(capitulo, semente) {
  const lista = capitulo.candidatos.slice();
  let h = 2166136261 >>> 0;
  const texto = String(semente == null ? '' : semente) + '|' + capitulo.id;
  for (let i = 0; i < texto.length; i++) { h ^= texto.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  const rnd = () => { h = (h + 0x6D2B79F5) | 0; let t = Math.imul(h ^ (h >>> 15), 1 | h); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  for (let i = lista.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [lista[i], lista[j]] = [lista[j], lista[i]]; }
  return lista;
}
