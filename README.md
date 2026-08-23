# Dragon — Laboratório Pessoal

> **Repositório público para consulta. Obra autoral proprietária de Mário César Nascimento, PhD. Todos os direitos reservados.**

O **Dragon** é um laboratório pessoal de criação e desenvolvimento de experiências interativas, jogos, casos, narrativas e materiais educacionais autorais.

## Projeto em desenvolvimento

O repositório reúne atualmente protótipos e componentes do **MOSAICO**, incluindo:

- mesa e interface principal do jogo;
- casos e fragmentos narrativos;
- experimentos de ambientação e interação;
- recursos visuais e arquivos de apoio;
- documentação técnica e registros de continuidade do desenvolvimento.

Os arquivos representam etapas de trabalho em evolução e podem conter versões experimentais, intermediárias ou ainda não consolidadas.

## Acesso e licença

O repositório é público, mas visibilidade não equivale a licença aberta. O acesso ao código e aos materiais não concede autorização de uso, reprodução, adaptação, redistribuição, publicação ou exploração.

Não publique links de demonstração, arquivos, capturas extensas, documentação interna ou qualquer parte do projeto sem autorização prévia e escrita do titular.

## Fluxo consolidado do jogo

`MOSAICO-mesa.html` implementa a pontuação V5 em fases sucessivas:

1. História que Pula e voto cego de Performance;
2. rodada sensorial **Constelação Indoor**;
3. rodada sensorial **Inclinação–Fragmento**;
4. Mosaico coletivo por núcleos e voto interno cego;
5. Mercado Cego com moedas, preços configuráveis e registro das compras;
6. dedução final com Suspeito, Motivo, Ação, Prova e Lacuna;
7. revelação e placar de Tempo (32%), Qualidade (13%), Cooperação (30%), Economia e Risco (20%) e Performance (5%).

Os parâmetros do caso ficam em `casos/casa-da-costa.json`. O cálculo puro e testável fica em `js/mosaico-v5.js`. Todos os pontos do jogo são inteiros.

Nos celulares, **Caso** abre a rodada atual, a orientação do momento e a linha do tempo pública; **Arquivo** reúne os fragmentos privados e adquiridos. O celular do mestre acrescenta somente **Menu**.

### Modos de mesa

- **Com telão:** um aparelho é dedicado ao painel coletivo, ao QR, à cronologia e aos controles do mestre. O mestre não ocupa uma vaga de jogador nesse aparelho.
- **Sem telão:** quem cria a sala também entra como jogador. Seu celular permanece igual ao dos demais, acrescentando apenas o botão compacto **Menu** ao lado de **Arquivo**. O Menu reúne QR/código, participantes conectados, controles necessários da fase e encerramento da sala. Formação de núcleos e cálculo do placar são automáticos e não aparecem como comandos manuais. Todos os celulares recebem um mural coletivo recolhível com relógio e cronologia pública.

O modo é escolhido ao abrir a mesa e gravado no documento da sala. Regras, caso, votos e pontuação são idênticos nos dois modos.

Se a página for recarregada ou o navegador for reaberto, o mesmo aparelho retorna à sala ativa com o jogador, personagem e progresso preservados. Uma sala encerrada pelo mestre não pode ser recuperada; ao abrir outra, o sistema cria um novo código.

O Firebase está configurado para autenticação anônima. As permissões versionadas ficam em `firestore.rules`, com configuração de implantação em `firebase.json` e `.firebaserc`. Consulte `FIREBASE-SECURITY.md` antes de publicar ou testar: o jogo não deve depender de regras abertas em modo de teste.

## Autoria e titularidade

**Autor e titular:** Mário César Nascimento, PhD  
**Perfil responsável:** [DrMarioNascimento](https://github.com/DrMarioNascimento)

## Licença

O conteúdo está sujeito à [Licença Proprietária — Todos os Direitos Reservados](LICENSE.md). Nenhum uso é autorizado além daquele expressamente concedido por escrito pelo titular.

---

**Prof. Mário César Nascimento, PhD ©**
