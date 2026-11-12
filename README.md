
# Simulador de Algoritmo Genético

Trabalho prático da disciplina de Inteligência Artificial da Universidade Federal do Piauí (UFPI), período 2026.2.

## Integrantes

- Benjamim Filho
- Gustavo Bastos
- João Vinicio

## Descrição

O projeto consiste em um simulador de algoritmo genético desenvolvido para selecionar projetos de melhoria de um campus universitário, respeitando um orçamento disponível.

Cada projeto possui nome, custo e benefício. O objetivo é encontrar uma combinação de projetos que maximize o benefício total sem ultrapassar o orçamento. 

O simulador permite cadastrar de 4 a 15 projetos, configurar os parâmetros do algoritmo e acompanhar a evolução das soluções ao longo das gerações.

## Tecnologias utilizadas

- HTML: estrutura da aplicação.
- CSS: estilização e animações.
- JavaScript: implementação do algoritmo genético e da interface.
- Node.js: execução dos testes automatizados.

Não foram utilizadas bibliotecas externas de inteligência artificial ou otimização. O algoritmo genético e seus operadores foram implementados em JavaScript.

## Funcionamento do algoritmo

Cada solução é representada por um cromossomo binário, no qual o valor 1 indica que um projeto foi selecionado e o valor 0 indica que não foi selecionado.

O algoritmo utiliza:

1. População inicial gerada aleatoriamente.
2. Avaliação pela soma dos benefícios dos projetos selecionados.
3. Reparação de soluções que ultrapassam o orçamento.
4. Seleção dos pais por torneio.
5. Cruzamento de um ponto.
6. Mutação por inversão de bits.
7. Elitismo para preservar os melhores indivíduos.
8. Formação de novas gerações até o limite configurado.

Na reparação, são removidos os projetos selecionados com menor razão benefício/custo até que o orçamento seja respeitado. Em caso de empate, é removido o projeto de menor índice.

A aplicação utiliza uma semente aleatória para permitir a reprodução dos resultados.

## Como executar

A aplicação está disponível no GitHub Pages:

https://benjamimfilho11.github.io/simulador-algoritmo-genetico/

Também é possível executá-la localmente:

1. Clone ou baixe o repositório.
2. Abra a pasta do projeto no VS Code.
3. Abra o arquivo `index.html` utilizando o Live Server.
4. Configure os parâmetros e execute a simulação.

A aplicação funciona no navegador, sem necessidade de servidor de aplicação.

## Parâmetros configuráveis

| Parâmetro | Descrição |
|---|---|
| Orçamento | Valor disponível para selecionar projetos |
| População | Quantidade de indivíduos em cada geração |
| Gerações | Número de gerações produzidas |
| Cruzamento | Probabilidade de cruzamento por par de pais |
| Mutação | Probabilidade de mutação por gene |
| Torneio | Quantidade de candidatos em cada torneio |
| Elite | Quantidade de melhores indivíduos preservados |
| Semente | Valor inteiro utilizado nos sorteios |

Os botões Executar, Pausar, Avançar uma geração e Reiniciar permitem controlar a simulação.

A interface apresenta a população atual, as métricas de aptidão, o histórico das gerações, a melhor solução encontrada e os registros das operações genéticas.

## Testes de validação

Os testes foram realizados utilizando o arquivo `testes.mjs`, com o comando:

```bash
node testes.mjs
```

Todos os 9 grupos de testes foram aprovados.

### Dados utilizados

| Projeto | Custo | Benefício |
|---|---:|---:|
| A - Melhoria da iluminação | R$ 4.000,00 | 7 |
| B - Instalação de bicicletários | R$ 3.000,00 | 5 |
| C - Aquisição de bancos | R$ 2.000,00 | 3 |
| D - Reforma de espaço de convivência | R$ 5.000,00 | 8 |

Orçamento inicial: R$ 7.000,00.

### Avaliação e reparação

A avaliação do cromossomo `1100` apresentou custo de R$ 7.000,00, benefício 12, saldo zero e aptidão 12.

A reparação do cromossomo `1111` apresentou a sequência:

`1111 → 1101 → 1100`

Foram removidos os projetos C e D, respectivamente.

### Cruzamento e mutação

Utilizando os pais `1100` e `0011`, com corte após o segundo gene, foram produzidos os filhos `1111` e `0000`.

Com a mutação controlada do primeiro gene do primeiro filho:

`1111 → 0111`

Após a reparação:

`0111 → 0101 → 0100`

O primeiro filho terminou com aptidão 5 e o segundo com aptidão 0.

Também foram aprovados os testes de taxas de cruzamento e mutação nos limites de 0% e 100%, seleção por torneio, desempate pelo menor índice, elitismo e tamanho constante da população.

### Execução completa

A execução foi realizada com os seguintes parâmetros:

| Parâmetro | Valor |
|---|---:|
| Orçamento | R$ 7.000,00 |
| População | 20 |
| Gerações | 50 |
| Cruzamento | 80% |
| Mutação | 5% |
| Torneio | 2 |
| Elite | 1 |
| Semente | 42 |

Resultados obtidos:

- Melhor cromossomo: `1100`.
- Melhor aptidão: 12.
- Histórico: 51 registros, incluindo a geração 0.
- População final com 20 indivíduos viáveis.
- Melhor aptidão acumulada sem diminuições.
- Melhor aptidão da geração sem diminuições, devido ao elitismo.

A execução encontrou a solução ótima de referência, formada pelos projetos A e B.

### Comparação das taxas de mutação

Foram comparadas as taxas de 1% e 20%, mantendo os demais parâmetros da execução completa e utilizando as sementes 1, 2, 3, 4 e 5.

Além do melhor benefício final, foram registradas a geração em que esse melhor foi encontrado, a aptidão média da população na geração 50 e quantos dos 20 indivíduos finais correspondem ao ótimo `1100`.

| Semente | Melhor (1%) | Melhor (20%) | Geração do melhor (1% / 20%) | Aptidão média final (1%) | Aptidão média final (20%) | Cópias de `1100` no fim (1%) | Cópias de `1100` no fim (20%) |
|---|---:|---:|---:|---:|---:|---:|---:|
| 1 | 12 | 12 | 0 / 0 | 12 | 8,85 | 20 | 10 |
| 2 | 12 | 12 | 0 / 0 | 12 | 9,10 | 20 | 12 |
| 3 | 12 | 12 | 0 / 0 | 12 | 10,25 | 20 | 14 |
| 4 | 12 | 12 | 0 / 0 | 12 | 9,60 | 20 | 13 |
| 5 | 12 | 12 | 0 / 0 | 12 | 10,20 | 20 | 13 |
| **Média** | **12** | **12** | — | **12** | **9,60** | **20** | **12,4** |
| **Execuções com aptidão 12** | **5** | **5** | | | | | |

**Melhor benefício final.** As duas taxas atingiram 12 nas cinco execuções, mas esse resultado não permite concluir que elas sejam equivalentes: em todas as dez execuções o ótimo `1100` já estava presente na população inicial (geração 0). Com apenas 4 projetos há 16 cromossomos possíveis, e uma população de 20 indivíduos sorteados ao acaso, já reparados, quase sempre contém o ótimo. A partir daí, o elitismo (1 indivíduo) garante que ele nunca seja perdido, independentemente da taxa de mutação. Nesta instância, portanto, o melhor benefício final não mede o efeito da mutação.

**Comportamento da população.** A diferença aparece na população final. Com mutação de 1%, a seleção por torneio e o cruzamento espalham o ótimo por toda a população: nas cinco execuções, os 20 indivíduos da geração 50 são `1100` e a aptidão média é 12, ou seja, a população convergiu. Com 20%, cada gene tem uma chance em cinco de ser invertido, e um filho de dois pais `1100` só permanece `1100` com probabilidade 0,8⁴ ≈ 41%. A mutação desfaz continuamente as boas soluções, a aptidão média fica em torno de 9,6 e apenas cerca de 12 dos 20 indivíduos são ótimos.

**Interpretação.** Uma taxa baixa favorece a exploração das boas soluções já encontradas (convergência rápida); uma taxa alta mantém a diversidade e favorece a exploração de novas regiões do espaço de busca, ao custo de degradar a população. Neste problema pequeno, a diversidade extra não traz benefício, porque o ótimo é encontrado logo no início. Em instâncias maiores (por exemplo, 15 projetos, com 32.768 combinações), em que a população inicial dificilmente contém o ótimo, uma taxa baixa pode levar à convergência prematura em uma solução subótima, e uma taxa maior pode ajudar a escapar dela. Por isso, não se pode afirmar que uma taxa seja sempre superior à outra.

### Limites de orçamento

Com orçamento de R$ 0, todas as soluções foram reparadas para `0000`, apresentando custo e benefício iguais a zero.

Com orçamento de R$ 14.000,00, a avaliação de `1111` apresentou custo de R$ 14.000,00, benefício 23, saldo zero e aptidão 23.

Os dois testes foram aprovados.

## Conclusão

Os testes automatizados confirmaram o funcionamento dos principais operadores do algoritmo genético e o respeito às restrições de orçamento.

Na configuração de referência, o simulador encontrou a solução ótima, com benefício 12. Na comparação entre as taxas de mutação de 1% e 20%, o melhor resultado final foi o mesmo, pois o ótimo já estava na população inicial em todas as execuções. A taxa de 20% manteve a população mais diversa e com aptidão média menor (9,6 contra 12).

O simulador permite acompanhar a evolução das soluções e observar como os operadores genéticos atuam na seleção dos projetos.
