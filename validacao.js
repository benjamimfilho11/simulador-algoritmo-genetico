function lerValor(texto) { //input em reais (string)
    const partes = texto.trim().match(/^(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?$/);
    
    if (!partes) {
        return null;
    }
    
    const inteiro = partes[1].replace(/\./g, "");
    const centavos = (partes[2] || "").padEnd(2, "0");
    
    const valor = Number(inteiro) * 100 + Number(centavos);
    
    if (!Number.isSafeInteger(valor)) {
        return null;
    } //Só para recusar números muuito grandesm que não cabem no int do JS
    
    return valor; //retorna o valor em centavos (int)
}

function transformarEmReais(valor) { //centavos(int) -> reais
    return (valor / 100).toLocaleString("pt-BR", {style: "currency", currency: "BRL"});
}

function formatarCampoValor(campo) {
    const valor = lerValor(campo.value);
    if (valor != null) {
        campo.value = (valor / 100).toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });//Adiciona os centavos e os pontos de milhar no campo
    }
}

function validarOrcamento() {
    const campoOrcamento = document.getElementById("orcamento");
    const erro = document.getElementById("erroOrcamento");
    const valor = lerValor(campoOrcamento.value);
    const valido = valor !== null;

    campoOrcamento.parentElement.classList.toggle("invalido", !valido);
    erro.textContent = valido ? "" : "Informe um valor em reais, com até duas casas decimais.";

    return valor;
}