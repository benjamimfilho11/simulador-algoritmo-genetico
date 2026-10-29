
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
    atualizarConfiguracao,
    reiniciarSimulacao,
    avancarGeracao
} from "./script.js";

const campoOrcamento = document.getElementById("orcamento");
const tabelaProjetos = document.getElementById("tabelaProjetos");
const mensagemProjetos = document.getElementById("mensagemProjetos");
const mensagemConfiguracao = document.getElementById("mensagemConfiguracao");
const quantidadeProjetos = document.getElementById("quantidadeProjetos");

const botaoAdicionar = document.getElementById("adicionarProjeto");
const botaoSalvar = document.getElementById("salvarProjetos");
const botaoDesfazer = document.getElementById("desfazerProjetos");

const botaoExecutar = document.getElementById("executarSimulacao");
const botaoPausar = document.getElementById("pausarSimulacao");
const botaoAvancar = document.getElementById("avancarSimulacao");
const botaoReiniciar = document.getElementById("reiniciarSimulacao");

const estadoExecucao = document.getElementById("estadoExecucao");

const camposConfiguracao = [
    "tamanhoPopulacao",
    "numeroGeracoes",
    "taxaCruzamento",
    "taxaMutacao",
    "tamanhoTorneio",
    "quantidadeElite",
    "semente"
];

let temporizador = null;
let alteracoesProjetos = false;
let configuracaoPendente = false;

// Converte os projetos para os campos de edição
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

function mostrarMensagemConfiguracao(texto, erro = false) {
    mensagemConfiguracao.textContent = texto;
    mensagemConfiguracao.classList.toggle("erro", erro);
}

function preencherConfiguracoes() {
    const configuracao = obterConfiguracao();

    campoOrcamento.value = String(configuracao.orcamento / 100).replace(".", ",");
    formatarCampoValor(campoOrcamento);

    camposConfiguracao.forEach(function(nome) {
        document.getElementById(nome).value = configuracao[nome];
    });
}

// Cria os campos editáveis de cada projeto
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
        pausarExecucao();
        alteracoesProjetos = true;
        projetosEmEdicao[indice][propriedade] = campo.value;
        mostrarMensagem("Existem alterações ainda não salvas.");
        atualizarBotoes();
    });

    if (moeda) {
        campo.addEventListener("blur", function() {
            formatarCampoValor(campo);
            projetosEmEdicao[indice][propriedade] = campo.value;
        });
    }

    coluna.appendChild(campo);
}

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

        remover.addEventListener("click", function() {
            if (projetosEmEdicao.length <= 4) {
                return;
            }

            pausarExecucao();
            projetosEmEdicao.splice(indice, 1);
            alteracoesProjetos = true;

            exibirProjetos();
            atualizarBotoes();
            mostrarMensagem("Projeto removido da edição. Salve para confirmar.");
        });

        colunaAcoes.appendChild(remover);
    });

    quantidadeProjetos.textContent = `${projetosEmEdicao.length} de 15 projetos`;
    botaoAdicionar.disabled = projetosEmEdicao.length >= 15;
}

// Atualiza a tabela com a população atual
function exibirPopulacao(populacao) {
    const tabela = document.getElementById("tabelaPopulacao");
    tabela.innerHTML = "";

    populacao.forEach(function(cromossomo, indice) {
        const resultado = calcularAptidao(cromossomo);
        const linha = tabela.insertRow();

        const valores = [
            indice + 1,
            resultado.cromossomo,
            transformarEmReais(resultado.custoTotal),
            resultado.beneficioTotal,
            resultado.aptidao
        ];

        valores.forEach(function(valor) {
            const coluna = linha.insertCell();
            coluna.textContent = valor;
        });
    });
}

// Atualiza a interface após cada geração
function atualizarSimulacao() {
    const estado = obterEstadoSimulacao();

    exibirPopulacao(estado.populacao);

    if (estado.finalizada) {
        pararTemporizador();
        estadoExecucao.textContent =
            `Geração ${estado.geracao} · Simulação finalizada`;
    } else if (temporizador !== null) {
        estadoExecucao.textContent =
            `Geração ${estado.geracao} · Executando`;
    } else {
        estadoExecucao.textContent =
            `Geração ${estado.geracao} · Pausada`;
    }

    atualizarBotoes();
}

function atualizarBotoes() {
    const estado = obterEstadoSimulacao();
    const executando = temporizador !== null;
    const bloqueado = alteracoesProjetos || configuracaoPendente;

    botaoExecutar.disabled = executando || estado.finalizada || bloqueado;
    botaoPausar.disabled = !executando;
    botaoAvancar.disabled = executando || estado.finalizada || bloqueado;
    botaoReiniciar.disabled = false;
}

// Salva os projetos após validar os dados
function salvarProjetos() {
    const novosProjetos = projetosEmEdicao.map(function(projeto) {
        return {
            nome: projeto.nome,
            custo: lerValor(projeto.custoTexto),
            beneficio: lerBeneficio(projeto.beneficioTexto)
        };
    });

    try {
        pausarExecucao();
        atualizarProjetos(novosProjetos);

        projetosEmEdicao = obterProjetos().map(criarRascunho);
        alteracoesProjetos = false;

        exibirProjetos();
        atualizarSimulacao();
        mostrarMensagem("Projetos salvos. Simulação reiniciada.");
    } catch (erro) {
        mostrarMensagem(erro.message, true);
        atualizarBotoes();
    }
}

function adicionarProjeto() {
    if (projetosEmEdicao.length >= 15) {
        mostrarMensagem("O limite é de 15 projetos.", true);
        return;
    }

    pausarExecucao();

    projetosEmEdicao.push({
        nome: "",
        custoTexto: "",
        beneficioTexto: "0"
    });

    alteracoesProjetos = true;

    exibirProjetos();
    atualizarBotoes();
    mostrarMensagem("Preencha o novo projeto e clique em Salvar projetos.");
}

function desfazerAlteracoes() {
    projetosEmEdicao = obterProjetos().map(criarRascunho);
    alteracoesProjetos = false;

    exibirProjetos();
    atualizarBotoes();
    mostrarMensagem("Alterações não salvas foram desfeitas.");
}

// Lê e valida os parâmetros da simulação
function lerConfiguracoes() {
    const valores = {};

    camposConfiguracao.forEach(function(nome) {
        const campo = document.getElementById(nome);
        const texto = campo.value.trim();

        if (texto === "") {
            throw new Error(`Preencha o campo ${campo.labels[0].textContent}.`);
        }

        const valor = Number(texto);

        if (!Number.isFinite(valor)) {
            throw new Error(`Valor inválido no campo ${campo.labels[0].textContent}.`);
        }

        valores[nome] = valor;
    });

    const orcamento = validarOrcamento();

    if (orcamento === null) {
        throw new Error("Informe um orçamento válido.");
    }

    valores.orcamento = orcamento;

    return valores;
}

// Aplica os parâmetros e reinicia quando necessário
function aplicarConfiguracoes() {
    pausarExecucao();

    try {
        const valores = lerConfiguracoes();

        atualizarConfiguracao(valores);
        configuracaoPendente = false;

        preencherConfiguracoes();
        atualizarSimulacao();
        mostrarMensagemConfiguracao("Configurações aplicadas.");
    } catch (erro) {
        configuracaoPendente = true;
        mostrarMensagemConfiguracao(erro.message, true);
    }

    atualizarBotoes();
}

function pararTemporizador() {
    if (temporizador !== null) {
        clearInterval(temporizador);
        temporizador = null;
    }
}

// Pausa sem alterar a população ou o histórico
function pausarExecucao() {
    pararTemporizador();

    const estado = obterEstadoSimulacao();

    if (!estado.finalizada) {
        estadoExecucao.textContent =
            `Geração ${estado.geracao} · Pausada`;
    }

    atualizarBotoes();
}

// Produz exatamente uma nova geração
function executarUmaGeracao() {
    try {
        avancarGeracao();
        atualizarSimulacao();
    } catch (erro) {
        pararTemporizador();
        estadoExecucao.textContent = `Erro: ${erro.message}`;
        atualizarBotoes();
    }
}

// Executa continuamente, preservando o estado
function executarSimulacao() {
    if (temporizador !== null || alteracoesProjetos || configuracaoPendente) {
        return;
    }

    if (obterEstadoSimulacao().finalizada) {
        return;
    }

    temporizador = setInterval(executarUmaGeracao, 500);
    atualizarSimulacao();
}

// Avança uma geração e permanece pausado
function avancarUmaGeracao() {
    if (temporizador !== null || alteracoesProjetos || configuracaoPendente) {
        return;
    }

    executarUmaGeracao();
}

// Reinicia a população, o histórico e a semente
function reiniciarExecucao() {
    pausarExecucao();

    if (alteracoesProjetos || configuracaoPendente) {
        mostrarMensagemConfiguracao(
            "Salve ou desfaça as alterações pendentes antes de reiniciar.",
            true
        );
        return;
    }

    reiniciarSimulacao();
    atualizarSimulacao();

    estadoExecucao.textContent = "Geração 0 · Simulação pronta";
}

// Eventos dos projetos
botaoAdicionar.addEventListener("click", adicionarProjeto);
botaoSalvar.addEventListener("click", salvarProjetos);
botaoDesfazer.addEventListener("click", desfazerAlteracoes);

// Eventos dos parâmetros
camposConfiguracao.forEach(function(nome) {
    const campo = document.getElementById(nome);

    campo.addEventListener("input", function() {
        pausarExecucao();
        configuracaoPendente = true;
        mostrarMensagemConfiguracao("Existem alterações pendentes.");
        atualizarBotoes();
    });

    campo.addEventListener("change", aplicarConfiguracoes);
});

campoOrcamento.addEventListener("input", function() {
    pausarExecucao();
    configuracaoPendente = true;
    validarOrcamento();
    atualizarBotoes();
});

campoOrcamento.addEventListener("change", aplicarConfiguracoes);

campoOrcamento.addEventListener("blur", function() {
    formatarCampoValor(campoOrcamento);
});

// Eventos dos controles
botaoExecutar.addEventListener("click", executarSimulacao);
botaoPausar.addEventListener("click", pausarExecucao);
botaoAvancar.addEventListener("click", avancarUmaGeracao);
botaoReiniciar.addEventListener("click", reiniciarExecucao);

// Inicialização da interface
exibirProjetos();
preencherConfiguracoes();
atualizarSimulacao();

estadoExecucao.textContent = "Geração 0 · Simulação pronta";
