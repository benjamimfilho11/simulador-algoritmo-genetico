
"use strict";

// Projetos iniciais e orçamento disponível
const projetos = [
//Valores estão em centavos! Porque no js, pode haver imprecisão com números decimais (0.1 + 0.2 != 0.3)
    {
        nome: "Melhoria da iluminação",
        custo: 400000,
        beneficio: 7
    },
    {
        nome: "Instalação de bicicletários",
        custo: 300000,
        beneficio: 5
    },
    {
        nome: "Aquisição de bancos",
        custo: 200000,
        beneficio: 3
    },
    {
        nome: "Reforma de espaço de convivência",
        custo: 500000,
        beneficio: 8
    }
];

let orcamento = 700000;

function lerValor(texto) { //input em reais (string)
    const partes = texto.trim().match(/^(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?$/);
    
    if (!partes) {
        return null;
    }
    
    const inteiro = partes[1].replace(/\./g, "");
    const centavos = (partes[2] || "").padEnd(2, "0");
    
    const valor = Number(inteiro) * 100 + Number(centavos);
    
    if (!Number.isSafeInteger(valor)) {
        return null;
    } //Só para recusar números muuito grandesm que não cabem no int do JS
    
    return valor; //retorna o valor em centavos (int)
}

function transformarEmReais(valor) { //centavos(int) -> reais
    return (valor / 100).toLocaleString("pt-BR", {style: "currency", currency: "BRL"});
}

function formatarCampoValor(campo) {
    const valor = lerValor(campo.value);
    if (valor != null) {
        campo.value = (valor / 100).toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });//Adiciona os centavos e os pontos de milhar no campo
    }
}

function validarOrcamento() {
    const campoOrcamento = document.getElementById("orcamento");
    const erro = document.getElementById("erroOrcamento");
    const valor = lerValor(campoOrcamento.value);
    const valido = valor !== null;

    campoOrcamento.parentElement.classList.toggle("invalido", !valido);
    erro.textContent = valido ? "" : "Informe um valor em reais, com até duas casas decimais.";

    return valor;
}

function preencherCampoOrcamento() {
    const campoOrcamento = document.getElementById("orcamento");
    campoOrcamento.value = String(orcamento / 100).replace(".", ",");
    formatarCampoValor(campoOrcamento);
}

const campoOrcamento = document.getElementById("orcamento");
campoOrcamento.addEventListener("input", validarOrcamento);
campoOrcamento.addEventListener("blur", function() { formatarCampoValor(campoOrcamento); });

// Mostra os projetos na tela
function exibirProjetos() {
    const tabela = document.getElementById("tabelaProjetos");

    tabela.innerHTML = "";

    projetos.forEach(function(projeto) {
        const linha = document.createElement("tr");

        const colunaNome = document.createElement("td");
        colunaNome.textContent = projeto.nome;

        const colunaCusto = document.createElement("td");
        colunaCusto.textContent = transformarEmReais(projeto.custo);

        const colunaBeneficio = document.createElement("td");
        colunaBeneficio.textContent = projeto.beneficio;

        linha.appendChild(colunaNome);
        linha.appendChild(colunaCusto);
        linha.appendChild(colunaBeneficio);

        tabela.appendChild(linha);
    });
}

// Configurações iniciais da população
let tamanhoPopulacao = 5;
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
            transformarEmReais(resultado.custoTotal),
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

exibirProjetos();
preencherCampoOrcamento();

const populacaoInicial = gerarPopulacaoInicial();

exibirPopulacao(populacaoInicial);
