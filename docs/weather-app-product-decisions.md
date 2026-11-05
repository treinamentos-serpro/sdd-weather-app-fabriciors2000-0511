# Decisões de produto — Weather App

## Status

Este registro fixa o comportamento técnico desta entrega SDD para que código e
testes tenham um contrato verificável. A validação formal de Produto para uso
fora do treinamento continua pendente; o responsável ainda não foi designado.

## Decisões desta entrega

| ID | Decisão | Justificativa e implementação |
|---|---|---|
| D-01 | Usar Open-Meteo Geocoding e Forecast APIs. | É a fonte definida pelas instruções deste repositório, não exige chave para o fluxo implementado e já é identificada na interface. A aplicação também inclui atribuição com link para Open-Meteo. |
| D-02 | Exibir cinco datas consecutivas do calendário local da cidade, começando pela primeira data diária retornada pela API; ordenar cronologicamente. | A requisição usa `forecast_days=5` e `timezone=auto`. Cada resposta válida deve conter exatamente cinco datas; respostas incompletas ou fora de ordem são rejeitadas. |
| D-03 | Usar timeout de 10 segundos por requisição. | O limite é aplicado no serviço e falhas por timeout são distintas de cancelamentos intencionais. |
| D-04 | Usar português na busca, Celsius como unidade inicial e armazenamento canônico de temperaturas em Celsius. | A unidade pode ser alternada localmente para Fahrenheit; a preferência não é persistida entre sessões. |
| D-05 | Mostrar a atribuição Open-Meteo com link na interface; apresentar horário da consulta quando disponível na resposta. | Não inventar metadados ausentes. Campos meteorológicos opcionais ausentes são tratados como indisponíveis. |

## Pendências antes de publicação externa

| Pendência | Responsável | Gate |
|---|---|---|
| Confirmar cobertura, disponibilidade, limites, atribuição exigida e condições de uso atuais do Open-Meteo para a distribuição pretendida. | Responsável de Produto a designar | Necessário antes de produção/publicação externa. |
| Confirmar matriz de navegadores/dispositivos e padrão de conformidade de acessibilidade esperado. | Responsável de Produto a designar | Necessário antes de declarar conformidade formal. |

As pendências não alteram o contrato técnico implementado para esta entrega,
mas impedem tratar essas escolhas como aprovação formal de Produto para
produção.
