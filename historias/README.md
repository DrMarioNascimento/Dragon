# Histórias — entradas do portal Dragon Games

Estas pastas organizam somente a navegação do portal. Os arquivos dos jogos,
as regras, os modos internos e seus endereços originais foram preservados.
O bloco Solo/Ensaio e o link externo LAB-RA foram retirados da página principal.
O antigo diretório de redirecionamento `laboratorio-ra/` também foi removido;
as experiências do LAB-RA usam suas próprias cópias de recursos.
Jogar O Impostor individualmente continua disponível.

```text
historias/
├── casa-da-costa/
│   ├── a-mesa/index.html
│   └── o-impostor/index.html
├── a-manha-do-carro-forte/
│   ├── a-mesa/index.html
│   └── o-impostor/index.html
└── o-eco-do-amanha/
    └── o-impostor/index.html
```

## Onde está cada jogo

| História | Versão | Entrada organizada | Implementação existente |
|---|---|---|---|
| A Casa da Costa | A Mesa | [Abrir](casa-da-costa/a-mesa/) | [v1/MOSAICO-mesa.html](../v1/MOSAICO-mesa.html) |
| A Casa da Costa | O Impostor | [Abrir](casa-da-costa/o-impostor/) | [o-impostor/mesa.html](../o-impostor/mesa.html) |
| A Manhã do Carro-Forte | A Mesa | [Abrir](a-manha-do-carro-forte/a-mesa/) | [carro-forte/celular.html](../carro-forte/celular.html) |
| A Manhã do Carro-Forte | O Impostor | [Abrir](a-manha-do-carro-forte/o-impostor/) | [carro-forte-impostor/mesa.html](../carro-forte-impostor/mesa.html) |
| O Eco do Amanhã — VestChip | O Impostor | [Abrir](o-eco-do-amanha/o-impostor/) | [vestchip-impostor/mesa.html](../vestchip-impostor/mesa.html) |

O Eco do Amanhã — VestChip existe somente na versão O Impostor.
Não há versão A Mesa, pasta reservada ou aviso de acesso pendente no portal.

## Por que os diretórios de implementação não foram renomeados

Os jogos carregam recursos por caminhos relativos e referências cruzadas.
Renomear, por exemplo, `v1/` quebraria referências a CSS, JavaScript e dados
em outros jogos. A instrução atual proíbe alterações nos jogos. Por isso,
a organização por história foi aplicada às entradas do portal; as pastas de
implementação permanecem intactas, com o mapa acima para identificação.
As imagens em `solo/tiles/` ainda são usadas pelo telão e permanecem intactas.
