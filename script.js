
"use strict";

// Valores monetários em centavos
const projetos = [
    { nome: "Melhoria da iluminação", custo: 400000, beneficio: 7 },
    { nome: "Instalação de bicicletários", custo: 300000, beneficio: 5 },
    { nome: "Aquisição de bancos", custo: 200000, beneficio: 3 },
    { nome: "Reforma de espaço de convivência", custo: 500000, beneficio: 8 }
];

let orcamento = 700000;

const configuracao = {
    tamanhoPopulacao: 5,
    tamanhoTorneio: 2,
    semente: 42,
    taxaCruzamento: 80,
    taxaMutacao: 5,
    quantidadeElite: 1,
    numeroGeracoes: 50
};

let estadoSimulacao;

function obterConfiguracao() {
    return { orcamento, ...configuracao };
}

function obterProjetos() {
    return projetos.map(projeto => ({ ...projeto }));
}

function obterEstadoSimulacao() {
    return structuredClone({
        ...estadoSimulacao,
        finalizada: estadoSimulacao.geracao >= configuracao.numeroGeracoes
    });
}

function atualizarConfiguracao(alteracoes) {
    if (!alteracoes || typeof alteracoes !== "object" || Array.isArray(alteracoes)) {
        throw new TypeError("As configurações devem ser um objeto.");
    }

    const atual = obterConfiguracao();

    for (const chave of Object.keys(alteracoes)) {
        if (!(chave in atual)) {
            throw new Error(`Configuração desconhecida: ${chave}`);
        }
    }

    const nova = { ...atual, ...alteracoes };

    const inteiroMinimo = (valor, minimo) =>
        Number.isSafeInteger(valor) && valor >= minimo;

    const percentualValido = valor =>
        Number.isFinite(valor) && valor >= 0 && valor <= 100;

    if (!inteiroMinimo(nova.orcamento, 0)) {
        throw new RangeError("Orçamento inválido.");
    }

    if (!inteiroMinimo(nova.tamanhoPopulacao, 2)) {
        throw new RangeError("A população deve ter pelo menos 2 indivíduos.");
    }

    if (!inteiroMinimo(nova.numeroGeracoes, 1)) {
        throw new RangeError("O número de gerações deve ser pelo menos 1.");
    }

    if (
        !inteiroMinimo(nova.tamanhoTorneio, 2) ||
        nova.tamanhoTorneio > nova.tamanhoPopulacao
    ) {
        throw new RangeError("O torneio deve ter entre 2 e o tamanho da população.");
    }

    if (
        !inteiroMinimo(nova.quantidadeElite, 0) ||
        nova.quantidadeElite >= nova.tamanhoPopulacao
    ) {
        throw new RangeError("A elite deve ter entre 0 e população menos 1.");
    }

    if (
        !percentualValido(nova.taxaCruzamento) ||
        !percentualValido(nova.taxaMutacao)
    ) {
        throw new RangeError("As taxas devem estar entre 0 e 100.");
    }

    if (!Number.isSafeInteger(nova.semente)) {
        throw new RangeError("A semente deve ser um inteiro.");
    }

    if (Object.keys(nova).some(chave => nova[chave] !== atual[chave])) {
        orcamento = nova.orcamento;

        for (const chave of Object.keys(configuracao)) {
            configuracao[chave] = nova[chave];
        }

        reiniciarSimulacao();
    }

    return obterConfiguracao();
}

// Sorteios reproduzíveis
function numeroAleatorio() {
    estadoSimulacao.estadoAleatorio = (
        Math.imul(1664525, estadoSimulacao.estadoAleatorio) + 1013904223
    ) >>> 0;

    return estadoSimulacao.estadoAleatorio / 4294967296;
}

function sortearIndice(limite) {
    if (!Number.isSafeInteger(limite) || limite < 1) {
        throw new RangeError("Limite de sorteio inválido.");
    }

    return Math.floor(numeroAleatorio() * limite);
}

function gerarCromossomo() {
    return projetos.map(() => numeroAleatorio() < 0.5 ? 0 : 1);
}

function avaliarCromossomo(cromossomo) {
    let custoTotal = 0;
    let beneficioTotal = 0;
    const projetosSelecionados = [];

    cromossomo.forEach(function(gene, indice) {
        if (gene === 1) {
            custoTotal += projetos[indice].custo;
            beneficioTotal += projetos[indice].beneficio;
            projetosSelecionados.push(projetos[indice].nome);
        }
    });

    return {
        cromossomo: cromossomo.join(""),
        projetosSelecionados,
        custoTotal,
        beneficioTotal,
        saldo: orcamento - custoTotal,
        viavel: custoTotal <= orcamento
    };
}

// Remove os projetos de menor razão benefício/custo
function repararCromossomo(cromossomo, etapas = null) {
    const reparado = [...cromossomo];

    while (avaliarCromossomo(reparado).custoTotal > orcamento) {
        let indiceRemover = -1;
        let menorRazao = Infinity;

        reparado.forEach(function(gene, indice) {
            if (gene === 1) {
                const razao = projetos[indice].beneficio / projetos[indice].custo;

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

        if (etapas !== null) {
            etapas.push({
                indice: indiceRemover,
                projeto: projetos[indiceRemover].nome,
                cromossomo: reparado.join("")
            });
        }
    }

    return reparado;
}

function calcularAptidao(cromossomo) {
    const resultado = avaliarCromossomo(repararCromossomo(cromossomo));

    return {
        ...resultado,
        aptidao: resultado.beneficioTotal
    };
}

function gerarPopulacaoInicial() {
    const populacao = [];

    for (let i = 0; i < configuracao.tamanhoPopulacao; i++) {
        populacao.push(repararCromossomo(gerarCromossomo()));
    }

    return populacao;
}

// Torneios com candidatos distintos
function selecionarPorTorneio(
    populacao,
    tamanhoTorneio = configuracao.tamanhoTorneio,
    registro = null
) {
    if (
        !Number.isSafeInteger(tamanhoTorneio) ||
        tamanhoTorneio < 2 ||
        tamanhoTorneio > populacao.length
    ) {
        throw new RangeError("Tamanho de torneio inválido.");
    }

    const candidatos = [];

    while (candidatos.length < tamanhoTorneio) {
        const indice = sortearIndice(populacao.length);

        if (!candidatos.includes(indice)) {
            candidatos.push(indice);
        }
    }

    let vencedor = candidatos[0];
    let maior = calcularAptidao(populacao[vencedor]).aptidao;

    for (let i = 1; i < candidatos.length; i++) {
        const indice = candidatos[i];
        const aptidao = calcularAptidao(populacao[indice]).aptidao;

        if (
            aptidao > maior ||
            (aptidao === maior && indice < vencedor)
        ) {
            vencedor = indice;
            maior = aptidao;
        }
    }

    if (registro !== null) {
        registro.candidatos = candidatos.map(indice => ({
            indice,
            cromossomo: populacao[indice].join(""),
            aptidao: calcularAptidao(populacao[indice]).aptidao
        }));

        registro.vencedor = vencedor;
        registro.cromossomo = populacao[vencedor].join("");
    }

    return [...populacao[vencedor]];
}

// Cruzamento de um ponto
function cruzarCromossomos(
    pai1,
    pai2,
    taxa = configuracao.taxaCruzamento,
    corteForcado = null,
    registro = null
) {
    let filho1 = [...pai1];
    let filho2 = [...pai2];
    let pontoCorte = null;

    if (numeroAleatorio() < taxa / 100) {
        pontoCorte = corteForcado !== null
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

    if (registro !== null) {
        registro.ocorreu = pontoCorte !== null;
        registro.pontoCorte = pontoCorte;
        registro.filhos = [filho1.join(""), filho2.join("")];
    }

    return [filho1, filho2];
}

// Mutação por gene
function mutarCromossomo(
    cromossomo,
    taxa = configuracao.taxaMutacao,
    indicesForcados = null,
    registro = null
) {
    const mutado = [...cromossomo];
    const indices = [];

    for (let i = 0; i < mutado.length; i++) {
        const deveMutar = indicesForcados !== null
            ? indicesForcados.includes(i)
            : numeroAleatorio() < taxa / 100;

        if (deveMutar) {
            mutado[i] = 1 - mutado[i];
            indices.push(i);
        }
    }

    if (registro !== null) {
        registro.antes = cromossomo.join("");
        registro.depois = mutado.join("");
        registro.indices = indices;
    }

    return mutado;
}

function selecionarElite(
    populacao,
    quantidade = configuracao.quantidadeElite,
    registro = null
) {
    const avaliados = populacao.map((cromossomo, indice) => ({
        indice,
        cromossomo,
        aptidao: calcularAptidao(cromossomo).aptidao
    }));

    avaliados.sort((a, b) =>
        b.aptidao - a.aptidao || a.indice - b.indice
    );

    const escolhidos = avaliados.slice(0, quantidade);

    if (registro !== null) {
        registro.push(...escolhidos.map(individuo => ({
            indice: individuo.indice,
            cromossomo: individuo.cromossomo.join(""),
            aptidao: individuo.aptidao
        })));
    }

    return escolhidos.map(individuo => [...individuo.cromossomo]);
}

// Forma a geração usando apenas pais da anterior
function gerarProximaGeracao(populacaoAnterior, eventos = null) {
    const elites = [];

    const novaPopulacao = selecionarElite(
        populacaoAnterior,
        configuracao.quantidadeElite,
        elites
    );

    if (eventos !== null) {
        eventos.push({
            tipo: "elitismo",
            individuos: elites
        });
    }

    while (novaPopulacao.length < populacaoAnterior.length) {
        const torneio1 = {};
        const torneio2 = {};

        const pai1 = selecionarPorTorneio(
            populacaoAnterior,
            configuracao.tamanhoTorneio,
            torneio1
        );

        const pai2 = selecionarPorTorneio(
            populacaoAnterior,
            configuracao.tamanhoTorneio,
            torneio2
        );

        const cruzamento = {};

        const filhos = cruzarCromossomos(
            pai1,
            pai2,
            configuracao.taxaCruzamento,
            null,
            cruzamento
        );

        const descendentes = [];

        for (const filho of filhos) {
            if (novaPopulacao.length >= populacaoAnterior.length) {
                break;
            }

            const mutacao = {};

            const mutado = mutarCromossomo(
                filho,
                configuracao.taxaMutacao,
                null,
                mutacao
            );

            const reparacoes = [];
            const reparado = repararCromossomo(mutado, reparacoes);

            novaPopulacao.push(reparado);

            descendentes.push({
                mutacao,
                reparacao: {
                    antes: mutado.join(""),
                    etapas: reparacoes,
                    depois: reparado.join("")
                },
                aptidao: calcularAptidao(reparado).aptidao
            });
        }

        if (eventos !== null) {
            eventos.push({
                tipo: "reproducao",
                pais: [torneio1, torneio2],
                cruzamento,
                descendentes
            });
        }
    }

    return novaPopulacao;
}

function avaliarGeracao(populacao, numero) {
    const resultados = populacao.map(cromossomo =>
        calcularAptidao(cromossomo)
    );

    const soma = resultados.reduce(
        (total, resultado) => total + resultado.aptidao,
        0
    );

    const melhor = resultados.reduce(function(atual, resultado) {
        return resultado.aptidao > atual.aptidao
            ? resultado
            : atual;
    });

    return {
        geracao: numero,
        melhorAptidao: melhor.aptidao,
        aptidaoMedia: soma / populacao.length,
        melhorIndividuo: melhor
    };
}

function registrarGeracao() {
    const resultado = avaliarGeracao(
        estadoSimulacao.populacao,
        estadoSimulacao.geracao
    );

    if (
        estadoSimulacao.melhorGlobal === null ||
        resultado.melhorAptidao > estadoSimulacao.melhorGlobal.aptidao
    ) {
        estadoSimulacao.melhorGlobal = {
            ...resultado.melhorIndividuo,
            projetosSelecionados: [
                ...resultado.melhorIndividuo.projetosSelecionados
            ],
            geracao: resultado.geracao
        };
    }

    estadoSimulacao.historico.push({
        geracao: resultado.geracao,
        melhorAptidao: resultado.melhorAptidao,
        aptidaoMedia: resultado.aptidaoMedia,
        melhorAcumulado: estadoSimulacao.melhorGlobal.aptidao
    });
}

// Reinicia o gerador e a população
function reiniciarSimulacao() {
    estadoSimulacao = {
        geracao: 0,
        populacao: [],
        historico: [],
        melhorGlobal: null,
        estadoAleatorio: configuracao.semente >>> 0,
        eventos: []
    };

    estadoSimulacao.populacao = gerarPopulacaoInicial();
    registrarGeracao();

    return obterEstadoSimulacao();
}

function avancarGeracao() {
    if (estadoSimulacao.geracao < configuracao.numeroGeracoes) {
        const eventos = [];

        estadoSimulacao.populacao = gerarProximaGeracao(
            estadoSimulacao.populacao,
            eventos
        );

        estadoSimulacao.eventos = eventos;
        estadoSimulacao.geracao++;

        registrarGeracao();
    }

    return obterEstadoSimulacao();
}

function executarAlgoritmo() {
    reiniciarSimulacao();

    while (estadoSimulacao.geracao < configuracao.numeroGeracoes) {
        avancarGeracao();
    }

    const estado = obterEstadoSimulacao();

    return {
        melhorSolucao: estado.melhorGlobal,
        populacaoFinal: estado.populacao,
        historico: estado.historico
    };
}

// Salva os projetos após validar
function atualizarProjetos(novosProjetos) {
    if (
        !Array.isArray(novosProjetos) ||
        novosProjetos.length < 4 ||
        novosProjetos.length > 15
    ) {
        throw new RangeError("Cadastre entre 4 e 15 projetos.");
    }

    const validados = novosProjetos.map(function(projeto, indice) {
        if (
            !projeto ||
            typeof projeto !== "object" ||
            Array.isArray(projeto)
        ) {
            throw new TypeError(`Projeto ${indice + 1} inválido.`);
        }

        const nome = typeof projeto.nome === "string"
            ? projeto.nome.trim()
            : "";

        if (nome.length === 0 || nome.length > 120) {
            throw new RangeError(`Nome inválido no projeto ${indice + 1}.`);
        }

        if (!Number.isSafeInteger(projeto.custo) || projeto.custo <= 0) {
            throw new RangeError(`Custo inválido no projeto ${indice + 1}.`);
        }

        if (
            typeof projeto.beneficio !== "number" ||
            !Number.isFinite(projeto.beneficio) ||
            projeto.beneficio < 0
        ) {
            throw new RangeError(`Benefício inválido no projeto ${indice + 1}.`);
        }

        return {
            nome,
            custo: projeto.custo,
            beneficio: projeto.beneficio
        };
    });

    let somaCustos = 0;
    let somaBeneficios = 0;

    for (const projeto of validados) {
        somaCustos += projeto.custo;
        somaBeneficios += projeto.beneficio;

        if (
            !Number.isSafeInteger(somaCustos) ||
            !Number.isFinite(somaBeneficios)
        ) {
            throw new RangeError("Os valores ultrapassam o limite permitido.");
        }
    }

    const mudou =
        validados.length !== projetos.length ||
        validados.some((projeto, indice) => {
            const anterior = projetos[indice];

            return (
                projeto.nome !== anterior.nome ||
                projeto.custo !== anterior.custo ||
                projeto.beneficio !== anterior.beneficio
            );
        });

    if (mudou) {
        projetos.splice(0, projetos.length, ...validados);
        reiniciarSimulacao();
    }

    return obterProjetos();
}

reiniciarSimulacao();

export {
    projetos,
    orcamento,
    obterProjetos,
    atualizarProjetos,
    obterConfiguracao,
    obterEstadoSimulacao,
    atualizarConfiguracao,
    reiniciarSimulacao,
    avancarGeracao,
    executarAlgoritmo,
    gerarPopulacaoInicial,
    avaliarCromossomo,
    calcularAptidao,
    repararCromossomo,
    selecionarPorTorneio,
    cruzarCromossomos,
    mutarCromossomo,
    selecionarElite,
    gerarProximaGeracao,
    avaliarGeracao
};
