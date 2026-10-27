"use strict";

// Os custos e o orçamento são armazenados em centavos
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

function obterEstadoSimulacao() {
    return {
        geracao: estadoSimulacao.geracao,
        populacao: estadoSimulacao.populacao.map(cromossomo => [...cromossomo]),
        historico: estadoSimulacao.historico.map(registro => ({ ...registro })),
        melhorGlobal: estadoSimulacao.melhorGlobal === null
            ? null
            : {
                ...estadoSimulacao.melhorGlobal,
                projetosSelecionados: [...estadoSimulacao.melhorGlobal.projetosSelecionados]
            },
        estadoAleatorio: estadoSimulacao.estadoAleatorio,
        finalizada: estadoSimulacao.geracao >= configuracao.numeroGeracoes
    };
}

// Atualiza os parâmetros e reinicia após mudanças válidas
function atualizarConfiguracao(alteracoes) {
    if (alteracoes === null || typeof alteracoes !== "object" || Array.isArray(alteracoes)) {
        throw new TypeError("As configurações devem ser um objeto.");
    }

    const atual = obterConfiguracao();
    const permitidas = Object.keys(atual);

    for (const chave of Object.keys(alteracoes)) {
        if (!permitidas.includes(chave)) {
            throw new Error(`Configuração desconhecida: ${chave}`);
        }
    }

    const nova = { ...atual, ...alteracoes };
    const inteiroMinimo = (valor, minimo) =>
        Number.isSafeInteger(valor) && valor >= minimo;
    const percentualValido = valor =>
        typeof valor === "number" && Number.isFinite(valor) && valor >= 0 && valor <= 100;

    if (!inteiroMinimo(nova.orcamento, 0)) {
        throw new RangeError("O orçamento deve ser um valor em centavos não negativo.");
    }
    if (!inteiroMinimo(nova.tamanhoPopulacao, 2)) {
        throw new RangeError("A população deve ter pelo menos 2 indivíduos.");
    }
    if (!inteiroMinimo(nova.numeroGeracoes, 1)) {
        throw new RangeError("O número de gerações deve ser pelo menos 1.");
    }
    if (!inteiroMinimo(nova.tamanhoTorneio, 2) || nova.tamanhoTorneio > nova.tamanhoPopulacao) {
        throw new RangeError("O torneio deve ter entre 2 e o tamanho da população.");
    }
    if (!inteiroMinimo(nova.quantidadeElite, 0) || nova.quantidadeElite >= nova.tamanhoPopulacao) {
        throw new RangeError("A elite deve ter entre 0 e população menos 1.");
    }
    if (!percentualValido(nova.taxaCruzamento) || !percentualValido(nova.taxaMutacao)) {
        throw new RangeError("As taxas devem estar entre 0 e 100.");
    }
    if (!Number.isSafeInteger(nova.semente)) {
        throw new RangeError("A semente deve ser um número inteiro.");
    }

    if (permitidas.some(chave => nova[chave] !== atual[chave])) {
        orcamento = nova.orcamento;
        for (const chave of Object.keys(configuracao)) {
            configuracao[chave] = nova[chave];
        }
        reiniciarSimulacao();
    }

    return obterConfiguracao();
}

// Sorteios reproduzíveis a partir da semente
function numeroAleatorio() {
    estadoSimulacao.estadoAleatorio = (
        Math.imul(1664525, estadoSimulacao.estadoAleatorio) + 1013904223
    ) >>> 0;

    return estadoSimulacao.estadoAleatorio / 4294967296;
}

function gerarCromossomo() {
    const cromossomo = [];

    for (let i = 0; i < projetos.length; i++) {
        const gene = numeroAleatorio() < 0.5 ? 0 : 1;
        cromossomo.push(gene);
    }

    return cromossomo;
}

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
        custoTotal,
        beneficioTotal,
        saldo: orcamento - custoTotal,
        viavel: custoTotal <= orcamento
    };
}

// Remove os projetos com menor benefício por custo
function repararCromossomo(cromossomo) {
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
    }

    return reparado;
}

function calcularAptidao(cromossomo) {
    const reparado = repararCromossomo(cromossomo);
    const resultado = avaliarCromossomo(reparado);
    return { ...resultado, aptidao: resultado.beneficioTotal };
}

function gerarPopulacaoInicial() {
    const populacao = [];

    for (let i = 0; i < configuracao.tamanhoPopulacao; i++) {
        const cromossomo = gerarCromossomo();
        populacao.push(repararCromossomo(cromossomo));
    }

    return populacao;
}

function sortearIndice(limite) {
    if (!Number.isSafeInteger(limite) || limite < 1) {
        throw new RangeError("O limite do sorteio deve ser positivo.");
    }
    return Math.floor(numeroAleatorio() * limite);
}

// Escolhe o vencedor com desempate pelo menor índice
function selecionarPorTorneio(populacao, tamanhoTorneio = configuracao.tamanhoTorneio) {
    if (!Number.isSafeInteger(tamanhoTorneio) || tamanhoTorneio < 2 || tamanhoTorneio > populacao.length) {
        throw new RangeError("Tamanho de torneio inválido.");
    }

    const candidatos = [];

    while (candidatos.length < tamanhoTorneio) {
        const indice = sortearIndice(populacao.length);
        if (!candidatos.includes(indice)) {
            candidatos.push(indice);
        }
    }

    let indiceVencedor = candidatos[0];
    let melhorAptidao = calcularAptidao(populacao[indiceVencedor]).aptidao;

    for (let i = 1; i < candidatos.length; i++) {
        const indiceAtual = candidatos[i];
        const aptidaoAtual = calcularAptidao(populacao[indiceAtual]).aptidao;

        if (
            aptidaoAtual > melhorAptidao ||
            (aptidaoAtual === melhorAptidao && indiceAtual < indiceVencedor)
        ) {
            indiceVencedor = indiceAtual;
            melhorAptidao = aptidaoAtual;
        }
    }

    return [...populacao[indiceVencedor]];
}

// Cruzamento de um ponto
function cruzarCromossomos(pai1, pai2, taxa = configuracao.taxaCruzamento, corteForcado = null) {
    let filho1 = [...pai1];
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

// Mutação aplicada a cada gene
function mutarCromossomo(cromossomo, taxa = configuracao.taxaMutacao, indicesForcados = null) {
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

function selecionarElite(populacao, quantidade = configuracao.quantidadeElite) {
    const avaliados = populacao.map(function(cromossomo, indice) {
        return {
            indice,
            cromossomo,
            aptidao: calcularAptidao(cromossomo).aptidao
        };
    });

    avaliados.sort(function(a, b) {
        return b.aptidao - a.aptidao || a.indice - b.indice;
    });

    return avaliados.slice(0, quantidade).map(function(individuo) {
        return [...individuo.cromossomo];
    });
}

// Usa apenas a população anterior para selecionar os pais
function gerarProximaGeracao(populacaoAnterior) {
    const novaPopulacao = selecionarElite(populacaoAnterior);

    while (novaPopulacao.length < populacaoAnterior.length) {
        const primeiroPai = selecionarPorTorneio(populacaoAnterior);
        const segundoPai = selecionarPorTorneio(populacaoAnterior);
        const filhos = cruzarCromossomos(primeiroPai, segundoPai);

        const primeiroFilho = repararCromossomo(mutarCromossomo(filhos[0]));
        novaPopulacao.push(primeiroFilho);

        if (novaPopulacao.length < populacaoAnterior.length) {
            const segundoFilho = repararCromossomo(mutarCromossomo(filhos[1]));
            novaPopulacao.push(segundoFilho);
        }
    }

    return novaPopulacao;
}

function avaliarGeracao(populacao, numero) {
    const resultados = populacao.map(cromossomo => calcularAptidao(cromossomo));
    const somaAptidoes = resultados.reduce((soma, resultado) => soma + resultado.aptidao, 0);
    const melhor = resultados.reduce(function(atual, resultado) {
        return resultado.aptidao > atual.aptidao ? resultado : atual;
    });

    return {
        geracao: numero,
        melhorAptidao: melhor.aptidao,
        aptidaoMedia: somaAptidoes / populacao.length,
        melhorIndividuo: melhor
    };
}

function registrarGeracao() {
    const resultado = avaliarGeracao(estadoSimulacao.populacao, estadoSimulacao.geracao);

    if (
        estadoSimulacao.melhorGlobal === null ||
        resultado.melhorAptidao > estadoSimulacao.melhorGlobal.aptidao
    ) {
        estadoSimulacao.melhorGlobal = {
            ...resultado.melhorIndividuo,
            projetosSelecionados: [...resultado.melhorIndividuo.projetosSelecionados],
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

// Restaura a semente e recria a geração zero
function reiniciarSimulacao() {
    estadoSimulacao = {
        geracao: 0,
        populacao: [],
        historico: [],
        melhorGlobal: null,
        estadoAleatorio: configuracao.semente >>> 0
    };

    estadoSimulacao.populacao = gerarPopulacaoInicial();
    registrarGeracao();
    return obterEstadoSimulacao();
}

// Avança uma geração sem perder o estado
function avancarGeracao() {
    if (estadoSimulacao.geracao < configuracao.numeroGeracoes) {
        estadoSimulacao.populacao = gerarProximaGeracao(estadoSimulacao.populacao);
        estadoSimulacao.geracao++;
        registrarGeracao();
    }
    return obterEstadoSimulacao();
}

// Mantém a execução completa disponível para os testes
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


function obterProjetos() {
    return projetos.map(projeto => ({ ...projeto }));
}

// Valida e salva os projetos
function atualizarProjetos(novosProjetos) {
    if (!Array.isArray(novosProjetos) || novosProjetos.length < 4 || novosProjetos.length > 15) {
        throw new RangeError("Cadastre entre 4 e 15 projetos.");
    }

    const validados = novosProjetos.map(function(projeto, indice) {
        if (projeto === null || typeof projeto !== "object" || Array.isArray(projeto)) {
            throw new TypeError(`Projeto ${indice + 1} inválido.`);
        }

        const nome = typeof projeto.nome === "string" ? projeto.nome.trim() : "";
        if (nome.length === 0 || nome.length > 120) {
            throw new RangeError(`Informe um nome válido para o projeto ${indice + 1}.`);
        }
        if (!Number.isSafeInteger(projeto.custo) || projeto.custo <= 0) {
            throw new RangeError(`Informe um custo válido para o projeto ${indice + 1}.`);
        }
        if (typeof projeto.beneficio !== "number" || !Number.isFinite(projeto.beneficio) || projeto.beneficio < 0) {
            throw new RangeError(`Informe um benefício válido para o projeto ${indice + 1}.`);
        }

        return { nome, custo: projeto.custo, beneficio: projeto.beneficio };
    });

    let somaCustos = 0;
    let somaBeneficios = 0;
    for (const projeto of validados) {
        somaCustos += projeto.custo;
        somaBeneficios += projeto.beneficio;
        if (!Number.isSafeInteger(somaCustos) || !Number.isFinite(somaBeneficios)) {
            throw new RangeError("Os valores dos projetos ultrapassam o limite permitido.");
        }
    }

    const mudou = validados.length !== projetos.length || validados.some(function(projeto, indice) {
        const anterior = projetos[indice];
        return projeto.nome !== anterior.nome ||
            projeto.custo !== anterior.custo ||
            projeto.beneficio !== anterior.beneficio;
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
    obterProjetos,
    atualizarProjetos,
    orcamento,
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
