# Decisões de sobreposição (unificação MOSAICO)

## Casa da Costa — módulos sensoriais

| Atividade | Linhagens | Decisão | Motivo |
|---|---|---|---|
| A Janela do Norte | `jogos/casa-da-costa/a-mesa/MOSAICO-26-a-janela-do-norte.html` vs `jogos/casa-da-costa/a-noite/modulos/janela-do-norte.html` (= `desenvolvimento/casa-da-costa/a-noite/public/modulos/`) | **Mantidas as duas, sequenciadas; CTA unificado** | Celular canônico usa v1. CTA Casa em todas as cópias: **Apontar a janela** (nunca Descer do carro). `/jogos/casa-da-costa/a-noite/` deixou de ser link da landing `casa-da-costa/` — revisão/bookmark only. |
| O Vidro Embaçado | `jogos/casa-da-costa/a-mesa/MOSAICO-26-vidro-embacado.html` vs `jogos/casa-da-costa/a-noite/modulos/vidro-embacado.html` | **Mantidas as duas, sequenciadas** | Idem — commits recentes melhoraram o vidro na Casa; v2 ainda diverge. |
| A Sala às Escuras | `jogos/casa-da-costa/a-mesa/MOSAICO-26-a-sala-as-escuras.html` vs `jogos/casa-da-costa/a-noite/modulos/sala-as-escuras.html` | **Mantidas as duas, sequenciadas** | Portão do oito / bússola na linhagem Casa; Carro-Forte e v2 têm contratos diferentes. |
| Mapa do Escuro | só em `jogos/casa-da-costa/a-noite/modulos/mapa-do-escuro.html` | **Mantido (sem sobreposição)** | Concatenado via preservação de `/jogos/casa-da-costa/a-noite/`. |
| A Marca Partida | só em Lab RA | **Migrado para lab-ra** | Não é atividade das duas linhagens mesa/noite do hub. |

## Carro-Forte — fluxos

| Fluxo | Caminho | Decisão | Motivo |
|---|---|---|---|
| Investigação (antiga A Mesa) | `jogos/a-manha-do-carro-forte/a-mesa/celular.html` | **Celular canônico** | Contém atividades sensoriais do caso + dossiê; rewired para `mosaico-noite`. |
| Reunião de fechamento (antiga A Noite) | `jogos/a-manha-do-carro-forte/a-noite/` | **Sequenciado / revisão** | Não sobrepõe as mesmas atividades HTML da investigação — é outro jogo sobre a mesma manhã. Mantido e ligado a partir do landing. |
| Módulos sensoriais do Carro | `jogos/a-manha-do-carro-forte/a-mesa/janela-do-norte.html` etc. | **Mantidos** | Adaptados ao caso (rua da agência); não são duplicatas da Casa. |

## Solo

| Caso | Decisão |
|---|---|
| Casa da Costa | `jogos/casa-da-costa/solo/` permanece; Firebase → `mosaico-game` via `data-project="mesa"` |
| Carro-Forte | Solo via `celular.html?soloLab=1&bots=max` (e noite com bots no fluxo de fechamento) |
