# Revisão das verificações — 24 de outubro de 2026

O catálogo continuava sendo testado como se contivesse os jogos anteriores à separação dos repositórios. As páginas agora são redirecionamentos. Os testes funcionais não foram removidos: `npm test` conserva todos os arquivos de teste anteriores: executa a migração no catálogo real e os demais contratos numa cópia temporária com os arquivos atuais de Casa da Costa, Carro-Forte e Eco do Amanhã. A execução exige os três repositórios e imprime seus commits; não substitui arquivos de produção nem omite testes quando falta uma fonte.

Antes de montar essa cópia, a suíte verifica o catálogo real, o estado aberto/fechado e os convites antigos até seus destinos. O workflow obtém os três checkouts atuais. Localmente, coloque-os ao lado de Dragon ou defina `DRAGON_TEST_SOURCES` para a pasta que os contém.

Foram corrigidas referências de testes aos caminhos anteriores, mantendo verificações de projeto Firebase, coleção, telão, payload de transferência e integridade dos scripts. Uma página de seleção normal não deve redirecionar sem convite; uma entrada com `sala` deve preservar todos os parâmetros e abrir o gate. Esse defeito foi corrigido na entrada de A Mesa no repositório Carro-Forte, com teste próprio.

Cinco entradas HTML usadas pelo build de A Noite haviam sido substituídas por redirecionamentos em 16/10. Foram restauradas a partir dos arquivos atuais de `casa-da-costa/a-noite/`, mantendo os controles existentes. `noite-auto.js` foi alinhado à fonte atual: as duas diferenças eram os caminhos da planta e do JSON do caso, agora relativos ao domínio próprio. O modelo interno `scripts/install-page.html` voltou a renderizar as instruções de instalação e os placeholders usados pelo plugin; não redireciona mais para a vitrine.

A pasta `desenvolvimento/` foi excluída da publicação Jekyll: restaurar fontes não deve criar entradas alternativas dos jogos no domínio do catálogo. Os redirecionamentos públicos permanecem intactos.

A suíte de regras no emulador e a verificação de tipos/testes de A Noite permanecem no workflow. Resultados locais e limites estão registrados no README; os runs do workflow comprovam as verificações no checkout completo.

A automação não substitui login Google real, turma em aparelhos distintos ou inspeção visual. Na sessão desta revisão, o navegador conectado informou ausência de contexto e o alternativo recusou retomar a sessão de credenciais; esses itens continuam sem comprovação prática.

No runner do GitHub, o Chrome disponível executa também a auditoria automatizada de sobreposição. As entradas do percurso, papéis e sala foram atualizadas para os caminhos atuais e recebem o identificador de rodada `run`, como na navegação do jogo. A tentativa antiga sem parâmetros acionava corretamente a proteção da minitarefa e voltava à entrada. As medições em 390×844, 800×540 e 1280×800, os controles e os cenários de RA simulada continuam ativos; isso não é login Google real nem inspeção visual humana.
