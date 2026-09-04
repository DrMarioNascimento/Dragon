/* MOSAICO — A Manhã do Carro-Forte · A MESA
   Consolidação V4 (31/08/2026): banco modular F01–F30, hipóteses concorrentes H1–H10,
   relações em pares/tríades R-A…R-G e duração por seleção de subconjuntos.

   A Mesa não é o Captura. Aqui não há moeda, vez nem carteira: a partida é coletiva,
   o dossiê abre em três terços e o que se administra é interpretação, não liquidez.
   REALIDADE CANÔNICA → FOCO DA PARTIDA → PERGUNTA → FRAGMENTOS → RELAÇÕES → INFERÊNCIA → DECISÃO */

/* O banco mora em fragmentos.js, lido também pelas três atividades sensoriais. */
const FRAGMENTOS=window.MOSAICO_FRAGMENTOS;

/* ── Relações (V4 §15). Cada peça é um grupo de alternativas: basta um código do grupo. */
const RELACOES=[
 {id:'R-A',t:'5,1 kg contra a tabela de peso',pecas:[['F14'],['F15']],efeito:'Transforma um número neutro em evidência de conteúdo.'},
 {id:'R-B',t:'O saco de 0,4 kg contra o malote de 5,1 kg',pecas:[['F13'],['F14']],efeito:'Separa o objeto descartado do malote efetivamente coletado.'},
 {id:'R-C',t:'5,1 kg contra os R$ 480.000 no destino',pecas:[['F14'],['F16']],efeito:'Derruba a retirada física do valor.'},
 {id:'R-D',t:'O saque contra o lacre novo e a janela',pecas:[['F17'],['F12','F30']],efeito:'Converte dinheiro suspeito em possível material de inserção.'},
 {id:'R-E',t:'O depósito único contra a duplicidade',pecas:[['F19'],['F20','F21']],efeito:'Localiza a origem escritural onze dias antes.'},
 {id:'R-F',t:'O acidente das pastas contra a prova em mãos',pecas:[['F25'],['F26']],efeito:'O mesmo acidente que incrimina Aprendiz explica por que a prova estava com Aprendiz.'},
 {id:'R-G',t:'O Erro 17 apagado contra a zona cega',pecas:[['F05','F06'],['F09','F10']],efeito:'Demonstra preparação da zona cega sem dizer se a finalidade era retirar ou inserir.'}
];

/* ── Hipóteses concorrentes (V4 §14). Nenhuma é pista falsa: todas nascem de fatos
      verdadeiros interpretados de forma incompleta. Canônica = sobrevive ao fechamento. */
const HIPOTESES=[
 {id:'H1',t:'Furto consumado de R$ 480 mil',d:'Saco vazio, câmera cega, vigilância afastada e lacre rompido.',apoia:['F13','F09','F24','F30'],enfraquece:['F14','F15','F16']},
 {id:'H2',t:'Furto parcial de R$ 96 mil',d:'A diferença entre R$ 384 mil físicos e R$ 480 mil declarados.',apoia:['F15','F17'],enfraquece:['F14','F16','F20']},
 {id:'H3',t:'Troca ou desvio do malote',d:'Duas etiquetas, coleta antecipada e trajeto pelo corredor.',apoia:['F11','F12','F01','F22'],enfraquece:['F16','F30']},
 {id:'H4',t:'Tentativa de furto frustrada',d:'Saco vazio e perturbação da segurança, mas o valor aparece no destino.',apoia:['F13','F09','F24'],enfraquece:['F16','F30']},
 {id:'H5',t:'Cumplicidade logística',d:'Rota antecipada, contestação do Transporte e confirmação interna.',apoia:['F01'],enfraquece:['F29']},
 {id:'H6',t:'Cumplicidade de acesso',d:'Chave 17-B, Limpeza e Aprendiz com pasta e chaveiro.',apoia:['F07','F08','F26'],enfraquece:['F25']},
 {id:'H7',t:'O saque é produto do desvio',d:'O dinheiro em espécie visto antes de sua origem e direção serem compreendidas.',apoia:['F17'],enfraquece:['F18','F16']},
 {id:'H8',t:'O saque é reposição',d:'384 + 96 = 480, com lacre novo e janela preparada.',apoia:['F17','F18','F12','F30','F15'],enfraquece:[],canonica:1},
 {id:'H9',t:'Fraude ou erro contábil anterior',d:'Duplicidade D-11 e ausência de contagem física explicam o buraco sem subtração.',apoia:['F19','F20','F21','F28'],enfraquece:[],canonica:1},
 {id:'H10',t:'Nenhum desaparecimento físico na manhã',d:'Peso de 5,1 kg, tabela operacional e conferência às 8h40.',apoia:['F14','F15','F16'],enfraquece:[],canonica:1}
];

/* ── Duração modular (V4 §16). O número é alvo, não teto: fragmentos centrais da pergunta
      e peças de relação garantida entram mesmo que estourem o alvo. */
const DURACOES={
 curta:{n:13,rel:3,rot:'Curta',nota:'12–14 fragmentos · foco em relações estruturais'},
 padrao:{n:18,rel:4,rot:'Padrão',nota:'16–20 fragmentos · equilíbrio entre as quatro funções'},
 longa:{n:24,rel:6,rot:'Longa',nota:'22–26 fragmentos · mais pistas paralelas e hipóteses intermediárias'}
};

const PARTIDAS={
 peso:{title:'O Peso do Malote 41',nature:'QUANTO + QUANDO',question:'O banco anuncia que faltam quatrocentos e oitenta mil reais. Quanto realmente desapareceu?',short:'Um número parece óbvio. A direção do dinheiro não.',
  activities:['vidro','escura'],hipotese:'H10',
  centrais:['F13','F14','F15','F16','F17','F19','F20','F21'],incidentais:['F25','F26','F27','F23','F07','F08'],
  fields:[
   ['Valor declarado',['R$ 480.000','R$ 384.000','R$ 96.000','R$ 0'],'R$ 480.000'],
   ['Valor físico antes da manhã',['R$ 480.000','R$ 384.000','R$ 96.000','R$ 0'],'R$ 384.000'],
   ['Movimento líquido da manhã',['+ R$ 96.000','− R$ 96.000','− R$ 480.000','R$ 0'],'+ R$ 96.000'],
   ['Diferença física real às 8h40',['R$ 480.000','R$ 384.000','R$ 96.000','R$ 0'],'R$ 0'],
   ['Quando nasceu a diferença?',['Na janela de 87 s','Às 8h02','Na véspera','Onze dias antes'],'Onze dias antes']],
  answer:'Naquela manhã, R$ 0 desapareceram fisicamente. A diferença de R$ 96.000 nasceu onze dias antes, como duplicidade escritural.',
  reveals:['O saco no chão pesa 0,4 kg. O malote coletado pesa 5,1 kg.','Às 8h40 a tesouraria confere R$ 480.000 íntegros.','A janela de 87 segundos foi usada para inserir R$ 96.000.','Um depósito de R$ 96.000 foi lançado duas vezes onze dias antes.']},

 janela:{title:'Os 87 Segundos',nature:'O QUÊ + COMO',question:'O que realmente aconteceu enquanto a câmera 3 ficou cega?',short:'Reconstrua a janela sem pressupor retirada.',
  activities:['norte','escura','vidro'],hipotese:'H8',
  centrais:['F09','F30','F11','F12','F24','F10'],incidentais:['F19','F20','F21','F27','F04','F03'],
  fields:[
   ['Primeiro evento',['Rádio afasta Vigilância','Lacre é rompido','Malote sai da agência','Etiqueta é impressa'],'Rádio afasta Vigilância'],
   ['O que ocorre no malote?',['R$ 480.000 saem','R$ 96.000 entram','Nada é tocado','O malote é trocado'],'R$ 96.000 entram'],
   ['O que ocorre com o lacre?',['Permanece ML-8842','É trocado por ML-8847','Desaparece','É rompido só no destino'],'É trocado por ML-8847'],
   ['Direção do fluxo',['Agência → rua','Malote → corredor','Fora → dentro do malote','Tesouraria → agência'],'Fora → dentro do malote'],
   ['Fim da janela',['7h58min12s','7h58min50s','7h59min39s','8h02'],'7h59min39s']],
  answer:'Durante os 87 segundos a vigilância foi afastada, o lacre foi rompido, R$ 96.000 foram inseridos no malote, um novo lacre foi aplicado e o malote voltou à custódia.',
  reveals:['A câmera cai às 7h58min12s.','A porta abre às 7h58min24s e o lacre ML-8842 é rompido às 7h58min50s.','R$ 96.000 entram e ML-8847 é aplicado às 7h59min20s.','A câmera retorna às 7h59min39s.']},

 roubo:{title:'Foi um roubo?',nature:'QUAL / QUE TIPO',question:'Todo mundo viu os sinais de um assalto. Mas houve realmente um roubo?',short:'Classifique o acontecimento sem confundir irregularidade com subtração.',
  activities:['vidro','escura'],hipotese:'H10',
  centrais:['F09','F13','F14','F16','F20','F30'],incidentais:['F03','F04','F27','F02'],
  fields:[
   ['Natureza da manhã',['Roubo consumado','Tentativa de roubo','Bagunça administrativa sem ação deliberada','Encenação operacional de reparação clandestina'],'Encenação operacional de reparação clandestina'],
   ['Houve subtração de valores?',['Sim, R$ 480.000','Sim, R$ 96.000','Não','Não é possível saber'],'Não'],
   ['A falha da câmera foi',['Acidental','Deliberadamente preparada','Rotina técnica','Produzida pela transportadora'],'Deliberadamente preparada'],
   ['A diferença central é',['Patrimonial','Escritural','De transporte','De lacre'],'Escritural'],
   ['A leitura “só bagunça” é',['Totalmente correta','Parcialmente correta','Totalmente falsa','Irrelevante'],'Parcialmente correta']],
  answer:'Não houve roubo naquela manhã. Houve uma encenação operacional deliberada para reparar clandestinamente uma diferença escritural anterior.',
  reveals:['Os sinais de crime são reais.','A preparação da câmera e do acesso foi deliberada.','Nenhum dinheiro foi subtraído.','A irregularidade é grave, mas não é furto.']},

 antes:{title:'Antes das 8h02',nature:'QUANDO',question:'Quando nasceu a diferença que todos procuram?',short:'A mesa olha para minutos; a resposta está onze dias atrás.',
  activities:['norte'],hipotese:'H9',
  centrais:['F19','F20','F21','F28','F02','F03','F04'],incidentais:['F22','F25','F26','F27','F13'],
  fields:[
   ['Âncora da manhã',['7h47','7h58min12s','8h02','8h40'],'7h47'],
   ['Janela crítica',['87 segundos','3 minutos','11 dias','40 minutos'],'87 segundos'],
   ['Momento da duplicidade',['Na manhã','Na véspera','Onze dias antes','No destino'],'Onze dias antes'],
   ['Evento que transforma o erro em ameaça',['Chegada do carro-forte','Auditoria anunciada na véspera','Grito às 8h02','Reset da câmera'],'Auditoria anunciada na véspera'],
   ['A diferença física nasce',['Às 7h58','Às 8h02','Onze dias antes','Nunca nasce'],'Nunca nasce']],
  answer:'A diferença nasce onze dias antes, quando um depósito de R$ 96.000 é reconsolidado e lançado pela segunda vez. A manhã apenas tenta dar corpo ao número.',
  reveals:['7h47 ancora a manhã, não a origem.','Os 87 segundos explicam uma operação, não a criação da diferença.','A auditoria da véspera torna urgente um erro antigo.','O nascimento factual está no D-11.']},

 quem:{title:'Quem construiu a janela?',nature:'QUEM COMPOSTO',question:'Quem colocou cada peça daqueles 87 segundos em movimento?',short:'Separe decisão, preparação, execução, participação sem conhecimento e negligência.',
  activities:['norte','escura'],hipotese:'H8',
  centrais:['F01','F05','F06','F07','F08','F10','F24','F26'],incidentais:['F15','F16','F19','F20','F03'],
  fields:[
   ['Quem decide a operação?',['Subgerente','Limpeza','Manutenção','Gerência'],'Subgerente'],
   ['Quem prepara a falha?',['Subgerente','Manutenção','Vigilância','Transporte'],'Subgerente'],
   ['Quem abre o acesso sem conhecer a finalidade?',['Limpeza','Aprendiz','Gerência','Cliente'],'Limpeza'],
   ['Quem executa o reset autorizado?',['Manutenção','Subgerente','Gerência','Vigilância'],'Manutenção'],
   ['Quem autoriza o reset sem contingência?',['Gerência','Manutenção','Transporte','Caixa Sênior'],'Gerência']],
  answer:'Subgerente decide e constrói a janela; Limpeza abre o acesso sem conhecer a finalidade; Manutenção executa um reset autorizado; Gerência autoriza sem contingência.',
  reveals:['Presença não é autoria.','Execução técnica não é decisão.','Abrir a porta não prova conhecimento da finalidade.','A cadeia é distribuída, mas a coordenação é identificável.']},

 proteger:{title:'O que estava sendo protegido?',nature:'POR QUÊ',question:'Se não era o dinheiro, o que alguém estava tentando salvar?',short:'A ação material contradiz o motivo aparente.',
  activities:['vidro'],hipotese:'H9',
  centrais:['F17','F18','F19','F20','F21','F28','F12'],incidentais:['F02','F03','F22','F25','F27'],
  fields:[
   ['O que Subgerente teme perder?',['R$ 480.000','A assinatura e a carreira','O malote 41','A chave 17-B'],'A assinatura e a carreira'],
   ['Por que usar dinheiro próprio?',['Para lavar produto de crime','Para completar fisicamente o saldo','Para pagar Transporte','Para comprar silêncio'],'Para completar fisicamente o saldo'],
   ['O que dispara a urgência?',['A garoa','A auditoria integral','O Cliente','O relógio da farmácia'],'A auditoria integral'],
   ['Qual ato original precisa ser escondido?',['Roubo anterior','Assinatura sem conferência física','Erro da transportadora','Abertura do cofre pelo Cliente'],'Assinatura sem conferência física'],
   ['O objetivo final é',['Enriquecimento','Desviar a auditoria para inocentes','Fazer registros e dinheiro coincidirem','Fechar a agência'],'Fazer registros e dinheiro coincidirem']],
  answer:'O objeto protegido era a assinatura — e, por extensão, a carreira. O dinheiro próprio foi usado para fazer a realidade física coincidir com um registro errado.',
  reveals:['R$ 96.000 saem da conta pessoal de Subgerente.','O dinheiro entra no malote; não sai.','A auditoria ameaça revelar uma assinatura sem conferência.','A operação tenta salvar reputação, não patrimônio.']}
};

/* As atividades não são interlúdio: são a distribuição.

   Cada uma tem um `rende` — a família de fragmentos que aquele gesto alcança.
   A Janela do Norte alcança tempo, posição e sequência; o Vidro Embaçado
   alcança número, peso, lacre e documento; a Sala às Escuras alcança vestígio
   material. Na hora da partida, o `rende` é cruzado com o que aquela pergunta
   torna relevante, e o resultado é o lote daquela atividade.

   O que o lote traz para o dossiê é só o que a mesa efetivamente descobriu.
   Quem varre a sala inteira leva os quatro; quem acha dois, leva dois — e os
   dois que ficaram para trás não entram por outra porta. É por isso que a
   montagem do dossiê deixou de acontecer na escolha da pergunta e passou a
   acontecer depois das atividades. */
const SENSORS={
 norte:{title:'A Janela do Norte',desc:'Oriente o aparelho pelos setores da agência e fixe horários e posições.',href:'janela-do-norte.html',
  rende:['F30','F09','F02','F03','F04','F01','F24','F28','F22']},
 vidro:{title:'O Vidro Embaçado',desc:'Limpe camadas de informação para revelar peso, lacres, valores e registros.',href:'vidro-embacado.html',
  rende:['F14','F15','F16','F13','F12','F11','F20','F21','F19','F17','F18']},
 escura:{title:'A Sala às Escuras',desc:'Procure no corredor objetos físicos da zona cega sem transformá-los automaticamente em culpa.',href:'sala-as-escuras.html',
  rende:['F13','F22','F23','F25','F26','F07','F08','F10','F05','F06']}
};
const POR_ATIVIDADE=4;

const FASES={intro:'PRÓLOGO',briefing:'PAUTA',sensory:'SENSORES',evidence:'DOSSIÊ',hypothesis:'HIPÓTESE',mosaic:'RELAÇÕES',final:'DECISÃO',reveal:'REVELAÇÃO',score:'RELATÓRIO'};
const PASSOS={intro:1,briefing:2,sensory:3,evidence:4,hypothesis:5,mosaic:6,final:7,reveal:8,score:9};
const TERCO_ROT=['PRIMEIRO TERÇO','SEGUNDO TERÇO','TERÇO FINAL'];

const state={screen:'intro',game:null,semente:0,players:6,pace:'pressure',duration:'padrao',
 dossie:[],tercos:[[],[],[]],aberto:1,marcados:new Set(),lotes:{},colhidos:new Set(),
 relacoes:new Set(),hipoteseProv:'',hipoteseFinal:'',
 sensorDone:new Set(),final:{},reveal:0,start:Date.now()};

const $=id=>document.getElementById(id);
const screens=[...document.querySelectorAll('.screen')];
const embaralhar=a=>a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(p=>p[1]);
const listar=a=>a.length<2?a.join(''):`${a.slice(0,-1).join(', ')} e ${a[a.length-1]}`;
const mao=()=>new Set(state.tercos.slice(0,state.aberto).flat());

function go(name){
 screens.forEach(s=>s.classList.toggle('active',s.dataset.screen===name));
 state.screen=name;
 $('phaseName').textContent=FASES[name]||name.toUpperCase();
 $('phaseStep').textContent=PASSOS[name]||'·';
 const rot=$('partidaLabel');
 rot.hidden=!state.game||name==='intro'||name==='games';
 if(state.game)rot.textContent=PARTIDAS[state.game].title;
 scrollTo(0,0);
}

/* ── Montagem do dossiê (V4 §12 e §16): relações garantidas, centrais da pergunta,
      preenchimento por função e proteção contra concentração de pistas de fechamento. */
function faltantes(rel,tem){return rel.pecas.filter(g=>!g.some(c=>tem.has(c))).map(g=>g[0])}
function relacaoCompleta(rel,tem){return rel.pecas.every(g=>g.some(c=>tem.has(c)))}

/* O lote de cada atividade: o que ela alcança, cruzado com o que esta pergunta
   torna relevante. Centrais primeiro — são eles que doem quando faltam —, e
   nenhum fragmento em dois lotes, senão falhar numa atividade seria perdoado
   pela outra. */
function montarLotes(){
 const g=PARTIDAS[state.game],usados=new Set(),lotes={};
 for(const id of g.activities){
  const s=SENSORS[id];
  const candidatos=s.rende.filter(c=>!usados.has(c)&&!g.incidentais.includes(c));
  const centrais=candidatos.filter(c=>g.centrais.includes(c));
  const resto=candidatos.filter(c=>!g.centrais.includes(c));
  const lote=[...centrais,...resto].slice(0,POR_ATIVIDADE);
  lote.forEach(c=>usados.add(c));
  lotes[id]=lote;
 }
 return lotes;
}
function sensoriais(){return Object.values(state.lotes).flat()}

function montarDossie(){
 const g=PARTIDAS[state.game],cfg=DURACOES[state.duration];
 /* Fragmentos sensoriais só entram se foram descobertos. Os perdidos não são
    substituídos: o dossiê encolhe, e é essa a consequência do gesto. */
 const doSensor=new Set(sensoriais()),perdidos=sensoriais().filter(c=>!state.colhidos.has(c));
 const alvo=Math.max(4,cfg.n-perdidos.length);
 const tem=new Set([...g.centrais.filter(c=>!doSensor.has(c)),...sensoriais().filter(c=>state.colhidos.has(c))]);
 /* Um fragmento perdido na atividade não pode voltar pela porta das relações
    nem pelo preenchimento — senão falhar não custaria nada. */
 const proibido=c=>doSensor.has(c)&&!state.colhidos.has(c);
 const ordem=[...RELACOES].filter(r=>!r.pecas.flat().every(c=>proibido(c)))
   .sort((a,b)=>faltantes(a,tem).length-faltantes(b,tem).length);
 let garantidas=0;
 for(const rel of ordem){
  if(garantidas>=cfg.rel)break;
  const faltam=faltantes(rel,tem).filter(c=>!proibido(c));
  if(faltam.length<faltantes(rel,tem).length)continue;
  faltam.forEach(c=>tem.add(c));
  garantidas++;
 }
 const resto=Object.keys(FRAGMENTOS).filter(c=>!tem.has(c)&&!proibido(c));
 const peso=c=>(g.incidentais.includes(c)?2:0)+({estrutural:0,interpretativo:.3,relacional:.5,contextual:1.2})[FRAGMENTOS[c].f]+Math.random();
 resto.sort((a,b)=>peso(a)-peso(b));
 for(const c of resto){if(tem.size>=alvo)break;tem.add(c)}
 state.dossie=[...tem].sort();
 state.tercos=distribuirTercos(state.dossie);
 state.aberto=1;state.marcados.clear();state.relacoes.clear();
}

function distribuirTercos(lista){
 const fecho=embaralhar(lista.filter(c=>FRAGMENTOS[c].fecho)),livres=embaralhar(lista.filter(c=>!FRAGMENTOS[c].fecho));
 const tam=Math.ceil(lista.length/3),t=[[],[],[]];
 /* O primeiro terço não recebe nenhuma pista de fechamento; o segundo recebe no
    máximo duas, para que a tensão entre “retirada” e “inserção” cresça sem que
    uma única leva entregue a conclusão (V4 §14 e §15). */
 while(t[0].length<tam&&livres.length)t[0].push(livres.shift());
 for(let i=0;i<2&&fecho.length&&t[1].length<tam;i++)t[1].push(fecho.shift());
 while(t[1].length<tam&&livres.length)t[1].push(livres.shift());
 t[2]=[...livres,...fecho];
 return t.map(embaralhar);
}

/* ── Rodízio: o sistema escolhe, e escolhe alternando ───────────────────
   Escolher a pergunta num menu ensinava a mesa a decorar — quem já tinha
   fechado "O Peso do Malote 41" reconhecia os fragmentos e pulava a dedução.
   O rodízio é um saco de seis: sorteia a ordem, entrega uma por vez e só
   reembaralha quando acaba. Ao reembaralhar, empurra para o fim a que acabou
   de sair, senão a virada do saco repetiria a mesma pergunta duas vezes
   seguidas. Ninguém revê uma pergunta antes de ver as seis.

   A Mesa roda numa tela só, a da mesa, então o rodízio é dessa tela. Se um dia
   ela for jogada em vários aparelhos na mesma sala, esta escolha precisa subir
   para o documento da sala — como A Noite faz em sala-partida.js —, senão cada
   aparelho abre uma pergunta diferente. */
const RODIZIO='mosaico-cf-rodizio';
function lerRodizio(){try{return JSON.parse(localStorage.getItem(RODIZIO))||{}}catch(e){return{}}}
function salvarRodizio(r){try{localStorage.setItem(RODIZIO,JSON.stringify(r))}catch(e){}}
function proximaPartida(){
 const ids=Object.keys(PARTIDAS),r=lerRodizio();
 let saco=Array.isArray(r.saco)?r.saco.filter(id=>ids.includes(id)):[];
 if(!saco.length){saco=embaralhar(ids);if(saco[0]===r.ultima&&saco.length>1)saco.push(saco.shift())}
 const id=saco.shift();
 salvarRodizio({...r,saco,ultima:id});
 return id;
}
function marcarFechada(id){
 const r=lerRodizio();
 salvarRodizio({...r,fechadas:[...new Set([...(r.fechadas||[]),id])]});
}
function fechadas(){return (lerRodizio().fechadas||[]).filter(id=>PARTIDAS[id])}

/* ── Telas ─────────────────────────────────────────────────────────────── */
function selectGame(id){
 state.game=id;state.semente=(Math.random()*0xffffffff)>>>0;state.hipoteseProv='';state.hipoteseFinal='';state.final={};state.reveal=0;state.sensorDone.clear();state.colhidos.clear();state.lotes=montarLotes();
 const g=PARTIDAS[id],cfg=DURACOES[state.duration];
 window.MosaicoPauta?.publicarPergunta(g);
 $('gameNature').textContent=g.nature;
 $('gameTitle').textContent=g.title;
 $('gameQuestion').textContent=g.question;
 const feitas=fechadas().filter(x=>x!==id).length,total=Object.keys(PARTIDAS).length;
 $('pautaNota').textContent=feitas
  ? `A pauta desta mesa foi sorteada. ${feitas} de ${total} perguntas já foram fechadas aqui — faltam ${total-feitas}.`
  : 'A pauta desta mesa foi sorteada. São seis perguntas sobre a mesma manhã, e você não escolhe qual delas cai.';
 $('planCards').innerHTML=[
  `<article class="plan-card depth-card gold"><small>DOSSIÊ</small><strong>até ${cfg.n} fragmentos</strong><p>${cfg.rot}. ${sensoriais().length} deles só entram se a mesa descobrir nas atividades — o que ficar para trás não volta por outra porta. Depois, o dossiê abre em três terços.</p></article>`,
  `<article class="plan-card depth-card green"><small>CAMPOS DESTA PERGUNTA</small><strong>${g.fields.length} campos</strong><p>${g.fields.map(f=>f[0]).join(' · ')}</p></article>`,
  `<article class="plan-card depth-card blue"><small>ATIVIDADES SENSORIAIS</small><strong>${g.activities.length} atividade${g.activities.length===1?'':'s'}</strong><p>${g.activities.map(a=>SENSORS[a].title).join(' · ')}</p></article>`
 ].join('');
 go('briefing');
}

/* As atividades são uma fila, não um cardápio.

   A mesa faz uma de cada vez, todos juntos, na ordem que a partida declara em
   `activities`. Antes eram cartões soltos: qualquer um podia ser aberto, todos
   ao mesmo tempo, e o dossiê abria mesmo sem nenhum — cada participante via
   fatos diferentes na hora de relacionar.

   A conclusão também deixou de morar no localStorage. Guardada, ela voltava
   marcada na partida seguinte e no aparelho que já tinha jogado: a atividade
   aparecia pronta sem ninguém ter feito nada, que é exatamente o furo que a
   fila fecha. Agora vale por partida, e `selectGame` zera. */
function renderSensors(){
 const g=PARTIDAS[state.game],host=$('sensoryCards'),ordem=g.activities;
 const atual=ordem.findIndex(id=>!state.sensorDone.has(id));
 host.innerHTML=ordem.map((id,i)=>{
  const s=SENSORS[id],feita=state.sensorDone.has(id),ativa=i===atual;
  const lote=state.lotes[id]||[],pegos=lote.filter(c=>state.colhidos.has(c));
  const rot=feita?`${i+1} · ${pegos.length} DE ${lote.length} FRAGMENTOS`:ativa?`${i+1} DE ${ordem.length} · AGORA`:`${i+1} DE ${ordem.length} · AGUARDA A ANTERIOR`;
  /* O que está em jogo fica escrito antes, não depois. Marcar sem abrir é uma
     escolha legítima — e custa o lote inteiro. */
  const aposta=feita
   ? `<p class="lote">${pegos.length?`Trouxe ${pegos.join(', ')}.`:'Nada foi descoberto aqui.'}${pegos.length<lote.length?` ${lote.length-pegos.length} ficaram no escuro.`:''}</p>`
   : `<p class="lote">${lote.length} fragmentos do dossiê dependem desta atividade.</p>`;
  return `<article class="sensor-card depth-card blue ${feita?'feita':ativa?'atual':'travada'}" data-sensor="${id}"><small>${rot}</small><h3>${s.title}</h3><p>${s.desc}</p>${aposta}${ativa?`<div class="sensor-actions"><a class="btn primary depth" href="${s.href}?partida=${state.game}&ritmo=${state.pace}&itens=${lote.join(",")}">Abrir atividade</a><button class="btn ghost depth mark-sensor" type="button">Pular · perde ${lote.length}</button></div>`:''}</article>`;
 }).join('');
 host.querySelectorAll('.mark-sensor').forEach(btn=>btn.onclick=()=>{
  const id=btn.closest('[data-sensor]').dataset.sensor,lote=state.lotes[id]||[];
  if(lote.length&&!confirm(`Pular esta atividade custa ${lote.length} fragmentos, que não entram no dossiê por nenhuma outra porta. Seguir assim?`))return;
  concluirSensor(id);
 });
 const n=state.sensorDone.size,faltam=ordem.length-n;
 const total=sensoriais().length,ganhos=state.colhidos.size;
 $('sensorDone').textContent=`${ganhos} de ${total} fragmentos descobertos`;
 $('sensorTags').innerHTML=ordem.filter(id=>state.sensorDone.has(id)).map(id=>`<span class="tag">${SENSORS[id].title}</span>`).join('');
 const seguir=$('toEvidence');
 seguir.disabled=faltam>0;
 seguir.innerHTML=faltam>0
  ? (faltam===1?'Falta 1 atividade':`Faltam ${faltam} atividades`)
  : 'Abrir o dossiê <span>→</span>';
}

/* A atividade abre em outra aba e agora avisa sozinha quando termina — antes
   quem marcava era só o botão daqui, e o aparelho da mesa tinha de lembrar.

   Só o aviso da atividade DA VEZ é aceito. A fila não anda fora de ordem nem
   por mensagem: uma aba velha de outra partida, ou um aviso repetido, não
   adianta o dossiê. O botão "A mesa concluiu" continua existindo para quando a
   atividade for feita fora do aparelho, ou a aba for fechada antes do fim. */
function atividadeDaVez(){
 if(!state.game)return null;
 const ordem=PARTIDAS[state.game].activities;
 return ordem.find(id=>!state.sensorDone.has(id))||null;
}
function concluirSensor(sensor){
 if(!sensor||sensor!==atividadeDaVez())return;
 state.sensorDone.add(sensor);
 if(state.screen==='sensory')renderSensors();
}
function receberAviso(dado){
 if(!dado||dado.fonte!=='mosaico-carro-forte'||dado.tipo!=='sensor-concluido')return;
 if(dado.partida!==state.game)return;
 /* A colheita é filtrada pelo lote que a Mesa entregou àquela atividade: a
    página só devolve o que recebeu, e um aviso forjado não injeta fragmento. */
 if(Array.isArray(dado.colheita))
  dado.colheita.filter(x=>(state.lotes[dado.sensor]||[]).includes(x)).forEach(x=>state.colhidos.add(x));
 concluirSensor(dado.sensor);
}
try{new BroadcastChannel('mosaico-carro-forte').onmessage=e=>receberAviso(e.data)}catch(e){}
addEventListener('message',e=>{if(e.origin===location.origin)receberAviso(e.data)});

function cartaoFragmento(cod){
 const f=FRAGMENTOS[cod],m=state.marcados.has(cod);
 return `<button class="fragment depth ${m?'marked':''}" data-f="${cod}" type="button" aria-pressed="${m}"><small>${cod} · ${f.f.toUpperCase()}</small><strong>${f.t}</strong><p>${f.d}</p></button>`;
}

function renderDossie(){
 const host=$('dossierWaves');
 host.innerHTML=state.tercos.slice(0,state.aberto).map((lote,i)=>
  `<section class="wave"><div class="wave-head"><small>${TERCO_ROT[i]}</small><span>${lote.length} fragmento${lote.length===1?'':'s'}</span></div><div class="hand">${lote.map(cartaoFragmento).join('')}</div></section>`).join('');
 host.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{
  const c=b.dataset.f;
  state.marcados.has(c)?state.marcados.delete(c):state.marcados.add(c);
  renderDossie();
 });
 const tem=mao(),abertas=RELACOES.filter(r=>relacaoCompleta(r,tem)).length;
 $('dossierMeta').innerHTML=`<b>${state.marcados.size}</b> marcado${state.marcados.size===1?'':'s'} de ${tem.size} em mesa · <b>${abertas}</b> ${abertas===1?'relação já costurável':'relações já costuráveis'}`;
 const fim=state.aberto>=3;
 $('nextWave').hidden=fim;
 $('nextWave').textContent=`Abrir o ${state.aberto===1?'segundo terço':'terço final'} →`;
 $('toHypothesis').hidden=!fim;
}

function renderHypothesis(){
 const g=PARTIDAS[state.game],tem=mao();
 $('hypothesisPrompt').textContent=g.question;
 $('hypothesisList').innerHTML=HIPOTESES.map(h=>{
  const a=h.apoia.filter(c=>tem.has(c)),e=h.enfraquece.filter(c=>tem.has(c));
  const cls=a.length&&e.length?'tensao':a.length?'apoiada':e.length?'fraca':'neutra';
  const rot=a.length&&e.length?'EM TENSÃO':a.length?'APOIADA':e.length?'ENFRAQUECIDA':'SEM APOIO NA MESA';
  const marcas=[a.length?`apoiada por ${a.join(', ')}`:'',e.length?`enfraquecida por ${e.join(', ')}`:''].filter(Boolean).join(' · ')||'nenhum fragmento desta mesa a toca';
  return `<label class="hyp-card depth-card ${cls} ${state.hipoteseProv===h.id?'chosen':''}"><input type="radio" name="hip" value="${h.id}" ${state.hipoteseProv===h.id?'checked':''}><span class="hyp-body"><small>${h.id} · ${rot}</small><strong>${h.t}</strong><p>${h.d}</p><em>${marcas}</em></span></label>`;
 }).join('');
 $('hypothesisList').querySelectorAll('input').forEach(i=>i.onchange=()=>{state.hipoteseProv=i.value;renderHypothesis()});
}

function renderRelations(){
 const tem=mao();
 $('relationGrid').innerHTML=RELACOES.map(r=>{
  const completa=relacaoCompleta(r,tem),feita=state.relacoes.has(r.id);
  const pecas=r.pecas.map(gr=>{const c=gr.find(x=>tem.has(x));return c?`<b>${c}</b>`:`<i>${gr.join(' ou ')}</i>`}).join(' ↔ ');
  return `<button class="relation-card depth-card ${completa?'':'locked'} ${feita?'selected':''}" data-r="${r.id}" type="button" ${completa?'':'disabled'}><small>${r.id}${completa?'':' · INCOMPLETA'}</small><h3>${r.t}</h3><div class="rel-pecas">${pecas}</div><p>${completa?r.efeito:'Falta o fragmento que permite interpretar o outro. Sem o par, o dado continua neutro.'}</p></button>`;
 }).join('');
 $('relationGrid').querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{
  const id=b.dataset.r;
  state.relacoes.has(id)?state.relacoes.delete(id):state.relacoes.add(id);
  renderRelations();
 });
 const h=HIPOTESES.find(x=>x.id===state.hipoteseProv);
 $('oldHypothesis').textContent=h?`${h.id} · ${h.t}`:'Nenhuma hipótese registrada';
 const inimigas=h?RELACOES.filter(r=>relacaoCompleta(r,tem)&&h.enfraquece.some(c=>r.pecas.flat().includes(c))):[];
 $('counterPrompt').textContent=h
  ? (inimigas.length?`${listar(inimigas.map(r=>r.id))} contradiz${inimigas.length>1?'em':''} esta leitura sem tornar falso nenhum fato já revelado. Abandonar uma hipótese plausível diante de nova relação conta a favor no relatório.`
                    :'Nenhuma relação desta mesa contradiz a sua hipótese até aqui. Isso não a confirma: pode apenas significar que a peça que a testaria ainda não foi costurada.')
  : 'Registre uma hipótese provisória para que a contraprova tenha o que atacar.';
}

/* A RESPOSTA CERTA NÃO PODE SER SEMPRE A PRIMEIRA.
   Em "Quem construiu a janela?" os cinco campos tinham a verdade na primeira
   opção: escolher a de cima em tudo fechava 5/5 sem ler um fragmento — numa
   pergunta cuja graça é separar quem decidiu de quem executou e de quem abriu
   a porta sem saber para quê. É a forma como a lista nasce: escreve-se a
   verdade primeiro, porque é ela que se tem em mente, e as alternativas vêm
   depois. Por isso o conserto não é reordenar o arquivo à mão — a próxima
   lista que alguém acrescentar nasceria torta do mesmo jeito.

   A ordem é sorteada POR PARTIDA e POR CAMPO. Por partida, senão recarregar
   até a resposta subir vira estratégia, e a ordem mudaria debaixo do dedo de
   quem voltasse à tela. Por campo, senão as listas sairiam correlacionadas e
   quem notasse uma adivinharia as outras.

   O value de cada <option> é o próprio texto e pontuar() compara texto, então
   a ordem não mexe em quem pontua o quê. */
function ordenar(opts,chave){
 let h=state.semente>>>0;
 for(let i=0;i<chave.length;i++)h=Math.imul(h^chave.charCodeAt(i),16777619)>>>0;
 const a=opts.slice();
 for(let i=a.length-1;i>0;i--){h=Math.imul(h^h>>>15,2246822507)>>>0;const j=(h>>>8)%(i+1);[a[i],a[j]]=[a[j],a[i]]}
 return a;
}
function optionList(opts,value='',chave=''){const lista=chave?ordenar(opts,chave):opts;return `<option value="">Selecione…</option>${lista.map(o=>`<option ${o===value?'selected':''}>${o}</option>`).join('')}`}

function renderFinal(){
 const g=PARTIDAS[state.game];
 $('finalPrompt').textContent=g.question;
 $('finalForm').innerHTML=g.fields.map(([label,opts])=>
  `<label class="field depth-card"><span>${label}</span><select name="${label}" required>${optionList(opts,'',state.game+'·'+label)}</select></label>`).join('')
 +`<label class="field depth-card green"><span>Hipótese que você sustenta no fechamento</span><select name="__hip" required>${optionList(HIPOTESES.map(h=>`${h.id} · ${h.t}`),state.hipoteseProv?`${state.hipoteseProv} · ${HIPOTESES.find(h=>h.id===state.hipoteseProv).t}`:'')}</select></label>`
 +`<button class="btn primary depth" type="submit">Fechar a decisão <span>→</span></button>`;
}

function pontuar(){
 const g=PARTIDAS[state.game],tem=mao();
 let acertos=0;g.fields.forEach(([label,,ans])=>{if(state.final[label]===ans)acertos++});
 const campos=Math.round(acertos/g.fields.length*45);

 const hFinal=HIPOTESES.find(h=>h.id===state.hipoteseFinal);
 const hipotese=hFinal?(hFinal.id===g.hipotese?15:hFinal.canonica?10:0):0;

 const disp=RELACOES.filter(r=>relacaoCompleta(r,tem)),feitas=disp.filter(r=>state.relacoes.has(r.id));
 const relacoes=disp.length?Math.round(feitas.length/disp.length*20):0;

 const centrais=g.centrais.filter(c=>tem.has(c));
 const certos=[...state.marcados].filter(c=>centrais.includes(c)).length;
 const ruido=[...state.marcados].filter(c=>g.incidentais.includes(c)).length;
 const leitura=centrais.length?Math.max(0,Math.round(certos/centrais.length*10)-Math.min(4,ruido)):0;

 const sensorial=Math.round(state.sensorDone.size/g.activities.length*10);
 const revisao=(state.hipoteseProv&&hFinal&&hFinal.canonica&&!HIPOTESES.find(h=>h.id===state.hipoteseProv).canonica)?5:0;

 return {total:Math.min(100,campos+hipotese+relacoes+leitura+sensorial+revisao),
  campos,hipotese,relacoes,leitura,sensorial,revisao,acertos,
  relFeitas:feitas.length,relDisp:disp.length};
}

function renderReveal(){
 const g=PARTIDAS[state.game],tem=mao();
 const caidas=HIPOTESES.filter(h=>!h.canonica&&h.enfraquece.some(c=>tem.has(c))).slice(0,3);
 const steps=[
  {k:'O QUE PARECIA',h:'R$ 480.000 desapareceram.',p:'Um saco vazio, uma câmera cega e a vigilância afastada organizam a interpretação antes de qualquer conferência.'},
  ...g.reveals.map((x,i)=>({k:`RELAÇÃO ${i+1}`,h:x,p:'Nenhum fato anterior foi alterado. Mudou a relação entre as evidências.'})),
  {k:'HIPÓTESES QUE CAEM',h:caidas.length?caidas.map(h=>h.id).join(' · '):'Nenhuma hipótese foi derrubada nesta mesa.',
   p:caidas.length?caidas.map(h=>`${h.id} — ${h.t}`).join('; ')+'. Cada uma nasceu de fatos verdadeiros lidos de forma incompleta.':'As pistas de fechamento não chegaram a se cruzar nesta duração.'},
  {k:'INFERÊNCIA CANÔNICA',h:g.answer,p:'A realidade é a mesma em todas as partidas. Esta pergunta apenas exige outro corte dela.'},
  {k:'PRINCÍPIO',h:'A verdade devolve o dinheiro; a mentira fica com ele.',p:'No MOSAICO, um fato verdadeiro pode estar associado à interpretação errada.'}
 ];
 state.revealMax=steps.length-1;
 const s=steps[Math.min(state.reveal,state.revealMax)];
 $('revealStage').innerHTML=`<div class="reveal-card depth-card"><span class="eyebrow">${s.k}</span><h2>${s.h}</h2><p>${s.p}</p></div>`;
 $('nextReveal').innerHTML=state.reveal>=state.revealMax?'Ver o relatório <span>→</span>':'Continuar revelação <span>→</span>';
}

function renderScore(){
 const g=PARTIDAS[state.game],s=pontuar(),hFinal=HIPOTESES.find(h=>h.id===state.hipoteseFinal);
 marcarFechada(state.game);
 window.MosaicoPauta?.publicarFim(g,s);
 $('scoreTitle').textContent=g.title;
 $('totalScore').textContent=s.total;
 const rows=[['Campos da pergunta',s.campos,45],['Hipótese sustentada',s.hipotese,15],['Relações costuradas',s.relacoes,20],['Leitura do dossiê',s.leitura,10],['Atividades sensoriais',s.sensorial,10],['Revisão de hipótese',s.revisao,5]];
 $('scoreBars').innerHTML=rows.map(([n,v,m])=>`<div class="score-row"><span>${n}</span><div class="bar"><i style="width:${Math.min(100,v/m*100)}%"></i></div><b>${v}</b></div>`).join('');
 $('endingCards').innerHTML=[
  `<article class="ending-card depth-card green"><small>PERGUNTA</small><h3>${g.question}</h3><p>${g.answer}</p></article>`,
  `<article class="ending-card depth-card gold"><small>CAMPOS</small><h3>${s.acertos}/${g.fields.length}</h3><p>Campos corretos da resolução específica desta partida.</p></article>`,
  `<article class="ending-card depth-card blue"><small>RELAÇÕES</small><h3>${s.relFeitas}/${s.relDisp}</h3><p>Relações completas nesta mesa que você efetivamente costurou.</p></article>`,
  `<article class="ending-card depth-card"><small>HIPÓTESE</small><h3>${hFinal?hFinal.id+' · '+hFinal.t:'—'}</h3><p>${hFinal&&hFinal.canonica?'Sobrevive ao fechamento auditável.':'Continua plausível, mas não sobrevive às relações físicas.'}${s.revisao?' Você abandonou uma leitura anterior diante de nova evidência — isso conta a favor.':''}</p></article>`
 ].join('');
 /* A coleção é o que traz a mesa de volta: as seis perguntas caem em rodízio,
    e o que falta fica visível sem revelar qual vem a seguir. */
 const feitas=fechadas(),total=Object.keys(PARTIDAS).length;
 $('colecao').innerHTML=`<small>PERGUNTAS DESTA MESA</small><b>${feitas.length} de ${total} fechadas</b><div class="colecao-marcas">${Object.keys(PARTIDAS).map(id=>`<span class="marca ${feitas.includes(id)?'on':''}">${feitas.includes(id)?PARTIDAS[id].nature:'?'}</span>`).join('')}</div><p>${feitas.length>=total?'A mesa fechou as seis. O rodízio recomeça em outra ordem, com outro dossiê.':'A próxima pergunta é sorteada pelo sistema — e nenhuma se repete antes que as seis tenham caído.'}</p>`;
}

/* ── Ligações ──────────────────────────────────────────────────────────── */
/* A abertura roda uma vez, na primeira entrada, e só então a pauta é sorteada —
   a pergunta aparece depois da narração, não antes. Nas entradas seguintes
   (voltar ao prólogo, sortear a próxima) ela não volta: MosaicoOpening.show()
   é inerte depois de terminada, e sem esta bandeira o clique ficaria esperando
   um evento que não viria mais. */
let aberturaPedida=false;
/* A pergunta da mesa é UMA. Quem sorteia é o Mestre e grava na sala; os outros
   recebem. Sem sala, `escolher` devolve o sorteio local intacto — é o caminho
   do ensaio e do aparelho solto, que continua sendo a maioria das partidas.
   Ver pauta-da-mesa.js: o defeito era dois celulares abrindo perguntas
   diferentes, cada um achando que jogava com o outro. */
function abrirPauta(){
 state.players=+$('playerCount').value;state.pace=$('pace').value;state.duration=$('duration').value;
 const local=()=>proximaPartida();
 if(!window.MosaicoPauta)return selectGame(local());
 window.MosaicoPauta.escolher(local).then(selectGame)
  .catch(e=>{console.error('MOSAICO: pauta falhou; sorteio local.',e);selectGame(local())});
}
window.addEventListener('mosaico-opening-finished',()=>{if(aberturaPedida)abrirPauta()},{once:true});
$('chooseGame').onclick=()=>{
 if(window.MosaicoOpening&&!aberturaPedida){aberturaPedida=true;window.MosaicoOpening.show();return}
 abrirPauta();
};

/* A sala tem duas portas e só precisa de uma. O #dragonSalaBtn flutuante vem do
   firebase-room.js, compartilhado com A Noite, onde ele é a única porta e não
   pode sumir — aqui ele cobria o dock e atrapalhava a mão. Fica escondido pelo
   CSS, não removido: o clique programático continua funcionando e a presença do
   nó ainda é como esta página reconhece que este aparelho é o do Mestre.
   Quando game.js roda, liberar() já instalou o botão, então uma conferida
   basta. */
(function(){
 const flutuante=document.getElementById('dragonSalaBtn'),hud=$('hudSala');
 if(!flutuante)return;
 hud.hidden=false;
 hud.onclick=()=>flutuante.click();
})();
document.querySelectorAll('[data-back]').forEach(b=>b.onclick=()=>go(b.dataset.back));
$('startGame').onclick=()=>{renderSensors();go('sensory')};
$('toEvidence').onclick=()=>{montarDossie();renderDossie();go('evidence')};
$('nextWave').onclick=()=>{if(state.aberto<3){state.aberto++;renderDossie()}};
$('toHypothesis').onclick=()=>{renderHypothesis();go('hypothesis')};
$('hypothesisForm').onsubmit=e=>{
 e.preventDefault();
 if(!state.hipoteseProv){alert('Comprometa-se com uma hipótese provisória antes de seguir.');return}
 renderRelations();go('mosaic');
};
$('toFinal').onclick=()=>{renderFinal();go('final')};
$('finalForm').onsubmit=e=>{
 e.preventDefault();
 const dados=Object.fromEntries(new FormData(e.currentTarget));
 state.hipoteseFinal=(dados.__hip||'').split(' · ')[0];
 delete dados.__hip;
 state.final=dados;state.reveal=0;renderReveal();go('reveal');
};
$('nextReveal').onclick=()=>{
 if(state.reveal>=state.revealMax){renderScore();go('score')}
 else{state.reveal++;renderReveal()}
};
/* Na rodada nova o convidado espera a pergunta MUDAR: sem passar a que acabou,
   ele receberia de volta a mesma e jogaria duas vezes o mesmo caso. */
$('playAgain').onclick=()=>{
 const anterior=state.game, local=()=>proximaPartida();
 if(!window.MosaicoPauta)return selectGame(local());
 window.MosaicoPauta.escolher(local,anterior).then(selectGame)
  .catch(e=>{console.error('MOSAICO: pauta falhou; sorteio local.',e);selectGame(local())});
};
$('resetBtn').onclick=()=>{if(confirm('Reiniciar a Mesa e voltar à escolha inicial?'))location.reload()};
$('infoBtn').onclick=()=>$('drawer').classList.add('on');
$('drawerClose').onclick=()=>$('drawer').classList.remove('on');
$('drawer').onclick=e=>{if(e.target===$('drawer'))$('drawer').classList.remove('on')};

setInterval(()=>{
 const d=Math.floor((Date.now()-state.start)/1000);
 $('timer').textContent=`${String(Math.floor(d/60)).padStart(2,'0')}:${String(d%60).padStart(2,'0')}`;
},1000);

go('intro');
