import { transformarEmReais, formatarCampoValor, validarOrcamento } from "./validacao.js";
import {
    projetos,
    calcularAptidao,
    obterConfiguracao,
    obterEstadoSimulacao,
    atualizarConfiguracao
} from "./script.js";

const campoOrcamento = document.getElementById("orcamento");

function preencherCampoOrcamento() {
    campoOrcamento.value = String(obterConfiguracao().orcamento / 100).replace(".", ",");
    formatarCampoValor(campoOrcamento);
}

function exibirProjetos() {
    const tabela = document.getElementById("tabelaProjetos");
    tabela.innerHTML = "";

    projetos.forEach(function(projeto) {
        const linha = document.createElement("tr");
        const valores = [projeto.nome, transformarEmReais(projeto.custo), projeto.beneficio];

        valores.forEach(function(valor) {
            const coluna = document.createElement("td");
            coluna.textContent = valor;
            linha.appendChild(coluna);
        });
        tabela.appendChild(linha);
    });
}

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

// Só aplica um orçamento válido e reinicia a população
function aplicarOrcamento() {
    const valor = validarOrcamento();
    if (valor === null) {
        return;
    }

    atualizarConfiguracao({ orcamento: valor });
    exibirPopulacao(obterEstadoSimulacao().populacao);
}

campoOrcamento.addEventListener("input", validarOrcamento);
campoOrcamento.addEventListener("change", aplicarOrcamento);
campoOrcamento.addEventListener("blur", function() {
    formatarCampoValor(campoOrcamento);
});

exibirProjetos();
preencherCampoOrcamento();
exibirPopulacao(obterEstadoSimulacao().populacao);
