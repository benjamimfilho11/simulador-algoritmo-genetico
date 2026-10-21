import { transformarEmReais, formatarCampoValor, validarOrcamento } from "./validacao.js";
import { gerarPopulacaoInicial, calcularAptidao, projetos, orcamento } from "./script.js";

const campoOrcamento = document.getElementById("orcamento");
campoOrcamento.addEventListener("input", validarOrcamento);
campoOrcamento.addEventListener("blur", function() { formatarCampoValor(campoOrcamento); });

function preencherCampoOrcamento() {
    const campoOrcamento = document.getElementById("orcamento");
    campoOrcamento.value = String(orcamento / 100).replace(".", ",");
    formatarCampoValor(campoOrcamento);
}

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