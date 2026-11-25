
// ==========================================
// 1. VARIÁVEIS E CONFIGURAÇÕES
// ==========================================

const TAMANHO_BLOCO = 10;
const LINHAS = 10;
const COLUNAS = 10;

const mapa = [
    [2, 0, 0, 1, 0, 0, 0, 0, 0, 0],
    [1, 1, 0, 1, 0, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
    [0, 1, 1, 1, 1, 1, 0, 1, 0, 0],
    [0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
    [1, 1, 0, 1, 0, 1, 1, 1, 1, 0],
    [0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 0, 1, 1, 0, 1],
    [0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    [0, 1, 0, 1, 0, 0, 0, 0, 1, 3]
];

let roboPos = { linha: 0, coluna: 0 };

let destinoPos = { linha: 9, coluna: 9 };

let dronePos = {
    linha: 4,
    coluna: 6,
    direcao: 1
};

let emExecucao = false;
let modoAutomatico = false;
let missaoConcluida = false;

let passos = 0;
let colisoes = 0;

let intervaloLoop = null;
let intervaloAuto = null;

let caminhoAutomatico = [];

const cenarioEl = document.getElementById('cenario');
const statusTexto = document.getElementById('status-texto');
const modoTexto = document.getElementById('modo-texto');
const passosTexto = document.getElementById('contador-passos');
const colisoesTexto = document.getElementById('contador-colisoes');
const msgVitoria = document.getElementById('mensagem-vitoria');

let roboEl = null;
let droneEl = null;


// ==========================================
// 2. CONSTRUÇÃO DO CENÁRIO
// ==========================================

function construirCenario() {

    cenarioEl.innerHTML = '';

    for (let l = 0; l < LINHAS; l++) {

        for (let c = 0; c < COLUNAS; c++) {

            const celula = document.createElement('div');

            celula.classList.add('celula');

            celula.style.top = `${l * TAMANHO_BLOCO}%`;
            celula.style.left = `${c * TAMANHO_BLOCO}%`;

            if (mapa[l][c] === 1) {

                celula.classList.add('obstaculo');
                celula.textContent = '🧱';

            } else if (mapa[l][c] === 2) {

                celula.classList.add('partida');

                roboPos = {
                    linha: l,
                    coluna: c
                };

            } else if (mapa[l][c] === 3) {

                celula.classList.add('destino');
                celula.textContent = '🔋';

                destinoPos = {
                    linha: l,
                    coluna: c
                };
            }

            cenarioEl.appendChild(celula);
        }
    }

    criarRobo();
    criarDrone();
}


function criarRobo() {

    roboEl = document.createElement('div');

    roboEl.id = 'robo';

    roboEl.innerHTML = `
        <div class="visor-robo">
            <div class="olho"></div>
            <div class="olho"></div>
        </div>
    `;

    atualizarPosicaoVisual(
        roboEl,
        roboPos.linha,
        roboPos.coluna
    );

    cenarioEl.appendChild(roboEl);
}


function criarDrone() {

    dronePos = {
        linha: 4,
        coluna: 6,
        direcao: 1
    };

    droneEl = document.createElement('div');

    droneEl.classList.add('drone');
    droneEl.textContent = '⚡';

    atualizarPosicaoVisual(
        droneEl,
        dronePos.linha,
        dronePos.coluna
    );

    cenarioEl.appendChild(droneEl);
}


function atualizarPosicaoVisual(elemento, linha, coluna) {

    elemento.style.top = `${linha * TAMANHO_BLOCO}%`;
    elemento.style.left = `${coluna * TAMANHO_BLOCO}%`;
}


// ==========================================
// 3. MOVIMENTAÇÃO E COLISÕES
// ==========================================

function moverRobo(dLinha, dColuna) {

    if (!emExecucao || missaoConcluida) return;

    const novaLinha = roboPos.linha + dLinha;
    const novaColuna = roboPos.coluna + dColuna;

    // Verifica os limites do mapa.

    if (
        novaLinha < 0 ||
        novaLinha >= LINHAS ||
        novaColuna < 0 ||
        novaColuna >= COLUNAS
    ) {

        registrarColisao('Limite do mapa atingido!');
        return;
    }

    // Verifica obstáculos fixos.

    if (mapa[novaLinha][novaColuna] === 1) {

        registrarColisao('Obstáculo bloqueando o caminho!');
        return;
    }

    // Verifica colisão com o drone.

    if (
        novaLinha === dronePos.linha &&
        novaColuna === dronePos.coluna
    ) {

        registrarColisao('Cuidado! Colisão com o Drone!');
        return;
    }

    // Executa o movimento.

    roboPos.linha = novaLinha;
    roboPos.coluna = novaColuna;

    passos++;

    passosTexto.textContent = passos;

    statusTexto.textContent = 'Explorando terreno...';

    atualizarPosicaoVisual(
        roboEl,
        roboPos.linha,
        roboPos.coluna
    );

    // Verifica se chegou ao destino.

    if (
        roboPos.linha === destinoPos.linha &&
        roboPos.coluna === destinoPos.coluna
    ) {

        concluirMissao();
    }
}


function registrarColisao(motivo) {

    colisoes++;

    colisoesTexto.textContent = colisoes;

    statusTexto.textContent = motivo;
}


// ==========================================
// 4. MOVIMENTAÇÃO DO DRONE
// ==========================================

function atualizarDrone() {

    if (!emExecucao || missaoConcluida) return;

    const proximaColuna =
        dronePos.coluna + dronePos.direcao;

    // O drone patrulha entre as colunas 6 e 9.

    if (
        proximaColuna < 6 ||
        proximaColuna > 9 ||
        mapa[dronePos.linha][proximaColuna] === 1
    ) {

        dronePos.direcao *= -1;

    } else {

        dronePos.coluna = proximaColuna;
    }

    // Verifica se o drone atingiu o robô.

    if (
        dronePos.linha === roboPos.linha &&
        dronePos.coluna === roboPos.coluna
    ) {

        registrarColisao(
            'Atingido pelo Drone! Voltando à partida...'
        );

        roboPos = {
            linha: 0,
            coluna: 0
        };

        atualizarPosicaoVisual(
            roboEl,
            roboPos.linha,
            roboPos.coluna
        );

        caminhoAutomatico = [];
    }

    atualizarPosicaoVisual(
        droneEl,
        dronePos.linha,
        dronePos.coluna
    );
}


// ==========================================
// 5. PILOTO AUTOMÁTICO - ALGORITMO BFS
// ==========================================

function calcularCaminhoAutomatico() {

    const fila = [{
        linha: roboPos.linha,
        coluna: roboPos.coluna,
        caminho: []
    }];

    const visitados = new Set();

    visitados.add(
        `${roboPos.linha},${roboPos.coluna}`
    );

    const direcoes = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1]
    ];

    while (fila.length > 0) {

        const atual = fila.shift();

        const l = atual.linha;
        const c = atual.coluna;
        const caminho = atual.caminho;

        // Verifica se encontrou o destino.

        if (
            l === destinoPos.linha &&
            c === destinoPos.coluna
        ) {

            return caminho;
        }

        // Testa as quatro direções possíveis.

        for (const [dl, dc] of direcoes) {

            const nl = l + dl;
            const nc = c + dc;

            const chave = `${nl},${nc}`;

            const dentroDoMapa =
                nl >= 0 &&
                nl < LINHAS &&
                nc >= 0 &&
                nc < COLUNAS;

            if (
                dentroDoMapa &&
                mapa[nl][nc] !== 1 &&
                !visitados.has(chave)
            ) {

                visitados.add(chave);

                fila.push({

                    linha: nl,
                    coluna: nc,

                    caminho: [
                        ...caminho,
                        [dl, dc]
                    ]
                });
            }
        }
    }

    return null;
}


// Executa apenas um movimento automático por vez.

function executarPilotoAutomatico() {

    if (
        !emExecucao ||
        !modoAutomatico ||
        missaoConcluida
    ) return;

    // Recalcula a rota quando necessário.

    if (caminhoAutomatico.length === 0) {

        caminhoAutomatico = calcularCaminhoAutomatico();

        if (caminhoAutomatico === null) {

            statusTexto.textContent =
                'Não foi possível encontrar uma rota!';

            pausarSimulacao();
            return;
        }

        if (caminhoAutomatico.length === 0) {

            concluirMissao();
            return;
        }
    }

    const [dl, dc] = caminhoAutomatico[0];

    const proximaLinha = roboPos.linha + dl;
    const proximaColuna = roboPos.coluna + dc;

    // Espera o drone liberar a próxima posição.

    if (
        proximaLinha === dronePos.linha &&
        proximaColuna === dronePos.coluna
    ) {

        statusTexto.textContent =
            'Aguardando drone passar...';

        caminhoAutomatico = [];

        return;
    }

    const passosAntes = passos;

    moverRobo(dl, dc);

    // Só consome a etapa quando o movimento foi realizado.

    if (passos > passosAntes) {

        caminhoAutomatico.shift();

    } else if (!missaoConcluida) {

        caminhoAutomatico = [];
    }
}


// ==========================================
// 6. CONTROLES DA SIMULAÇÃO
// ==========================================

function iniciarSimulacao() {

    if (emExecucao || missaoConcluida) return;

    emExecucao = true;

    statusTexto.textContent =
        'Em execução! Use as setas.';

    intervaloLoop = setInterval(
        atualizarDrone,
        600
    );

    if (modoAutomatico) {

        iniciarIntervaloAutomatico();
    }
}


function iniciarIntervaloAutomatico() {

    clearInterval(intervaloAuto);

    intervaloAuto = setInterval(
        executarPilotoAutomatico,
        350
    );
}


function pausarSimulacao() {

    emExecucao = false;

    clearInterval(intervaloLoop);
    clearInterval(intervaloAuto);

    intervaloLoop = null;
    intervaloAuto = null;

    if (!missaoConcluida) {

        statusTexto.textContent =
            'Simulação pausada.';
    }
}


function reiniciarSimulacao() {

    pausarSimulacao();

    modoAutomatico = false;
    missaoConcluida = false;

    caminhoAutomatico = [];

    modoTexto.textContent = 'Manual';

    passos = 0;
    colisoes = 0;

    passosTexto.textContent = 0;
    colisoesTexto.textContent = 0;

    msgVitoria.classList.add('oculto');

    statusTexto.textContent =
        'Pronto para iniciar.';

    construirCenario();
}


// ==========================================
// 7. ALTERNAR PILOTO AUTOMÁTICO
// ==========================================

function alternarPilotoAutomatico() {

    if (missaoConcluida) return;

    modoAutomatico = !modoAutomatico;

    caminhoAutomatico = [];

    modoTexto.textContent =
        modoAutomatico ? 'Automático (IA)' : 'Manual';

    if (modoAutomatico) {

        statusTexto.textContent =
            'Piloto Automático ativado!';

        if (!emExecucao) {

            iniciarSimulacao();

        } else {

            iniciarIntervaloAutomatico();
        }

    } else {

        clearInterval(intervaloAuto);

        intervaloAuto = null;

        statusTexto.textContent =
            'Modo manual ativado.';
    }
}


// ==========================================
// 8. CONCLUSÃO DA MISSÃO
// ==========================================

function concluirMissao() {

    if (missaoConcluida) return;

    missaoConcluida = true;

    pausarSimulacao();

    modoAutomatico = false;

    modoTexto.textContent = 'Missão concluída';

    statusTexto.textContent =
        'Destino alcançado!';

    msgVitoria.classList.remove('oculto');
}


// ==========================================
// 9. EVENTOS DO TECLADO
// ==========================================

document.addEventListener('keydown', (evento) => {

    if (!emExecucao || modoAutomatico) return;

    const movimentos = {

        ArrowUp: [-1, 0],
        ArrowDown: [1, 0],
        ArrowLeft: [0, -1],
        ArrowRight: [0, 1]

    };

    if (movimentos[evento.key]) {

        evento.preventDefault();

        const [dl, dc] = movimentos[evento.key];

        moverRobo(dl, dc);
    }
});


// ==========================================
// 10. EVENTOS DOS BOTÕES
// ==========================================

document.getElementById('btn-iniciar')
    .addEventListener('click', iniciarSimulacao);

document.getElementById('btn-pausar')
    .addEventListener('click', pausarSimulacao);

document.getElementById('btn-reiniciar')
    .addEventListener('click', reiniciarSimulacao);

document.getElementById('btn-auto')
    .addEventListener('click', alternarPilotoAutomatico);

document.getElementById('btn-jogar-novamente')
    .addEventListener('click', reiniciarSimulacao);


// ==========================================
// 11. INICIALIZAÇÃO DO PROJETO
// ==========================================

construirCenario();
