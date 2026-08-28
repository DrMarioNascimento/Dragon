# MOSAICO — A Verdade é um Fragmento

> Jogo híbrido de dedução distribuída para smartphones, com telão opcional. Projeto autoral proprietário em desenvolvimento.

O **MOSAICO** transforma um caso em informações fragmentadas entre os participantes. Ninguém recebe sozinho todos os fatos. Os jogadores encenam, apontam, cooperam e acusam.

**Entrar:** [drmarionascimento.github.io/Dragon/](https://drmarionascimento.github.io/Dragon/)

O hub segue o recorte visual do [Learning-lab](https://github.com/DrMarioNascimento/Learning-lab), com a paleta da noite.

## Duas versões

| | Pasta | Jogar |
|---|---|---|
| **01 A mesa** | [`v1/`](./v1) | [v1/MOSAICO-mesa.html](https://drmarionascimento.github.io/Dragon/v1/MOSAICO-mesa.html) |
| **02 A noite** | [`mosaico-web/`](./mosaico-web) (código) · [`v2/`](./v2) (site) | [v2/](https://drmarionascimento.github.io/Dragon/v2/) |

O endereço antigo [`MOSAICO-mesa.html`](./MOSAICO-mesa.html) redireciona para a mesa (v1).

**Caso:** *A Casa da Costa*  
**Participantes:** 1 a 12 (1 = ensaio com todas as telas)  
**Situação:** protótipo em playtest

## Autoria

**Concepção:** Mário César Nascimento e Osana Melo Nascimento  
**Perfil:** [DrMarioNascimento](https://github.com/DrMarioNascimento)

---

## Versão 1 — A mesa

HTML + Firebase. Telão opcional. QR na sala.

- **Com telão:** código, QR, cronologia, revelação, apuração e pódio.
- **Sem telão:** o criador joga no celular; os controles de mestre ficam em **Sala**.

Áudio canônico em `v1/audio/`. Sirene e anúncios só no aparelho do mestre. `encerramento.mp3` entre acusação e revelação.

### Barra móvel

**Caso | Sala | Arquivo** — rodada e cronologia; comandos do mestre; pistas privadas.

### Ritmo

Na criação da sala: **Automaticamente** (avança quando todos terminam) ou **Com minha liberação**. Nos dois, o mestre pode pausar e retomar.

### Fluxo

1. criação da sala e abertura  
2. Encenação — Entenda, Faça, Fale  
3. voto da cena  
4. **A Janela do Norte**  
5. **O Vidro Embaçado** ou **A Sala às Escuras**  
6. encontro dos Fragmentos pela cor  
7. reconstrução coletiva  
8. mercado de pistas  
9. acusação  
10. revelação e pódio  

Fragmentos: Névoa, Tempestade, Farol, Noite. Cronômetro dourado na formação. 1–3 pessoas = um Fragmento, todos Portadores. 4–12 = grupos de 2 ou 3, um Portador sorteado.

### Pontuação V5 — máximo 100

| Componente | Técnico | Máximo |
|---|---|---:|
| Encenação | Performance | 5 |
| J × J | Tempo | 32 |
| J + J | Cooperação | 30 |
| Mercado | Economia | 20 |
| Caso | Qualidade | 13 |

Pontos inteiros. O escore Z não entra no placar.

### Arquitetura da mesa

| Arquivo | Responsabilidade |
|---|---|
| `v1/MOSAICO-mesa.html` | interface, fluxo, Firebase |
| `v1/casos/casa-da-costa.json` | caso piloto |
| `v1/js/mosaico-v5.js` | pontuação |
| `v1/js/qr.js` | QR local |
| `v1/js/tarefa-sensor.js` | protocolo das lanternas |
| `v1/MOSAICO-26-a-janela-do-norte.html` | janela |
| `v1/MOSAICO-26-vidro-embacado.html` | vidro |
| `v1/MOSAICO-26-a-sala-as-escuras.html` | sala escura |
| `firestore.rules` | autorização (raiz) |
| `v1/sw.js` | cache — desligado |
| `tests/` | motor, QR, caso, regras |
| `FIREBASE-SECURITY.md` | segurança |
| `HANDOFF.md` | continuidade |

```bash
npm install && npm run test:tudo
```

O motor, o QR e a sincronia `v1/casos/casa-da-costa.json` ↔ HTML rodam sem emulador. As regras do Firestore precisam do emulador (`npm run test:regras`).

---

## Versão 2 — A noite

App em [`mosaico-web/`](./mosaico-web) (React / Vite). **Não substitui a mesa.**

- criação da mesa: **noite curta** (~20 min) ou **noite cheia** (~40 min)
- QR na sala
- encene, lanternas, procura da cor, foto partida (encaixe), tarja no ímpar
- acusação em três linhas, a casa reparte o campo
- cronômetro âmbar com glow; a casa vira sozinha
- arquétipo (emoji) em vez de nome de personagem na porta

O GitHub Pages serve o build estático em [`v2/`](https://drmarionascimento.github.io/Dragon/v2/). Código-fonte: [`mosaico-web/`](./mosaico-web).

```bash
cd mosaico-web && MOSAICO_PAGES=1 npx vite build
# copiar dist/client para ../v2/
```

---

## Estado

Experiência jogável, proposta em construção.

> **Tudo se adapta, nada se perde.**

Antes de mudar regra, narrativa ou pontuação: `HANDOFF.md` e o histórico Git.

## Licença e uso

Repositório público para consulta e GitHub Pages — **não é código aberto**. A visibilidade não autoriza copiar, adaptar, redistribuir, comercializar, treinar IA ou criar obra derivada. Ver [Licença Proprietária](LICENSE.md).

---

**Prof. Mário César Nascimento, PhD ©**
