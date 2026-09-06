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

  var STORAGE_SCAFFOLD = "mosaico_hpc_scaffold";

  function emptyScaffoldState() {
    return {
      compare: { A: "", B: "", C: "" },
      notes: {
        favor: "",
        contra: "",
        outra: "",
        justificativa: "",
        fatos: "",
        interpretacoes: "",
        duvidas: "",
        sequencia: "",
        lacunas: "",
        horarios: "",
        relacionadas: "",
        hipotese: ""
      },
      unexamined: {},
      linkedEvidence: "",
      events: [],
      socratic: { index: 0, acknowledged: [], answers: {} },
      hipoteseId: "",
      selecionados: {}
    };
  }

  function normalizeScaffoldState(raw) {
    var base = emptyScaffoldState();
    if (!raw || typeof raw !== "object") return base;
    var cmp = raw.compare || {};
    base.compare = {
      A: String(cmp.A || ""),
      B: String(cmp.B || ""),
      C: String(cmp.C || "")
    };
    var notes = raw.notes || {};
    Object.keys(base.notes).forEach(function (k) {
      base.notes[k] = String(notes[k] != null ? notes[k] : "");
    });
    /* Compat: buckets antigos como texto único. */
    if (!base.notes.favor && raw.buckets && raw.buckets.favor) {
      base.notes.favor = Array.isArray(raw.buckets.favor)
        ? raw.buckets.favor.join("\n")
        : String(raw.buckets.favor);
    }
    if (!base.notes.contra && raw.buckets && (raw.buckets.contra || raw.buckets.against)) {
      var ag = raw.buckets.contra || raw.buckets.against;
      base.notes.contra = Array.isArray(ag) ? ag.join("\n") : String(ag);
    }
    base.unexamined = {};
    if (raw.unexamined && typeof raw.unexamined === "object") {
      Object.keys(raw.unexamined).forEach(function (id) {
        if (raw.unexamined[id]) base.unexamined[id] = true;
      });
    }
    base.linkedEvidence = String(raw.linkedEvidence != null ? raw.linkedEvidence : "");
    base.events = Array.isArray(raw.events)
      ? raw.events.map(function (e) { return String(e || ""); }).filter(Boolean)
      : [];
    var soc = raw.socratic || {};
    base.socratic = {
      index: Math.max(0, Number(soc.index) || 0),
      acknowledged: Array.isArray(soc.acknowledged)
        ? soc.acknowledged.map(Number).filter(function (n) { return n === n; })
        : [],
      answers: {}
    };
    if (soc.answers && typeof soc.answers === "object") {
      Object.keys(soc.answers).forEach(function (k) {
        base.socratic.answers[String(k)] = String(soc.answers[k] || "");
      });
    }
    base.hipoteseId = String(raw.hipoteseId || "");
    base.selecionados = {};
    if (raw.selecionados && typeof raw.selecionados === "object") {
      Object.keys(raw.selecionados).forEach(function (k) {
        base.selecionados[k] = String(raw.selecionados[k] || "");
      });
    }
    return base;
  }

  function scaffoldStorageKey(caso, opts) {
    opts = opts || {};
    var c = normalizarCaso(caso);
    var p = opts.partidaId ? String(opts.partidaId) : "_";
    var player = opts.playerId ? String(opts.playerId) : "local";
    return STORAGE_SCAFFOLD + ":" + c + ":" + p + ":" + player;
  }

  function carregarScaffold(caso, opts) {
    opts = opts || {};
    try {
      if (typeof localStorage === "undefined") return normalizeScaffoldState(opts.state);
      var key = scaffoldStorageKey(caso, opts);
      var raw = localStorage.getItem(key);
      if (!raw && opts.fallbackShared) {
        raw = localStorage.getItem(scaffoldStorageKey(caso, {
          partidaId: opts.partidaId,
          playerId: "local"
        }));
      }
      if (!raw) return normalizeScaffoldState(opts.state);
      var parsed = JSON.parse(raw);
      var merged = normalizeScaffoldState(parsed);
      if (opts.state) {
        var overlay = normalizeScaffoldState(opts.state);
        if (overlay.hipoteseId) merged.hipoteseId = overlay.hipoteseId;
        Object.keys(overlay.selecionados || {}).forEach(function (k) {
          if (overlay.selecionados[k]) merged.selecionados[k] = overlay.selecionados[k];
        });
      }
      return merged;
    } catch (e) {
      return normalizeScaffoldState(opts.state);
    }
  }

  function salvarScaffold(caso, state, opts) {
    opts = opts || {};
    var normalized = normalizeScaffoldState(state);
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(scaffoldStorageKey(caso, opts), JSON.stringify(normalized));
      }
    } catch (err) { /* quota / private mode */ }
    return normalized;
  }

  /** Patch leve para campos do jogador na sala (quando o multiplayer expuser hooks). */
  function roomPlayerFields(state) {
    var s = normalizeScaffoldState(state);
    var metrics = processMetrics(s);
    return {
      hpcScaffold: {
        compare: s.compare,
        unexaminedCount: metrics.unexaminedCount,
        favorLines: metrics.favorLines,
        againstLines: metrics.againstLines,
        compareFilled: metrics.compareFilled,
        socraticAnswered: metrics.socraticAnswered,
        organizedComparison: metrics.organizedComparison
      }
    };
  }

  function countLines(text) {
    return String(text || "")
      .split(/\n+/)
      .map(function (l) { return l.trim(); })
      .filter(Boolean).length;
  }

  /**
   * Métricas de processo (trabalho do jogador) — nunca inferem a resposta.
   * Ex.: evidências vinculadas: 5, contradições: 2, hipóteses em comparação: 3.
   */
  function processMetrics(state) {
    var s = normalizeScaffoldState(state);
    var filled = ["A", "B", "C"].filter(function (k) { return !!s.compare[k]; });
    var labels = filled.map(function (k) {
      return k + (s.compare[k] ? ("=" + s.compare[k]) : "");
    });
    var favorLines = countLines(s.notes.favor) + countLines(s.linkedEvidence);
    var againstLines = countLines(s.notes.contra);
    var unexaminedCount = Object.keys(s.unexamined).filter(function (id) {
      return s.unexamined[id];
    }).length;
    var classLines =
      countLines(s.notes.fatos) +
      countLines(s.notes.interpretacoes) +
      countLines(s.notes.duvidas);
    var timelineLines =
      countLines(s.notes.sequencia) +
      countLines(s.notes.lacunas) +
      countLines(s.notes.horarios) +
      s.events.length;
    var socraticAnswered = Object.keys(s.socratic.answers).filter(function (k) {
      return String(s.socratic.answers[k] || "").trim();
    }).length;
    var hasJustification = !!String(s.notes.justificativa || "").trim();
    var organizedComparison =
      filled.length >= 2 && (favorLines + againstLines >= 1 || hasJustification);
    return {
      compareFilled: filled.length,
      compareIds: filled.map(function (k) { return s.compare[k]; }),
      compareSummary: labels.join(" · ") || "—",
      favorLines: favorLines,
      againstLines: againstLines,
      unexaminedCount: unexaminedCount,
      classLines: classLines,
      timelineLines: timelineLines,
      socraticAnswered: socraticAnswered,
      socraticAcknowledged: (s.socratic.acknowledged || []).length,
      hasJustification: hasJustification,
      organizedComparison: organizedComparison,
      /* Snippet seguro para telão — só contagens, sem ids de hipótese. */
      telaoSnippet: filled.length
        ? (filled.length + " hipóteses em comparação")
        : ""
    };
  }

  function htmlRelatorioProcesso(state, opts) {
    opts = opts || {};
    var s = normalizeScaffoldState(state);
    var m = processMetrics(s);
    if (m.compareFilled === 0 && m.favorLines === 0 && m.againstLines === 0 &&
        m.unexaminedCount === 0 && m.classLines === 0 && m.timelineLines === 0 &&
        m.socraticAnswered === 0 && !m.hasJustification) {
      return "";
    }
    var hips = {};
    try {
      hypothesisOptions(opts.caso || "").forEach(function (h) { hips[h.id] = h.t; });
    } catch (e) { /* ignore */ }
    function slotLabel(letter) {
      var id = s.compare[letter];
      if (!id) return letter + ": —";
      var t = hips[id] || id;
      return letter + ": " + id + (t && t !== id ? (" · " + t) : "");
    }
    var parts = [];
    parts.push('<article class="ending-card depth-card hpc-processo" data-hpc-processo>');
    parts.push("<small>PROCESSO · COMPARAÇÃO A/B/C</small>");
    parts.push("<h3>" + esc(String(m.compareFilled)) + " em comparação</h3>");
    parts.push("<p>" + esc(slotLabel("A")) + "<br>" + esc(slotLabel("B")) + "<br>" + esc(slotLabel("C")) + "</p>");
    parts.push("<p><b>A favor:</b> " + m.favorLines + " · <b>Contra:</b> " + m.againstLines);
    if (m.unexaminedCount) parts.push(" · <b>Não examinadas:</b> " + m.unexaminedCount);
    if (m.classLines) parts.push(" · <b>Classificações:</b> " + m.classLines);
    if (m.timelineLines) parts.push(" · <b>Linha temporal:</b> " + m.timelineLines);
    if (m.socraticAnswered) parts.push(" · <b>Prompts respondidos:</b> " + m.socraticAnswered);
    if (m.hasJustification) parts.push(" · <b>Justificativa:</b> sim");
    parts.push("</p>");
    if (m.organizedComparison) {
      parts.push("<p><em>Comparação organizada pelo jogador (métrica de processo — sem ranquear hipóteses).</em></p>");
    }
    parts.push("</article>");
    var html = parts.join("");
    assertNoForbidden(html);
    return html;
  }

  /** Guiada + Decisor: justificativa curta obrigatória antes de confirmar. */
  function canConfirmGuiada(state, opts) {
    opts = opts || {};
    if ((opts.camada || "livre") !== "guiada") return { ok: true };
    if ((opts.papel || "") !== "decisor") return { ok: true };
    var s = normalizeScaffoldState(state);
    if (String(s.notes.justificativa || "").trim().length >= 3) return { ok: true };
    return {
      ok: false,
      reason: "Na camada Guiada, o Decisor precisa de uma justificativa curta antes de confirmar."
    };
  }

  /**
   * HTML do painel de hipóteses/decisão com densidade da camada.
   * Liga opções reais do catálogo (não inventa segunda chave de solução).
   * state opcional: scaffold completo ou { hipoteseId, notas:{}, selecionados:{}, partidaId }
   */
  function htmlPainel(opts) {
    opts = opts || {};
    var pres = presentation(opts);
    var state = normalizeScaffoldState(opts.state || {});
    if (opts.state && opts.state.hipoteseId) state.hipoteseId = String(opts.state.hipoteseId);
    if (opts.state && opts.state.selecionados) {
      Object.keys(opts.state.selecionados).forEach(function (k) {
        state.selecionados[k] = String(opts.state.selecionados[k] || "");
      });
    }
    /* Compat notas soltas do MVP. */
    if (opts.state && opts.state.notas) {
      Object.keys(opts.state.notas).forEach(function (k) {
        if (state.notes[k] != null) state.notes[k] = String(opts.state.notas[k] || "");
      });
    }
    var hipSel = state.hipoteseId || "";
    var parts = [];
    var hideChrome = pres.rank === 0;

    parts.push('<section class="hpc-painel" data-hpc-painel data-hpc-caso="' + esc(pres.caso) +
      '" data-hpc-camada="' + esc(pres.camada) + '" data-hpc-papel="' + esc(pres.papel) +
      '" data-hpc-rank="' + pres.rank + '"' +
      (hideChrome ? ' data-hpc-livre="1"' : "") + ">");

    if (!hideChrome) {
      parts.push('<header class="hpc-head"><b>Hipóteses · ' + esc(labelCamada(pres.camada)) +
        '</b><span class="hpc-enfase">Ênfase: ' + esc(pres.enfase.primario) + "</span></header>");
    } else {
      parts.push('<header class="hpc-head hpc-head-livre"><b>Hipóteses · Livre</b></header>');
    }

    var omitList = !!opts.omitHypothesisList;
    var omitFields = !!opts.omitDecisionFields;
    var items = (pres.widgets[0] && pres.widgets[0].items) || hypothesisOptions(pres.caso);

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
          var unex = !!state.unexamined[h.id];
          parts.push('<label class="hpc-hip' + on + (unex ? " hpc-unex-on" : "") +
            '" data-hpc-hip="' + esc(h.id) +
            '"><input type="radio" name="hpc-hip" value="' + esc(h.id) + '"' +
            (hipSel === h.id ? " checked" : "") + "> <strong>" + esc(h.id) + " · " +
            esc(h.t) + "</strong><small>" + esc(h.d) + "</small>" +
            '<button type="button" class="hpc-unex-btn" data-hpc-toggle-unexamined="' +
            esc(h.id) + '" aria-pressed="' + (unex ? "true" : "false") + '">' +
            (unex ? "não examinada ✓" : "marcar não examinada") +
            "</button></label>");
        });
        parts.push("</div>");
      }
    }

    /* Livre: sem chrome de andaime (compare / buckets / socrático). */
    if (pres.rank >= 1) {
      parts.push('<div class="hpc-compare" data-hpc-widget="compareSlots">');
      ["A", "B", "C"].forEach(function (slot) {
        var cur = state.compare[slot] || "";
        parts.push('<div class="hpc-slot" data-hpc-compare="' + slot + '"><b>Hipótese ' + slot +
          '</b><select data-hpc-compare-sel="' + slot + '"><option value="">—</option>' +
          hypothesisOptions(pres.caso).map(function (h) {
            return '<option value="' + esc(h.id) + '"' + (cur === h.id ? " selected" : "") +
              ">" + esc(h.id) + " · " + esc(h.t) + "</option>";
          }).join("") +
          '<option value="__livre__"' + (cur && hypothesisKeys(pres.caso).indexOf(cur) < 0 ? " selected" : "") +
          ">rótulo livre…</option></select>" +
          '<input type="text" class="hpc-compare-livre" data-hpc-compare-livre="' + slot +
          '" placeholder="Rótulo livre" value="' +
          esc(cur && hypothesisKeys(pres.caso).indexOf(cur) < 0 ? cur : "") +
          '"' + (cur && hypothesisKeys(pres.caso).indexOf(cur) < 0 ? "" : " hidden") +
          "></div>");
      });
      parts.push("</div>");

      parts.push('<div class="hpc-buckets" data-hpc-widget="favorAgainst">' +
        '<div class="hpc-slot" data-hpc-bucket="favor"><b>A favor</b>' +
        '<textarea rows="2" placeholder="Evidências que você vincula…" data-hpc-note="favor">' +
        esc(state.notes.favor) + "</textarea></div>" +
        '<div class="hpc-slot" data-hpc-bucket="contra"><b>Contra</b>' +
        '<textarea rows="2" placeholder="Evidências que tensionam…" data-hpc-note="contra">' +
        esc(state.notes.contra) + "</textarea></div>" +
        "</div>");

      parts.push('<div class="hpc-unex" data-hpc-widget="unexaminedMarker">' +
        "<b>Ainda não examinadas</b><p>Marque hipóteses que você ainda não testou. O sistema não ranqueia. " +
        "<span data-hpc-unex-count>" + Object.keys(state.unexamined).filter(function (k) {
          return state.unexamined[k];
        }).length + "</span> marcadas.</p></div>");

      /* Ênfase por papel — mesmas hipóteses; ferramentas diferentes em destaque. */
      if (pres.papel === "investigador") {
        parts.push('<div class="hpc-slot" data-hpc-widget="linkedEvidence"><b>Hipótese + evidências vinculadas</b>' +
          '<textarea rows="2" placeholder="Liste evidências ligadas à hipótese…" data-hpc-note="relacionadas">' +
          esc(state.notes.relacionadas || state.linkedEvidence) + "</textarea></div>");
      }
      if (pres.papel === "arquivista") {
        parts.push('<div class="hpc-buckets" data-hpc-widget="classifyBuckets">' +
          ["fatos", "interpretacoes", "duvidas"].map(function (b) {
            var lab = ({ fatos: "Fatos", interpretacoes: "Interpretações", duvidas: "Dúvidas" })[b];
            return '<div class="hpc-slot" data-hpc-bucket="' + b + '"><b>' + lab +
              '</b><textarea rows="2" placeholder="Classifique aqui…" data-hpc-note="' + b + '">' +
              esc(state.notes[b] || "") + "</textarea></div>";
          }).join("") + "</div>");
      }
      if (pres.papel === "cronista") {
        var evText = state.events.length
          ? state.events.join("\n")
          : (state.notes.sequencia || "");
        parts.push('<div class="hpc-buckets" data-hpc-widget="timelineScaffold" style="grid-template-columns:1fr">' +
          '<div class="hpc-slot" data-hpc-bucket="sequencia"><b>Linha do tempo / sequência (uma por linha)</b>' +
          '<textarea rows="3" placeholder="1. …&#10;2. …" data-hpc-note="sequencia">' +
          esc(evText) + "</textarea></div>" +
          '<div class="hpc-slot" data-hpc-bucket="lacunas"><b>Lacunas temporais</b>' +
          '<textarea rows="2" placeholder="Onde falta elo…" data-hpc-note="lacunas">' +
          esc(state.notes.lacunas) + "</textarea></div>" +
          '<div class="hpc-slot" data-hpc-bucket="horarios"><b>Horários confirmados × estimados</b>' +
          '<textarea rows="2" placeholder="Confirmado / estimado…" data-hpc-note="horarios">' +
          esc(state.notes.horarios) + "</textarea></div></div>");
      }
      if (pres.papel === "cetico") {
        parts.push('<div class="hpc-slot" data-hpc-widget="objectionSlot"><b>Outra explicação possível</b>' +
          '<textarea rows="2" placeholder="Explicação concorrente…" data-hpc-note="outra">' +
          esc(state.notes.outra) + "</textarea></div>");
      }
      if (pres.papel === "decisor") {
        var req = pres.rank >= 2 ? ' required data-hpc-required="1"' : "";
        parts.push('<div class="hpc-slot" data-hpc-widget="justificativa"><b>Justificativa da decisão' +
          (pres.rank >= 2 ? " (obrigatória na Guiada)" : "") + "</b>" +
          '<textarea rows="2" placeholder="Por que esta leitura?" data-hpc-note="justificativa"' +
          req + ">" + esc(state.notes.justificativa) + "</textarea></div>");
      }
    }

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
      var qi = Math.min(pres.prompts.length - 1, Math.max(0, state.socratic.index || 0));
      var ans = state.socratic.answers[String(qi)] || "";
      var ack = (state.socratic.acknowledged || []).indexOf(qi) >= 0;
      parts.push('<div class="hpc-socratic" data-hpc-widget="socraticPrompts" data-hpc-qi="' + qi + '">' +
        "<b>Mestre socrático</b><p class=\"hpc-q\">" + esc(pres.prompts[qi] || pres.prompts[0]) + "</p>" +
        '<label class="hpc-soc-ans">Sua anotação (curta)' +
        '<textarea rows="2" data-hpc-socratic-ans placeholder="Resposta de processo…">' +
        esc(ans) + "</textarea></label>" +
        '<label class="hpc-soc-ack"><input type="checkbox" data-hpc-socratic-ack"' +
        (ack ? " checked" : "") + "> Marquei esta pergunta como considerada</label>" +
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

  function lerEstadoDoPainel(raiz) {
    if (!raiz) return emptyScaffoldState();
    var painel = raiz.querySelector("[data-hpc-painel]") || raiz;
    var state = emptyScaffoldState();
    var hip = painel.querySelector('input[name="hpc-hip"]:checked');
    if (hip) state.hipoteseId = hip.value;
    ["A", "B", "C"].forEach(function (slot) {
      var sel = painel.querySelector('[data-hpc-compare-sel="' + slot + '"]');
      var livre = painel.querySelector('[data-hpc-compare-livre="' + slot + '"]');
      var v = sel ? sel.value : "";
      if (v === "__livre__" || (livre && !livre.hidden && livre.value.trim())) {
        state.compare[slot] = (livre && livre.value.trim()) || "";
      } else {
        state.compare[slot] = v || "";
      }
    });
    painel.querySelectorAll("[data-hpc-note]").forEach(function (ta) {
      var k = ta.getAttribute("data-hpc-note");
      if (k && state.notes[k] != null) state.notes[k] = ta.value;
      if (k === "relacionadas") state.linkedEvidence = ta.value;
      if (k === "sequencia") {
        state.events = String(ta.value || "").split(/\n+/).map(function (l) {
          return l.trim();
        }).filter(Boolean);
      }
    });
    painel.querySelectorAll("[data-hpc-toggle-unexamined]").forEach(function (btn) {
      var id = btn.getAttribute("data-hpc-toggle-unexamined");
      if (btn.getAttribute("aria-pressed") === "true") state.unexamined[id] = true;
    });
    /* Fallback: labels com classe. */
    painel.querySelectorAll("label.hpc-unex-on[data-hpc-hip]").forEach(function (lab) {
      state.unexamined[lab.getAttribute("data-hpc-hip")] = true;
    });
    painel.querySelectorAll("[data-hpc-field]").forEach(function (sel) {
      state.selecionados[sel.getAttribute("data-hpc-field")] = sel.value || "";
    });
    var mestre = painel.querySelector("[data-hpc-widget='socraticPrompts']");
    if (mestre) {
      var qi = Number(mestre.getAttribute("data-hpc-qi") || 0);
      state.socratic.index = qi;
      var ans = mestre.querySelector("[data-hpc-socratic-ans]");
      if (ans && ans.value.trim()) state.socratic.answers[String(qi)] = ans.value;
      /* Preserve other answers from data attr if present */
      var dump = mestre.getAttribute("data-hpc-socratic-dump");
      if (dump) {
        try {
          var extra = JSON.parse(dump);
          Object.keys(extra).forEach(function (k) {
            if (!state.socratic.answers[k]) state.socratic.answers[k] = extra[k];
          });
        } catch (e) { /* ignore */ }
      }
      var ack = mestre.querySelector("[data-hpc-socratic-ack]");
      var acked = [];
      var prevAck = mestre.getAttribute("data-hpc-acked");
      if (prevAck) {
        try { acked = JSON.parse(prevAck) || []; } catch (e) { acked = []; }
      }
      if (ack && ack.checked && acked.indexOf(qi) < 0) acked.push(qi);
      if (ack && !ack.checked) acked = acked.filter(function (n) { return n !== qi; });
      state.socratic.acknowledged = acked;
    }
    return normalizeScaffoldState(state);
  }

  function ligarPainel(raiz, opts) {
    if (!raiz) return null;
    opts = opts || {};
    var caso = opts.caso || (raiz.querySelector("[data-hpc-caso]") &&
      raiz.querySelector("[data-hpc-painel]").getAttribute("data-hpc-caso")) || "casa-da-costa";
    var painel = raiz.querySelector("[data-hpc-painel]") || raiz;
    var prompts = (presentation(opts).prompts) || [];
    var persist = opts.persist !== false;

    function dumpSocratic(mestre, state) {
      if (!mestre) return;
      mestre.setAttribute("data-hpc-socratic-dump", JSON.stringify(state.socratic.answers || {}));
      mestre.setAttribute("data-hpc-acked", JSON.stringify(state.socratic.acknowledged || []));
    }

    function commit() {
      var st = lerEstadoDoPainel(raiz);
      dumpSocratic(painel.querySelector("[data-hpc-widget='socraticPrompts']"), st);
      if (persist) salvarScaffold(caso, st, opts);
      if (typeof opts.onChange === "function") opts.onChange(st);
      var countEl = painel.querySelector("[data-hpc-unex-count]");
      if (countEl) {
        countEl.textContent = String(Object.keys(st.unexamined).filter(function (k) {
          return st.unexamined[k];
        }).length);
      }
      return st;
    }

    /* Compare slots A/B/C */
    painel.querySelectorAll("[data-hpc-compare-sel]").forEach(function (sel) {
      sel.addEventListener("change", function () {
        var slot = sel.getAttribute("data-hpc-compare-sel");
        var livre = painel.querySelector('[data-hpc-compare-livre="' + slot + '"]');
        if (sel.value === "__livre__") {
          if (livre) { livre.hidden = false; livre.focus(); }
        } else if (livre) {
          livre.hidden = true;
          livre.value = "";
        }
        commit();
      });
    });
    painel.querySelectorAll("[data-hpc-compare-livre]").forEach(function (inp) {
      inp.addEventListener("input", commit);
    });

    painel.querySelectorAll("[data-hpc-note], [data-hpc-field], [data-hpc-socratic-ans]").forEach(function (el) {
      el.addEventListener("input", commit);
      el.addEventListener("change", commit);
    });

    painel.querySelectorAll("[data-hpc-toggle-unexamined]").forEach(function (btn) {
      btn.addEventListener("click", function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        var pressed = btn.getAttribute("aria-pressed") === "true";
        btn.setAttribute("aria-pressed", pressed ? "false" : "true");
        btn.textContent = pressed ? "marcar não examinada" : "não examinada ✓";
        var lab = btn.closest("label.hpc-hip");
        if (lab) lab.classList.toggle("hpc-unex-on", !pressed);
        commit();
      });
    });

    var ackBox = painel.querySelector("[data-hpc-socratic-ack]");
    if (ackBox) ackBox.addEventListener("change", commit);

    var mestre = painel.querySelector("[data-hpc-widget='socraticPrompts']");
    if (mestre) {
      function pintar() {
        var i = Number(mestre.getAttribute("data-hpc-qi") || 0);
        var p = mestre.querySelector(".hpc-q");
        if (p) p.textContent = prompts[i] || prompts[0] || "";
        var ans = mestre.querySelector("[data-hpc-socratic-ans]");
        var dump = {};
        try { dump = JSON.parse(mestre.getAttribute("data-hpc-socratic-dump") || "{}"); } catch (e) {}
        if (ans) ans.value = dump[String(i)] || "";
        var acked = [];
        try { acked = JSON.parse(mestre.getAttribute("data-hpc-acked") || "[]"); } catch (e) {}
        var ack = mestre.querySelector("[data-hpc-socratic-ack]");
        if (ack) ack.checked = acked.indexOf(i) >= 0;
      }
      /* Seed dump from current fields */
      commit();
      var next = mestre.querySelector("[data-hpc-next]");
      var prev = mestre.querySelector("[data-hpc-prev]");
      if (next) next.addEventListener("click", function () {
        commit();
        var i = Number(mestre.getAttribute("data-hpc-qi") || 0);
        mestre.setAttribute("data-hpc-qi", String(Math.min(prompts.length - 1, i + 1)));
        pintar();
        commit();
      });
      if (prev) prev.addEventListener("click", function () {
        commit();
        var i = Number(mestre.getAttribute("data-hpc-qi") || 0);
        mestre.setAttribute("data-hpc-qi", String(Math.max(0, i - 1)));
        pintar();
        commit();
      });
    } else {
      /* Ainda assim persiste radios/campos se existirem */
      painel.querySelectorAll('input[name="hpc-hip"]').forEach(function (inp) {
        inp.addEventListener("change", commit);
      });
    }

    painel.querySelectorAll('input[name="hpc-hip"]').forEach(function (inp) {
      inp.addEventListener("change", function () {
        painel.querySelectorAll("label.hpc-hip").forEach(function (lab) {
          lab.classList.toggle("on", !!(lab.querySelector("input") && lab.querySelector("input").checked));
        });
        commit();
      });
    });

    return commit();
  }

  function cssHpc() {
    return [
      ".hpc-painel{margin:12px 0;padding:12px 14px;border:1px solid rgba(232,169,74,.28);border-radius:12px;background:rgba(8,12,16,.72);color:#e6edf2;font-family:Inter,system-ui,sans-serif}",
      ".hpc-painel[data-hpc-livre='1']{border-style:dashed;opacity:.96}",
      ".hpc-head{display:flex;flex-wrap:wrap;gap:8px;justify-content:space-between;align-items:baseline;margin-bottom:10px}",
      ".hpc-head b{font:700 12px Inter,system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#e8a94a}",
      ".hpc-enfase{font-size:11px;color:#9eafb8}",
      ".hpc-lista{display:grid;gap:8px}",
      ".hpc-hip{display:block;padding:10px 12px;border:1px solid #344750;border-radius:10px;background:#0a1419;cursor:pointer}",
      ".hpc-hip.on{border-color:#e8a94a;background:#25190e}",
      ".hpc-hip.hpc-unex-on{border-color:#7a6a3a}",
      ".hpc-hip strong{display:block;font-size:14px}",
      ".hpc-hip small{display:block;margin-top:4px;color:#9eafb8;font-size:12px;line-height:1.35}",
      ".hpc-unex-btn{display:inline-block;margin-top:6px;border:1px solid #5a4a2a;background:#1a160c;color:#c9b48a;border-radius:6px;padding:3px 8px;font-size:10px;letter-spacing:.06em;text-transform:uppercase;cursor:pointer}",
      ".hpc-compare,.hpc-buckets,.hpc-campos{display:grid;gap:8px;margin-top:12px}",
      ".hpc-compare{grid-template-columns:repeat(3,1fr)}",
      ".hpc-buckets{grid-template-columns:1fr 1fr}",
      ".hpc-slot,.hpc-campo{padding:10px;border:1px dashed #3a4c56;border-radius:8px;background:#0a1318}",
      ".hpc-slot b,.hpc-campo span,.hpc-campos>b,.hpc-unex b,.hpc-socratic b{display:block;font-size:12px;color:#afc8d5;letter-spacing:.08em;text-transform:uppercase;margin-bottom:6px}",
      ".hpc-slot textarea,.hpc-slot select,.hpc-slot input,.hpc-campo select,.hpc-soc-ans textarea{width:100%;border:0;background:transparent;color:#e6edf2;font:500 14px Inter,system-ui,sans-serif}",
      ".hpc-unex{margin-top:10px;padding:8px 10px;border-left:3px solid #5a7a8a;background:#0a1216;border-radius:6px;font-size:13px;color:#b7c6ce}",
      ".hpc-socratic{margin-top:12px;padding:10px 12px;border-left:3px solid #70d6a0;background:#0a1814;border-radius:8px}",
      ".hpc-socratic .hpc-q{margin:6px 0;color:#c5d8cf;font-size:14px;line-height:1.45}",
      ".hpc-soc-ans,.hpc-soc-ack{display:block;margin-top:8px;font-size:12px;color:#9eb8ad}",
      ".hpc-prog{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}",
      ".hpc-prog button{border:1px solid #3d6a55;background:#102820;color:#bde8d0;border-radius:7px;padding:6px 10px;font-weight:700;cursor:pointer;font-size:12px}",
      ".hpc-coerencia{margin-top:8px;color:#8aa89a;font-size:12px}",
      ".hpc-processo{margin-top:12px}",
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
   * Carrega scaffold persistido; Livre esconde chrome estrutural.
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
    var loaded = carregarScaffold(opts.caso, opts);
    if (opts.state) {
      var over = normalizeScaffoldState(opts.state);
      if (over.hipoteseId) loaded.hipoteseId = over.hipoteseId;
      Object.keys(over.selecionados || {}).forEach(function (k) {
        if (over.selecionados[k]) loaded.selecionados[k] = over.selecionados[k];
      });
    }
    opts = { caso: opts.caso, papel: opts.papel, camada: opts.camada, partidaId: opts.partidaId, playerId: opts.playerId, omitHypothesisList: opts.omitHypothesisList, omitDecisionFields: opts.omitDecisionFields, alvo: opts.alvo, pos: opts.pos, persist: opts.persist, onChange: opts.onChange, state: loaded };
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
    STORAGE_SCAFFOLD: STORAGE_SCAFFOLD,
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
    emptyScaffoldState: emptyScaffoldState,
    normalizeScaffoldState: normalizeScaffoldState,
    scaffoldStorageKey: scaffoldStorageKey,
    carregarScaffold: carregarScaffold,
    salvarScaffold: salvarScaffold,
    roomPlayerFields: roomPlayerFields,
    processMetrics: processMetrics,
    htmlRelatorioProcesso: htmlRelatorioProcesso,
    canConfirmGuiada: canConfirmGuiada,
    htmlPainel: htmlPainel,
    lerEstadoDoPainel: lerEstadoDoPainel,
    ligarPainel: ligarPainel,
    aplicarPainel: aplicarPainel,
    injetarCss: injetarCss,
    invarianceReport: invarianceReport,
    camadaRank: camadaRank
  };
})(typeof window !== "undefined" ? window : globalThis);
