import assert from 'node:assert/strict';
import * as ag from './script.js';
import { lerValor, transformarEmReais } from './validacao.js';

let aprovados = 0;
function teste(nome, fn) {
    try {
        fn();
        aprovados++;
        console.log('OK', nome);
    } catch (e) {
        console.error('FALHOU', nome, e);
        process.exitCode = 1;
    }
}
const padrao = ag.obterConfiguracao();
const snapshot = () => JSON.stringify(ag.obterEstadoSimulacao());
const viaveis = pop => pop.every(c => ag.avaliarCromossomo(c).viavel);

teste('Configuração inicial preservada', () => {
    assert.equal(padrao.orcamento, 700000);
    assert.equal(padrao.tamanhoPopulacao, 5);
    assert.equal(padrao.tamanhoTorneio, 2);
    assert.equal(padrao.semente, 42);
    assert.equal(padrao.numeroGeracoes, 50);
});
teste('Projetos continuam em centavos', () => assert.deepEqual(ag.projetos.map(p => p.custo), [400000,300000,200000,500000]));
teste('Geração zero é inicializada com 5 indivíduos', () => {
    const e = ag.obterEstadoSimulacao();
    assert.equal(e.geracao,0); assert.equal(e.populacao.length,5); assert.equal(e.historico.length,1);
    assert(viaveis(e.populacao));
});
teste('Avaliação 1100', () => {
    const r=ag.avaliarCromossomo([1,1,0,0]);
    assert.equal(r.custoTotal,700000);assert.equal(r.beneficioTotal,12);assert.equal(r.viavel,true);
});
teste('Avaliação 1111 inviável', () => {
    const r=ag.avaliarCromossomo([1,1,1,1]);
    assert.equal(r.custoTotal,1400000);assert.equal(r.beneficioTotal,23);assert.equal(r.viavel,false);
});
teste('Reparação 1111 gera 1100', () => assert.deepEqual(ag.repararCromossomo([1,1,1,1]),[1,1,0,0]));
teste('Reparação não altera entrada', () => {
    const a=[1,1,1,1]; ag.repararCromossomo(a); assert.deepEqual(a,[1,1,1,1]);
});
teste('Aptidão de 1111 após reparação é 12', () => assert.equal(ag.calcularAptidao([1,1,1,1]).aptidao,12));
teste('Torneio seleciona maior aptidão', () => {
    const p=[[1,0,0,0],[0,0,1,1],[1,1,0,0]];
    assert.deepEqual(ag.selecionarPorTorneio(p,3),[1,1,0,0]);
});
teste('Torneio desempata pelo menor índice', () => {
    assert.deepEqual(ag.selecionarPorTorneio([[0,0,0,1],[0,1,1,0]],2),[0,0,0,1]);
});
teste('Torneio inválido não entra em laço infinito', () => {
    assert.throws(()=>ag.selecionarPorTorneio([[0],[1]],3),RangeError);
});
teste('Cruzamento controlado gera 1111 e 0000', () => {
    assert.deepEqual(ag.cruzarCromossomos([1,1,0,0],[0,0,1,1],100,2),[[1,1,1,1],[0,0,0,0]]);
});
teste('Sem cruzamento os filhos copiam os pais', () => {
    assert.deepEqual(ag.cruzarCromossomos([1,1,0,0],[0,0,1,1],0),[[1,1,0,0],[0,0,1,1]]);
});
teste('Mutação controlada e reparação', () => {
    assert.deepEqual(ag.mutarCromossomo([1,1,1,1],0,[0]),[0,1,1,1]);
    assert.deepEqual(ag.repararCromossomo([0,1,1,1]),[0,1,0,0]);
});
teste('Mutação 0% e 100%', () => {
    assert.deepEqual(ag.mutarCromossomo([1,1,0,0],0),[1,1,0,0]);
    assert.deepEqual(ag.mutarCromossomo([1,1,0,0],100),[0,0,1,1]);
});
teste('Elite 0 e 1', () => {
    const p=[[1,0,0,0],[0,0,1,1],[1,1,0,0]];
    assert.deepEqual(ag.selecionarElite(p,0),[]);
    assert.deepEqual(ag.selecionarElite(p,1),[[1,1,0,0]]);
});
teste('Nova geração mantém tamanho e viabilidade', () => {
    const p=ag.obterEstadoSimulacao().populacao;
    const nova=ag.gerarProximaGeracao(p);
    assert.equal(nova.length,p.length); assert(viaveis(nova));
});
teste('Reiniciar restaura população e histórico originais', () => {
    const a=ag.reiniciarSimulacao();
    ag.avancarGeracao();
    const b=ag.reiniciarSimulacao();
    assert.deepEqual(a,b);
});
teste('Avanço incrementa exatamente uma geração e preserva histórico', () => {
    ag.reiniciarSimulacao();
    const antes=ag.obterEstadoSimulacao();
    const depois=ag.avancarGeracao();
    assert.equal(depois.geracao,1); assert.equal(depois.historico.length,2);
    assert.deepEqual(depois.historico[0],antes.historico[0]);
    assert.equal(depois.populacao.length,5);assert(viaveis(depois.populacao));
});
teste('Snapshots não permitem alterar estado interno', () => {
    ag.reiniciarSimulacao();
    const snap=ag.obterEstadoSimulacao(); const antes=snapshot();
    snap.populacao[0][0]=8;
    snap.historico[0].melhorAptidao=999;
    snap.melhorGlobal.projetosSelecionados.push('INTRUSO');
    snap.estadoAleatorio=999;
    assert.equal(snapshot(),antes);
});
teste('Configuração exposta é uma cópia', () => {
    const cfg=ag.obterConfiguracao();cfg.orcamento=123;
    assert.equal(ag.obterConfiguracao().orcamento,700000);
});
teste('Mudar orçamento realmente altera avaliação e reinicia simulação', () => {
    ag.avancarGeracao();
    ag.atualizarConfiguracao({orcamento:0});
    const e=ag.obterEstadoSimulacao();
    assert.equal(e.geracao,0); assert.equal(e.historico.length,1);
    assert(e.populacao.every(c => c.join('') === '0000'));
    assert.equal(ag.orcamento,0);
    assert.equal(ag.calcularAptidao([1,1,1,1]).aptidao,0);
});
teste('Orçamento total 14000 torna 1111 viável', () => {
    ag.atualizarConfiguracao({orcamento:1400000});
    const r=ag.calcularAptidao([1,1,1,1]);
    assert.equal(r.aptidao,23); assert.equal(r.viavel,true);
});
teste('Alteração de parâmetros válida muda a simulação', () => {
    ag.atualizarConfiguracao({tamanhoPopulacao:20,tamanhoTorneio:2,quantidadeElite:1,numeroGeracoes:50, semente:42,orcamento:700000});
    const e=ag.obterEstadoSimulacao();
    assert.equal(e.populacao.length,20);assert.equal(e.historico.length,1);assert(viaveis(e.populacao));
});
teste('Parâmetros inválidos são rejeitados sem mexer no estado', () => {
    const valores=[{tamanhoPopulacao:1},{tamanhoTorneio:21},{tamanhoTorneio:1},{quantidadeElite:20},{taxaMutacao:101},{taxaCruzamento:-1},{semente:1.2},{numeroGeracoes:0},{orcamento:-1},{orcamento:12.34},{naoExiste:1}];
    const antes=snapshot(), config=ag.obterConfiguracao();
    for(const p of valores) assert.throws(()=>ag.atualizarConfiguracao(p));
    assert.equal(snapshot(),antes);assert.deepEqual(ag.obterConfiguracao(),config);
});
teste('Configuração idêntica não reinicia execução', () => {
    ag.avancarGeracao(); const antes=snapshot();
    ag.atualizarConfiguracao({orcamento:ag.obterConfiguracao().orcamento});
    assert.equal(snapshot(),antes);
});
teste('Executar 50 gerações resulta em 51 registros e melhor acumulado estável', () => {
    const r=ag.executarAlgoritmo();
    assert.equal(r.historico.length,51);assert.equal(r.historico[0].geracao,0);assert.equal(r.historico[50].geracao,50);
    assert.equal(r.populacaoFinal.length,20);assert(viaveis(r.populacaoFinal));
    assert(r.historico.every((h,i)=>i===0||h.melhorAcumulado>=r.historico[i-1].melhorAcumulado));
    assert(r.melhorSolucao.aptidao<=12);
    assert.equal(ag.obterEstadoSimulacao().geracao,50);
});
teste('Depois da geração 50, Avançar não muda o estado', () => {
    const antes=snapshot();ag.avancarGeracao();assert.equal(snapshot(),antes);
});
teste('Execução completa reproduzida com a mesma semente', () => {
    const r1=ag.executarAlgoritmo();
    const r2=ag.executarAlgoritmo();
    assert.deepEqual(r1,r2);
});
teste('Execução por passos e completa têm resultados idênticos', () => {
    const esperado=ag.executarAlgoritmo();
    ag.reiniciarSimulacao();
    for(let i=0;i<50;i++) ag.avancarGeracao();
    const e=ag.obterEstadoSimulacao();
    assert.deepEqual({melhorSolucao:e.melhorGlobal,populacaoFinal:e.populacao,historico:e.historico}, esperado);
});
teste('Elitismo zero é aceito e mantém tamanho', () => {
    ag.atualizarConfiguracao({quantidadeElite:0,tamanhoPopulacao:5});
    const proxima=ag.avancarGeracao();
    assert.equal(proxima.populacao.length,5);assert(viaveis(proxima.populacao));
});
teste('Menor população e menor número de gerações', () => {
    ag.atualizarConfiguracao({tamanhoPopulacao:2,tamanhoTorneio:2,quantidadeElite:0,numeroGeracoes:1});
    const r=ag.executarAlgoritmo();assert.equal(r.populacaoFinal.length,2);assert.equal(r.historico.length,2);
});
teste('Valores monetários em centavos', () => {
    assert.equal(lerValor('7.000,00'),700000);assert.equal(lerValor('0'),0);
    assert.equal(lerValor('12,34'),1234);assert.equal(lerValor('1.234,56'),123456);
    assert.equal(lerValor('-1'),null);assert.equal(lerValor('2,123'),null);
    assert.equal(lerValor('1.234.56'),null);assert.equal(lerValor('abc'),null);
    assert(transformarEmReais(700000).includes('7.000,00'));
});
console.log(`TOTAL: ${aprovados} testes aprovados${process.exitCode ? ' (algumas falhas)' : ''}`);
