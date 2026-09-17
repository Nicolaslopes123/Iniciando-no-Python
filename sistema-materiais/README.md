# Sistema de Materiais por Projeto

Aplicação web 100% front-end (HTML + CSS + JavaScript puro, sem build e sem
instalação) para controle de materiais de obra/engenharia organizados **por
projeto**, em vez de uma lista global única.

## Como usar

Não é preciso instalar nada. Basta abrir `index.html` diretamente no
navegador (duplo clique, ou "Abrir com" → navegador). Os dados ficam salvos
no `localStorage` do próprio navegador, no seu computador.

Se preferir servir por HTTP (opcional, mesmo resultado):

```
python3 -m http.server 8000 --directory sistema-materiais
```

## Arquitetura

A estrutura principal é **por projeto**, não uma lista global de materiais:

```
Projeto
 ├── Informações gerais
 ├── Materiais
 ├── Fotos
 ├── Pendências
 ├── Indicadores
 ├── Relatório
 └── Histórico
```

Todo material, foto, pendência e evento de histórico carrega um
`projectId`, garantindo isolamento entre projetos — nada de um projeto
aparece em outro.

### Navegação

```
Projetos → Selecionar projeto → Ambiente do projeto (Dashboard / Materiais /
Fotos / Pendências / Indicadores / Relatório / Histórico)
```

Dentro do ambiente do projeto, o nome do projeto fica sempre visível no
cabeçalho, com o botão "← Voltar para Projetos". Ao cadastrar materiais,
fotos ou pendências dentro de um projeto, o usuário não precisa selecionar o
projeto novamente — o projeto atual é implícito pela rota.

### Camada de dados (`js/db.js`)

Toda a persistência passa por um único módulo (`DB`), que hoje grava em
`localStorage` mas expõe uma API estável (`Projects`, `Materials`, `Photos`,
`Pendencies`, `History`, `Stats`). Nenhuma tela acessa `localStorage`
diretamente. Isso deixa o caminho pronto para, no futuro, trocar a
implementação por chamadas a uma API remota (necessário para múltiplos
usuários trabalhando no mesmo projeto ao mesmo tempo) sem alterar nenhuma
tela — só o conteúdo de `db.js` muda. O campo `usuario`, já presente em cada
entrada do histórico, existe justamente para preparar esse cenário
multiusuário.

Relacionamento entre entidades:

```
Project 1──N Material
Project 1──N Photo   (Photo N──1 Material, opcional)
Project 1──N Pendencia (Pendencia N──1 Material, opcional)
Project 1──N HistoryEntry
```

### Estrutura de arquivos

```
sistema-materiais/
├── index.html
├── css/styles.css
└── js/
    ├── db.js            # camada de dados (localStorage) + cálculos de indicadores
    ├── labels.js         # rótulos/cores centralizados (status, prioridade, origem)
    ├── utils.js           # modal, toast, formatação, compressão de imagem
    ├── seed.js             # dados de demonstração (só na 1ª execução)
    ├── router.js            # roteador por hash (#/, #/projeto/:id/:aba)
    ├── app.js               # bootstrap: registra rotas e inicia o roteador
    └── views/
        ├── projects.js       # tela inicial: cards de projetos
        ├── projectShell.js    # cabeçalho + abas do ambiente do projeto
        ├── dashboard.js
        ├── materials.js
        ├── photos.js
        ├── pendencies.js
        ├── indicators.js       # gráficos (Chart.js via CDN)
        ├── report.js            # relatório imprimível + exportação CSV
        └── history.js
```

### Indicadores calculados por projeto

Total de materiais, disponíveis, faltantes, parciais, referências externas,
não identificados, quantidade total faltante, percentual de atendimento e
percentual de identificação SAP — todos calculados apenas com os dados do
projeto aberto no momento (`DB.Stats.summary` / `DB.Stats.groupings`).

Status de disponibilidade de cada material é **calculado**, não digitado:
`disponível` se a quantidade disponível cobre a necessária, `parcial` se
cobre em parte, `faltante` se não há nada disponível. A origem da
identificação é `SAP` quando há código SAP, `referência externa` quando há
uma referência informada sem código SAP, e `não identificado` quando nenhum
dos dois existe.
