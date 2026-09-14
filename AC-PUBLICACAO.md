# AC — preparação da publicação integrada

Base pública: 1e846149ae6903e2ab810702e696a659bb5de3d9.
Versão isolada no branch codex/ac-release-integrada. Não publicada.

## Incluído e validado
- Percurso sala escura, escrivaninha/vela e maquete; papéis cooperativos por Fragmento e trio quando necessário.
- Identidade visual por cor, diálogos padronizados, pontuação individual/parcial e recompensas cooperativas por etapa.
- Fila de envios pendentes na sessão da aba e recuperação de confirmação perdida.
- 444 testes aprovados nesta versão isolada. 47 testes das mesmas regras aprovados no emulador na árvore de desenvolvimento.
- CI prepara o emulador Firestore antes de executar o teste, usando o comando oficial setup:emulators:firestore.

## Bloqueadores da publicação completa
1. Hospedagem atual confirmada: GitHub Pages, main, raiz. Também há deploys Production/Preview registrados, mas nenhum servidor AC acessível/configurado foi identificado.
2. Servidor atual ferramentas/ac-cooperacao.mjs é de ensaio: estado em memória com checkpoint local e SSE. Exige backend persistente; publicar somente HTML não disponibiliza /api/ac/*.
3. Definir provedor e acesso de implantação. Firebase CLI não possui conta autenticada neste computador.
4. Implementar/verificar identidade de produção com Firebase, vínculo canônico jogador/mesa, autorização dos resultados e elenco vindo da mesa. Hoje a entrada automática confia no elenco e jogador declarados pelo cliente; tokens de convite não substituem essa verificação.
5. Adaptar persistência ao provedor, preservar resultados após reinício e ligar frontend/backend sob origem autorizada com HTTPS. Não presumir que disco de função serverless é persistente.
6. Publicar regras e backend antes de habilitar novos percursos no frontend. Validar duas sessões reais no endereço público, expiração, reconexão, pontos e fallback sem RA. RA física requer homologação em aparelhos.

Não foram copiados logs, checkpoints de jogadores, credenciais ou alterações da análise bíblica para esta release. Nenhum push em main realizado.
