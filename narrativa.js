
"use strict";

const numero = valor => Number(valor).toLocaleString("pt-BR", {
    maximumFractionDigits: 2
});

const individuo = indice => `indivíduo ${indice + 1} da geração anterior`;

function descreverCruzamento(cruzamento, pais) {
    const [filho1, filho2] = cruzamento.filhos;

    if (!cruzamento.ocorreu) {
        return `Sem cruzamento: filhos copiam os pais (${filho1} e ${filho2})`;
    }

    const k = cruzamento.pontoCorte;
    const [p1, p2] = pais.map(pai => pai.cromossomo);

    return `Cruzamento com corte após o ${k}º gene: ` +
        `${p1.slice(0, k)}|${p1.slice(k)} + ${p2.slice(0, k)}|${p2.slice(k)} ` +
        `→ filhos ${filho1} e ${filho2}`;
}

function descreverDescendente(descendente, numeroFilho) {
    const { mutacao, reparacao } = descendente;
    const linhas = [];

    if (mutacao.indices.length === 0) {
        linhas.push(`Filho ${numeroFilho} sem mutação`);
    } else {
        const rotulo = mutacao.indices.length === 1 ? "gene" : "genes";
        const genes = mutacao.indices.map(i => i + 1).join(", ");
        linhas.push(
            `Mutação no filho ${numeroFilho}: ${rotulo} ${genes} → ${mutacao.depois}`
        );
    }

    if (reparacao.etapas.length === 0) {
        linhas.push(`Filho ${numeroFilho} sem reparação`);
    } else {
        const cadeia = [reparacao.antes, ...reparacao.etapas.map(e => e.cromossomo)];
        const rotulo = reparacao.etapas.length === 1 ? "removido" : "removidos";
        const projetos = reparacao.etapas.map(e => e.projeto).join("; ");
        linhas.push(
            `Reparação do filho ${numeroFilho}: ${cadeia.join(" → ")} ` +
            `(${rotulo}: ${projetos})`
        );
    }

    linhas.push(
        `Filho ${numeroFilho} final: ${reparacao.depois} · aptidão ${numero(descendente.aptidao)}`
    );

    return linhas;
}

function descreverReproducao(evento) {
    const [pai1, pai2] = evento.pais;

    const linhas = [
        `Pais: ${pai1.cromossomo} (${individuo(pai1.vencedor)}) e ` +
        `${pai2.cromossomo} (${individuo(pai2.vencedor)})`,
        descreverCruzamento(evento.cruzamento, evento.pais)
    ];

    evento.descendentes.forEach((descendente, i) => {
        linhas.push(...descreverDescendente(descendente, i + 1));
    });

    if (evento.descendentes.length === 1) {
        linhas.push("Apenas o filho 1 entra na população (última vaga)");
    }

    return linhas;
}

function descreverElitismo(evento) {
    if (evento.individuos.length === 0) {
        return ["Sem elitismo: nenhum indivíduo preservado"];
    }

    return evento.individuos.map(ind =>
        `Preservado sem alterações: ${ind.cromossomo} (${individuo(ind.indice)}) · ` +
        `aptidão ${numero(ind.aptidao)}`
    );
}

export { descreverReproducao, descreverElitismo };
