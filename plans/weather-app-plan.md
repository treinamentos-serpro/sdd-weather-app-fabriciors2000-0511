# Plano técnico — Weather App

## Architecture (Overview)

### Decisão arquitetural

Aplicação de página única (SPA) em React, organizada em componentes de
apresentação, um hook de orquestração e um serviço isolado para comunicação com
a API meteorológica. O navegador chama a API pública diretamente; não há
necessidade atual de backend, banco de dados ou gerenciamento global de estado.

Open-Meteo é a fonte externa adotada para esta entrega SDD porque fornece
geocoding e previsão sem chave de API e está definida nas instruções do
repositório. A cobertura, disponibilidade, limites e condições de uso precisam
de aprovação formal de Produto antes de publicação externa; as decisões e
pendências estão em `docs/weather-app-product-decisions.md` (FR-01 a FR-04;
Open Questions 1, 6 e 7 da spec).

```text
┌────────────────────────────────────────────┐
│ React UI                                   │
│ SearchBar · CurrentWeather · ForecastList  │
│ UnitToggle · Loading/Empty/Error states    │
└───────────────────┬────────────────────────┘
                    │ ações do usuário / props
┌───────────────────▼────────────────────────┐
│ useWeather                                 │
│ busca · cidade selecionada · dados · status│
│ unidade de apresentação                    │
└───────────────────┬────────────────────────┘
                    │ contratos de domínio
┌───────────────────▼────────────────────────┐
│ weatherService                             │
│ busca · consulta · validação · mapeamento  │
└───────────────────┬────────────────────────┘
                    │ HTTPS / fetch
┌───────────────────▼────────────────────────┐
│ Open-Meteo Geocoding API + Forecast API    │
└────────────────────────────────────────────┘
```

### Limites e responsabilidades

- **UI:** recebe entradas e apresenta resultados, estados e ações; não monta
  URLs nem interpreta payloads externos.
- **Hook:** coordena busca, seleção, consulta, tentativas novamente e estado da
  tela; mantém buscas e consultas meteorológicas como fluxos distintos.
- **Serviço:** encapsula transporte HTTP, timeout, validação estrutural e
  transformação de respostas externas para tipos de domínio.
- **Bibliotecas puras (`src/lib/`):** formatam dados, traduzem códigos
  meteorológicos e convertem temperaturas sem efeitos colaterais.
- **API externa:** única fonte de resultados de cidades e dados meteorológicos
  nesta proposta; não há persistência local de resultados.

## Tech Stack

| Tecnologia | Uso e justificativa | Rastreabilidade |
|---|---|---|
| TypeScript strict | Tipos para contratos de domínio, respostas e estados reduzem combinações inválidas e facilitam validar dados externos. | FR-01 a FR-07; AC-2.4, AC-3.3 e AC-6.1 |
| React 19 | Componentes para busca, seleção, clima atual, previsão, unidade e estados de interface. | User Stories 1–7 |
| Vite 8 | Servidor de desenvolvimento e build já configurados no projeto. | Todos os fluxos |
| Tailwind CSS 3 | Estilização responsiva, já presente no stack do projeto. | FR-05; User Story 5; NFR-01 |
| Fetch API | Requisições HTTPS sem adicionar uma biblioteca HTTP para este escopo. | FR-01, FR-03 e FR-04 |
| Open-Meteo Geocoding e Forecast APIs | Fonte adotada para esta entrega; aprovação de cobertura, disponibilidade e termos para publicação externa ainda pendente. | FR-01 a FR-04; risco de provedor |
| Vitest + Testing Library | Testes unitários e de componentes já configurados no projeto. | Acceptance Criteria 1–7 |
| Playwright | Testes E2E dos fluxos principais e estados da aplicação; dependência já presente. | Acceptance Criteria 1–7 |
| Biome | Lint e formatação conforme configuração existente. | Qualidade geral |

Não introduzir Redux, uma biblioteca de estado, cliente HTTP ou persistência
enquanto o escopo permanecer restrito a uma única tela e não houver requisito
que justifique essas dependências.

## Project Structure

Estrutura proposta, alinhada às pastas já existentes no repositório:

```text
src/
  App.tsx                         # composição da página Weather App
  main.tsx                        # bootstrap da aplicação React
  components/
    SearchBar.tsx                 # termo de busca e escolha de cidade
    CurrentWeather.tsx            # condições atuais
    ForecastList.tsx              # previsão para os dias retornados
    ForecastCard.tsx              # apresentação de um dia
    UnitToggle.tsx                # escolha Celsius/Fahrenheit
    states/
      LoadingState.tsx            # feedback de carregamento
      EmptyState.tsx              # busca sem resultados/dados
      ErrorState.tsx              # falha e ação de nova tentativa
  hooks/
    useWeather.ts                 # estado e coordenação dos fluxos
  services/
    weatherService.ts             # API, validação e mapeamento
  types/
    weather.ts                    # tipos de domínio compartilhados
  lib/
    temperature.ts                # conversão de temperatura
    weatherCodes.ts               # descrição dos códigos da fonte
    format.ts                     # formatação de datas e valores

tests/
  unit/
    weatherService.test.ts        # HTTP, validação, mapeamento e falhas
    App.test.tsx                   # fluxos integrados da tela
    UnitToggle.test.tsx            # interação da unidade
    temperature.test.ts            # conversões e limites
  e2e/
    weather.spec.ts                # busca, seleção, clima e responsividade
```

Os caminhos refletem os componentes, serviços e testes existentes. Novos tipos
ou arquivos só devem ser adicionados quando necessários para os contratos e
critérios de aceite; não criar uma camada genérica de abstração para uma única
fonte.

## Data Model

Os tipos abaixo são contratos de domínio propostos, não a representação direta
dos JSONs externos. Valores externos devem ser validados e mapeados pelo serviço
antes de chegarem à UI.

```ts
export type TemperatureUnit = 'celsius' | 'fahrenheit';

export interface City {
  id: number;
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

export interface CurrentWeather {
  temperatureC: number;
  weatherCode: number;
  observedAt: string;
  humidityPercent?: number;
  windSpeedKmh?: number;
  pressureHpa?: number;
  precipitationMm?: number;
}

export interface ForecastDay {
  date: string;
  minTemperatureC: number;
  maxTemperatureC: number;
  weatherCode: number;
  precipitationProbabilityPercent?: number;
}

export type FiveDayForecast = readonly [
  ForecastDay,
  ForecastDay,
  ForecastDay,
  ForecastDay,
  ForecastDay,
];

export interface WeatherData {
  city: City;
  current: CurrentWeather;
  forecast: FiveDayForecast;
}

export type WeatherErrorKind =
  | 'network'
  | 'timeout'
  | 'http'
  | 'invalid-response';

export interface WeatherError {
  kind: WeatherErrorKind;
  message: string;
}
```

### Invariantes do domínio

- Coordenadas e identificador da cidade acompanham a seleção usada para
  consultar o clima, evitando associar dados a outra cidade (FR-02, FR-06;
  AC-6.1 e AC-6.2).
- Temperaturas são mantidas em Celsius no domínio; a conversão para a unidade
  escolhida ocorre somente na apresentação (FR-05; AC-4.1 a AC-4.3).
- Campos adicionais de clima são opcionais até Produto confirmar quais
  informações compõem clima atual e previsão (FR-03 e FR-04; Open Questions 4 e
  9).
- A camada de serviço só retorna sucesso quando os campos necessários estão
  presentes e válidos. Uma previsão incompleta não é completada com valores
  fabricados (AC-2.4 e AC-3.3).
- O serviço valida em runtime que foram recebidos cinco dias antes de montar
  `FiveDayForecast`; o tipo TypeScript sozinho não valida payloads de rede
  (AC-3.1 e AC-3.3).
- A interpretação de `date` e o critério para contar os cinco dias devem seguir
  a decisão de Produto sobre dias locais versus janela de 120 horas (AC-3.4;
  Open Question 5).

## Data Flow

### Busca e seleção

1. A pessoa informa um termo e submete a busca.
2. `SearchBar` chama a ação exposta por `useWeather`.
3. O hook limpa resultados antigos de busca, inicia o estado de carregamento e
   chama `searchCities(query)` no serviço.
4. O serviço remove espaços externos, codifica o termo como parâmetro de URL,
   consulta o geocoding, valida a resposta e mapeia cada resultado para `City`.
5. O hook publica lista de cidades, estado vazio ou erro. Não seleciona
   automaticamente o primeiro resultado: a pessoa deve selecionar a cidade
   desejada (FR-02; AC-1.1).
6. A seleção chama `getWeather(city)` com as coordenadas da cidade escolhida.

### Consulta e apresentação meteorológica

1. O hook define a cidade selecionada e inicia o carregamento dos dados para
   ela.
2. O serviço consulta a Forecast API usando coordenadas e fuso horário local
   retornado pelo provedor, valida os campos e mapeia clima atual e cinco
   registros diários para `WeatherData`.
3. Em caso de resposta incompleta, falha ou timeout, o serviço retorna erro
   tipado; o hook publica o estado de erro sem substituir a resposta por dados
   de outra cidade.
4. Em sucesso, o hook publica os dados de domínio; componentes exibem a cidade,
   condições atuais e previsão.
5. `weatherCodes.ts` traduz códigos para descrições de apresentação e
   `format.ts` formata datas/valores.
6. A mudança de unidade atualiza estado de apresentação local e converte as
   temperaturas visíveis; não dispara uma nova consulta (FR-05; AC-4.3).

Se uma nova seleção acontecer enquanto outra consulta estiver em andamento, a
resposta obsoleta deve ser cancelada quando possível ou descartada por
identificador da requisição. Ela nunca deve substituir os dados da seleção mais
recente (AC-6.2).

## External APIs

### Open-Meteo Geocoding API — decisão desta entrega

- **Método/endpoint:** `GET https://geocoding-api.open-meteo.com/v1/search`
- **Parâmetros propostos:**
  - `name`: termo de busca codificado como query string.
  - `count`: limite de resultados, inicialmente 10 (ajustável conforme a UX).
  - `language`: inicialmente `pt`, sujeito à decisão sobre idiomas suportados.
  - `format`: `json`.
- **Mapeamento:** `id`, `name`, `country`, `admin1`, `latitude`, `longitude` e,
  se disponível, `timezone` para o contrato `City`.
- **Sem resultados:** lista `results` ausente/vazia significa estado vazio
  apenas se a resposta tiver formato válido. JSON inválido ou estrutura
  incompatível deve ser erro, não busca vazia.

Exemplo de formato de requisição:

```text
GET /v1/search?name={query}&count=10&language=pt&format=json
```

### Open-Meteo Forecast API — decisão desta entrega

- **Método/endpoint:** `GET https://api.open-meteo.com/v1/forecast`
- **Parâmetros mínimos propostos:**
  - `latitude` e `longitude`: coordenadas da cidade selecionada.
  - `current=temperature_2m,weather_code`: temperatura atual e código da
    condição.
  - `daily=weather_code,temperature_2m_max,temperature_2m_min`: código e
    temperaturas mínima/máxima diária.
  - `forecast_days=5`: solicita cinco datas diárias.
  - `timezone=auto`: solicita horários/datas no fuso local da coordenada.
- **Unidade:** manter a resposta de temperatura em Celsius para o modelo de
  domínio; a UI converte para Fahrenheit quando selecionado.
- **Validação:** confirmar status HTTP, estrutura e comprimentos coerentes dos
  arrays diários; exigir clima atual e exatamente cinco registros para sucesso.
- **Período:** cinco datas consecutivas do calendário local retornadas em
  ordem cronológica por `forecast_days=5` e `timezone=auto`, incluindo a
  primeira data diária da resposta. O contrato está registrado em
  `docs/weather-app-product-decisions.md`; a confirmação formal de Produto
  continua sendo gate para publicação externa.

Exemplo de formato de requisição:

```text
GET /v1/forecast?latitude={lat}&longitude={lon}
  &current=temperature_2m,weather_code
  &daily=weather_code,temperature_2m_max,temperature_2m_min
  &forecast_days=5&timezone=auto
```

As URLs e parâmetros são a decisão técnica desta entrega baseada na API pública
do Open-Meteo. Confirmar termos de uso, atribuição, disponibilidade, cobertura
geográfica e estabilidade antes de publicação externa.

### Contratos do serviço

```ts
searchCities(
  query: string,
  options?: { signal?: AbortSignal },
): Promise<City[]>;

getWeather(
  city: City,
  options?: { signal?: AbortSignal },
): Promise<WeatherData>;
```

O serviço rejeita a promise com `WeatherServiceError` tipado para falhas de
rede, timeout, HTTP ou resposta inválida. Cancelamento por troca de consulta
não deve ser apresentado como falha ao usuário.

## State Management

Usar estado local React, encapsulado em `useWeather`; os componentes recebem
estado e callbacks por props. Não adicionar biblioteca de estado global, pois o
escopo atual consiste em uma experiência de página única (FR-01 a FR-07).

O estado deve manter separadamente:

- **Busca:** termo, resultados e status `idle | loading | success | empty |
  error`.
- **Seleção:** cidade atualmente selecionada.
- **Clima:** dados da cidade selecionada, status `idle | loading | success |
  error` e erro associado à consulta, se houver.
- **Apresentação:** unidade escolhida (`celsius | fahrenheit`).

A separação evita que “busca sem resultados” seja confundida com erro de
previsão e permite apresentar a unidade sem refazer chamadas (AC-1.2, AC-4.3 e
AC-7.1). Para esta entrega, a unidade inicial é Celsius e a preferência não é
persistida em `localStorage` ou em conta de usuário. A aprovação formal de
Produto para publicação externa continua pendente (Open Question 8).

Cada novo fluxo de busca/consulta deve invalidar ou cancelar o anterior quando
ele puder produzir resposta obsoleta. A ação de tentar novamente repete somente
a operação que falhou: busca para erro de geocoding ou consulta para erro da
cidade já selecionada (FR-07; AC-7.3).

## Error Handling

- **Carregamento:** iniciar antes da requisição e manter até sucesso, vazio ou
  erro; comunicar visualmente e de modo acessível (AC-1.3, AC-2.2, AC-3.2).
- **Busca vazia:** validar entrada composta apenas por espaços antes de chamar a
  API; informar que um termo é necessário, sem transformar isso em falha de
  rede.
- **Sem resultados:** exibir estado vazio distinto de erro; manter a possibilidade
  de ajustar o termo.
- **Rede, HTTP e timeout:** mapear para erro tipado e mensagem em português,
  preservar contexto da operação e oferecer nova tentativa quando aplicável.
  Timeout definido para esta entrega: 10 segundos por requisição; confirmar ou
  ajustar esse limite com Produto antes de publicação externa (Open Question 10).
- **Resposta inválida/incompleta:** falhar explicitamente; não converter payload
  malformado em lista vazia nem preencher dados ausentes com valores padrão
  (AC-2.4 e AC-3.3).
- **Corrida entre requisições:** cancelar ou ignorar respostas de consultas
  antigas; cancelamento intencional não gera mensagem de erro (AC-6.2).
- **Retry:** acionamento explícito pela pessoa usuária; não executar retries
  automáticos nesta primeira versão, evitando tráfego adicional e estados
  duplicados.
- **Offline/cache:** sem fallback offline ou apresentação de dados antigos como
  atuais até haver requisito e política de expiração aprovados (Edge Cases;
  Open Question 14).

### Hardening de produção

- Representar campos meteorológicos ausentes como indisponíveis e exibir `—`,
  sem completar dados; ainda exigir estrutura válida e cinco datas de previsão
  para não sugerir cobertura que a resposta não oferece.
- Manter busca, seleção, unidade e recuperação operáveis por teclado, com foco
  visível, nomes/estados semânticos e contraste legível; respeitar preferência
  por movimento reduzido.
- Validar o fluxo principal a 320 px sem rolagem horizontal. A alternância de
  unidade permanece local e não deve gerar chamadas adicionais à API.

## Testing Strategy

### Unitários — Vitest

- Serviço de geocoding: query vazia/normalizada, codificação de URL,
  mapeamento de cidade, resultados vazios e validação de payload.
- Serviço de previsão: parâmetros, mapeamento de Celsius, timezone, exatamente
  cinco dias e rejeição de arrays inconsistentes.
- Erros: resposta HTTP não-OK, rede, timeout, JSON inválido e resposta
  incompleta; cancelamento não deve ser tratado como erro visível.
- Funções puras: conversão Celsius/Fahrenheit, formatação de datas locais e
  tradução de códigos meteorológicos.
- Hook: estados independentes de busca e clima, seleção manual, retry e
  descarte de resposta obsoleta.

### Componentes — Testing Library

- Busca permite submeter, selecionar uma cidade e tratar resultados vazios.
- Estados de carregamento, vazio e erro são distintos e acessíveis.
- Alternar unidades atualiza todas as temperaturas sem nova chamada à API.
- Selecionar outra cidade atualiza identificação, clima e previsão sem misturar
  respostas.
- Controles principais têm nomes acessíveis e suportam teclado.

### E2E — Playwright

- Fluxo feliz: buscar cidade, selecionar um resultado, consultar clima atual,
  visualizar cinco dias e alternar unidade.
- Fluxo de recuperação: busca vazia, falha/timeout e nova tentativa.
- Troca de cidade durante carregamento não apresenta dados da resposta antiga.
- Verificar acessibilidade básica dos controles e uso dos fluxos em viewport
  móvel, sem rolagem horizontal.
- Interceptar/mocar as respostas externas nos testes E2E para tornar resultados
  determinísticos; manter contratos de payload coerentes com a API validada.

Comandos disponíveis no projeto: `pnpm test`, `pnpm test:e2e`, `pnpm lint` e
`pnpm build`. A execução ocorre nas fases de Code/Test, não durante a produção
deste plano.

## Risks & Trade-offs

| Risco / trade-off | Consequência | Decisão ou mitigação |
|---|---|---|
| Open-Meteo ainda não recebeu aprovação formal de Produto para publicação externa. | Cobertura, termos ou disponibilidade podem não satisfazer o produto. | Usar como fonte da entrega SDD conforme as instruções do repositório; confirmar cobertura, atribuição e termos antes de publicar externamente. Manter a integração isolada no serviço facilita substituição sem acoplar UI. |
| Chamadas diretas do browser dependem de conectividade, disponibilidade externa e CORS do provedor. | Falha de serviço interrompe busca/consulta; não há cache ou fallback. | Tratar erros e timeout explicitamente. Introduzir backend/proxy só se requisitos de segurança, quota ou disponibilidade exigirem. |
| Detalhes de clima atual e previsão permanecem em aberto. | Contratos de dados e apresentação podem mudar quando os campos forem definidos. | Limitar os campos obrigatórios aos mínimos propostos para temperatura e condição; deixar demais métricas opcionais até confirmação. |
| A definição temporal dos cinco dias adotada ainda não foi aprovada formalmente por Produto. | A expectativa externa pode diferir das cinco datas locais implementadas. | Esta entrega usa cinco datas locais consecutivas na ordem da API; solicitar confirmação formal antes de publicação externa. |
| Conversão de unidade apenas na UI mantém uma única unidade canônica, mas exige conversão consistente em todos os componentes. | Um componente pode exibir temperatura em unidade diferente. | Centralizar conversão em função pura compartilhada e testar clima atual e previsão juntos. |
| Uma máquina de estados simples exige controle de respostas obsoletas. | Resposta lenta anterior pode sobrescrever seleção recente. | Usar `AbortController` quando possível e validar identidade da requisição/cidade antes de publicar estado. |
| Contagem exata de cinco dias como tupla melhora o contrato de domínio, mas depende de validação runtime. | Payload externo não confiável pode violar o tipo declarado. | Validar estrutura e quantidade no serviço antes de construir `WeatherData`; não confiar em casts de payload. |
| Sem persistência reduz complexidade, mas preferências e cidade não sobrevivem à recarga. | Pode haver expectativa de lembrar unidade ou local. | Esta entrega inicia em Celsius e não persiste unidade/cidade; confirmar a expectativa de Produto antes de publicação externa (Open Question 8). |
| Métricas de performance, matriz de dispositivos e padrão de acessibilidade ainda não foram definidos. | Difícil demonstrar conformidade quantitativa. | Confirmar metas e dispositivos prioritários antes de definir critérios de release (NFR-01 a NFR-03; Open Questions 10 e 12). |
