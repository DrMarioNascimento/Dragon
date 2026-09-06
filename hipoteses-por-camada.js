/*! MOSAICO · Hipóteses / respostas por camada cognitiva
 * Catálogo player-facing + apresentação Livre / Assistida / Guiada.
 * Invariância MOSAICO: mesmas chaves canônicas / mesmos campos em todas as camadas.
 * Camadas só mudam andaime (agrupamento, buckets, prompts socráticos).
 * NUNCA: %, "mais provável", ranking keyed à solução.
 * Fonte: hipoteses-por-camada.json · MOSAICO-ACESSIBILIDADE-PAPEIS.md
 */
(function (global) {
  "use strict";

  var CATALOG = {"casos": {"casa-da-costa": {"id": "casa-da-costa", "titulo": "A Casa da Costa", "hipoteses": [{"id": "H1", "t": "Assombração", "d": "Respiração, vulto, nome, degrau e relógio formam uma leitura sobrenatural aparente."}, {"id": "H2", "t": "Só a casa", "d": "Umidade, madeira e vento explicam parte real dos fenômenos — e a generalização é a armadilha."}, {"id": "H3", "t": "Intruso entrou durante a reunião", "d": "Presença física, apagão e pegadas podem ser lidos como entrada recente."}, {"id": "H4", "t": "Alguém entrou antes dos seis", "d": "Anotação, nome estranho e cofre encostado deslocam a entrada para antes do inventário, mas ainda para aquela noite."}, {"id": "H5", "t": "Tentativa de furto", "d": "Cofre tocado, apagão e movimentação no corredor parecem preparar subtração."}, {"id": "H6", "t": "Encenação do apagão", "d": "A coincidência temporal sugere sabotagem até a falha externa aparecer."}, {"id": "H7", "t": "O Morador mantém alguém na casa", "d": "Limpeza e rotina doméstica incriminam o caseiro antes de se comparar visitas com consumo."}, {"id": "H8", "t": "Alguém mora ali há dias", "d": "Água, boiler, estoque e poeira sustentam ocupação recente."}, {"id": "H9", "t": "Alguém mora ali há cinco meses", "d": "Contrato, consumo contínuo e boiler fora das visitas fecham a duração sem ainda fechar a contagem."}, {"id": "H10", "t": "Havia sete dentro da casa", "d": "As famílias doméstica, física e documental convergem."}], "partidas": {"sete": {"titulo": "Sete dentro da casa", "natureza": "QUANTO + ONDE", "pergunta": "Seis pessoas atravessaram o portão. Quantas estavam dentro da casa?", "principal": "contagemReal", "campos": [{"id": "contagemDeclarada", "rotulo": "Contagem declarada", "opcoes": ["5", "6", "7", "8"]}, {"id": "contagemReal", "rotulo": "Contagem real", "opcoes": ["6", "7", "8", "Não é possível determinar"]}, {"id": "sinaisCasa", "rotulo": "Sinais atribuíveis à casa", "opcoes": ["Estalos do sótão e cortina", "Respiração e sombra", "Colher e cadeira morna", "Pegadas e xícaras"]}, {"id": "sinaisCorpo", "rotulo": "Sinais que exigem um corpo", "opcoes": ["Degrau, respiração, sombra e colher", "Estalos, vento e umidade", "Cortina, disjuntor e caixa de passagem", "Névoa, chuva e rangidos gerais"]}, {"id": "localizacao", "rotulo": "Onde estava a pessoa a mais?", "opcoes": ["Quarto de serviço atrás do jardim interno", "Farol", "Anexo do caseiro", "Porão sob o cofre"]}, {"id": "duracao", "rotulo": "Há quanto tempo?", "opcoes": ["Desde aquela tarde", "Quarenta minutos", "Cinco meses", "Catorze meses"]}, {"id": "confirmacao", "rotulo": "O que fecha a contagem?", "opcoes": ["Sete xícaras + ausência seletiva de poeira", "A porta do cofre entreaberta", "A queda de energia", "A janela trancada"]}]}, "cinco": {"titulo": "Cinco meses", "natureza": "HÁ QUANTO TEMPO", "pergunta": "Desde quando alguém permanece na Casa da Costa?", "principal": "duracao", "campos": [{"id": "duracao", "rotulo": "Duração da permanência", "opcoes": ["Uma noite", "Duas semanas", "Cinco meses", "Catorze meses"]}, {"id": "marco", "rotulo": "Marco inicial", "opcoes": ["O falecimento do antigo dono", "O anúncio do inventário", "O início da tempestade", "A primeira visita do Morador"]}, {"id": "consumo", "rotulo": "Registro que sustenta continuidade", "opcoes": ["Hidrômetro com consumo diário", "Relógio da sala", "Cofre entreaberto", "Queda em três casas"]}, {"id": "rotina", "rotulo": "Outro sinal de rotina", "opcoes": ["Boiler acionado fora das visitas do Morador", "Janela fechada", "Envelope lacrado", "Luz religada às 21h31"]}, {"id": "domestico", "rotulo": "Sinais domésticos", "opcoes": ["Xícaras, poeira e despensa", "Cofre, chave e envelope", "Raio, névoa e vento", "Carros, portão e relógio"]}]}, "apagao": {"titulo": "Os 2 minutos e 2 segundos", "natureza": "COMO", "pergunta": "Como uma pessoa atravessou a casa durante o apagão sem ser identificada?", "principal": "movimento", "campos": [{"id": "movimento", "rotulo": "O que aconteceu no escuro?", "opcoes": ["Uma pessoa já dentro da casa atravessou corredor e sala", "Alguém entrou pela janela", "O Morador desligou a energia e abriu o cofre", "Ninguém se moveu; tudo foi estrutural"]}, {"id": "inicio", "rotulo": "Onde o deslocamento começa?", "opcoes": ["Vão do sótão", "Portão principal", "Cozinha", "Farol"]}, {"id": "fim", "rotulo": "Para onde ela segue?", "opcoes": ["Porta do jardim / quarto de serviço", "Cofre", "Portão principal", "Anexo do caseiro"]}, {"id": "sinais", "rotulo": "O que acompanha o trajeto?", "opcoes": ["Respiração, sombra e colher chutada", "Somente estalos do sótão", "Abertura da janela", "Disjuntor desligado"]}, {"id": "apagao", "rotulo": "Quem provocou o apagão?", "opcoes": ["Ninguém dentro da casa", "A Sétima", "O Morador", "A Herdeira"]}]}, "nome": {"titulo": "O nome", "natureza": "QUEM", "pergunta": "De quem é o nome que a secretária eletrônica reproduziu às 21h31?", "principal": "identidade", "campos": [{"id": "identidade", "rotulo": "A quem o nome pertence?", "opcoes": ["À antiga acompanhante do proprietário", "À Herdeira", "Ao Morador", "Ao antigo zelador"]}, {"id": "fonte", "rotulo": "De onde vem o nome?", "opcoes": ["Última mensagem gravada pelo antigo dono", "Ligação feita naquela noite", "Relatório policial", "Contrato lido em voz alta"]}, {"id": "documento", "rotulo": "O que liga o nome a uma pessoa real?", "opcoes": ["Registro de pagamentos de acompanhante", "Registro do cofre", "Conta de energia", "Lista de convidados"]}, {"id": "periodo", "rotulo": "Quando os pagamentos cessaram?", "opcoes": ["Cinco meses atrás", "Naquela manhã", "Catorze meses atrás", "Às 21h31"]}]}, "corpo": {"titulo": "Casa, corpo ou assombração?", "natureza": "QUAL / QUE TIPO", "pergunta": "Quais fenômenos eram da própria casa e quais exigiam uma presença humana?", "principal": "leitura", "campos": [{"id": "leitura", "rotulo": "Leitura final", "opcoes": ["Parte era a casa; parte exigia um corpo", "Tudo era assombração", "Tudo era estrutura e tempestade", "Tudo foi encenado pelos seis"]}, {"id": "estrutura", "rotulo": "Fenômenos estruturais", "opcoes": ["Estalos do sótão, umidade e cortina", "Respiração, sombra e cadeira morna", "Pegadas, colher e degrau", "Xícaras, contrato e hidrômetro"]}, {"id": "corpo", "rotulo": "Fenômenos que exigem corpo", "opcoes": ["Degrau sob carga, respiração, sombra e cadeira morna", "Higrômetro, vento e caixa de passagem", "Cortina, chuva e disjuntor", "Religamento, envelope e cofre"]}, {"id": "cofre", "rotulo": "O cofre prova o quê?", "opcoes": ["Nada foi furtado; a porta estava apenas encostada", "Houve invasão", "A Herdeira roubou o envelope", "O apagão foi provocado"]}]}, "perceber": {"titulo": "Quem deveria ter percebido?", "natureza": "QUEM COMPOSTO", "pergunta": "Quem teve oportunidade de perceber a ocupação e por que ela permaneceu invisível?", "principal": "cadeia", "campos": [{"id": "cadeia", "rotulo": "O que melhor explica a falha coletiva?", "opcoes": ["Sinais verdadeiros foram atribuídos a causas isoladas", "Todos sabiam e esconderam", "A casa apagava provas", "A Sétima possuía todas as chaves"]}, {"id": "morador", "rotulo": "Por que o Morador não percebeu?", "opcoes": ["Atribuía a limpeza ao próprio cuidado", "Nunca entrava na casa", "Não conhecia o quarto de serviço", "Estava fora da cidade por cinco meses"]}, {"id": "familia", "rotulo": "O que a família deixou de verificar?", "opcoes": ["A saída efetiva da acompanhante após o falecimento", "A existência do cofre", "O horário do apagão", "O funcionamento da janela"]}, {"id": "grupo", "rotulo": "O que o grupo fez naquela noite?", "opcoes": ["Interpretou sinais antes de recontar pessoas e relações", "Contou sete ao entrar", "Encontrou o quarto de serviço imediatamente", "Provou uma invasão"]}]}}}, "carro-forte": {"id": "carro-forte", "titulo": "A Manhã do Carro-Forte", "hipoteses": [{"id": "H1", "t": "Furto consumado de R$ 480 mil", "d": "Saco vazio, câmera cega, vigilância afastada e lacre rompido."}, {"id": "H2", "t": "Furto parcial de R$ 96 mil", "d": "A diferença entre R$ 384 mil físicos e R$ 480 mil declarados."}, {"id": "H3", "t": "Troca ou desvio do malote", "d": "Duas etiquetas, coleta antecipada e trajeto pelo corredor."}, {"id": "H4", "t": "Tentativa de furto frustrada", "d": "Saco vazio e perturbação da segurança, mas o valor aparece no destino."}, {"id": "H5", "t": "Cumplicidade logística", "d": "Rota antecipada, contestação do Transporte e confirmação interna."}, {"id": "H6", "t": "Cumplicidade de acesso", "d": "Chave 17-B, Limpeza e Aprendiz com pasta e chaveiro."}, {"id": "H7", "t": "O saque é produto do desvio", "d": "O dinheiro em espécie visto antes de sua origem e direção serem compreendidas."}, {"id": "H8", "t": "O saque é reposição", "d": "384 + 96 = 480, com lacre novo e janela preparada."}, {"id": "H9", "t": "Fraude ou erro contábil anterior", "d": "Duplicidade D-11 e ausência de contagem física explicam o buraco sem subtração."}, {"id": "H10", "t": "Nenhum desaparecimento físico na manhã", "d": "Peso de 5,1 kg, tabela operacional e conferência às 8h40."}], "partidas": {"peso": {"titulo": "O Peso do Malote 41", "natureza": "QUANTO + QUANDO", "pergunta": "O banco anuncia que faltam quatrocentos e oitenta mil reais. Quanto realmente desapareceu?", "principal": "valor-declarado", "campos": [{"id": "valor-declarado", "rotulo": "Valor declarado", "opcoes": ["R$ 480.000", "R$ 384.000", "R$ 96.000", "R$ 0"]}, {"id": "valor-fisico-antes-da-manha", "rotulo": "Valor físico antes da manhã", "opcoes": ["R$ 480.000", "R$ 384.000", "R$ 96.000", "R$ 0"]}, {"id": "movimento-liquido-da-manha", "rotulo": "Movimento líquido da manhã", "opcoes": ["+ R$ 96.000", "− R$ 96.000", "− R$ 480.000", "R$ 0"]}, {"id": "diferenca-fisica-real-as-8h40", "rotulo": "Diferença física real às 8h40", "opcoes": ["R$ 480.000", "R$ 384.000", "R$ 96.000", "R$ 0"]}, {"id": "quando-nasceu-a-diferenca", "rotulo": "Quando nasceu a diferença?", "opcoes": ["Na janela de 87 s", "Às 8h02", "Na véspera", "Onze dias antes"]}]}, "janela": {"titulo": "Os 87 Segundos", "natureza": "O QUÊ + COMO", "pergunta": "O que realmente aconteceu enquanto a câmera 3 ficou cega?", "principal": "primeiro-evento", "campos": [{"id": "primeiro-evento", "rotulo": "Primeiro evento", "opcoes": ["Rádio afasta Vigilância", "Lacre é rompido", "Malote sai da agência", "Etiqueta é impressa"]}, {"id": "o-que-ocorre-no-malote", "rotulo": "O que ocorre no malote?", "opcoes": ["R$ 480.000 saem", "R$ 96.000 entram", "Nada é tocado", "O malote é trocado"]}, {"id": "o-que-ocorre-com-o-lacre", "rotulo": "O que ocorre com o lacre?", "opcoes": ["Permanece ML-8842", "É trocado por ML-8847", "Desaparece", "É rompido só no destino"]}, {"id": "direcao-do-fluxo", "rotulo": "Direção do fluxo", "opcoes": ["Agência → rua", "Malote → corredor", "Fora → dentro do malote", "Tesouraria → agência"]}, {"id": "fim-da-janela", "rotulo": "Fim da janela", "opcoes": ["7h58min12s", "7h58min50s", "7h59min39s", "8h02"]}]}, "roubo": {"titulo": "Foi um roubo?", "natureza": "QUAL / QUE TIPO", "pergunta": "Todo mundo viu os sinais de um assalto. Mas houve realmente um roubo?", "principal": "natureza-da-manha", "campos": [{"id": "natureza-da-manha", "rotulo": "Natureza da manhã", "opcoes": ["Roubo consumado", "Tentativa de roubo", "Bagunça administrativa sem ação deliberada", "Encenação operacional de reparação clandestina"]}, {"id": "houve-subtracao-de-valores", "rotulo": "Houve subtração de valores?", "opcoes": ["Sim", "R$ 480.000", "Sim", "R$ 96.000", "Não", "Não é possível saber"]}, {"id": "a-falha-da-camera-foi", "rotulo": "A falha da câmera foi", "opcoes": ["Acidental", "Deliberadamente preparada", "Rotina técnica", "Produzida pela transportadora"]}, {"id": "a-diferenca-central-e", "rotulo": "A diferença central é", "opcoes": ["Patrimonial", "Escritural", "De transporte", "De lacre"]}, {"id": "a-leitura-so-bagunca-e", "rotulo": "A leitura “só bagunça” é", "opcoes": ["Totalmente correta", "Parcialmente correta", "Totalmente falsa", "Irrelevante"]}]}, "antes": {"titulo": "Antes das 8h02", "natureza": "QUANDO", "pergunta": "Quando nasceu a diferença que todos procuram?", "principal": "ancora-da-manha", "campos": [{"id": "ancora-da-manha", "rotulo": "Âncora da manhã", "opcoes": ["7h47", "7h58min12s", "8h02", "8h40"]}, {"id": "janela-critica", "rotulo": "Janela crítica", "opcoes": ["87 segundos", "3 minutos", "11 dias", "40 minutos"]}, {"id": "momento-da-duplicidade", "rotulo": "Momento da duplicidade", "opcoes": ["Na manhã", "Na véspera", "Onze dias antes", "No destino"]}, {"id": "evento-que-transforma-o-erro-em-ameaca", "rotulo": "Evento que transforma o erro em ameaça", "opcoes": ["Chegada do carro-forte", "Auditoria anunciada na véspera", "Grito às 8h02", "Reset da câmera"]}, {"id": "a-diferenca-fisica-nasce", "rotulo": "A diferença física nasce", "opcoes": ["Às 7h58", "Às 8h02", "Onze dias antes", "Nunca nasce"]}]}, "quem": {"titulo": "Quem construiu a janela?", "natureza": "QUEM COMPOSTO", "pergunta": "Quem colocou cada peça daqueles 87 segundos em movimento?", "principal": "quem-decide-a-operacao", "campos": [{"id": "quem-decide-a-operacao", "rotulo": "Quem decide a operação?", "opcoes": ["Subgerente", "Limpeza", "Manutenção", "Gerência"]}, {"id": "quem-prepara-a-falha", "rotulo": "Quem prepara a falha?", "opcoes": ["Subgerente", "Manutenção", "Vigilância", "Transporte"]}, {"id": "quem-abre-o-acesso-sem-conhecer-a-finalidade", "rotulo": "Quem abre o acesso sem conhecer a finalidade?", "opcoes": ["Limpeza", "Aprendiz", "Gerência", "Cliente"]}, {"id": "quem-executa-o-reset-autorizado", "rotulo": "Quem executa o reset autorizado?", "opcoes": ["Manutenção", "Subgerente", "Gerência", "Vigilância"]}, {"id": "quem-autoriza-o-reset-sem-contingencia", "rotulo": "Quem autoriza o reset sem contingência?", "opcoes": ["Gerência", "Manutenção", "Transporte", "Caixa Sênior"]}]}, "proteger": {"titulo": "O que estava sendo protegido?", "natureza": "POR QUÊ", "pergunta": "Se não era o dinheiro, o que alguém estava tentando salvar?", "principal": "o-que-subgerente-teme-perder", "campos": [{"id": "o-que-subgerente-teme-perder", "rotulo": "O que Subgerente teme perder?", "opcoes": ["R$ 480.000", "A assinatura e a carreira", "O malote 41", "A chave 17-B"]}, {"id": "por-que-usar-dinheiro-proprio", "rotulo": "Por que usar dinheiro próprio?", "opcoes": ["Para lavar produto de crime", "Para completar fisicamente o saldo", "Para pagar Transporte", "Para comprar silêncio"]}, {"id": "o-que-dispara-a-urgencia", "rotulo": "O que dispara a urgência?", "opcoes": ["A garoa", "A auditoria integral", "O Cliente", "O relógio da farmácia"]}, {"id": "qual-ato-original-precisa-ser-escondido", "rotulo": "Qual ato original precisa ser escondido?", "opcoes": ["Roubo anterior", "Assinatura sem conferência física", "Erro da transportadora", "Abertura do cofre pelo Cliente"]}, {"id": "o-objetivo-final-e", "rotulo": "O objetivo final é", "opcoes": ["Enriquecimento", "Desviar a auditoria para inocentes", "Fazer registros e dinheiro coincidirem", "Fechar a agência"]}]}}}}, "_leia": "Catálogo player-facing de hipóteses e campos de decisão. Sem respostas canônicas, sem probabilidade. Camadas só mudam andaime."};

  var FORBIDDEN = [
    /%\s*(prov[aá]vel|de\s+confian[cç]a|chance)/i,
    /\bmais\s+prov[aá]vel\b/i,
    /\bhip[oó]tese\s+mais\s+prov[aá]vel\b/i,
    /\d+\s*%\s*prov/i,
    /\branking\s+autom[aá]tico\b/i,
    /\b78%\b/,
    /\b87%\s*de\s+confian/i
  ];

  /* Ênfase de painel por papel (não remove campos; só destaca ferramentas). */
  var ENFASE_PAPEL = {
    investigador: { primario: "hipoteses", secoes: ["hipoteses", "pistas", "naoExaminadas"] },
    cetico: { primario: "buckets", secoes: ["favor", "contra", "outra", "naoEncaixa"] },
    arquivista: { primario: "classificacao", secoes: ["fatos", "interpretacoes", "duvidas"] },
    cronista: { primario: "timeline", secoes: ["sequencia", "lacunas", "horarios"] },
    decisor: { primario: "comparar", secoes: ["hipA", "hipB", "hipC", "campos", "justificativa"] }
  };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  function normalizarCaso(caso) {
    var c = String(caso || "").toLowerCase();
    if (c.indexOf("casa") >= 0) return "casa-da-costa";
    if (c.indexOf("carro") >= 0 || c.indexOf("forte") >= 0) return "carro-forte";
    if (c.indexOf("noite") >= 0) return "noite";
    return c || "casa-da-costa";
  }

  function casoModel(caso) {
    var id = normalizarCaso(caso);
    return (CATALOG.casos && CATALOG.casos[id]) || null;
  }

  function partidaIds(caso) {
    var m = casoModel(caso);
    return m ? Object.keys(m.partidas || {}) : [];
  }

  function partidaModel(caso, partidaId) {
    var m = casoModel(caso);
    if (!m) return null;
    var id = partidaId || Object.keys(m.partidas || {})[0];
    return (m.partidas && m.partidas[id]) || null;
  }

  /** Chaves de hipótese disponíveis — idênticas em Livre/Assistida/Guiada. */
  function hypothesisKeys(caso) {
    var m = casoModel(caso);
    return m ? (m.hipoteses || []).map(function (h) { return h.id; }) : [];
  }

  function hypothesisOptions(caso) {
    var m = casoModel(caso);
    return m ? (m.hipoteses || []).map(function (h) {
      return { id: h.id, t: h.t, d: h.d };
    }) : [];
  }

  /** Campos de decisão da pergunta-mãe — mesmos ids/opções em todas as camadas. */
  function decisionFields(caso, partidaId) {
    var p = partidaModel(caso, partidaId);
    return p ? (p.campos || []).map(function (c) {
      return { id: c.id, rotulo: c.rotulo, opcoes: (c.opcoes || []).slice() };
    }) : [];
  }

  function decisionFieldKeys(caso, partidaId) {
    return decisionFields(caso, partidaId).map(function (c) { return c.id; });
  }

  function camadaRank(camada) {
    if (camada === "guiada") return 2;
    if (camada === "assistida") return 1;
    return 0;
  }

  /**
   * Descritor de apresentação por camada (sem veredito do sistema).
   * Livre: lista crua / entrada livre.
   * Assistida: agrupamentos, A/B/C, favor/contra, não-examinadas.
   * Guiada: Assistida + prompts socráticos de processo.
   */
  function presentation(opts) {
    opts = opts || {};
    var caso = normalizarCaso(opts.caso);
    var camada = opts.camada || "livre";
    var papel = opts.papel || "investigador";
    var partidaId = opts.partidaId;
    var hips = hypothesisOptions(caso);
    var campos = decisionFields(caso, partidaId);
    var enfase = ENFASE_PAPEL[papel] || ENFASE_PAPEL.investigador;
    var rank = camadaRank(camada);

    var widgets = [];
    /* Sempre: mesmas hipóteses e mesmos campos (invariância). */
    widgets.push({
      kind: "hypothesisList",
      density: rank === 0 ? "raw" : "structured",
      keys: hips.map(function (h) { return h.id; }),
      items: hips
    });
    widgets.push({
      kind: "decisionFields",
      keys: campos.map(function (c) { return c.id; }),
      fields: campos,
      required: true
    });

    if (rank >= 1) {
      widgets.push({ kind: "compareSlots", slots: ["A", "B", "C"], fillByPlayer: true });
      widgets.push({ kind: "favorAgainst", buckets: ["favor", "contra"], fillByPlayer: true });
      widgets.push({ kind: "unexaminedMarker", label: "Ainda não examinadas" });
      if (papel === "arquivista") {
        widgets.push({ kind: "classifyBuckets", buckets: ["fatos", "interpretacoes", "duvidas"] });
      }
      if (papel === "cronista") {
        widgets.push({ kind: "timelineScaffold", slots: ["sequencia", "lacunas", "horarios"] });
      }
      if (papel === "cetico") {
        widgets.push({ kind: "objectionSlot", label: "Outra explicação possível" });
      }
      if (papel === "decisor") {
        widgets.push({ kind: "justificativa", label: "Justificativa da decisão" });
      }
    }

    var prompts = [];
    if (rank >= 2) {
      var MPC = global.MosaicoPapelCamada;
      if (MPC && MPC.SOCRATICAS && MPC.SOCRATICAS[papel]) {
        prompts = MPC.SOCRATICAS[papel].slice();
      } else {
        prompts = defaultSocraticas(papel);
      }
      widgets.push({ kind: "socraticPrompts", prompts: prompts, progressive: true });
      widgets.push({ kind: "coherenceCheck", label: "Checagem de coerência (processo)", systemVerdict: false });
    }

    return {
      caso: caso,
      partidaId: partidaId || null,
      papel: papel,
      camada: camada,
      rank: rank,
      enfase: enfase,
      hypothesisKeys: hips.map(function (h) { return h.id; }),
      decisionFieldKeys: campos.map(function (c) { return c.id; }),
      widgets: widgets,
      prompts: prompts,
      affordances: countAffordancesFromWidgets(widgets, rank)
    };
  }

  function defaultSocraticas(papel) {
    var map = {
      investigador: [
        "Qual evidência sustenta sua hipótese?",
        "Esta evidência prova ou apenas é compatível?",
        "Há pistas ainda não examinadas que mudariam o quadro?"
      ],
      cetico: [
        "O que teria de ser verdadeiro para essa hipótese funcionar?",
        "Existe outra explicação para os mesmos fatos?",
        "O que não encaixa na leitura dominante?"
      ],
      arquivista: [
        "Isso foi observado ou inferido?",
        "Há itens ainda sem classificação?",
        "Existe conflito entre duas classificações?"
      ],
      cronista: [
        "Há uma lacuna nesta sequência?",
        "A ordem desses eventos é compatível?",
        "Esse horário é confirmado ou estimado?"
      ],
      decisor: [
        "Qual hipótese explica mais fatos?",
        "Qual exige mais suposições?",
        "O que permanece sem explicação?"
      ]
    };
    return map[papel] || map.investigador;
  }

  function countAffordancesFromWidgets(widgets, rank) {
    var n = 0;
    widgets.forEach(function (w) {
      if (w.kind === "hypothesisList") n += 1;
      if (w.kind === "decisionFields") n += 1;
      if (w.kind === "compareSlots") n += (w.slots || []).length;
      if (w.kind === "favorAgainst") n += (w.buckets || []).length;
      if (w.kind === "unexaminedMarker") n += 1;
      if (w.kind === "classifyBuckets") n += (w.buckets || []).length;
      if (w.kind === "timelineScaffold") n += (w.slots || []).length;
      if (w.kind === "objectionSlot") n += 1;
      if (w.kind === "justificativa") n += 1;
      if (w.kind === "socraticPrompts") n += (w.prompts || []).length;
      if (w.kind === "coherenceCheck") n += 1;
    });
    return n;
  }

  function affordancesCount(caso, papel, camada, partidaId) {
    return presentation({ caso: caso, papel: papel, camada: camada, partidaId: partidaId }).affordances;
  }

  function containsForbidden(text) {
    var s = String(text || "");
    return FORBIDDEN.some(function (re) { return re.test(s); });
  }

  function assertNoForbidden(text) {
    if (containsForbidden(text)) {
      throw new Error("Texto viola regra MOSAICO (probabilidade / ranking de solução): " + String(text).slice(0, 120));
    }
    return true;
  }

  /**
   * HTML do painel de hipóteses/decisão com densidade da camada.
   * Liga opções reais do catálogo (não inventa segunda chave de solução).
   * state opcional: { hipoteseId, notas:{}, selecionados:{}, partidaId }
   */
  function htmlPainel(opts) {
    opts = opts || {};
    var pres = presentation(opts);
    var state = opts.state || {};
    var hipSel = state.hipoteseId || "";
    var parts = [];

    parts.push('<section class="hpc-painel" data-hpc-painel data-hpc-caso="' + esc(pres.caso) +
      '" data-hpc-camada="' + esc(pres.camada) + '" data-hpc-papel="' + esc(pres.papel) +
      '" data-hpc-rank="' + pres.rank + '">');

    parts.push('<header class="hpc-head"><b>Hipóteses · ' + esc(labelCamada(pres.camada)) +
      '</b><span class="hpc-enfase">Ênfase: ' + esc(pres.enfase.primario) + "</span></header>");

    var omitList = !!opts.omitHypothesisList;
    var omitFields = !!opts.omitDecisionFields;
    var items = (pres.widgets[0] && pres.widgets[0].items) || hypothesisOptions(pres.caso);

    /* Lista de hipóteses — sempre as mesmas keys (omitível se o jogo já as mostra). */
    if (!omitList) {
      if (pres.rank === 0) {
        parts.push('<div class="hpc-lista hpc-raw" data-hpc-widget="hypothesisList">');
        items.forEach(function (h) {
          var on = hipSel === h.id ? " on" : "";
          parts.push('<label class="hpc-hip' + on + '"><input type="radio" name="hpc-hip" value="' +
            esc(h.id) + '"' + (hipSel === h.id ? " checked" : "") + "> <strong>" +
            esc(h.id) + " · " + esc(h.t) + "</strong><small>" + esc(h.d) + "</small></label>");
        });
        parts.push("</div>");
      } else {
        parts.push('<div class="hpc-lista hpc-structured" data-hpc-widget="hypothesisList">');
        items.forEach(function (h) {
          var on = hipSel === h.id ? " on" : "";
          parts.push('<label class="hpc-hip' + on + '" data-hpc-hip="' + esc(h.id) +
            '"><input type="radio" name="hpc-hip" value="' + esc(h.id) + '"' +
            (hipSel === h.id ? " checked" : "") + "> <strong>" + esc(h.id) + " · " +
            esc(h.t) + "</strong><small>" + esc(h.d) + "</small>" +
            '<span class="hpc-tag-unex" data-hpc-unexamined hidden>não examinada</span></label>');
        });
        parts.push("</div>");
      }
    }

    if (pres.rank >= 1) {
      parts.push('<div class="hpc-compare" data-hpc-widget="compareSlots">');
      ["A", "B", "C"].forEach(function (slot) {
        parts.push('<div class="hpc-slot" data-hpc-compare="' + slot + '"><b>Hipótese ' + slot +
          '</b><select data-hpc-compare-sel="' + slot + '"><option value="">—</option>' +
          hypothesisOptions(pres.caso).map(function (h) {
            return '<option value="' + esc(h.id) + '">' + esc(h.id) + " · " + esc(h.t) + "</option>";
          }).join("") + "</select></div>");
      });
      parts.push("</div>");

      parts.push('<div class="hpc-buckets" data-hpc-widget="favorAgainst">' +
        '<div class="hpc-slot" data-hpc-bucket="favor"><b>A favor</b>' +
        '<textarea rows="2" placeholder="Evidências que você vincula…" data-hpc-note="favor"></textarea></div>' +
        '<div class="hpc-slot" data-hpc-bucket="contra"><b>Contra</b>' +
        '<textarea rows="2" placeholder="Evidências que tensionam…" data-hpc-note="contra"></textarea></div>' +
        "</div>");

      parts.push('<div class="hpc-unex" data-hpc-widget="unexaminedMarker">' +
        "<b>Ainda não examinadas</b><p>Marque hipóteses que você ainda não testou. O sistema não ranqueia.</p></div>");

      /* Ênfase por papel — mesmas hipóteses; ferramentas diferentes em destaque. */
      if (pres.papel === "arquivista") {
        parts.push('<div class="hpc-buckets" data-hpc-widget="classifyBuckets">' +
          ["fatos","interpretacoes","duvidas"].map(function (b) {
            var lab = ({ fatos: "Fatos", interpretacoes: "Interpretações", duvidas: "Dúvidas" })[b];
            return '<div class="hpc-slot" data-hpc-bucket="' + b + '"><b>' + lab +
              '</b><textarea rows="2" placeholder="Classifique aqui…" data-hpc-note="' + b + '"></textarea></div>';
          }).join("") + "</div>");
      }
      if (pres.papel === "cronista") {
        parts.push('<div class="hpc-buckets" data-hpc-widget="timelineScaffold" style="grid-template-columns:1fr">' +
          [["sequencia","Linha do tempo / sequência"],["lacunas","Lacunas temporais"],["horarios","Horários confirmados × estimados"]].map(function (pair) {
            return '<div class="hpc-slot" data-hpc-bucket="' + pair[0] + '"><b>' + pair[1] +
              '</b><textarea rows="2" placeholder="Organize aqui…" data-hpc-note="' + pair[0] + '"></textarea></div>';
          }).join("") + "</div>");
      }
      if (pres.papel === "cetico") {
        parts.push('<div class="hpc-slot" data-hpc-widget="objectionSlot"><b>Outra explicação possível</b>' +
          '<textarea rows="2" placeholder="Explicação concorrente…" data-hpc-note="outra"></textarea></div>');
      }
      if (pres.papel === "decisor") {
        parts.push('<div class="hpc-slot" data-hpc-widget="justificativa"><b>Justificativa da decisão</b>' +
          '<textarea rows="2" placeholder="Por que esta leitura?" data-hpc-note="justificativa"></textarea></div>');
      }
    }

    /* Campos de decisão — sempre as mesmas opções (omitível se o jogo já os mostra). */
    var campos = omitFields ? [] : decisionFields(pres.caso, opts.partidaId);
    if (campos.length) {
      parts.push('<div class="hpc-campos" data-hpc-widget="decisionFields">');
      parts.push("<b>Campos da decisão</b>");
      campos.forEach(function (c) {
        var cur = (state.selecionados && state.selecionados[c.id]) || "";
        parts.push('<label class="hpc-campo" data-hpc-campo="' + esc(c.id) + '"><span>' +
          esc(c.rotulo) + '</span><select name="' + esc(c.id) + '" data-hpc-field="' +
          esc(c.id) + '"><option value="">Selecione…</option>' +
          c.opcoes.map(function (o) {
            return "<option" + (o === cur ? " selected" : "") + ">" + esc(o) + "</option>";
          }).join("") + "</select></label>");
      });
      parts.push("</div>");
    }

    if (pres.rank >= 2 && pres.prompts.length) {
      parts.push('<div class="hpc-socratic" data-hpc-widget="socraticPrompts" data-hpc-qi="0">' +
        "<b>Mestre socrático</b><p class=\"hpc-q\">" + esc(pres.prompts[0]) + "</p>" +
        '<div class="hpc-prog"><button type="button" data-hpc-prev>Anterior</button>' +
        '<button type="button" data-hpc-next>Próxima pergunta</button></div>' +
        '<div class="hpc-coerencia" data-hpc-widget="coherenceCheck">' +
        "<small>Checagem de coerência: você vinculou evidência? Há hipótese concorrente anotada? " +
        "(Sem veredito automático.)</small></div></div>");
    }

    parts.push("</section>");
    var html = parts.join("");
    assertNoForbidden(html);
    return html;
  }

  function labelCamada(id) {
    return ({ livre: "Livre", assistida: "Assistida", guiada: "Guiada" })[id] || id;
  }

  function ligarPainel(raiz, opts) {
    if (!raiz) return;
    var mestre = raiz.querySelector("[data-hpc-widget='socraticPrompts']");
    if (!mestre) return;
    var prompts = (presentation(opts).prompts) || [];
    function pintar() {
      var i = Number(mestre.getAttribute("data-hpc-qi") || 0);
      var p = mestre.querySelector(".hpc-q");
      if (p) p.textContent = prompts[i] || prompts[0] || "";
    }
    var next = mestre.querySelector("[data-hpc-next]");
    var prev = mestre.querySelector("[data-hpc-prev]");
    if (next) next.addEventListener("click", function () {
      var i = Number(mestre.getAttribute("data-hpc-qi") || 0);
      mestre.setAttribute("data-hpc-qi", String(Math.min(prompts.length - 1, i + 1)));
      pintar();
    });
    if (prev) prev.addEventListener("click", function () {
      var i = Number(mestre.getAttribute("data-hpc-qi") || 0);
      mestre.setAttribute("data-hpc-qi", String(Math.max(0, i - 1)));
      pintar();
    });
  }

  function cssHpc() {
    return [
      ".hpc-painel{margin:12px 0;padding:12px 14px;border:1px solid rgba(232,169,74,.28);border-radius:12px;background:rgba(8,12,16,.72);color:#e6edf2;font-family:Inter,system-ui,sans-serif}",
      ".hpc-head{display:flex;flex-wrap:wrap;gap:8px;justify-content:space-between;align-items:baseline;margin-bottom:10px}",
      ".hpc-head b{font:700 12px Inter,system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#e8a94a}",
      ".hpc-enfase{font-size:11px;color:#9eafb8}",
      ".hpc-lista{display:grid;gap:8px}",
      ".hpc-hip{display:block;padding:10px 12px;border:1px solid #344750;border-radius:10px;background:#0a1419;cursor:pointer}",
      ".hpc-hip.on{border-color:#e8a94a;background:#25190e}",
      ".hpc-hip strong{display:block;font-size:14px}",
      ".hpc-hip small{display:block;margin-top:4px;color:#9eafb8;font-size:12px;line-height:1.35}",
      ".hpc-compare,.hpc-buckets,.hpc-campos{display:grid;gap:8px;margin-top:12px}",
      ".hpc-compare{grid-template-columns:repeat(3,1fr)}",
      ".hpc-buckets{grid-template-columns:1fr 1fr}",
      ".hpc-slot,.hpc-campo{padding:10px;border:1px dashed #3a4c56;border-radius:8px;background:#0a1318}",
      ".hpc-slot b,.hpc-campo span,.hpc-campos>b,.hpc-unex b,.hpc-socratic b{display:block;font-size:12px;color:#afc8d5;letter-spacing:.08em;text-transform:uppercase;margin-bottom:6px}",
      ".hpc-slot textarea,.hpc-slot select,.hpc-campo select{width:100%;border:0;background:transparent;color:#e6edf2;font:500 14px Inter,system-ui,sans-serif}",
      ".hpc-unex{margin-top:10px;padding:8px 10px;border-left:3px solid #5a7a8a;background:#0a1216;border-radius:6px;font-size:13px;color:#b7c6ce}",
      ".hpc-socratic{margin-top:12px;padding:10px 12px;border-left:3px solid #70d6a0;background:#0a1814;border-radius:8px}",
      ".hpc-socratic .hpc-q{margin:6px 0;color:#c5d8cf;font-size:14px;line-height:1.45}",
      ".hpc-prog{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}",
      ".hpc-prog button{border:1px solid #3d6a55;background:#102820;color:#bde8d0;border-radius:7px;padding:6px 10px;font-weight:700;cursor:pointer;font-size:12px}",
      ".hpc-coerencia{margin-top:8px;color:#8aa89a;font-size:12px}",
      ".hpc-tag-unex{display:inline-block;margin-top:4px;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#c9b48a}",
      "@media(max-width:640px){.hpc-compare,.hpc-buckets{grid-template-columns:1fr}}"
    ].join("");
  }

  function injetarCss() {
    if (typeof document === "undefined" || !document.createElement) return;
    if (document.getElementById("mosaico-hipoteses-camada-css")) return;
    var st = document.createElement("style");
    st.id = "mosaico-hipoteses-camada-css";
    st.textContent = cssHpc();
    document.head.appendChild(st);
  }

  /**
   * Aplica / troca o painel conforme camada.
   * Substitui stubs vazios do andaime MVP quando há catálogo.
   */
  function aplicarPainel(opts) {
    opts = opts || {};
    injetarCss();
    var alvo = typeof opts.alvo === "string"
      ? (typeof document !== "undefined" ? document.querySelector(opts.alvo) : null)
      : opts.alvo;
    if (!alvo) return null;
    var existente = alvo.querySelector("[data-hpc-painel]");
    if (existente) existente.remove();
    var html = htmlPainel(opts);
    alvo.insertAdjacentHTML(opts.pos || "afterbegin", html);
    ligarPainel(alvo, opts);
    return presentation(opts);
  }

  /** Invariância: mesmas keys em todas as camadas para um caso/partida. */
  function invarianceReport(caso, partidaId) {
    var cams = ["livre", "assistida", "guiada"];
    var baseH = hypothesisKeys(caso);
    var baseD = decisionFieldKeys(caso, partidaId);
    var ok = true;
    var detail = [];
    cams.forEach(function (cam) {
      var p = presentation({ caso: caso, camada: cam, partidaId: partidaId, papel: "investigador" });
      var sameH = p.hypothesisKeys.join(",") === baseH.join(",");
      var sameD = p.decisionFieldKeys.join(",") === baseD.join(",");
      if (!sameH || !sameD) ok = false;
      detail.push({ camada: cam, sameHypotheses: sameH, sameFields: sameD, affordances: p.affordances });
    });
    return { ok: ok, hypothesisKeys: baseH, decisionFieldKeys: baseD, layers: detail };
  }

  global.MosaicoHipotesesCamada = {
    CATALOG: CATALOG,
    FORBIDDEN: FORBIDDEN,
    ENFASE_PAPEL: ENFASE_PAPEL,
    normalizarCaso: normalizarCaso,
    casoModel: casoModel,
    partidaIds: partidaIds,
    partidaModel: partidaModel,
    hypothesisKeys: hypothesisKeys,
    hypothesisOptions: hypothesisOptions,
    decisionFields: decisionFields,
    decisionFieldKeys: decisionFieldKeys,
    presentation: presentation,
    affordancesCount: affordancesCount,
    containsForbidden: containsForbidden,
    assertNoForbidden: assertNoForbidden,
    htmlPainel: htmlPainel,
    ligarPainel: ligarPainel,
    aplicarPainel: aplicarPainel,
    injetarCss: injetarCss,
    invarianceReport: invarianceReport,
    camadaRank: camadaRank
  };
})(typeof window !== "undefined" ? window : globalThis);
