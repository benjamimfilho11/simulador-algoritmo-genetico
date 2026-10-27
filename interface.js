import {
    lerValor,
    lerBeneficio,
    transformarEmReais,
    formatarCampoValor,
    validarOrcamento
} from "./validacao.js";

import {
    obterProjetos,
    atualizarProjetos,
    calcularAptidao,
    obterConfiguracao,
    obterEstadoSimulacao,
    atualizarConfiguracao
} from "./script.js";

const campoOrcamento = document.getElementById("orcamento");
const tabelaProjetos = document.getElementById("tabelaProjetos");
const mensagemProjetos = document.getElementById("mensagemProjetos");
const quantidadeProjetos = document.getElementById("quantidadeProjetos");
const botaoAdicionar = document.getElementById("adicionarProjeto");
const botaoSalvar = document.getElementById("salvarProjetos");
const botaoDesfazer = document.getElementById("desfazerProjetos");

function criarRascunho(projeto) {
    return {
        nome: projeto.nome,
        custoTexto: (projeto.custo / 100).toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }),
        beneficioTexto: String(projeto.beneficio).replace(".", ",")
    };
}

let projetosEmEdicao = obterProjetos().map(criarRascunho);

function mostrarMensagem(texto, erro = false) {
    mensagemProjetos.textContent = texto;
    mensagemProjetos.classList.toggle("erro", erro);
}

function preencherCampoOrcamento() {
    campoOrcamento.value = String(obterConfiguracao().orcamento / 100).replace(".", ",");
    formatarCampoValor(campoOrcamento);
}

function criarCampo(linha, valor, rotulo, indice, propriedade, moeda = false) {
    const coluna = linha.insertCell();
    const campo = document.createElement("input");
    campo.type = "text";
    campo.className = "campo-projeto";
    campo.value = valor;
    campo.setAttribute("aria-label", rotulo);

    if (propriedade === "nome") {
        campo.maxLength = 120;
        campo.classList.add("campo-nome");
    } else {
        campo.inputMode = "decimal";
    }

    campo.addEventListener("input", function() {
        projetosEmEdicao[indice][propriedade] = campo.value;
        mostrarMensagem("Existem alterações ainda não salvas.");
    });

    if (moeda) {
        campo.addEventListener("blur", function() {
            formatarCampoValor(campo);
            projetosEmEdicao[indice][propriedade] = campo.value;
        });
    }

    coluna.appendChild(campo);
}

// Mostra os projetos que estão sendo editados
function exibirProjetos() {
    tabelaProjetos.innerHTML = "";

    projetosEmEdicao.forEach(function(projeto, indice) {
        const linha = tabelaProjetos.insertRow();

        criarCampo(linha, projeto.nome, `Nome do projeto ${indice + 1}`, indice, "nome");
        criarCampo(linha, projeto.custoTexto, `Custo do projeto ${indice + 1}`, indice, "custoTexto", true);
        criarCampo(linha, projeto.beneficioTexto, `Benefício do projeto ${indice + 1}`, indice, "beneficioTexto");

        const colunaAcoes = linha.insertCell();
        const remover = document.createElement("button");
        remover.type = "button";
        remover.textContent = "Remover";
        remover.className = "botao-perigo";
        remover.disabled = projetosEmEdicao.length <= 4;
        remover.setAttribute("aria-label", `Remover projeto ${indice + 1}`);

        remover.addEventListener("click", function() {
            if (projetosEmEdicao.length <= 4) {
                return;
            }
            projetosEmEdicao.splice(indice, 1);
            exibirProjetos();
            mostrarMensagem("Projeto removido da edição. Salve para confirmar.");
        });

        colunaAcoes.appendChild(remover);
    });

    quantidadeProjetos.textContent = `${projetosEmEdicao.length} de 15 projetos`;
    botaoAdicionar.disabled = projetosEmEdicao.length >= 15;
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

// Salva os projetos após validar todos os campos
function salvarProjetos() {
    const novosProjetos = projetosEmEdicao.map(function(projeto) {
        return {
            nome: projeto.nome,
            custo: lerValor(projeto.custoTexto),
            beneficio: lerBeneficio(projeto.beneficioTexto)
        };
    });

    try {
        atualizarProjetos(novosProjetos);
        projetosEmEdicao = obterProjetos().map(criarRascunho);
        exibirProjetos();
        exibirPopulacao(obterEstadoSimulacao().populacao);
        mostrarMensagem("Projetos salvos com sucesso.");
    } catch (erro) {
        mostrarMensagem(erro.message, true);
    }
}

function adicionarProjeto() {
    if (projetosEmEdicao.length >= 15) {
        mostrarMensagem("O limite é de 15 projetos.", true);
        return;
    }

    projetosEmEdicao.push({ nome: "", custoTexto: "", beneficioTexto: "0" });
    exibirProjetos();
    mostrarMensagem("Preencha o novo projeto e clique em Salvar projetos.");
}

function desfazerAlteracoes() {
    projetosEmEdicao = obterProjetos().map(criarRascunho);
    exibirProjetos();
    mostrarMensagem("Alterações não salvas foram desfeitas.");
}

// Aplica o orçamento e atualiza a população
function aplicarOrcamento() {
    const valor = validarOrcamento();
    if (valor === null) {
        return;
    }

    atualizarConfiguracao({ orcamento: valor });
    exibirPopulacao(obterEstadoSimulacao().populacao);
}

botaoAdicionar.addEventListener("click", adicionarProjeto);
botaoSalvar.addEventListener("click", salvarProjetos);
botaoDesfazer.addEventListener("click", desfazerAlteracoes);

campoOrcamento.addEventListener("input", validarOrcamento);
campoOrcamento.addEventListener("change", aplicarOrcamento);
campoOrcamento.addEventListener("blur", function() {
    formatarCampoValor(campoOrcamento);
});

exibirProjetos();
preencherCampoOrcamento();
exibirPopulacao(obterEstadoSimulacao().populacao);
