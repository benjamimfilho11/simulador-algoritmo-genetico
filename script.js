
"use strict";

const projetos = [
    {
        nome: "Melhoria da iluminação",
        custo: 4000,
        beneficio: 7
    },
    {
        nome: "Instalação de bicicletários",
        custo: 3000,
        beneficio: 5
    },
    {
        nome: "Aquisição de bancos",
        custo: 2000,
        beneficio: 3
    },
    {
        nome: "Reforma de espaço de convivência",
        custo: 5000,
        beneficio: 8
    }
];

let orcamento = 7000;

function exibirProjetos() {
    const tabela = document.getElementById("tabelaProjetos");

    tabela.innerHTML = "";

    projetos.forEach(function(projeto, indice) {
        const linha = document.createElement("tr");

        const colunaNome = document.createElement("td");
        colunaNome.textContent = projeto.nome;

        const colunaCusto = document.createElement("td");
        colunaCusto.textContent = projeto.custo.toLocaleString(
            "pt-BR",
            { style: "currency", currency: "BRL" }
        );

        const colunaBeneficio = document.createElement("td");
        colunaBeneficio.textContent = projeto.beneficio;

        linha.appendChild(colunaNome);
        linha.appendChild(colunaCusto);
        linha.appendChild(colunaBeneficio);

        tabela.appendChild(linha);
    });

    document.getElementById("orcamento").textContent =
        orcamento.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
}

exibirProjetos();
