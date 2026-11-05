# Tarefas — Weather App

Backlog de implementação ordenado por entrega e dependência. As decisões ainda
abertas da especificação devem ser registradas antes de fixar a fonte e os
detalhes de período, campos e apresentação; não se presume comportamento fora
do MVP.

## Decisões e contratos

### T-01 — Confirmar decisões de produto que desbloqueiam a integração
- **Descrição:** Registrar a fonte aprovada (ou alternativa), cobertura e termos, atribuição, informações de desambiguação, definição dos cinco dias, campos meteorológicos mínimos, idioma, timeout e disponibilidade de metadados. Documentar também unidade inicial e comportamento responsivo/acessível acordados; manter sem persistência enquanto não houver decisão explícita.
- **Requisitos:** FR-01–FR-05; AC-3.4, AC-4.4; NFR-01–NFR-03, NFR-06.
- **Critérios de aceite:**
  - Há registro consultável das decisões ou das pendências e responsáveis; nenhuma proposta do plano é apresentada como decisão já aprovada.
  - A definição de período e ordenação dos cinco dias, os campos mínimos e os metadados a apresentar estão explícitos.
  - A fonte, cobertura, atribuição e condições de uso estão aprovadas antes da integração final.
- **Dependências:** Nenhuma.
- **Arquivos prováveis:** `docs/weather-app-product-decisions.md`
- **Tipo:** Infra

### T-02 — Definir contratos de domínio e erros meteorológicos
- **Descrição:** Criar os tipos compartilhados para cidade, unidade, clima atual, cinco dias de previsão e falhas tipadas, mantendo temperaturas canônicas em Celsius e campos não confirmados opcionais.
- **Requisitos:** FR-02–FR-06; AC-2.1, AC-2.4, AC-3.1, AC-3.3, AC-6.1; NFR-04.
- **Critérios de aceite:**
  - Os tipos representam cidade com coordenadas, identidade e dados de desambiguação decididos em T-01.
  - `WeatherData` associa cidade, clima atual e exatamente cinco registros; valores adicionais não obrigatórios são opcionais.
  - Erros distinguem falha de rede, timeout, HTTP e resposta inválida, sem usar dados de resposta externa diretamente como tipos de domínio.
- **Dependências:** T-01.
- **Arquivos prováveis:** `src/types/weather.ts`
- **Tipo:** Data

## Dados e coordenação

### T-03 — Implementar busca e validação de cidades
- **Descrição:** Implementar no serviço a busca geográfica aprovada, normalização do termo, mapeamento de resultados e distinção entre lista vazia válida e resposta inválida.
- **Requisitos:** FR-01, FR-02, FR-07; AC-1.1, AC-1.2, AC-1.4, AC-7.1, AC-7.2.
- **Critérios de aceite:**
  - O termo é normalizado e codificado como parâmetro; entrada vazia ou só com espaços não dispara requisição.
  - Resultados válidos são mapeados para cidades selecionáveis com os campos de desambiguação definidos em T-01.
  - Ausência de resultados em resposta válida retorna lista vazia; JSON/estrutura inválidos, HTTP não OK, falha de rede e timeout geram erro tipado.
  - A busca aceita cancelamento e não trata cancelamento intencional como falha exibível.
- **Dependências:** T-01, T-02.
- **Arquivos prováveis:** `src/services/weatherService.ts`
- **Tipo:** Data

### T-04 — Implementar consulta e validação do clima e da previsão
- **Descrição:** Consultar a fonte aprovada para as coordenadas da cidade selecionada e mapear clima atual e cinco dias para os contratos de domínio.
- **Requisitos:** FR-03, FR-04, FR-06, FR-07; AC-2.1, AC-2.3, AC-2.4, AC-3.1–AC-3.4, AC-6.1; NFR-04, NFR-06.
- **Critérios de aceite:**
  - A requisição usa as coordenadas e o fuso local da cidade e solicita os campos e período acordados em T-01.
  - A resposta só é aceita se status, estrutura, clima atual necessário e todos os cinco registros diários forem válidos e coerentes; arrays incompletos não são preenchidos.
  - Temperaturas são mapeadas em Celsius; cidade, datas e períodos permanecem associados à resposta correta.
  - Falhas HTTP, de rede, timeout, JSON e dados incompletos resultam em erro tipado; cancelamento não é erro visível.
  - Horário/origem são preservados e disponibilizados para apresentação quando fornecidos pela fonte.
- **Dependências:** T-01, T-02.
- **Arquivos prováveis:** `src/services/weatherService.ts`, `src/types/weather.ts`
- **Tipo:** Data

### T-05 — Criar conversão e formatação meteorológica puras
- **Descrição:** Implementar funções reutilizáveis sem efeitos colaterais para converter temperaturas, descrever códigos meteorológicos e formatar datas conforme o fuso e a definição acordados.
- **Requisitos:** FR-03–FR-05; AC-2.1, AC-3.1, AC-3.4, AC-4.1–AC-4.4; NFR-05.
- **Critérios de aceite:**
  - Conversões Celsius/Fahrenheit produzem valores corretos e não alteram os dados canônicos.
  - Códigos meteorológicos conhecidos têm descrição; códigos não mapeados não geram uma condição inventada.
  - Datas e ordenação dos cinco dias respeitam o fuso local e a decisão de T-01.
  - Valores ausentes podem ser identificados sem substituição numérica.
- **Dependências:** T-01, T-02.
- **Arquivos prováveis:** `src/lib/temperature.ts`, `src/lib/weatherCodes.ts`, `src/lib/format.ts`
- **Tipo:** Data

### T-06 — Orquestrar busca, seleção, consulta e tentativas novamente
- **Descrição:** Criar `useWeather` com estado local separado para busca, cidade selecionada, dados meteorológicos e unidade de apresentação.
- **Requisitos:** FR-01–FR-07; AC-1.3, AC-1.4, AC-2.2, AC-3.2, AC-4.3, AC-6.1, AC-6.2, AC-7.3; NFR-03, NFR-04.
- **Critérios de aceite:**
  - Busca e consulta mantêm estados independentes de inatividade, carregamento, sucesso, vazio e erro.
  - A pessoa seleciona explicitamente um resultado; seleção inicia consulta para essa cidade.
  - Requisição anterior é cancelada quando possível ou descartada por identidade, sem sobrescrever dados da seleção atual nem mostrar dados antigos como novos.
  - A tentativa novamente repete somente a operação que falhou (busca ou consulta da cidade selecionada).
  - Alterar unidade atualiza estado de apresentação sem iniciar nova chamada e sem persistência não aprovada.
- **Dependências:** T-03, T-04, T-05.
- **Arquivos prováveis:** `src/hooks/useWeather.ts`
- **Tipo:** Data

## Interface

### T-07 — Implementar busca e seleção acessíveis de cidades
- **Descrição:** Criar a barra de busca e a apresentação de resultados, com identificação suficiente para escolher corretamente entre cidades.
- **Requisitos:** FR-01, FR-02, FR-06, FR-07; AC-1.1, AC-1.3, AC-5.1, AC-6.1; NFR-02.
- **Critérios de aceite:**
  - É possível submeter um termo e selecionar cada resultado por teclado e controles identificáveis.
  - Cada resultado mostra os campos de desambiguação definidos em T-01.
  - Busca em andamento é comunicada; termo vazio não inicia busca e informa a necessidade de preenchimento.
  - Resultados permanecem associados ao termo submetido, sem seleção automática.
- **Dependências:** T-03, T-06.
- **Arquivos prováveis:** `src/components/SearchBar.tsx`
- **Tipo:** UI

### T-08 — Exibir clima atual da cidade selecionada
- **Descrição:** Criar a apresentação das condições atuais disponíveis, identificando local, temperatura, condição e metadados fornecidos.
- **Requisitos:** FR-03, FR-05, FR-06; AC-2.1, AC-2.2, AC-2.4, AC-4.1–AC-4.4, AC-6.1, AC-6.2; NFR-04–NFR-06.
- **Critérios de aceite:**
  - A cidade exibida corresponde à cidade selecionada e seus dados atuais válidos.
  - Temperatura usa a unidade ativa com identificador junto ao valor; condição e horário/origem são exibidos quando disponíveis.
  - Campo ausente não é representado por número ou informação inventada.
  - Durante carregamento não se atribui ao novo local o clima da seleção anterior.
- **Dependências:** T-04, T-05, T-06.
- **Arquivos prováveis:** `src/components/CurrentWeather.tsx`
- **Tipo:** UI

### T-09 — Exibir a previsão diária de cinco dias
- **Descrição:** Criar a lista e os cartões da previsão, usando os cinco dias validados e ordenados conforme a decisão de produto.
- **Requisitos:** FR-04–FR-06; AC-3.1–AC-3.4, AC-4.1–AC-4.4, AC-6.1, AC-6.2; NFR-04, NFR-05.
- **Critérios de aceite:**
  - São apresentados exatamente cinco dias da cidade selecionada, nas datas e ordenação estabelecidas em T-01.
  - Cada dia apresenta os campos válidos disponíveis e temperaturas na unidade ativa, identificada junto aos valores.
  - Previsão incompleta não é exibida como cobertura completa nem recebe dias fabricados.
  - Carregamento ou troca de cidade não mistura dados de localidades diferentes.
- **Dependências:** T-04, T-05, T-06.
- **Arquivos prováveis:** `src/components/ForecastList.tsx`, `src/components/ForecastCard.tsx`
- **Tipo:** UI

### T-10 — Permitir alternância consistente de unidade
- **Descrição:** Implementar o controle Celsius/Fahrenheit e conectar sua seleção a todas as temperaturas visíveis.
- **Requisitos:** FR-05; AC-4.1–AC-4.4, AC-5.1; NFR-05.
- **Critérios de aceite:**
  - É possível escolher Celsius ou Fahrenheit por controle com nome acessível.
  - A unidade e seus símbolos são identificáveis e aplicados ao clima atual e aos cinco dias.
  - A alternância preserva cidade e período, não dispara nova consulta e funciona antes e depois do carregamento.
- **Dependências:** T-05, T-06, T-08, T-09.
- **Arquivos prováveis:** `src/components/UnitToggle.tsx`
- **Tipo:** UI

### T-11 — Implementar estados vazios, de carregamento e de erro
- **Descrição:** Criar estados reutilizáveis e mensagens em português para busca, consulta e dados indisponíveis, incluindo ação de nova tentativa quando aplicável.
- **Requisitos:** FR-07; AC-1.2–AC-1.4, AC-2.2–AC-2.4, AC-3.2–AC-3.3, AC-7.1–AC-7.3; NFR-02, NFR-04, NFR-05.
- **Critérios de aceite:**
  - Carregamento, lista vazia e falha são estados distintos e perceptíveis sem depender somente de cor.
  - Erros de busca e de consulta explicam qual operação falhou; dados ausentes/inválidos não parecem resultado válido.
  - Cada ação de tentar novamente repete a operação correspondente, sem retry automático.
  - Mensagens de estado são expostas de forma acessível; campos meteorológicos indisponíveis não recebem valores substitutos.
- **Dependências:** T-06, T-07, T-08, T-09.
- **Arquivos prováveis:** `src/components/states/LoadingState.tsx`, `src/components/states/EmptyState.tsx`, `src/components/states/ErrorState.tsx`
- **Tipo:** UI

### T-12 — Compor a tela responsiva e acessível
- **Descrição:** Integrar busca, resultados, clima, previsão, unidade e estados em uma página utilizável em telas móveis e desktop.
- **Requisitos:** FR-01–FR-07; AC-5.1–AC-5.3; NFR-01, NFR-02, NFR-05, NFR-06.
- **Critérios de aceite:**
  - A página integra os componentes e callbacks de `useWeather`, preservando estados e identidade da cidade.
  - Busca, seleção, consulta e troca de unidade são operáveis em viewport móvel; conteúdo principal não exige rolagem horizontal.
  - Layout adapta conteúdo sem ocultar resultados, controles ou mensagens.
  - Controles têm nomes compreensíveis, suporte a teclado e estados de carregamento/erro perceptíveis.
  - Origem e horário dos dados são apresentados quando disponíveis, sem inventar metadados.
- **Dependências:** T-07, T-08, T-09, T-10, T-11.
- **Arquivos prováveis:** `src/App.tsx`, `src/index.css`, `src/components/`
- **Tipo:** UI

## Testes e validação

### T-13 — Testar serviços, funções puras e coordenação
- **Descrição:** Cobrir com testes unitários contratos HTTP, validação/mapeamento, funções puras e estados concorrentes do hook.
- **Requisitos:** FR-01–FR-07; AC-1.1–AC-1.4, AC-2.1–AC-2.4, AC-3.1–AC-3.4, AC-4.1–AC-4.3, AC-6.1, AC-6.2, AC-7.3; NFR-04.
- **Critérios de aceite:**
  - Testes de busca verificam normalização/codificação, resultados válidos e vazios, payload inválido, HTTP, rede, timeout e cancelamento.
  - Testes de previsão verificam parâmetros, Celsius, fuso, exatamente cinco dias, arrays incoerentes e dados atuais ausentes.
  - Testes puros cobrem conversão nos dois sentidos, formatação de datas locais e tradução de códigos.
  - Testes do hook verificam estados independentes, seleção manual, retry e descarte de resposta obsoleta.
- **Dependências:** T-02, T-03, T-04, T-05, T-06.
- **Arquivos prováveis:** `tests/unit/weatherService.test.ts`, `tests/unit/temperature.test.ts`, `tests/unit/useWeather.test.ts`
- **Tipo:** Test

### T-14 — Testar componentes e fluxos integrados da interface
- **Descrição:** Verificar interações, acessibilidade básica e distinção dos estados nos componentes e na página.
- **Requisitos:** FR-01–FR-07; AC-1.1–AC-1.4, AC-2.1–AC-2.4, AC-3.1–AC-3.3, AC-4.1–AC-4.4, AC-5.1–AC-5.3, AC-6.1, AC-6.2, AC-7.1–AC-7.3; NFR-01, NFR-02, NFR-05.
- **Critérios de aceite:**
  - Testes verificam submissão de busca, seleção, resultados vazios e estados distintos de carregamento/erro.
  - Alternar unidade atualiza temperaturas atuais e da previsão sem nova chamada.
  - Selecionar outra cidade atualiza identificação e dados sem misturar respostas.
  - Controles principais têm nomes acessíveis e podem ser usados por teclado; estado de erro/loading é anunciado ou exposto semanticamente.
- **Dependências:** T-07, T-08, T-09, T-10, T-11, T-12.
- **Arquivos prováveis:** `tests/unit/App.test.tsx`, `tests/unit/UnitToggle.test.tsx`
- **Tipo:** Test

### T-15 — Validar os fluxos completos e responsivos em E2E
- **Descrição:** Cobrir com Playwright os fluxos principais e de recuperação, usando respostas externas determinísticas interceptadas.
- **Requisitos:** FR-01–FR-07; AC-1.1–AC-1.4, AC-2.1–AC-2.4, AC-3.1–AC-3.4, AC-4.1–AC-4.4, AC-5.1–AC-5.3, AC-6.1, AC-6.2, AC-7.1–AC-7.3; NFR-01, NFR-02, NFR-04, NFR-05.
- **Critérios de aceite:**
  - Fluxo feliz cobre busca, seleção, clima atual, cinco dias e alternância de unidade.
  - Cenários cobrem busca vazia, falha/timeout e retry, além da troca de cidade durante carregamento sem exibir resposta antiga.
  - Em viewport móvel, os controles e fluxos principais são utilizáveis sem rolagem horizontal.
  - Respostas externas são mockadas e compatíveis com os contratos validados; `pnpm test:e2e` conclui sem falhas.
- **Dependências:** T-12, T-13, T-14.
- **Arquivos prováveis:** `tests/e2e/weather.spec.ts`
- **Tipo:** Test

## Hardening

### T-17 — Reforçar acessibilidade e experiência responsiva
- **Descrição:** Revisar navegação por teclado, foco, nomes e anúncios acessíveis, contraste e movimento reduzido; validar a experiência principal em telas de 320 px.
- **Requisitos:** AC-1.1–AC-1.4, AC-4.1–AC-4.4, AC-5.1–AC-5.3, AC-7.1–AC-7.3; NFR-01, NFR-02, NFR-03, NFR-05.
- **Critérios de aceite:**
  - Busca, resultados, unidade e nova tentativa podem ser operados com teclado e têm foco visível.
  - Rótulos e estados de carregamento, resultados e erro são expostos semanticamente; a busca vazia comunica a necessidade de um termo.
  - Texto secundário mantém contraste legível e animações respeitam `prefers-reduced-motion`.
  - Busca, seleção, clima, previsão e alternância de unidade funcionam a 320 px sem rolagem horizontal.
  - Trocar unidade não causa nova requisição nem recalcula/repete trabalho de rede.
- **Dependências:** T-07, T-10, T-11, T-12, T-14, T-15.
- **Arquivos prováveis:** `src/App.tsx`, `src/components/`, `src/styles/index.css`, `tests/unit/`, `tests/e2e/weather.spec.ts`
- **Tipo:** Hardening

### T-18 — Tratar dados parciais e endurecer casos de falha
- **Descrição:** Tornar medidas meteorológicas ausentes explícitas na interface sem inventar valores, preservar a rejeição de payloads inválidos e cobrir os casos de borda em testes.
- **Requisitos:** AC-2.3–AC-2.4, AC-3.1–AC-3.3, AC-7.1–AC-7.3; NFR-03, NFR-04.
- **Critérios de aceite:**
  - Campos atuais e diários opcionais ausentes/nulos aparecem como `—`, com informação equivalente para tecnologias assistivas.
  - Cinco datas válidas e ordenadas continuam obrigatórias; resposta sem estrutura utilizável, arrays incoerentes ou payload inválido resulta em erro, nunca em dias fabricados.
  - Timeout, falha de rede, cancelamento e retry continuam distinguíveis; cancelamento intencional não vira erro visível e retry permanece explícito.
  - Testes cobrem campos ausentes/nulos, resposta inválida, timeout, cancelamento e recuperação sem chamadas reais à API.
- **Dependências:** T-04, T-08, T-09, T-11, T-13, T-14, T-15.
- **Arquivos prováveis:** `src/types/weather.ts`, `src/services/weatherService.ts`, `src/components/CurrentWeather.tsx`, `src/components/ForecastCard.tsx`, `tests/unit/weatherService.test.ts`, `tests/e2e/weather.spec.ts`
- **Tipo:** Hardening
