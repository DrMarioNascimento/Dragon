# MOSAICO — cliente web (React)

Protótipo do caso **A Casa da Costa** em React, separado da mesa canônica.

A mesa que está no ar continua em [`../MOSAICO-mesa.html`](../MOSAICO-mesa.html).  
Esta pasta não substitui a mesa, o Firebase, nem as tarefas HTML da raiz.

**Jogar a mesa atual:** [drmarionascimento.github.io/Dragon/MOSAICO-mesa.html](https://drmarionascimento.github.io/Dragon/MOSAICO-mesa.html)

## O que tem aqui

- Caso piloto em modo solo (1 humano + bots) ou mesa local (passar o telefone)
- Abertura, caderno, mercado, mosaico e acusação
- As quatro tarefas de sensor, no iPhone em tela cheia (giroscópio)
- Arte e áudio em `public/`

## Como rodar

```bash
cd mosaico-web
npm install
npm run dev
```

Abre no celular pelo mesmo endereço da máquina (https). Sem https o iPhone bloqueia o giroscópio.

## Relação com a raiz do Dragon

| Raiz do repositório | Esta pasta |
|---|---|
| `MOSAICO-mesa.html` + Firebase | protótipo React, sem sala na nuvem |
| `MOSAICO-26-*.html` | cópias em `public/modulos/` para o iframe / tela cheia |
| `audio/`, `img/` | cópias em `public/audio` e `public/media` |

Autoria: Mário César Nascimento e Osana Melo Nascimento.
