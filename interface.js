
"use strict";

import {
    lerValor, lerBeneficio, transformarEmReais,
    formatarCampoValor, validarOrcamento
} from "./validacao.js";

import {
    obterProjetos, atualizarProjetos, calcularAptidao,
    obterConfiguracao, obterEstadoSimulacao,
    atualizarConfiguracao, reiniciarSimulacao, avancarGeracao
} from "./script.js";

import { descreverReproducao, descreverElitismo } from "./narrativa.js";
import { animarReproducao, cancelarAnimacao } from "./animacao.js";

const $ = id => document.getElementById(id);
const formato = valor => Number(valor).toLocaleString("pt-BR", {
    maximumFractionDigits: 2
});

const campos = [
    "tamanhoPopulacao", "numeroGeracoes", "taxaCruzamento",
    "taxaMutacao", "tamanhoTorneio", "quantidadeElite", "semente"
];

let temporizador = null;
let projetosPendentes = false;
let configuracaoPendente = false;

function criarRascunho(projeto) {
    return {
        nome: projeto.nome,
        custo: (projeto.custo / 100).toFixed(2).replace(".", ","),
        beneficio: String(projeto.beneficio).replace(".", ",")
    };
}

let rascunho = obterProjetos().map(criarRascunho);

function mensagem(id, texto, erro = false) {
    $(id).textContent = texto;
    $(id).classList.toggle("erro", erro);
}

function criarElemento(tag, texto = "", classe = "") {
    const elemento = document.createElement(tag);
    elemento.textContent = texto;
    if (classe) elemento.className = classe;
    return elemento;
}

function preencherConfiguracao() {
    const config = obterConfiguracao();

    $("orcamento").value = (config.orcamento / 100).toFixed(2).replace(".", ",");
    formatarCampoValor($("orcamento"));

    campos.forEach(id => $(id).value = config[id]);
}

function exibirProjetos() {
    const tabela = $("tabelaProjetos");
    tabela.replaceChildren();

    rascunho.forEach((projeto, indice) => {
        const linha = tabela.insertRow();

        ["nome", "custo", "beneficio"].forEach(chave => {
            const campo = criarElemento("input");
            campo.type = "text";
            campo.value = projeto[chave];
            campo.className = chave === "nome"
                ? "campo-projeto campo-nome" : "campo-projeto";
            campo.setAttribute("aria-label", `${chave} do projeto ${indice + 1}`);

            if (chave === "nome") {
                campo.maxLength = 120;
            } else {
                campo.inputMode = "decimal";
            }

            campo.addEventListener("input", () => {
                pausar();
                rascunho[indice][chave] = campo.value;
                projetosPendentes = true;
                mensagem("mensagemProjetos", "Existem alterações não salvas.");
                atualizarBotoes();
            });

            if (chave === "custo") {
                campo.addEventListener("blur", () => {
                    formatarCampoValor(campo);
                    rascunho[indice][chave] = campo.value;
                });
            }

            linha.insertCell().appendChild(campo);
        });

        const remover = criarElemento("button", "Remover", "botao-perigo");
        remover.disabled = rascunho.length <= 4;

        remover.addEventListener("click", () => {
            pausar();
            rascunho.splice(indice, 1);
            projetosPendentes = true;
            exibirProjetos();
            atualizarBotoes();
            mensagem("mensagemProjetos", "Projeto removido. Salve as alterações.");
        });

        linha.insertCell().appendChild(remover);
    });

    $("quantidadeProjetos").textContent = `${rascunho.length} de 15 projetos`;
    $("adicionarProjeto").disabled = rascunho.length >= 15;
}

function salvarProjetos() {
    pausar();

    try {
        const novos = rascunho.map(projeto => ({
            nome: projeto.nome,
            custo: lerValor(projeto.custo),
            beneficio: lerBeneficio(projeto.beneficio)
        }));

        atualizarProjetos(novos);
        rascunho = obterProjetos().map(criarRascunho);
        projetosPendentes = false;
        resetarAnimacao();

        exibirProjetos();
        atualizarTela();
        mensagem("mensagemProjetos", "Projetos salvos.");
    } catch (erro) {
        mensagem("mensagemProjetos", erro.message, true);
    }
}

function lerConfiguracao() {
    const config = {};

    campos.forEach(id => {
        const campo = $(id);
        if (campo.value.trim() === "") {
            throw new Error(`Preencha o campo ${campo.labels[0].textContent}.`);
        }

        config[id] = Number(campo.value);
    });

    config.orcamento = validarOrcamento();

    if (config.orcamento === null) {
        throw new Error("Informe um orçamento válido.");
    }

    return config;
}

function aplicarConfiguracao() {
    pausar();

    try {
        atualizarConfiguracao(lerConfiguracao());
        configuracaoPendente = false;
        resetarAnimacao();
        preencherConfiguracao();
        atualizarTela();
        mensagem("mensagemConfiguracao", "Configurações aplicadas.");
    } catch (erro) {
        configuracaoPendente = true;
        mensagem("mensagemConfiguracao", erro.message, true);
    }

    atualizarBotoes();
}

function preencherTabela(id, linhas) {
    const tabela = $(id);
    tabela.replaceChildren();

    linhas.forEach(valores => {
        const linha = tabela.insertRow();
        valores.forEach(valor => {
            linha.insertCell().textContent = valor;
        });
    });
}

function exibirResultados(estado) {
    const ultimo = estado.historico.at(-1);
    const melhor = estado.melhorGlobal;

    preencherTabela("tabelaPopulacao", estado.populacao.map((c, i) => {
        const r = calcularAptidao(c);
        return [
            i + 1, r.cromossomo, transformarEmReais(r.custoTotal),
            formato(r.beneficioTotal), formato(r.aptidao)
        ];
    }));

    $("metricaGeracao").textContent = estado.geracao;
    $("metricaMelhor").textContent = formato(ultimo.melhorAptidao);
    $("metricaMedia").textContent = formato(ultimo.aptidaoMedia);
    $("metricaGlobal").textContent = formato(ultimo.melhorAcumulado);

    preencherTabela("tabelaHistorico", estado.historico.map(r => [
        r.geracao, formato(r.melhorAptidao),
        formato(r.aptidaoMedia), formato(r.melhorAcumulado)
    ]));

    const detalhe = $("melhorSolucao");
    detalhe.replaceChildren();

    const dados = [
        ["Cromossomo", melhor.cromossomo],
        ["Projetos", melhor.projetosSelecionados.join(", ") || "Nenhum"],
        ["Custo", transformarEmReais(melhor.custoTotal)],
        ["Benefício", formato(melhor.beneficioTotal)],
        ["Saldo", transformarEmReais(melhor.saldo)],
        ["Aptidão", formato(melhor.aptidao)],
        ["Geração encontrada", melhor.geracao]
    ];

    dados.forEach(([nome, valor]) => {
        const p = criarElemento("p");
        const strong = criarElemento("strong", `${nome}: `);
        p.append(strong, document.createTextNode(String(valor)));
        detalhe.appendChild(p);
    });

    exibirGrafico(estado.historico);
}

// Desenha as três curvas da evolução
function exibirGrafico(historico) {
    const svg = $("graficoEvolucao");
    const ns = "http://www.w3.org/2000/svg";
    svg.replaceChildren();

    function elemento(tag, atributos, texto = "") {
        const e = document.createElementNS(ns, tag);
        Object.entries(atributos).forEach(([k, v]) => e.setAttribute(k, v));
        e.textContent = texto;
        svg.appendChild(e);
    }

    const largura = 800, altura = 260;
    const maxX = Math.max(1, historico.at(-1).geracao);
    const maxY = Math.max(1, ...historico.map(r => r.melhorAcumulado));

    const x = n => 55 + n / maxX * 720;
    const y = n => 215 - n / maxY * 175;

    for (let i = 0; i <= 4; i++) {
        const valor = maxY * i / 4;
        elemento("line", {
            x1: 55, y1: y(valor), x2: 775, y2: y(valor),
            class: "grafico-grade"
        });
        elemento("text", {
            x: 47, y: y(valor) + 4,
            "text-anchor": "end", class: "grafico-texto"
        }, formato(valor));
    }

    elemento("line", {
        x1: 55, y1: 40, x2: 55, y2: 215, class: "grafico-eixo"
    });
    elemento("line", {
        x1: 55, y1: 215, x2: 775, y2: 215, class: "grafico-eixo"
    });

    const series = [
        ["melhorAptidao", "grafico-linha-melhor"],
        ["aptidaoMedia", "grafico-linha-media"],
        ["melhorAcumulado", "grafico-linha-global"]
    ];

    series.forEach(([campo, classe]) => {
        const pontos = historico.map(r =>
            `${x(r.geracao)},${y(r[campo])}`
        ).join(" ");

        elemento("polyline", { points: pontos, class: classe });
    });

    elemento("text", {
        x: 55, y: 245, class: "grafico-texto"
    }, "Geração 0");

    elemento("text", {
        x: 775, y: 245, "text-anchor": "end", class: "grafico-texto"
    }, `Geração ${historico.at(-1).geracao}`);

    const legendas = [
        ["Melhor geração", "#485c43"],
        ["Média", "#b18c57"],
        ["Melhor acumulado", "#687f91"]
    ];

    legendas.forEach(([nome, cor], i) => {
        const pos = [55, 255, 395][i];
        elemento("line", {
            x1: pos, y1: 18, x2: pos + 22, y2: 18,
            stroke: cor, "stroke-width": 3
        });
        elemento("text", {
            x: pos + 28, y: 22, class: "grafico-texto"
        }, nome);
    });
}

function cromossomoVisual(texto, destacados = [], classe = "", corte = null) {
    const div = criarElemento("div", "", "visualizacao-cromossomo");

    [...texto].forEach((bit, i) => {
        const gene = criarElemento("span", bit, "gene");
        if (destacados.includes(i)) gene.classList.add(classe);
        if (corte !== null && i === corte - 1) gene.classList.add("gene-corte");
        div.appendChild(gene);
    });

    return div;
}

// Mostra os eventos da última geração
function exibirEventos(eventos, geracao) {
    const painel = $("painelEventos");
    painel.replaceChildren();

    if (geracao === 0 || eventos.length === 0) {
        painel.appendChild(criarElemento(
            "p", "Avance uma geração para visualizar as operações."
        ));
        return;
    }

    painel.appendChild(criarElemento(
        "p",
        `Geração ${geracao}: índices referem-se à população da geração ${geracao - 1}.`,
        "evento-detalhe"
    ));

    let numeroReproducao = 0;

    eventos.forEach(evento => {
        const bloco = criarElemento("div", "", "evento");

        if (evento.tipo === "elitismo") {
            bloco.classList.add("evento-elite");
            bloco.appendChild(criarElemento("h3", "Elitismo"));

            descreverElitismo(evento).forEach((linha, i) => {
                const ind = evento.individuos[i];
                bloco.appendChild(criarElemento("p", linha));

                if (ind) {
                    bloco.appendChild(cromossomoVisual(
                        ind.cromossomo,
                        [...ind.cromossomo].map((_, j) => j), "gene-elite"
                    ));
                }
            });

            painel.appendChild(bloco);
            return;
        }

        if (evento.tipo !== "reproducao") return;

        numeroReproducao++;
        bloco.classList.add("evento-cruzamento");
        bloco.appendChild(criarElemento("h3", `Reprodução ${numeroReproducao}`));

        const linhas = descreverReproducao(evento);
        const cruz = evento.cruzamento;

        evento.pais.forEach((torneio, i) => {
            const candidatos = torneio.candidatos.map(c =>
                `${c.indice + 1} (${c.cromossomo}, aptidão ${formato(c.aptidao)})`
            ).join("; ");

            bloco.appendChild(criarElemento(
                "p", `Torneio ${i + 1}: candidatos ${candidatos}`, "evento-detalhe"
            ));
        });

        bloco.appendChild(criarElemento("p", linhas[0]));
        evento.pais.forEach(torneio => {
            bloco.appendChild(cromossomoVisual(torneio.cromossomo, [], "", cruz.pontoCorte));
        });

        bloco.appendChild(criarElemento("p", linhas[1]));
        cruz.filhos.forEach(filho => {
            bloco.appendChild(cromossomoVisual(filho, [], "", cruz.pontoCorte));
        });

        evento.descendentes.forEach((desc, i) => {
            const [linhaMutacao, linhaReparacao, linhaFinal] =
                linhas.slice(2 + 3 * i, 5 + 3 * i);

            bloco.appendChild(criarElemento("p", linhaMutacao));
            if (desc.mutacao.indices.length > 0) {
                bloco.appendChild(cromossomoVisual(
                    desc.mutacao.depois, desc.mutacao.indices, "gene-mutado"
                ));
            }

            bloco.appendChild(criarElemento("p", linhaReparacao));
            desc.reparacao.etapas.forEach(etapa => {
                bloco.appendChild(cromossomoVisual(
                    etapa.cromossomo, [etapa.indice], "gene-removido"
                ));
            });

            bloco.appendChild(criarElemento("p", linhaFinal));
        });

        if (evento.descendentes.length === 1) {
            bloco.appendChild(criarElemento("p", linhas.at(-1), "evento-detalhe"));
        }

        painel.appendChild(bloco);
    });
}

function atualizarBotoes() {
    const estado = obterEstadoSimulacao();
    const bloqueado = projetosPendentes || configuracaoPendente;

    $("executarSimulacao").disabled =
        temporizador !== null || estado.finalizada || bloqueado;
    $("pausarSimulacao").disabled = temporizador === null;
    $("avancarSimulacao").disabled =
        temporizador !== null || estado.finalizada || bloqueado;

    atualizarControlesAnimacao(estado);
}

// Animação de uma reprodução real da geração atual
let geracaoAnimacao = -1;
let palcoComMensagem = true;

function reproducoesAtuais(estado) {
    return estado.eventos.filter(evento => evento.tipo === "reproducao");
}

function resetarAnimacao() {
    cancelarAnimacao();
    geracaoAnimacao = -1;
}

function atualizarControlesAnimacao(estado) {
    const reproducoes = estado.geracao === 0 ? [] : reproducoesAtuais(estado);
    const executando = temporizador !== null;

    if (estado.geracao !== geracaoAnimacao) {
        cancelarAnimacao();
        geracaoAnimacao = estado.geracao;
        palcoComMensagem = true;

        $("reproducaoAnimada").replaceChildren(...reproducoes.map((_, i) => {
            const opcao = criarElemento("option", `Reprodução ${i + 1}`);
            opcao.value = String(i);
            return opcao;
        }));
    }

    if (palcoComMensagem) {
        const texto = executando
            ? "Pause a execução para animar uma reprodução."
            : reproducoes.length === 0
                ? "Avance uma geração para animar uma reprodução."
                : "Escolha uma reprodução e clique em Reproduzir animação.";

        $("palcoAnimacao").replaceChildren(criarElemento("p", texto, "evento-vazio"));
    }

    const indisponivel = executando || reproducoes.length === 0;
    $("reproducaoAnimada").disabled = indisponivel;
    $("reproduzirAnimacao").disabled = indisponivel;
}

function reproduzirAnimacao(indice = Number($("reproducaoAnimada").value)) {
    const evento = reproducoesAtuais(obterEstadoSimulacao())[indice];
    if (!evento || temporizador !== null) return;

    $("reproducaoAnimada").value = String(indice);
    palcoComMensagem = false;

    animarReproducao($("palcoAnimacao"), evento, {
        duracaoEtapa: Number($("velocidadeAnimacao").value)
    });
}

function atualizarTela() {
    const estado = obterEstadoSimulacao();

    exibirResultados(estado);
    exibirEventos(estado.eventos, estado.geracao);

    if (estado.finalizada) pararTemporizador();

    $("estadoExecucao").textContent = estado.finalizada
        ? `Geração ${estado.geracao} · Finalizada`
        : `Geração ${estado.geracao} · ` +
          (temporizador === null ? "Pausada" : "Executando");

    atualizarBotoes();
}

function pararTemporizador() {
    if (temporizador !== null) {
        clearInterval(temporizador);
        temporizador = null;
    }
}

function pausar() {
    pararTemporizador();
    const estado = obterEstadoSimulacao();

    $("estadoExecucao").textContent = estado.finalizada
        ? `Geração ${estado.geracao} · Finalizada`
        : `Geração ${estado.geracao} · Pausada`;

    atualizarBotoes();
}

function avancar() {
    try {
        avancarGeracao();
        atualizarTela();
    } catch (erro) {
        pausar();
        $("estadoExecucao").textContent = `Erro: ${erro.message}`;
    }
}

// Avanço pelo botão: produz uma geração e anima a primeira reprodução
function avancarComAnimacao() {
    avancar();
    if (temporizador === null) reproduzirAnimacao(0);
}

const intervaloExecucao = () => Number($("velocidadeExecucao").value);

function executar() {
    if ($("executarSimulacao").disabled) return;
    cancelarAnimacao();
    palcoComMensagem = true;
    temporizador = setInterval(avancar, intervaloExecucao());
    atualizarTela();
}

function mudarVelocidadeExecucao() {
    if (temporizador === null) return;
    clearInterval(temporizador);
    temporizador = setInterval(avancar, intervaloExecucao());
}

function reiniciar() {
    pausar();

    if (projetosPendentes || configuracaoPendente) {
        mensagem(
            "mensagemConfiguracao",
            "Resolva as alterações pendentes antes de reiniciar.",
            true
        );
        return;
    }

    reiniciarSimulacao();
    resetarAnimacao();
    atualizarTela();
    $("estadoExecucao").textContent = "Geração 0 · Simulação pronta";
}

// Eventos da interface
$("adicionarProjeto").addEventListener("click", () => {
    if (rascunho.length >= 15) return;

    pausar();
    rascunho.push({ nome: "", custo: "", beneficio: "0" });
    projetosPendentes = true;
    exibirProjetos();
    atualizarBotoes();
});

$("salvarProjetos").addEventListener("click", salvarProjetos);

$("desfazerProjetos").addEventListener("click", () => {
    rascunho = obterProjetos().map(criarRascunho);
    projetosPendentes = false;
    exibirProjetos();
    atualizarBotoes();
    mensagem("mensagemProjetos", "Alterações desfeitas.");
});

function configuracaoDiferente() {
    try {
        const lida = lerConfiguracao();
        const atual = obterConfiguracao();
        return Object.keys(lida).some(chave => lida[chave] !== atual[chave]);
    } catch {
        return true;
    }
}

function registrarEdicaoConfiguracao() {
    pausar();
    configuracaoPendente = configuracaoDiferente();
    mensagem(
        "mensagemConfiguracao",
        configuracaoPendente ? "Existem alterações pendentes." : ""
    );
    atualizarBotoes();
}

campos.forEach(id => {
    $(id).addEventListener("input", registrarEdicaoConfiguracao);
    $(id).addEventListener("change", aplicarConfiguracao);
});

$("orcamento").addEventListener("input", registrarEdicaoConfiguracao);

$("orcamento").addEventListener("change", aplicarConfiguracao);
$("orcamento").addEventListener("blur", () => {
    formatarCampoValor($("orcamento"));
});

$("executarSimulacao").addEventListener("click", executar);
$("pausarSimulacao").addEventListener("click", pausar);
$("avancarSimulacao").addEventListener("click", avancarComAnimacao);
$("reiniciarSimulacao").addEventListener("click", reiniciar);
$("velocidadeExecucao").addEventListener("change", mudarVelocidadeExecucao);
$("reproduzirAnimacao").addEventListener("click", () => reproduzirAnimacao());
$("reproducaoAnimada").addEventListener("change", () => reproduzirAnimacao());

exibirProjetos();
preencherConfiguracao();
atualizarTela();
$("estadoExecucao").textContent = "Geração 0 · Simulação pronta";
