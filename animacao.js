
"use strict";

const numero = valor => Number(valor).toLocaleString("pt-BR", {
    maximumFractionDigits: 2
});

const listaGenes = indices => indices.map(i => i + 1).join(", ");

function etapasAnimacao(evento) {
    const etapas = evento.pais.map((torneio, i) => ({
        tipo: "torneio",
        pai: i + 1,
        candidatos: torneio.candidatos,
        vencedor: torneio.vencedor,
        cromossomo: torneio.cromossomo
    }));

    const { cruzamento } = evento;
    const pais = evento.pais.map(pai => pai.cromossomo);

    if (cruzamento.ocorreu) {
        etapas.push(
            { tipo: "corte", pontoCorte: cruzamento.pontoCorte, pais },
            { tipo: "troca", pontoCorte: cruzamento.pontoCorte, pais, filhos: cruzamento.filhos }
        );
    } else {
        etapas.push({ tipo: "copia", filhos: cruzamento.filhos });
    }

    evento.descendentes.forEach((descendente, i) => {
        const filho = i + 1;
        const { mutacao, reparacao } = descendente;

        if (mutacao.indices.length > 0) {
            etapas.push({
                tipo: "mutacao",
                filho,
                antes: mutacao.antes,
                depois: mutacao.depois,
                indices: mutacao.indices
            });
        }

        reparacao.etapas.forEach(etapa => {
            etapas.push({
                tipo: "reparacao",
                filho,
                indice: etapa.indice,
                projeto: etapa.projeto,
                cromossomo: etapa.cromossomo
            });
        });
    });

    etapas.push({
        tipo: "resultado",
        filhos: evento.descendentes.map(d => ({
            cromossomo: d.reparacao.depois,
            aptidao: d.aptidao
        }))
    });

    return etapas;
}

function elemento(tag, texto = "", classe = "") {
    const e = document.createElement(tag);
    e.textContent = texto;
    if (classe) e.className = classe;
    return e;
}

function linha(rotulo, cromossomo, classesPorGene = () => []) {
    const div = elemento("div", "", "animacao-linha");
    div.appendChild(elemento("span", rotulo, "animacao-rotulo"));

    const genes = elemento("div", "", "visualizacao-cromossomo");
    [...cromossomo].forEach((bit, i) => {
        const gene = elemento("span", bit, "gene");
        gene.classList.add(...classesPorGene(i));
        genes.appendChild(gene);
    });

    div.appendChild(genes);
    return div;
}

function legendaTorneio(etapa) {
    const vencedor = etapa.candidatos.find(c => c.indice === etapa.vencedor);
    const empate = etapa.candidatos.some(c =>
        c.indice !== etapa.vencedor && c.aptidao === vencedor.aptidao
    );

    return `Torneio do pai ${etapa.pai}: vence o indivíduo ${etapa.vencedor + 1} ` +
        `(aptidão ${numero(vencedor.aptidao)}` +
        (empate ? "; empate decidido pelo menor índice)" : ", a maior entre os candidatos)");
}

function desenharEtapa(etapa) {
    const area = elemento("div", "", "animacao-linhas");
    let legenda = "";

    switch (etapa.tipo) {
        case "torneio": {
            legenda = legendaTorneio(etapa);
            etapa.candidatos.forEach(c => {
                const venceu = c.indice === etapa.vencedor;
                const l = linha(
                    `Indivíduo ${c.indice + 1} · aptidão ${numero(c.aptidao)}`,
                    c.cromossomo
                );
                l.classList.add(venceu ? "candidato-vencedor" : "candidato-perdedor");
                area.appendChild(l);
            });
            break;
        }

        case "corte": {
            const k = etapa.pontoCorte;
            legenda = `Cruzamento: os pais são separados após o ${k}º gene`;
            etapa.pais.forEach((pai, i) => {
                area.appendChild(linha(`Pai ${i + 1}`, pai, g =>
                    g >= k ? ["segmento-direito"] : []
                ));
            });
            break;
        }

        case "troca": {
            const k = etapa.pontoCorte;
            legenda = `Os segmentos após o corte trocam de lugar: filhos ` +
                `${etapa.filhos[0]} e ${etapa.filhos[1]}`;
            etapa.filhos.forEach((filho, i) => {
                const movimento = i === 0 ? "veio-de-baixo" : "veio-de-cima";
                area.appendChild(linha(`Filho ${i + 1}`, filho, g =>
                    g >= k ? ["segmento-direito", "segmento-trocado", movimento] : []
                ));
            });
            break;
        }

        case "copia": {
            legenda = "Sem cruzamento (sorteio acima da taxa): os filhos copiam os pais";
            etapa.filhos.forEach((filho, i) => {
                area.appendChild(linha(`Filho ${i + 1}`, filho));
            });
            break;
        }

        case "mutacao": {
            const rotulo = etapa.indices.length === 1
                ? `gene ${listaGenes(etapa.indices)} invertido`
                : `genes ${listaGenes(etapa.indices)} invertidos`;
            legenda = `Mutação no filho ${etapa.filho}: ${rotulo}: ` +
                `${etapa.antes} → ${etapa.depois}`;
            area.appendChild(linha(`Antes`, etapa.antes));
            area.appendChild(linha(`Filho ${etapa.filho}`, etapa.depois, g =>
                etapa.indices.includes(g) ? ["gene-mutado", "gene-virando"] : []
            ));
            break;
        }

        case "reparacao": {
            legenda = `Reparação do filho ${etapa.filho}: custo acima do orçamento; ` +
                `removido "${etapa.projeto}" (menor razão benefício/custo) → ${etapa.cromossomo}`;
            // Antes da remoção o gene era 1; o projeto removido aparece riscado
            const antes = [...etapa.cromossomo];
            antes[etapa.indice] = "1";

            area.appendChild(linha("Antes", antes.join(""), g =>
                g === etapa.indice ? ["gene-removido", "gene-saindo"] : []
            ));
            area.appendChild(linha(`Filho ${etapa.filho}`, etapa.cromossomo));
            break;
        }

        case "resultado": {
            legenda = "Resultado: descendentes que entram na nova população";
            etapa.filhos.forEach((filho, i) => {
                area.appendChild(linha(
                    `Filho ${i + 1} · aptidão ${numero(filho.aptidao)}`,
                    filho.cromossomo
                ));
            });
            if (etapa.filhos.length === 1) {
                area.appendChild(elemento(
                    "p", "Apenas o filho 1 entra na população (última vaga).", "evento-detalhe"
                ));
            }
            break;
        }
    }

    return { legenda, area };
}

let execucaoAtual = 0;

function cancelarAnimacao() {
    execucaoAtual++;
}

const esperar = ms => new Promise(resolver => setTimeout(resolver, ms));

async function animarReproducao(palco, evento, opcoes = {}) {
    const minhaExecucao = ++execucaoAtual;
    const duracaoEtapa = opcoes.duracaoEtapa ?? 900;
    const etapas = etapasAnimacao(evento);

    palco.style.setProperty("--duracao-etapa", `${duracaoEtapa}ms`);

    for (let i = 0; i < etapas.length; i++) {
        if (minhaExecucao !== execucaoAtual) return;

        const { legenda, area } = desenharEtapa(etapas[i]);
        palco.replaceChildren(
            elemento("p", `Etapa ${i + 1} de ${etapas.length}`, "animacao-contador"),
            elemento("p", legenda, "animacao-legenda"),
            area
        );

        await esperar(duracaoEtapa);
    }
}

export { etapasAnimacao, animarReproducao, cancelarAnimacao };
