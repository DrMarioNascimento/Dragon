# Jogos por história e versão

Os arquivos de implementação ficam aqui. As páginas de escolha do portal
continuam em [historias/](../historias/README.md).

| História | Versão | Entrada |
|---|---|---|
| A Casa da Costa | A Mesa | [Jogar](casa-da-costa/a-mesa/MOSAICO-mesa.html) |
| A Casa da Costa | O Impostor | [Jogar](casa-da-costa/o-impostor/mesa.html) |
| A Manhã do Carro-Forte | A Mesa | [Jogar](a-manha-do-carro-forte/a-mesa/celular.html) |
| A Manhã do Carro-Forte | O Impostor | [Jogar](a-manha-do-carro-forte/o-impostor/mesa.html) |
| O Eco do Amanhã — VestChip | O Impostor | [Jogar](o-eco-do-amanha/o-impostor/mesa.html) |

## Experiências complementares preservadas

- [Casa da Costa — Solo](casa-da-costa/solo/index.html): fora do catálogo principal.
- [Casa da Costa — A Noite](casa-da-costa/a-noite/index.html): publicação da fonte em
  [desenvolvimento/casa-da-costa/a-noite](../desenvolvimento/casa-da-costa/a-noite/README.md).
- [Carro-Forte — A Noite](a-manha-do-carro-forte/a-noite/index.html): continuação da investigação da manhã.

Não há versão A Mesa de VestChip.

## Endereços antigos

As antigas entradas HTML permanecem como redirecionamentos, preservando os
parâmetros do convite e o fragmento da URL. Os jogos têm uma única implementação,
nas pastas acima; as pastas antigas não contêm outra cópia executável dos jogos.

O portal pessoal ainda usa duas imagens em `v1/img/Orizontal.jpg` e
`solo/tiles/carta-costa.jpg`. Essas cópias de compatibilidade conservam o mesmo
conteúdo das imagens atuais. O [manifesto](compatibilidade.json) registra os
endereços preservados. Após alterar essas imagens ou as entradas de jogos,
execute `node ferramentas/compatibilidade-jogos.mjs` e `npm test`.
