// Converte valores em reais para centavos
function lerValor(texto) {
    const partes = texto.trim().match(/^(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?$/);
    if (!partes) {
        return null;
    }

    const inteiro = partes[1].replace(/\./g, "");
    const centavos = (partes[2] || "").padEnd(2, "0");
    const valor = Number(inteiro) * 100 + Number(centavos);

    return Number.isSafeInteger(valor) ? valor : null;
}

function transformarEmReais(valor) {
    return (valor / 100).toLocaleString("pt-BR", {
        style: "currency", currency: "BRL"
    });
}

function formatarCampoValor(campo) {
    const valor = lerValor(campo.value);
    if (valor !== null) {
        campo.value = (valor / 100).toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
}

function validarOrcamento() {
    const campo = document.getElementById("orcamento");
    const erro = document.getElementById("erroOrcamento");
    const valor = lerValor(campo.value);
    const valido = valor !== null;

    campo.parentElement.classList.toggle("invalido", !valido);
    erro.textContent = valido ? "" : "Informe um valor em reais, com até duas casas decimais.";

    return valor;
}

function lerBeneficio(texto) {
    if (typeof texto !== "string" || !/^\d+(?:[,.]\d+)?$/.test(texto.trim())) {
        return null;
    }

    const valor = Number(texto.trim().replace(",", "."));
    return Number.isFinite(valor) && valor >= 0 ? valor : null;
}

export { lerValor, lerBeneficio, transformarEmReais, formatarCampoValor, validarOrcamento };
