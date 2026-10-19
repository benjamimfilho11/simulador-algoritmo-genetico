
"use strict";

// Projetos iniciais e orçamento disponível
const projetos = [
    {
        nome: "Melhoria da iluminação",
        custo: 4000,
        beneficio: 7
    },
    {
        nome: "Instalação de bicicletários",
        custo: 3000,
        beneficio: 5
    },
    {
        nome: "Aquisição de bancos",
        custo: 2000,
        beneficio: 3
    },
    {
        nome: "Reforma de espaço de convivência",
        custo: 5000,
        beneficio: 8
    }
];

let orcamento = 7000;

// Mostra os projetos e o orçamento na tela
function exibirProjetos() {
    const tabela = document.getElementById("tabelaProjetos");

    tabela.innerHTML = "";

    projetos.forEach(function(projeto) {
        const linha = document.createElement("tr");

        const colunaNome = document.createElement("td");
        colunaNome.textContent = projeto.nome;

        const colunaCusto = document.createElement("td");
        colunaCusto.textContent = projeto.custo.toLocaleString(
            "pt-BR",
            { style: "currency", currency: "BRL" }
        );

        const colunaBeneficio = document.createElement("td");
        colunaBeneficio.textContent = projeto.beneficio;

        linha.appendChild(colunaNome);
        linha.appendChild(colunaCusto);
        linha.appendChild(colunaBeneficio);

        tabela.appendChild(linha);
    });

    document.getElementById("orcamento").textContent =
        orcamento.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
}

// Configurações iniciais da população
let tamanhoPopulacao = 5;
let tamanhoTorneio = 2;
let semente = 42;
let estadoAleatorio = semente;

// Gera números pseudoaleatórios usando a semente
function numeroAleatorio() {
    estadoAleatorio = (
        Math.imul(1664525, estadoAleatorio) + 1013904223
    ) >>> 0;

    return estadoAleatorio / 4294967296;
}

// Cria um cromossomo com genes 0 ou 1
function gerarCromossomo() {
    const cromossomo = [];

    for (let i = 0; i < projetos.length; i++) {
        const gene = numeroAleatorio() < 0.5 ? 0 : 1;
        cromossomo.push(gene);
    }

    return cromossomo;
}

// Calcula os dados de um cromossomo
function avaliarCromossomo(cromossomo) {
    let custoTotal = 0;
    let beneficioTotal = 0;
    const selecionados = [];

    cromossomo.forEach(function(gene, indice) {
        if (gene === 1) {
            custoTotal += projetos[indice].custo;
            beneficioTotal += projetos[indice].beneficio;
            selecionados.push(projetos[indice].nome);
        }
    });

    return {
        cromossomo: cromossomo.join(""),
        projetosSelecionados: selecionados,
        custoTotal: custoTotal,
        beneficioTotal: beneficioTotal,
        saldo: orcamento - custoTotal,
        viavel: custoTotal <= orcamento
    };
}

// Remove projetos até respeitar o orçamento
function repararCromossomo(cromossomo) {
    const reparado = [...cromossomo];

    while (avaliarCromossomo(reparado).custoTotal > orcamento) {
        let indiceRemover = -1;
        let menorRazao = Infinity;

        reparado.forEach(function(gene, indice) {
            if (gene === 1) {
                const razao =
                    projetos[indice].beneficio / projetos[indice].custo;

                if (razao < menorRazao) {
                    menorRazao = razao;
                    indiceRemover = indice;
                }
            }
        });

        if (indiceRemover === -1) {
            break;
        }

        reparado[indiceRemover] = 0;
    }

    return reparado;
}

// Calcula a aptidão após a reparação
function calcularAptidao(cromossomo) {
    const reparado = repararCromossomo(cromossomo);
    const resultado = avaliarCromossomo(reparado);

    return {
        ...resultado,
        aptidao: resultado.beneficioTotal
    };
}

// Gera a população inicial já reparada
function gerarPopulacaoInicial() {
    const populacao = [];

    for (let i = 0; i < tamanhoPopulacao; i++) {
        const cromossomo = gerarCromossomo();
        const reparado = repararCromossomo(cromossomo);

        populacao.push(reparado);
    }

    return populacao;
}

// Mostra os indivíduos e suas aptidões na tabela
function exibirPopulacao(populacao) {
    const tabela = document.getElementById("tabelaPopulacao");

    tabela.innerHTML = "";

    populacao.forEach(function(cromossomo, indice) {
        const resultado = calcularAptidao(cromossomo);
        const linha = document.createElement("tr");

        const valores = [
            indice + 1,
            resultado.cromossomo,
            resultado.custoTotal.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL"
            }),
            resultado.beneficioTotal,
            resultado.aptidao
        ];

        valores.forEach(function(valor) {
            const coluna = document.createElement("td");
            coluna.textContent = valor;
            linha.appendChild(coluna);
        });

        tabela.appendChild(linha);
    });
}

// Sorteia um índice válido da população
function sortearIndice(limite) {
    return Math.floor(numeroAleatorio() * limite);
}

// Seleciona um indivíduo por torneio
function selecionarPorTorneio(populacao, tamanhoTorneio) {
    const candidatos = [];

    // Sorteia os candidatos sem repetir índices
    while (candidatos.length < tamanhoTorneio) {
        const indice = sortearIndice(populacao.length);

        if (!candidatos.includes(indice)) {
            candidatos.push(indice);
        }
    }

    // Considera o primeiro candidato como vencedor inicial
    let indiceVencedor = candidatos[0];
    let melhorAptidao = calcularAptidao(
        populacao[indiceVencedor]
    ).aptidao;

    // Compara as aptidões para encontrar o vencedor
    for (let i = 1; i < candidatos.length; i++) {
        const indiceAtual = candidatos[i];

        const aptidaoAtual = calcularAptidao(
            populacao[indiceAtual]
        ).aptidao;

        if (
            aptidaoAtual > melhorAptidao ||
            (
                aptidaoAtual === melhorAptidao &&
                indiceAtual < indiceVencedor
            )
        ) {
            indiceVencedor = indiceAtual;
            melhorAptidao = aptidaoAtual;
        }
    }

    return [...populacao[indiceVencedor]];
}

exibirProjetos();

const populacaoInicial = gerarPopulacaoInicial();

exibirPopulacao(populacaoInicial);

// Seleciona dois pais em torneios independentes
const pai1 = selecionarPorTorneio(populacaoInicial, tamanhoTorneio);
const pai2 = selecionarPorTorneio(populacaoInicial, tamanhoTorneio);

let taxaCruzamento = 80;
let taxaMutacao = 5;

// Realiza o cruzamento de um ponto entre dois pais
function cruzarCromossomos(pai1, pai2, taxa = taxaCruzamento, corteForcado = null) {
    let filho1 = [...pai1]; // Copia os genes sem alterar o pai original
    let filho2 = [...pai2];

    if (numeroAleatorio() < taxa / 100) {
        const pontoCorte = corteForcado !== null
            ? corteForcado
            : 1 + sortearIndice(pai1.length - 1);

        filho1 = [
            ...pai1.slice(0, pontoCorte),
            ...pai2.slice(pontoCorte)
        ];

        filho2 = [
            ...pai2.slice(0, pontoCorte),
            ...pai1.slice(pontoCorte)
        ];
    }

    return [filho1, filho2];
}

// Aplica mutação individualmente em cada gene
function mutarCromossomo(cromossomo, taxa = taxaMutacao, indicesForcados = null) {
    const mutado = [...cromossomo];

    for (let i = 0; i < mutado.length; i++) {
        const deveMutar = indicesForcados !== null
            ? indicesForcados.includes(i)
            : numeroAleatorio() < taxa / 100;

        if (deveMutar) {
            mutado[i] = mutado[i] === 0 ? 1 : 0;
        }
    }

    return mutado;
}

