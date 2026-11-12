
"use strict";

import assert from "node:assert/strict";
import {
    obterConfiguracao, atualizarConfiguracao, obterEstadoSimulacao,
    reiniciarSimulacao, avancarGeracao, executarAlgoritmo,
    avaliarCromossomo, calcularAptidao, repararCromossomo,
    selecionarPorTorneio, cruzarCromossomos, mutarCromossomo,
    selecionarElite, gerarProximaGeracao
} from "./script.js";
import { descreverReproducao, descreverElitismo } from "./narrativa.js";
import { etapasAnimacao } from "./animacao.js";

const original = obterConfiguracao();
let aprovados = 0;

function configurar(opcoes = {}) {
    atualizarConfiguracao({
        orcamento: 700000, tamanhoPopulacao: 20,
        numeroGeracoes: 50, taxaCruzamento: 80,
        taxaMutacao: 5, tamanhoTorneio: 2,
        quantidadeElite: 1, semente: 42,
        ...opcoes
    });
    reiniciarSimulacao();
}

function testar(nome, funcao) {
    funcao();
    aprovados++;
    console.log(`PASSOU - ${nome}`);
}

const texto = cromossomo => cromossomo.join("");

const evento64 = {
    tipo: "reproducao",
    pais: [
        { candidatos: [], vencedor: 2, cromossomo: "1100" },
        { candidatos: [], vencedor: 4, cromossomo: "0011" }
    ],
    cruzamento: { ocorreu: true, pontoCorte: 2, filhos: ["1111", "0000"] },
    descendentes: [
        {
            mutacao: { antes: "1111", depois: "0111", indices: [0] },
            reparacao: {
                antes: "0111", depois: "0100", etapas: [
                    { indice: 2, projeto: "Aquisição de bancos", cromossomo: "0101" },
                    { indice: 3, projeto: "Reforma de espaço de convivência", cromossomo: "0100" }
                ]
            },
            aptidao: 5
        },
        {
            mutacao: { antes: "0000", depois: "0000", indices: [] },
            reparacao: { antes: "0000", depois: "0000", etapas: [] },
            aptidao: 0
        }
    ]
};

try {
    console.log("\n=== TESTES DO ALGORITMO GENÉTICO ===\n");
    configurar();

    testar("Avaliação", () => {
        const r = calcularAptidao([1, 1, 0, 0]);
        assert.deepEqual(
            [r.cromossomo, r.custoTotal, r.beneficioTotal, r.saldo, r.viavel, r.aptidao],
            ["1100", 700000, 12, 0, true, 12]
        );
    });

    testar("Reparação", () => {
        const etapas = [];
        assert.equal(texto(repararCromossomo([1, 1, 1, 1], etapas)), "1100");
        assert.deepEqual(etapas.map(e => e.cromossomo), ["1101", "1100"]);
    });

    testar("Cruzamento e mutação controlados", () => {
        const filhos = cruzarCromossomos([1, 1, 0, 0], [0, 0, 1, 1], 100, 2);
        assert.deepEqual(filhos.map(texto), ["1111", "0000"]);

        const etapas = [];
        const mutado = mutarCromossomo(filhos[0], 0, [0]);
        const segundo = mutarCromossomo(filhos[1], 0, []);

        assert.equal(texto(mutado), "0111");
        assert.equal(texto(segundo), "0000");
        assert.equal(texto(repararCromossomo(mutado, etapas)), "0100");
        assert.deepEqual(etapas.map(e => e.cromossomo), ["0101", "0100"]);
        assert.equal(calcularAptidao([0, 1, 0, 0]).aptidao, 5);
        assert.equal(calcularAptidao(segundo).aptidao, 0);
    });

    testar("Limites das taxas", () => {
        const pai1 = [1, 1, 0, 0], pai2 = [0, 0, 1, 1];
        assert.deepEqual(cruzarCromossomos(pai1, pai2, 0), [pai1, pai2]);
        assert.deepEqual(mutarCromossomo(pai1, 0), pai1);
        assert.deepEqual(mutarCromossomo(pai1, 100), pai2);
        assert.deepEqual(pai1, [1, 1, 0, 0]);
    });

    testar("Torneio e desempate", () => {
        const populacao = [[1, 0, 0, 0], [0, 0, 1, 1], [1, 1, 0, 0]];
        assert.equal(texto(selecionarPorTorneio(populacao, 3)), "1100");

        const empate = [[0, 1, 1, 0], [0, 0, 0, 1]];
        assert.equal(texto(selecionarPorTorneio(empate, 2)), "0110");
    });

    testar("Elitismo e tamanho da população", () => {
        const populacao = [[1, 0, 0, 0], [1, 1, 0, 0], [0, 0, 1, 1]];
        assert.equal(texto(selecionarElite(populacao, 1)[0]), "1100");
        assert.deepEqual(selecionarElite(populacao, 0), []);

        configurar({ tamanhoPopulacao: 5, quantidadeElite: 0 });
        const eventos = [];
        const nova = gerarProximaGeracao(obterEstadoSimulacao().populacao, eventos);

        assert.equal(nova.length, 5);
        assert.ok(nova.every(c => avaliarCromossomo(c).viavel));
        assert.equal(eventos.at(-1).descendentes.length, 1);
    });

    testar("Histórico, registros e reprodução", () => {
        configurar();
        const inicial = obterEstadoSimulacao().populacao;
        avancarGeracao();
        const estado = obterEstadoSimulacao();

        assert.equal(estado.historico.length, 2);
        assert.equal(estado.eventos[0].tipo, "elitismo");
        assert.ok(estado.eventos.some(e => e.tipo === "reproducao"));

        const primeiro = executarAlgoritmo();
        const segundo = executarAlgoritmo();

        assert.deepEqual(primeiro, segundo);
        assert.deepEqual(obterEstadoSimulacao().populacao, segundo.populacaoFinal);

        reiniciarSimulacao();
        assert.deepEqual(obterEstadoSimulacao().populacao, inicial);
    });

    testar("Execução completa", () => {
        configurar();
        const r = executarAlgoritmo();

        assert.equal(r.historico.length, 51);
        assert.equal(r.historico[0].geracao, 0);
        assert.equal(r.historico.at(-1).geracao, 50);
        assert.equal(r.populacaoFinal.length, 20);
        assert.ok(r.populacaoFinal.every(c => avaliarCromossomo(c).viavel));
        assert.ok(r.melhorSolucao.aptidao <= 12);

        for (let i = 1; i < r.historico.length; i++) {
            assert.ok(r.historico[i].melhorAcumulado >= r.historico[i - 1].melhorAcumulado);
            assert.ok(r.historico[i].melhorAptidao >= r.historico[i - 1].melhorAptidao);
        }

        console.log("Melhor solução:", r.melhorSolucao.cromossomo);
        console.log("Melhor aptidão:", r.melhorSolucao.aptidao);
        console.log("Registros:", r.historico.length);
    });

    testar("Limites de orçamento", () => {
        configurar({ orcamento: 0 });
        assert.ok(obterEstadoSimulacao().populacao.every(c => texto(c) === "0000"));
        assert.equal(executarAlgoritmo().melhorSolucao.aptidao, 0);

        configurar({ orcamento: 1400000 });
        const r = calcularAptidao([1, 1, 1, 1]);
        assert.deepEqual(
            [r.cromossomo, r.custoTotal, r.beneficioTotal, r.saldo, r.aptidao],
            ["1111", 1400000, 23, 0, 23]
        );
    });

    testar("Narrativa da reprodução (seção 6.4)", () => {
        assert.deepEqual(descreverReproducao(evento64), [
            "Pais: 1100 (indivíduo 3 da geração anterior) e 0011 (indivíduo 5 da geração anterior)",
            "Cruzamento com corte após o 2º gene: 11|00 + 00|11 → filhos 1111 e 0000",
            "Mutação no filho 1: gene 1 → 0111",
            "Reparação do filho 1: 0111 → 0101 → 0100 (removidos: Aquisição de bancos; Reforma de espaço de convivência)",
            "Filho 1 final: 0100 · aptidão 5",
            "Filho 2 sem mutação",
            "Filho 2 sem reparação",
            "Filho 2 final: 0000 · aptidão 0"
        ]);
    });

    testar("Narrativa sem cruzamento e com vaga única", () => {
        const evento = structuredClone(evento64);
        evento.cruzamento = { ocorreu: false, pontoCorte: null, filhos: ["1100", "0011"] };
        evento.descendentes = [{
            mutacao: { antes: "1100", depois: "1100", indices: [] },
            reparacao: { antes: "1100", depois: "1100", etapas: [] },
            aptidao: 12
        }];

        const linhas = descreverReproducao(evento);
        assert.equal(linhas[1], "Sem cruzamento: filhos copiam os pais (1100 e 0011)");
        assert.equal(linhas.at(-1), "Apenas o filho 1 entra na população (última vaga)");
    });

    testar("Narrativa com vários genes mutados e uma remoção", () => {
        const evento = structuredClone(evento64);
        evento.descendentes[0].mutacao = { antes: "1111", depois: "0101", indices: [0, 2] };
        evento.descendentes[0].reparacao = {
            antes: "0101", depois: "0100", etapas: [
                { indice: 3, projeto: "Reforma de espaço de convivência", cromossomo: "0100" }
            ]
        };

        const linhas = descreverReproducao(evento);
        assert.equal(linhas[2], "Mutação no filho 1: genes 1, 3 → 0101");
        assert.equal(linhas[3], "Reparação do filho 1: 0101 → 0100 (removido: Reforma de espaço de convivência)");
    });

    testar("Narrativa do elitismo", () => {
        assert.deepEqual(
            descreverElitismo({ tipo: "elitismo", individuos: [] }),
            ["Sem elitismo: nenhum indivíduo preservado"]
        );
        assert.deepEqual(
            descreverElitismo({
                tipo: "elitismo",
                individuos: [{ indice: 0, cromossomo: "1100", aptidao: 12 }]
            }),
            ["Preservado sem alterações: 1100 (indivíduo 1 da geração anterior) · aptidão 12"]
        );
    });

    testar("Etapas da animação refletem o evento", () => {
        const etapas = etapasAnimacao(evento64);

        assert.deepEqual(etapas.map(e => e.tipo), [
            "torneio", "torneio", "corte", "troca",
            "mutacao", "reparacao", "reparacao", "resultado"
        ]);
        assert.deepEqual(etapas[4].indices, [0]);
        assert.equal(etapas[4].filho, 1);
        assert.deepEqual(
            etapas.filter(e => e.tipo === "reparacao").map(e => e.cromossomo),
            ["0101", "0100"]
        );
        assert.deepEqual(etapas.at(-1).filhos, [
            { cromossomo: "0100", aptidao: 5 },
            { cromossomo: "0000", aptidao: 0 }
        ]);

        const semCruzamento = structuredClone(evento64);
        semCruzamento.cruzamento = { ocorreu: false, pontoCorte: null, filhos: ["1100", "0011"] };
        semCruzamento.descendentes = [semCruzamento.descendentes[1]];

        assert.deepEqual(
            etapasAnimacao(semCruzamento).map(e => e.tipo),
            ["torneio", "torneio", "copia", "resultado"]
        );
    });

    console.log("\n=== COMPARAÇÃO DAS TAXAS DE MUTAÇÃO ===\n");

    for (const taxa of [1, 20]) {
        const resultados = [];

        for (let semente = 1; semente <= 5; semente++) {
            configurar({ taxaMutacao: taxa, semente });
            const execucao = executarAlgoritmo();

            resultados.push({
                semente,
                melhor: execucao.melhorSolucao.aptidao,
                geracaoDoMelhor: execucao.melhorSolucao.geracao,
                mediaFinal: execucao.historico.at(-1).aptidaoMedia,
                copiasDoOtimoNaPopulacaoFinal: execucao.populacaoFinal
                    .filter(c => texto(c) === "1100").length
            });
        }

        const mediaDe = campo =>
            resultados.reduce((soma, r) => soma + r[campo], 0) / resultados.length;
        const otimos = resultados.filter(r => r.melhor === 12).length;

        console.log(`Mutação ${taxa}%`);
        console.table(resultados);
        console.log(
            `Média do melhor: ${mediaDe("melhor")} | ` +
            `Execuções com aptidão 12: ${otimos} | ` +
            `Média da aptidão média final: ${mediaDe("mediaFinal").toFixed(2)} | ` +
            `Média de cópias do ótimo: ${mediaDe("copiasDoOtimoNaPopulacaoFinal")}\n`
        );
    }

    console.log(`${aprovados} grupos de testes aprovados.`);

} finally {
    atualizarConfiguracao(original);
    reiniciarSimulacao();
}
