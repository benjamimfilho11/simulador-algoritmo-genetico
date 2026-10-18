
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

    projetos.forEach(function(projeto, indice) {
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

exibirProjetos();

// Configurações iniciais da população
let tamanhoPopulacao = 5;
let semente = 42;
let estadoAleatorio = semente;

// Gera números aleatórios usando a semente
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

// Gera a quantidade de indivíduos definida
function gerarPopulacaoInicial() {
    const populacao = [];

    for (let i = 0; i < tamanhoPopulacao; i++) {
        populacao.push(gerarCromossomo());
    }

    return populacao;
}

// Mostra os cromossomos da população na tabela
function exibirPopulacao(populacao) {
    const tabela = document.getElementById("tabelaPopulacao");

    tabela.innerHTML = "";

    populacao.forEach(function(cromossomo, indice) {
        const linha = document.createElement("tr");

        const colunaIndice = document.createElement("td");
        colunaIndice.textContent = indice + 1;

        const colunaCromossomo = document.createElement("td");
        colunaCromossomo.textContent = cromossomo.join("");

        linha.appendChild(colunaIndice);
        linha.appendChild(colunaCromossomo);

        tabela.appendChild(linha);
    });
}

// Cria e exibe a população inicial
const populacaoInicial = gerarPopulacaoInicial();

exibirPopulacao(populacaoInicial);
