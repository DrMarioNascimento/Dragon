/* A abertura narrada da Mesa — invariantes da destrava.
 *
 * Existe por causa de 03/09/2026. Até então o único caminho para destravar a
 * encenação era o `onended` da narração, e isso travava a mesa inteira num
 * caso comum: o Mestre recarrega a página durante a abertura.
 * `_nivelSonoroAnterior` é variável de aba, volta a null, a primeira passada
 * por verificarTrocaDeNivel só semeia o valor e sai — a voz não toca de novo,
 * o `onended` nunca dispara, `encenacaoIntroducaoConcluida` fica false no
 * documento para sempre, e as doze pessoas olham um AGUARDE... que não sai.
 * Não havia botão do Mestre: só duas linhas do arquivo escrevem esse campo.
 *
 * O que se guarda aqui não é o áudio — é a garantia de que clima nunca é o
 * que segura a mesa. Ela tem de sobreviver a qualquer decisão futura sobre
 * quantos mp3 existem.
 *
 * Olha a FONTE: a mesa é uma página inteira com Web Audio e Firestore, que
 * não roda de cabeça para baixo aqui. Cada asserção abaixo falha na versão
 * anterior ao conserto — foi conferido rodando contra ela.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const MESA = readFileSync(new URL("../v1/MOSAICO-mesa.html", import.meta.url), "utf8");

/* O gate sem o relógio é exatamente a trava. Se um dia alguém gravar os dois
   em chamadas separadas, um snapshot pode chegar com o gate fechado e sem
   relógio — e aí não há de onde tirar o tempo nem quando desistir. */
test("o gate da encenação e o relógio da abertura nascem na mesma gravação", () => {
  const i = MESA.indexOf("encenacaoIntroducaoConcluida:false");
  assert.ok(i > 0, "a virada para encenação não fecha mais o gate");
  const chamada = MESA.slice(MESA.lastIndexOf("atualizarMesa", i), i + 200);
  assert.match(
    chamada,
    /aberturaIniciadaMs:\s*Date\.now\(\)/,
    "o gate fecha sem gravar aberturaIniciadaMs na mesma chamada",
  );
});

/* A garantia. Sem um temporizador, tudo volta a depender de o áudio terminar. */
test("a abertura conclui por tempo, não só quando o áudio termina", () => {
  assert.match(
    MESA,
    /_timerAbertura\s*=\s*setTimeout\(\s*concluirAbertura/,
    "não há temporizador que conclua a abertura sem o áudio",
  );
  assert.match(
    MESA,
    /function concluirAbertura\(\)\{[\s\S]*?liberarTelaEncenacao\(\)/,
    "concluirAbertura não destrava a tela da encenação",
  );
});

/* Troca de fase acontece uma vez; render acontece sempre. Só o segundo
   sobrevive a um recarregar. */
test("o sincronizador da abertura é chamado do render", () => {
  assert.match(
    MESA,
    /if\(aberturaPendente\(\)\)sincronizarAudioAbertura\(\);/,
    "o render não chama sincronizarAudioAbertura",
  );
});

/* Se os dois caminhos tocassem, a narração sairia dobrada no aparelho do
   Mestre — o sincronizador começa no mesmo instante da troca de fase. */
test("a troca de nível não toca mais a abertura por conta própria", () => {
  const i = MESA.indexOf("function verificarTrocaDeNivel");
  const bloco = MESA.slice(i, i + 1400);
  assert.ok(i > 0, "verificarTrocaDeNivel sumiu");
  assert.doesNotMatch(
    bloco,
    /tocarAberturaComAmbiente/,
    "verificarTrocaDeNivel voltou a tocar a abertura: ela sairia duas vezes",
  );
});

/* Mesma regra do encerramento, que já resolvia isto neste arquivo: áudio fora
   do mapa significa espera ZERO, nunca espera em silêncio. */
test("sem narração no mapa, a espera da abertura é zero", () => {
  assert.match(
    MESA,
    /var DURACAO_ABERTURA_MS=ARQUIVOS_VOZ_NIVEL\.abertura\?\d+:0;/,
    "a duração da abertura não sai mais do mapa de áudios",
  );
});

/* Salas abertas antes do conserto não têm o campo. Abrir na hora é melhor do
   que esperar uma voz cujo início ninguém sabe. */
test("sala sem relógio destrava em vez de travar", () => {
  assert.match(
    MESA,
    /var inicio=Number\(STATE\.doc\.aberturaIniciadaMs\)\|\|0;\s*if\(!inicio\)\{concluirAbertura\(\);return;\}/,
    "sala sem aberturaIniciadaMs não tem saída garantida",
  );
});

/* O temporizador impede a trava; o botão devolve a decisão a quem conduz.
   Enquanto a casa fala não há apresentação para pular — o menu do Mestre
   mostrava "Pular a apresentação atual", que é outra coisa. */
test("o Mestre pode pular a abertura sem esperar os 81 s", () => {
  assert.match(
    MESA,
    /introducaoEncenacaoPendente\(\)\)\s*\n?\s*botoes\+=[\s\S]{0,200}concluirAbertura\(\)/,
    "o menu do Mestre não oferece pular a abertura",
  );
});

/* O ponto de retomada. Sem ele o Mestre que recarrega no segundo 5 faz a mesa
   ouvir 81 s de novo; no segundo 75, esperar 81 s a mais. */
test("a narração retoma no ponto, não do começo", () => {
  assert.match(
    MESA,
    /function tocarAberturaComAmbiente\(aoTerminar,deslocamentoMs\)/,
    "tocarAberturaComAmbiente não aceita deslocamento",
  );
  assert.match(MESA, /abertura\.start\(inicio,salto\)/, "a narração ignora o deslocamento");
  assert.match(
    MESA,
    /tocarAberturaComAmbiente\(concluirAbertura,decorrido\)/,
    "o sincronizador não passa o tempo decorrido para a narração",
  );
});
