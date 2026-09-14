# AC — versão preparada para Firebase gratuito

Destino: GitHub Pages existente (DrMarioNascimento/Dragon) e Firestore do projeto mosaico-game, banco (default).
Plano gratuito preservado. Sem Functions, Cloud Run, servidor pago ou ativação de faturamento.

## Implementação
- Motor compartilhado entre ensaio Node e navegador: ac-core.mjs e ac-maquete-state.mjs.
- Grupos criados somente pelo mestre. Identidade do jogador vem da sessão Firebase da mesa, não dos parâmetros declarados na URL.
- Eventos imutáveis com horário do servidor, papel vinculado ao grupo e rodada ativa. Estado e pontos reconstruídos pelo mesmo motor; não há campo de pontuação aceito do jogador.
- Leituras/gravações autenticadas; participante não grava pelo colega. Somente mestre define o grupo, que não pode ser alterado após criado.
- Presença a cada15s e movimento no máximo2envios/s por tipo. Encaixe confirma a posição final da ponta. Uso sujeito às cotas gratuitas do Firestore; não habilita cobrança.
- A pausa conserva o identificador da rodada. Encerramento da fase impede novos eventos. Grupos têm limite técnico de24h; a duração do jogo segue a mesa.
- Ensaio local existente preservado; páginas públicas usam o transporte Firebase.

## Validação
- 445 testes gerais aprovados.
- 50 testes de regras/integração aprovados no emulador.
- Trio completa sala escura, vela e três chaves com recibos iguais.
- Adaptador real executado contra o SDK/emulador: entrada usa identidade autenticada; progresso persistido; outro papel recusado; mestre recupera resultados.
- Publicação e verificação pública ainda não realizadas. RA física depende de ensaio em aparelhos.

## Confirmação pendente da revisão automática
Comando bloqueado: npx -y firebase-tools@latest deploy --only firestore:rules --project mosaico-game --non-interactive.
A revisão automática exige confirmação específica para alterar as regras do projeto existente. Nenhuma tentativa alternativa de alteração foi feita.
Escopo: incluir acGrupos/eventos/presenca com restrições acima e aceitar a fase constelacao nas tarefas, preservando as outras regras do repositório. Não altera plano nem exclui dados.
Risco: uma regra incompatível com clientes existentes pode impedir leitura/gravação. Mitigação: matriz do emulador passou; validar regras publicadas e duas/três sessões no endereço público após implantação.
A autorização deve cobrir publicar este firestore.rules no mosaico-game e, depois, publicar os arquivos desta versão no Dragon.
