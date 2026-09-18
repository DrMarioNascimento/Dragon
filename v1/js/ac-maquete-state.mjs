/* Motor da atividade da maquete — A Casa da Costa.

   Sem three.js e sem DOM: este arquivo roda no Node (testes e servidor de
   ensaio), dentro do replay do Firestore e no navegador. Ele decide o que
   cada papel PODE fazer e o que cada papel PODE VER; a cena 3D apenas
   obedece.

   A maquete é uma caixa de segredos: três fechaduras seguram as camadas do
   modelo. Cada chave encaixada solta uma camada — telhado, piso de cima,
   térreo — até o porão aparecer com a passagem que a planta da casa não tem.

   A LEI d'A Casa (Mario, 17/09/2026): cada jogador tem METADE do aparelho, e
   as metades são de naturezas diferentes. Ninguém é avisado do seu papel —
   ele se revela pelo efeito no outro. Em cada camada:

   Ato 1 — os dois procuram ao mesmo tempo. A pista é UMA, idêntica nos dois
           aparelhos, e diz o recorte, não o objeto. Um acha a chave; o outro
           acha a fechadura. O aparelho de cada um só conhece o objeto dele: a
           chave não existe no aparelho de quem tem a fechadura, e a fechadura
           não existe no de quem tem a chave.
   Ato 2 — os dois acharam: chega a segunda pista, também igual. Um arrasta e
           vem; o outro arrasta e não vem (a recusa é da cena, não do motor).
   Ato 3 — quem tem a fixa descreve onde ela está; quem tem a móvel leva.

   Que caminho sobra para terminar sozinho? Nenhum: o encaixe exige a chave
   achada por um E a fechadura achada pelo outro, e só quem tem a chave move
   a chave. */

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

/* A segunda pista é a mesma nas três camadas: ela não diz onde, diz COMO. */
export const SEGUNDA_PISTA = 'Uma é fixa que nem a casa, e a outra mexe igual onda.';

export const CAPITULOS = [
  {
    id: 'portada',
    nome: 'A casa fechada',
    camada: 'telhado',
    chaveiro: 'luz',
    fechadura: 'fechadura-portada',
    fechaduraRotulo: 'A maçaneta da porta da frente',
    esconderijo: 'pedra-do-caminho',
    recorte: 'Onde o caminho do portão chega à casa.',
    candidatos: ['pedra-do-caminho', 'pilar-do-portao', 'moita-do-caminho', 'laje-de-chegada'],
    rotulos: {
      'pedra-do-caminho': 'A pedra solta do caminho, diante da porta',
      'pilar-do-portao': 'O pilar do portão',
      'moita-do-caminho': 'A moita ao lado da varanda',
      'laje-de-chegada': 'O lajeado diante da porta'
    },
    achado: {
      chave: 'A pedra estava solta. Debaixo dela havia uma coisa pequena e fria.',
      fechadura: 'A maçaneta não gira. No meio dela há um vão que não é de maçaneta.'
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
    fechaduraRotulo: 'O peito da chaminé, no corredor dos quartos',
    esconderijo: 'armario-do-quarto-distante',
    recorte: 'No andar que o telhado descobriu.',
    candidatos: ['armario-do-quarto-distante', 'castical-do-quarto-distante', 'armario-do-quarto-vizinho', 'castical-do-quarto-vizinho'],
    rotulos: {
      'armario-do-quarto-distante': 'O armário do quarto mais distante da torre',
      'castical-do-quarto-distante': 'O castiçal do quarto mais distante da torre',
      'armario-do-quarto-vizinho': 'O armário do quarto ao lado',
      'castical-do-quarto-vizinho': 'O castiçal do quarto ao lado'
    },
    achado: {
      chave: 'O armário tinha fundo falso. O que caiu lá dentro não era roupa.',
      fechadura: 'Um tijolo da chaminé está oco. Atrás dele, um vão de metal.'
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
    fechaduraRotulo: 'O consolo da lareira',
    esconderijo: 'relogio-de-pendulo',
    recorte: 'Na sala que ficou escura.',
    candidatos: ['relogio-de-pendulo', 'escrivaninha', 'candelabro', 'espelho'],
    rotulos: {
      'relogio-de-pendulo': 'O relógio de pêndulo parado',
      'escrivaninha': 'A escrivaninha',
      'candelabro': 'O candelabro com a vela',
      'espelho': 'O espelho na parede'
    },
    achado: {
      chave: 'O relógio parou às 21h29. A portinhola do mostrador guardava outra coisa.',
      fechadura: 'Sob o consolo da lareira, uma placa de ferro com um vão estreito.'
    },
    evidencia: 'passagem-sob-despensa',
    fecho: 'O térreo se ergueu. Sob a despensa há um porão — e ele não termina onde a casa termina.'
  }
];

/* A maior pontuação é 8 por chave; cada engano tira 1, com piso em 2. Vinte e
   quatro é o teto, e é o número que `ac-pontuacao.js` valida no recibo. */
export const PONTOS_POR_CHAVE = 8;
export const PISO_POR_CHAVE = 2;
/* Dois toques do MESMO jogador em menos disto contam como um. Por jogador:
   os dois procuram ao mesmo tempo, e uma trava única engolia o toque do
   segundo sem dizer nada. */
export const INTERVALO_ENTRE_TOQUES = 700;

export function startMaquette() {
  return { level: 0, key: false, lock: false, mistakes: 0, score: 0, evidence: [], lastAttempt: {} };
}

/* Quem NÃO tem a chave no capítulo tem a fechadura. Dois papéis, sempre. */
export function papelDaFechadura(capitulo) {
  return capitulo.chaveiro === 'luz' ? 'conhecimento' : 'luz';
}

/* O que cada lado vasculha. Quem tem a chave procura entre os esconderijos;
   quem tem a fechadura, entre os mesmos pontos E a fechadura — os
   esconderijos são, no aparelho dele, só lugares vazios. A fechadura nunca
   entra na lista de quem tem a chave: no aparelho dele ela não existe. */
export function pontosDoLado(capitulo, lado) {
  const pontos = capitulo.candidatos.slice();
  if (lado === 'fechadura') pontos.push(capitulo.fechadura);
  return pontos;
}

export function actMaquette(state, role, event, now = Date.now()) {
  if (!state || state.level >= CAPITULOS.length) return false;
  const capitulo = CAPITULOS[state.level];
  const lado = role === capitulo.chaveiro ? 'chave' : 'fechadura';
  if (!state.lastAttempt || typeof state.lastAttempt !== 'object') state.lastAttempt = {};

  if (event.type === 'maquete_examinar') {
    if (typeof event.object !== 'string' || event.object.length > 40) return false;
    if (lado === 'chave' ? state.key : state.lock) return false;
    if (!pontosDoLado(capitulo, lado).includes(event.object)) return false;
    if (now - (state.lastAttempt[role] || 0) < INTERVALO_ENTRE_TOQUES) return false;
    state.lastAttempt[role] = now;
    if (lado === 'chave' && event.object === capitulo.esconderijo) state.key = true;
    else if (lado === 'fechadura' && event.object === capitulo.fechadura) state.lock = true;
    else state.mistakes++;
    return true;
  }

  if (event.type === 'maquete_encaixar') {
    if (lado !== 'chave' || !state.key || !state.lock) return false;
    state.score += Math.max(PISO_POR_CHAVE, PONTOS_POR_CHAVE - Math.min(PONTOS_POR_CHAVE - PISO_POR_CHAVE, state.mistakes));
    state.evidence.push(capitulo.evidencia);
    state.level++;
    state.key = false;
    state.lock = false;
    state.mistakes = 0;
    state.lastAttempt = {};
    return true;
  }

  return false;
}

/* O que cada aparelho recebe. O que não está aqui não existe para aquele
   jogador: quem tem a chave nunca recebe o identificador da fechadura, e quem
   tem a fechadura só a recebe ACESA depois de achá-la. */
export function maquetteView(state, role) {
  if (!state) return null;
  const capitulo = CAPITULOS[state.level];
  if (!capitulo) {
    return { ...state, complete: true, name: 'A passagem revelada', chaveiro: null, papel: null,
      capitulo: null, pista: null, ato: null, achou: false, achado: null, alvos: [], fechadura: null,
      candidatos: [], rotulos: {}, camadasAbertas: CAPITULOS.map(c => c.camada) };
  }
  const lado = role === capitulo.chaveiro ? 'chave' : 'fechadura';
  const ambos = !!(state.key && state.lock);
  const achou = lado === 'chave' ? !!state.key : !!state.lock;
  const alvos = pontosDoLado(capitulo, lado);
  const rotulos = { ...capitulo.rotulos };
  if (lado === 'fechadura') rotulos[capitulo.fechadura] = capitulo.fechaduraRotulo;
  return {
    level: state.level,
    key: !!state.key,
    lock: !!state.lock,
    mistakes: state.mistakes,
    score: state.score,
    evidence: state.evidence.slice(),
    complete: false,
    capitulo: capitulo.id,
    name: capitulo.nome,
    chaveiro: capitulo.chaveiro,
    papel: lado,
    /* A pista é a MESMA nos dois aparelhos. */
    pista: ambos ? SEGUNDA_PISTA : capitulo.recorte,
    ato: ambos ? 2 : 1,
    achou,
    achado: achou ? capitulo.achado[lado] : null,
    alvos,
    candidatos: alvos,
    rotulos,
    fechadura: lado === 'fechadura' && state.lock ? capitulo.fechadura : null,
    camadasAbertas: CAPITULOS.slice(0, state.level).map(c => c.camada)
  };
}

/* O Solo é a mesma coisa com uma pessoa só: ela ocupa os dois lados. Nada de
   mecânica substituta — a vista só junta as duas metades. */
export function maquetteViewSolo(state) {
  if (!state) return null;
  const capitulo = CAPITULOS[state.level];
  if (!capitulo) return maquetteView(state, 'luz');
  const v = maquetteView(state, papelDaFechadura(capitulo));
  v.papel = 'ambos';
  v.achou = !!(state.key && state.lock);
  v.achado = state.lock ? capitulo.achado.fechadura : state.key ? capitulo.achado.chave : null;
  return v;
}

/* No Solo, um toque vale pelo lado que ainda procura aquele ponto. */
export function papelDoToqueSolo(state, objeto) {
  const capitulo = state && CAPITULOS[state.level];
  if (!capitulo) return null;
  const chave = capitulo.chaveiro, fechadura = papelDaFechadura(capitulo);
  if (objeto === capitulo.fechadura) return state.lock ? null : fechadura;
  if (!state.key) return chave;
  if (!state.lock) return fechadura;
  return null;
}

/* A lista de objetos por nome (a alternativa a tocar na cena) nasceria com a
   verdade sempre em cima, porque o esconderijo é o primeiro item do capítulo.
   Aqui ela é sorteada por partida — nunca reordenada à mão no arquivo.
   Ver a lição repetida do MOSAICO: sortear na hora de mostrar. */
export function ordemDosAlvos(lista, capituloId, semente) {
  lista = lista.slice();
  let h = 2166136261 >>> 0;
  const texto = String(semente == null ? '' : semente) + '|' + capituloId;
  for (let i = 0; i < texto.length; i++) { h ^= texto.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  const rnd = () => { h = (h + 0x6D2B79F5) | 0; let t = Math.imul(h ^ (h >>> 15), 1 | h); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  for (let i = lista.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [lista[i], lista[j]] = [lista[j], lista[i]]; }
  return lista;
}
export function ordemDosCandidatos(capitulo, semente) {
  return ordemDosAlvos(capitulo.candidatos, capitulo.id, semente);
}
