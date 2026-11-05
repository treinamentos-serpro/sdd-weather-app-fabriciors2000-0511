# Especificação do produto — Weather App

## Overview

O Weather App permite que pessoas encontrem uma cidade e consultem as condições
climáticas atuais e a previsão para cinco dias. A temperatura pode ser exibida
em Celsius ou Fahrenheit, e a experiência deve funcionar também em dispositivos
móveis.

### Objetivos

- Encontrar e selecionar uma cidade para consultar suas informações
  meteorológicas.
- Apresentar o clima atual e uma previsão de cinco dias para a cidade
  selecionada.
- Permitir alternar entre Celsius e Fahrenheit.
- Tornar as funções principais utilizáveis em telas móveis.
- Comunicar estados de carregamento, resultados vazios e falhas sem apresentar
  dados como se fossem atuais quando não puderem ser confirmados.

### Escopo do MVP

O escopo confirmado limita-se à busca de cidades, consulta do clima atual,
consulta da previsão de cinco dias, alternância de unidade de temperatura e uso
em dispositivos móveis. Os detalhes ainda não decididos estão registrados em
**Open Questions** e não devem ser considerados decisões tomadas.

## Functional Requirements

| ID | Requisito |
|---|---|
| FR-01 | O sistema deve permitir que a pessoa usuária informe um termo de busca para encontrar cidades. |
| FR-02 | O sistema deve apresentar os resultados encontrados de forma que a pessoa usuária possa identificar e selecionar a cidade desejada. As informações de desambiguação necessárias ainda precisam ser decididas. |
| FR-03 | Após a seleção de uma cidade, o sistema deve apresentar as condições climáticas atuais disponíveis para esse local. Os campos que compõem essas condições serão definidos após a escolha da fonte e a confirmação das necessidades de negócio. |
| FR-04 | Para a cidade selecionada, o sistema deve apresentar uma previsão que cubra cinco dias. A definição de dia e os campos de previsão ainda precisam ser confirmados. |
| FR-05 | O sistema deve permitir escolher Celsius ou Fahrenheit para a exibição de temperaturas. A unidade escolhida deve ser aplicada consistentemente às temperaturas visíveis da cidade selecionada. |
| FR-06 | O sistema deve permitir iniciar uma nova busca e selecionar outra cidade sem confundir os dados meteorológicos do novo local com os do local anterior. |
| FR-07 | O sistema deve comunicar carregamento, ausência de resultados e falha ao buscar cidades ou carregar dados meteorológicos. Quando uma ação de recuperação estiver disponível, deve permitir que a pessoa usuária tente novamente. |

## User Stories

1. Como pessoa que consulta o tempo, quero buscar uma cidade para encontrar o
   local cujas condições desejo conhecer.
2. Como pessoa que consulta o tempo, quero ver as condições atuais de uma cidade
   selecionada para entender o clima nesse local.
3. Como pessoa que planeja os próximos dias, quero ver a previsão de cinco dias
   para uma cidade selecionada para considerar as condições esperadas.
4. Como pessoa que prefere uma unidade específica, quero alternar entre Celsius
   e Fahrenheit para interpretar as temperaturas na unidade que conheço.
5. Como pessoa que usa um dispositivo móvel, quero acessar busca e informações
   meteorológicas em uma tela pequena para consultar o tempo fora de um
   computador.
6. Como pessoa que pesquisa locais diferentes, quero selecionar outra cidade
   para consultar seus dados sem misturá-los com os da cidade anterior.
7. Como pessoa que encontra uma falha ou uma busca sem resultados, quero receber
   uma explicação clara e uma opção de recuperação quando possível para saber
   como prosseguir.

## Acceptance Criteria

### História 1 — Buscar uma cidade

- **AC-1.1:** Dado que a pessoa usuária informa um termo de busca e a busca
  retorna cidades, quando os resultados forem apresentados, então cada
  resultado deve ser selecionável.
- **AC-1.2:** Dado que a busca não retorna cidades, quando a resposta for
  apresentada, então o sistema deve indicar que não encontrou resultados e não
  deve exibir uma cidade como se fosse uma correspondência.
- **AC-1.3:** Dado que a busca está em andamento, quando os resultados ainda não
  estiverem disponíveis, então o sistema deve comunicar o estado de
  carregamento.
- **AC-1.4:** Dado que a busca falha, quando o sistema receber ou detectar a
  falha, então deve informar que não foi possível buscar cidades e, quando
  possível, oferecer nova tentativa.

### História 2 — Ver o clima atual

- **AC-2.1:** Dada uma cidade selecionada e uma resposta atual válida, quando os
  dados forem carregados, então o sistema deve identificar o local selecionado
  e apresentar as condições atuais disponíveis para ele.
- **AC-2.2:** Dado que os dados atuais estão sendo carregados, quando ainda não
  houver resposta, então o sistema deve indicar carregamento e não deve
  apresentar dados de outra cidade como resposta para o local selecionado.
- **AC-2.3:** Dado que os dados atuais não estão disponíveis ou a consulta falha,
  quando o sistema apresentar o resultado, então deve comunicar que não foi
  possível carregar as condições atuais e não deve inventar valores.
- **AC-2.4:** Dada uma resposta que não contém dados atuais utilizáveis, quando
  a consulta terminar, então o sistema deve indicar que os dados atuais não
  estão disponíveis, em vez de apresentar conteúdo vazio como resultado válido.

### História 3 — Ver a previsão de cinco dias

- **AC-3.1:** Dada uma cidade selecionada e uma resposta válida de previsão,
  quando os dados forem carregados, então o sistema deve apresentar a previsão
  para cinco dias associada àquela cidade.
- **AC-3.2:** Dado que a previsão está sendo carregada, quando ainda não houver
  resposta, então o sistema deve indicar carregamento e não deve associar a
  previsão de outra cidade à seleção atual.
- **AC-3.3:** Dado que a previsão falha ou não contém dados utilizáveis para
  cinco dias, quando o resultado for apresentado, então o sistema deve comunicar
  que a previsão completa não está disponível e não deve preencher os dias
  ausentes com valores inventados.
- **AC-3.4:** Quando a previsão for apresentada, então seus cinco dias devem
  seguir uma definição única de período e ordenação, a ser confirmada antes da
  implementação.

### História 4 — Alternar a unidade de temperatura

- **AC-4.1:** Dado que uma cidade possui temperaturas visíveis, quando a pessoa
  usuária seleciona Celsius, então todas as temperaturas visíveis devem ser
  apresentadas em Celsius.
- **AC-4.2:** Dado que uma cidade possui temperaturas visíveis, quando a pessoa
  usuária seleciona Fahrenheit, então todas as temperaturas visíveis devem ser
  apresentadas em Fahrenheit.
- **AC-4.3:** Quando a unidade for alternada, então as temperaturas atuais e da
  previsão devem manter os mesmos locais e períodos; somente sua representação
  em unidade deve mudar.
- **AC-4.4:** A unidade selecionada deve ser identificável junto aos valores
  exibidos. A unidade inicial e a persistência da preferência entre sessões
  permanecem pendentes de decisão.

### História 5 — Usar em um dispositivo móvel

- **AC-5.1:** Em uma tela móvel, a pessoa usuária deve conseguir alcançar e usar
  a busca, selecionar uma cidade, consultar os dados e alternar a unidade.
- **AC-5.2:** Em uma tela móvel, o conteúdo principal não deve exigir rolagem
  horizontal para acessar informações ou controles.
- **AC-5.3:** A apresentação deve adaptar a disposição do conteúdo ao espaço
  disponível sem ocultar estados de carregamento, mensagens de erro ou
  resultados.

### História 6 — Selecionar outra cidade

- **AC-6.1:** Dada uma cidade já selecionada, quando a pessoa usuária buscar e
  selecionar outra, então a identificação do local e os dados atuais e de
  previsão apresentados devem corresponder à nova seleção.
- **AC-6.2:** Enquanto os dados da nova seleção estiverem carregando, o sistema
  deve deixar claro que a consulta está em andamento e não deve atribuir dados do
  local anterior ao novo local.

### História 7 — Lidar com estados vazios e falhas

- **AC-7.1:** Para uma busca sem correspondências, o sistema deve apresentar um
  estado vazio que diferencie ausência de resultados de carregamento e de falha.
- **AC-7.2:** Para falhas de busca ou de consulta meteorológica, o sistema deve
  apresentar uma mensagem compreensível e distinguir a falha de uma resposta
  válida sem dados.
- **AC-7.3:** Quando houver uma opção de nova tentativa, acioná-la deve repetir a
  ação correspondente sem exigir que a pessoa usuária interprete uma falha como
  resultado válido.

## Non-Functional Requirements

| ID | Requisito | Critério / pendência |
|---|---|---|
| NFR-01 | Responsividade: as funções principais devem ser utilizáveis em dispositivos móveis e em diferentes dimensões de tela. | Validar os fluxos de busca, seleção, consulta e troca de unidade em telas móveis. A matriz de dispositivos e navegadores suportados permanece em aberto. |
| NFR-02 | Acessibilidade: controles e resultados devem ter identificação compreensível e estados relevantes devem ser perceptíveis. | Busca e seleção devem poder ser operadas por teclado; mensagens de carregamento e erro devem ser comunicadas sem depender apenas de cor. O padrão de conformidade e a validação com tecnologias assistivas precisam ser definidos. |
| NFR-03 | Desempenho: a busca e a consulta devem comunicar que estão em andamento enquanto aguardam resposta. | Metas numéricas de resposta, percentis e condições de rede não foram fornecidos e precisam ser definidos antes de se tornarem critérios quantitativos de aceite. |
| NFR-04 | Confiabilidade dos dados: o sistema não deve inventar nem apresentar como atual uma resposta ausente, inválida ou pertencente a outra cidade. | Verificável nos cenários de falha, dados incompletos e troca de cidade dos critérios de aceite. A fonte e a disponibilidade dos dados permanecem pendentes. |
| NFR-05 | Clareza: cada temperatura apresentada deve permitir identificar a unidade em uso, e os estados de carregamento, vazio e erro devem ser distinguíveis. | Verificável por inspeção da interface e pelos critérios de aceite de busca e unidade. |
| NFR-06 | Atualidade e transparência: a origem e o horário dos dados devem ser apresentados quando disponíveis na fonte. | A fonte pode não fornecer esses metadados; a seleção do provedor e o comportamento nesse caso permanecem em aberto. |

## Edge Cases

| Cenário | Comportamento esperado |
|---|---|
| Campo de busca vazio ou contendo apenas espaços | Não tratar como uma busca válida nem selecionar uma cidade implicitamente; informar a necessidade de um termo, se a pessoa tentar buscar. |
| Busca sem resultados | Apresentar estado vazio, sem confundi-lo com falha ou carregamento. |
| Mais de uma cidade com o mesmo nome | Permitir que a pessoa identifique a cidade correta antes de consultar o clima; os campos de desambiguação ainda precisam ser definidos. |
| A busca falha ou excede o tempo de resposta | Comunicar que não foi possível concluir a busca e oferecer nova tentativa quando possível. A duração que caracteriza timeout precisa ser definida. |
| A consulta meteorológica falha ou excede o tempo de resposta | Comunicar a falha para a consulta correspondente e não apresentar valores inventados. |
| Resposta meteorológica vazia, incompleta ou inválida | Mostrar indisponibilidade para os dados ausentes; não substituir valores por dados não confirmados nem sugerir que a previsão cobre os cinco dias quando não cobre. |
| A pessoa seleciona outra cidade durante uma consulta | Não associar a resposta anterior à nova seleção; identificar claramente qual cidade corresponde aos dados apresentados. |
| Alternância de unidade antes de haver dados | Atualizar a unidade escolhida para os próximos valores exibidos sem gerar temperaturas inexistentes. |
| Valor de temperatura ausente | Não exibir um número substituto; indicar indisponibilidade para esse valor. |
| Dispositivo com largura reduzida ou orientação diferente | Manter controles e conteúdo principais utilizáveis sem exigir rolagem horizontal. |
| Conexão indisponível | Comunicar que a consulta não pôde ser concluída; não presumir suporte offline nem apresentar dados armazenados como atuais. |

## Assumptions

- A cidade deve ser selecionada a partir dos resultados da busca antes de
  associar a ela as informações meteorológicas.
- “Celsius ou Fahrenheit” refere-se à unidade de temperatura; a conversão ou
  apresentação de outras grandezas não está incluída sem decisão adicional.
- “Previsão de cinco dias” significa que a experiência deve cobrir cinco dias,
  mas os limites temporais e o detalhamento diário dependem de confirmação.
- O sistema depende de uma fonte de dados meteorológicos e de conectividade para
  realizar buscas e consultas. Nenhum provedor específico foi escolhido.
- Mensagens de carregamento, estados vazios e erros são necessários para que a
  pessoa usuária diferencie uma consulta em andamento, uma resposta sem dados e
  uma falha.
- Não se presume localização automática, conta de usuário, persistência de
  preferências, favoritos, histórico ou funcionamento offline.

## Risks

| Risco | Impacto | Mitigação |
|---|---|---|
| A fonte meteorológica pode estar indisponível, desatualizada ou não cobrir as regiões necessárias. | Consultas incompletas ou impossíveis e perda de confiança nos dados. | Confirmar cobertura, atualização, disponibilidade, limites e condições de uso antes de escolher a fonte; definir comunicação de falhas. |
| Cidades homônimas podem levar a uma seleção incorreta. | A pessoa pode interpretar dados de uma localidade diferente. | Definir informações de desambiguação nos resultados e validar o fluxo de seleção. |
| A expressão “previsão de cinco dias” pode gerar interpretações diferentes. | O produto pode exibir períodos ou quantidade de dias diferentes da expectativa. | Decidir se são dias do calendário local ou uma janela de 120 horas e definir o conteúdo de cada dia. |
| Campos meteorológicos e horários podem variar por fonte ou região. | A informação pode ser inconsistente ou difícil de interpretar. | Definir os campos mínimos, unidades, fuso horário e apresentação da última atualização após avaliar a fonte. |
| Unidades inconsistentes entre clima atual e previsão. | A pessoa pode interpretar valores incorretamente. | Aplicar a unidade selecionada a todas as temperaturas visíveis e identificá-la junto aos valores. |
| Respostas lentas, falhas de conexão ou dados incompletos. | Experiência confusa ou apresentação de informações enganosas. | Definir estados de carregamento, vazio, erro e timeout; não inventar dados nem atribuir resultados a outra cidade. |
| Interface inadequada a telas pequenas ou necessidades de acessibilidade. | Parte das pessoas não conseguirá usar as funções principais. | Validar responsividade, navegação por teclado e comunicação dos estados; confirmar matriz de suporte e critérios de conformidade. |
| Restrições contratuais, de atribuição ou de uso da fonte. | Necessidade de alterar a solução ou impossibilidade de disponibilizar o serviço como previsto. | Analisar termos, limites, atribuição exigida e viabilidade da fonte antes de assumir sua adoção. |

## Out of Scope

Não fazem parte do escopo confirmado desta especificação:

- Alertas meteorológicos ou notificações.
- Localização automática por GPS ou endereço IP.
- Favoritos, cidades recentes, histórico de buscas ou sincronização entre
  dispositivos.
- Cadastro, autenticação ou perfis de usuário.
- Funcionamento offline ou garantia de dados em cache.
- Widgets, mapas, radar, dados históricos ou comparação entre cidades.
- Previsões para além dos cinco dias solicitados.
- Conversão ou seleção de unidades além de Celsius e Fahrenheit para
  temperatura.

Esses itens podem ser reconsiderados se houver decisão explícita de produto.

## Open Questions

As perguntas abaixo precisam ser respondidas para remover as ambiguidades
identificadas no Discovery e fechar os critérios de produto:

1. Quais países ou regiões devem estar cobertos pela busca e pela previsão?
2. A busca deve aceitar nomes parciais, acentos e múltiplos idiomas? Deve
   apresentar sugestões enquanto a pessoa digita ou buscar após confirmação?
3. Quais informações devem identificar cada resultado e desambiguar cidades
   homônimas (por exemplo, estado/província e país)?
4. Quais campos definem o clima atual e quais dados devem ser apresentados para
   cada dia da previsão?
5. “Cinco dias” corresponde aos próximos cinco dias do calendário local ou a
   uma janela contínua de 120 horas?
6. Qual fonte meteorológica deve ser usada? Quais cobertura, frequência de
   atualização, disponibilidade, limites, atribuição e condições de uso são
   necessários?
7. A interface deve mostrar horário local da cidade, origem dos dados e horário
   da última atualização? Como agir se a fonte não fornecer esses metadados?
8. A unidade inicial deve ser Celsius ou Fahrenheit, ou determinada por alguma
   regra? A preferência deve persistir após recarregar ou reabrir a aplicação?
9. A troca entre Celsius e Fahrenheit afeta somente temperaturas? Como devem
   ser tratadas outras grandezas meteorológicas?
10. Qual deve ser o tempo máximo de espera antes de indicar timeout e quais
    metas de desempenho são esperadas para busca e consultas?
11. Qual idioma ou conjunto de idiomas deve ser suportado?
12. Quais dispositivos, navegadores, larguras de tela e orientações devem ser
    suportados? Há um padrão de acessibilidade ou nível de conformidade exigido?
13. Deve existir uma cidade inicial, localização automática ou opção para salvar
    locais? Se localização automática for desejada, como será solicitado e
    tratado o consentimento?
14. É necessário suportar consulta offline ou exibir dados previamente
    carregados? Em caso afirmativo, por quanto tempo esses dados podem ser
    considerados úteis e como serão identificados como desatualizados?
