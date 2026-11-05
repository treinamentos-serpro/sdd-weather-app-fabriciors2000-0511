# Discovery — Aplicação de previsão do tempo

## Contexto e objetivo

O briefing solicita uma aplicação que permita encontrar cidades e consultar o
clima atual e uma previsão para cinco dias, com opção de exibir temperaturas em
Celsius ou Fahrenheit. A aplicação também precisa ser utilizável em dispositivos
móveis.

Esta análise organiza o que foi explicitamente solicitado, registra requisitos
não-funcionais preliminares e destaca decisões que precisam ser respondidas
antes da especificação detalhada. Não define provedor de dados nem presume
comportamentos que não aparecem no briefing.

## Requisitos funcionais

| ID | Requisito | Origem / observação |
|---|---|---|
| RF-01 | Permitir que a pessoa usuária busque cidades. | O briefing não define critérios de busca, formato de entrada nem como diferenciar cidades homônimas. |
| RF-02 | Permitir consultar as condições climáticas atuais de uma cidade selecionada. | Os dados que compõem “clima atual” ainda precisam ser definidos. |
| RF-03 | Permitir consultar a previsão do tempo para cinco dias de uma cidade selecionada. | O briefing não especifica se são dias corridos ou períodos de 24 horas, nem quais dados devem ser exibidos. |
| RF-04 | Permitir alternar a unidade de temperatura entre Celsius e Fahrenheit. | É necessário confirmar o escopo da preferência e se a conversão deve afetar apenas temperaturas ou outras unidades também. |

## Requisitos não-funcionais

Os itens abaixo são implicações ou expectativas preliminares do briefing. Devem
ser confirmados e convertidos em critérios mensuráveis durante a especificação.

| ID | Requisito | Origem / observação |
|---|---|---|
| RNF-01 | A interface deve ser utilizável em dispositivos móveis. | Requisito explícito; tamanhos de tela, orientação e navegadores suportados não foram definidos. |
| RNF-02 | A interface deve se adaptar a diferentes dimensões de tela sem perda de conteúdo ou das funções de busca, consulta e troca de unidade. | Derivado do uso em dispositivos móveis; precisa de validação em telas e dispositivos-alvo. |
| RNF-03 | A busca e a consulta de clima devem comunicar estados de carregamento, ausência de resultados e falhas de forma compreensível. | Necessário para o fluxo de consulta, especialmente se depender de dados remotos; comportamento exato não foi informado. |
| RNF-04 | Os dados meteorológicos apresentados devem ter origem e horário de atualização identificáveis, quando disponibilizados pela fonte. | Expectativa de confiança e interpretação; fonte e metadados disponíveis ainda são desconhecidos. |
| RNF-05 | A interação deve ser compreensível e acessível, inclusive em telas pequenas. | Recomendação a confirmar; o briefing não especifica padrões de acessibilidade nem requisitos de teclado ou leitor de tela. |
| RNF-06 | O tempo de resposta aceitável para busca e carregamento das previsões deve ser definido. | O briefing não estabelece metas de desempenho nem condições de rede. |

## Riscos

| Risco | Impacto potencial | Mitigação / investigação |
|---|---|---|
| Dados indisponíveis, atrasados ou inconsistentes na fonte meteorológica. | Usuários podem receber informações incompletas ou tomar decisões com dados desatualizados. | Selecionar e validar uma fonte adequada; definir como indicar atualização e como tratar indisponibilidade. |
| Cidades homônimas ou resultados de busca ambíguos. | A pessoa usuária pode consultar o local errado. | Definir quais informações desambiguam resultados, como país ou região, e validar o fluxo de seleção. |
| Interpretações diferentes de “clima atual” e “previsão de cinco dias”. | Resultados inconsistentes com a expectativa da pessoa usuária. | Acordar campos, horizonte temporal, frequência de atualização e apresentação antes de detalhar a solução. |
| Unidades apresentadas de forma inconsistente. | Confusão ou interpretação incorreta da temperatura. | Definir o alcance da alternância e verificar a consistência das unidades em todos os dados e telas. |
| Desempenho ou legibilidade insuficientes em dispositivos móveis. | Dificuldade de uso ou abandono da aplicação. | Validar em dispositivos e tamanhos de tela representativos e estabelecer critérios de responsividade e desempenho. |
| Dependência de conexão para obter busca ou dados meteorológicos. | Funcionalidades podem falhar em redes lentas ou indisponíveis. | Confirmar requisitos de disponibilidade e definir estados e mensagens para falhas e conexão limitada. |
| Restrições de uso, cobertura ou disponibilidade do provedor de dados. | A aplicação pode não atender às regiões desejadas ou ao uso esperado. | Investigar cobertura geográfica, limites, atribuição e condições de uso antes de escolher uma fonte. |

## Perguntas em aberto

### Busca de cidades

1. A busca deve aceitar nomes parciais, acentos e nomes em mais de um idioma?
2. Quais informações devem aparecer nos resultados para diferenciar cidades com
   o mesmo nome (por exemplo, estado/província e país)?
3. A aplicação deve sugerir resultados enquanto a pessoa digita ou buscar após
   uma confirmação explícita?
4. Quais regiões ou países precisam ser cobertos?

### Dados meteorológicos

5. Quais condições devem compor o “clima atual” (por exemplo, temperatura,
   sensação térmica, condição textual, umidade ou vento)?
6. Quais informações devem ser exibidas para cada dia da previsão?
7. “Cinco dias” significa os próximos cinco dias do calendário local ou uma
   janela contínua de 120 horas?
8. Qual fonte de dados deve ser utilizada e qual nível de atualização e cobertura
   é necessário?
9. A interface precisa informar o horário local da cidade e o horário da última
   atualização dos dados?

### Unidades e preferências

10. A alternância Celsius/Fahrenheit deve afetar apenas temperaturas ou também
    outras grandezas meteorológicas?
11. A unidade escolhida deve permanecer após recarregar ou reabrir a aplicação?
12. Deve haver uma unidade padrão? Se sim, qual regra a determina?

### Experiência e operação

13. A aplicação deve mostrar uma cidade inicial, manter cidades recentes ou
    permitir salvar locais favoritos?
14. Deve haver suporte a localização do dispositivo? Se sim, o uso da localização
    será opcional e como será solicitado o consentimento?
15. Qual idioma ou conjunto de idiomas deve ser suportado?
16. Quais navegadores, dispositivos e tamanhos de tela são prioritários?
17. Como a aplicação deve se comportar quando não houver conexão, a busca não
    retornar resultados ou o serviço de dados falhar?
18. Quais metas de desempenho e requisitos de acessibilidade devem ser usados
    como critérios de aceite?

## Premissas e limites desta análise

- Busca, visualização do clima atual, previsão de cinco dias e alternância de
  temperatura são capacidades explicitamente solicitadas.
- Uso em dispositivos móveis é um requisito explícito, mas a lista de dispositivos
  e os critérios de compatibilidade permanecem em aberto.
- Fonte de dados, localização automática, favoritos, histórico, alertas,
  autenticação e suporte offline não foram solicitados; não devem ser tratados
  como requisitos confirmados sem decisão de negócio.
- Não foram definidos métricas, critérios de aceite, regras de privacidade,
  metas de disponibilidade nem limites de uso.
