
// ==========================================
// 1. CONFIGURAÇÕES E VARIÁVEIS
// ==========================================

const LINHAS = 10;
const COLUNAS = 10;
const TAMANHO_BLOCO = 10;

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

let dronePos = { linha: 4, coluna: 6 };

let emExecucao = false;
let modoAutomatico = false;
let missaoConcluida = false;

let passos = 0;
let colisoes = 0;

let intervaloLoop = null;
let intervaloAuto = null;

let roboEl = null;
let droneEl = null;

let caminhoAutomatico = [];

// ==========================================
// 2. ROTA DO DRONE
// ==========================================

const rotaDrone = [
    [4, 6], [4, 7], [4, 8], [4, 9],
    [3, 9], [3, 8], [2, 8], [1, 8],
    [0, 8], [0, 7], [0, 6], [0, 5],
    [0, 4], [1, 4], [2, 4], [2, 3],
    [2, 2], [2, 1], [2, 0], [3, 0],
    [4, 0], [4, 1], [4, 2], [4, 3],
    [4, 4], [5, 4], [6, 4], [6, 5],
    [6, 6], [6, 7], [6, 8], [6, 9],
    [5, 9]
];

let indiceRotaDrone = 0;
let direcaoDrone = 1;

// ==========================================
// 3. ELEMENTOS HTML
// ==========================================

const cenarioEl = document.getElementById('cenario');
const statusTexto = document.getElementById('status-texto');
const modoTexto = document.getElementById('modo-texto');
const passosTexto = document.getElementById('contador-passos');
const colisoesTexto = document.getElementById('contador-colisoes');
const msgVitoria = document.getElementById('mensagem-vitoria');

// ==========================================
// 4. CONSTRUIR CENÁRIO
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

            } else if (mapa[l][c] === 3) {

                celula.classList.add('destino');
                celula.textContent = '🔋';
            }

            cenarioEl.appendChild(celula);
        }
    }

    criarRobo();
    criarDrone();
}

// ==========================================
// 5. CRIAR ROBÔ
// ==========================================

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

// ==========================================
// 6. CRIAR DRONE
// ==========================================

function criarDrone() {

    indiceRotaDrone = 0;
    direcaoDrone = 1;

    dronePos = {
        linha: rotaDrone[0][0],
        coluna: rotaDrone[0][1]
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

// ==========================================
// 7. ATUALIZAR POSIÇÃO VISUAL
// ==========================================

function atualizarPosicaoVisual(elemento, linha, coluna) {

    elemento.style.top = `${linha * TAMANHO_BLOCO}%`;
    elemento.style.left = `${coluna * TAMANHO_BLOCO}%`;
}

// ==========================================
// 8. REGISTRAR COLISÕES
// ==========================================

function registrarColisao(motivo) {

    colisoes++;

    colisoesTexto.textContent = colisoes;
    statusTexto.textContent = motivo;
}

// ==========================================
// 9. MOVIMENTAR ROBÔ
// ==========================================

function moverRobo(dLinha, dColuna) {

    if (!emExecucao || missaoConcluida) return;

    const novaLinha = roboPos.linha + dLinha;
    const novaColuna = roboPos.coluna + dColuna;

    // Verificar limites.

    if (
        novaLinha < 0 ||
        novaLinha >= LINHAS ||
        novaColuna < 0 ||
        novaColuna >= COLUNAS
    ) {

        registrarColisao('Limite do mapa atingido!');
        return;
    }

    // Verificar rochas.

    if (mapa[novaLinha][novaColuna] === 1) {

        registrarColisao('Rocha bloqueando o caminho!');
        return;
    }

    // Verificar drone.

    if (
        novaLinha === dronePos.linha &&
        novaColuna === dronePos.coluna
    ) {

        registrarColisao('Cuidado! Colisão com o Drone!');
        return;
    }

    // Executar movimento.

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

    // Verificar chegada.

    if (
        roboPos.linha === destinoPos.linha &&
        roboPos.coluna === destinoPos.coluna
    ) {

        concluirMissao();
    }
}

// ==========================================
// 10. PRÓXIMA POSIÇÃO DO DRONE
// ==========================================

function calcularProximaPosicaoDrone() {

    let proximoIndice =
        indiceRotaDrone + direcaoDrone;

    if (
        proximoIndice >= rotaDrone.length ||
        proximoIndice < 0
    ) {

        proximoIndice =
            indiceRotaDrone - direcaoDrone;
    }

    return rotaDrone[proximoIndice];
}

// ==========================================
// 11. MOVIMENTAÇÃO DO DRONE
// ==========================================

function atualizarDrone() {

    if (!emExecucao || missaoConcluida) return;

    let proximoIndice =
        indiceRotaDrone + direcaoDrone;

    // Inverter ao chegar ao final da rota.

    if (
        proximoIndice >= rotaDrone.length ||
        proximoIndice < 0
    ) {

        direcaoDrone *= -1;

        proximoIndice =
            indiceRotaDrone + direcaoDrone;
    }

    const proximaPosicao = rotaDrone[proximoIndice];

    const novaLinha = proximaPosicao[0];
    const novaColuna = proximaPosicao[1];

    // Detectar colisão do drone com o robô.

    if (
        novaLinha === roboPos.linha &&
        novaColuna === roboPos.coluna
    ) {

        registrarColisao(
            'Atingido pelo Drone! Voltando à partida...'
        );

        roboPos = { linha: 0, coluna: 0 };

        atualizarPosicaoVisual(
            roboEl,
            roboPos.linha,
            roboPos.coluna
        );

        caminhoAutomatico = [];
    }

    indiceRotaDrone = proximoIndice;

    dronePos.linha = novaLinha;
    dronePos.coluna = novaColuna;

    atualizarPosicaoVisual(
        droneEl,
        dronePos.linha,
        dronePos.coluna
    );
}

// ==========================================
// 12. CALCULAR CAMINHO SEGURO - BFS
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

    // Prever algumas posições futuras do drone.
    // Isso reduz a chance de o robô escolher uma rota
    // que cruza a patrulha.

    const casasPerigosas = new Set();

    let indicePrevisto = indiceRotaDrone;
    let direcaoPrevista = direcaoDrone;

    casasPerigosas.add(
        `${dronePos.linha},${dronePos.coluna}`
    );

    for (let i = 1; i <= 5; i++) {

        let proximoIndice =
            indicePrevisto + direcaoPrevista;

        if (
            proximoIndice >= rotaDrone.length ||
            proximoIndice < 0
        ) {

            direcaoPrevista *= -1;

            proximoIndice =
                indicePrevisto + direcaoPrevista;
        }

        indicePrevisto = proximoIndice;

        const posicao =
            rotaDrone[indicePrevisto];

        casasPerigosas.add(
            `${posicao[0]},${posicao[1]}`
        );
    }

    while (fila.length > 0) {

        const atual = fila.shift();

        const l = atual.linha;
        const c = atual.coluna;

        // Chegou à bateria.

        if (
            l === destinoPos.linha &&
            c === destinoPos.coluna
        ) {

            return atual.caminho;
        }

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
                !visitados.has(chave) &&
                !casasPerigosas.has(chave)
            ) {

                visitados.add(chave);

                fila.push({

                    linha: nl,
                    coluna: nc,

                    caminho: [
                        ...atual.caminho,
                        [dl, dc]
                    ]
                });
            }
        }
    }

    return null;
}

// ==========================================
// 13. PILOTO AUTOMÁTICO
// ==========================================

function executarPilotoAutomatico() {

    if (
        !emExecucao ||
        !modoAutomatico ||
        missaoConcluida
    ) return;

    // Recalcular a rota em cada movimento.

    caminhoAutomatico =
        calcularCaminhoAutomatico();

    // Não encontrou caminho seguro.

    if (caminhoAutomatico === null) {

        statusTexto.textContent =
            'Drone no caminho! Procurando outra rota...';

        return;
    }

    // Já chegou ao destino.

    if (caminhoAutomatico.length === 0) {

        concluirMissao();
        return;
    }

    const [dl, dc] = caminhoAutomatico[0];

    const proximaLinha = roboPos.linha + dl;
    const proximaColuna = roboPos.coluna + dc;

    // Verificar novamente o drone antes de andar.

    if (
        proximaLinha === dronePos.linha &&
        proximaColuna === dronePos.coluna
    ) {

        statusTexto.textContent =
            'Aguardando o drone passar...';

        return;
    }

    moverRobo(dl, dc);
}

// ==========================================
// 14. INICIAR PILOTO AUTOMÁTICO
// ==========================================

function iniciarIntervaloAutomatico() {

    clearInterval(intervaloAuto);

    intervaloAuto = setInterval(
        executarPilotoAutomatico,
        350
    );
}

// ==========================================
// 15. INICIAR SIMULAÇÃO
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

// ==========================================
// 16. PAUSAR SIMULAÇÃO
// ==========================================

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

// ==========================================
// 17. REINICIAR SIMULAÇÃO
// ==========================================

function reiniciarSimulacao() {

    pausarSimulacao();

    modoAutomatico = false;
    missaoConcluida = false;

    caminhoAutomatico = [];

    passos = 0;
    colisoes = 0;

    roboPos = { linha: 0, coluna: 0 };
    destinoPos = { linha: 9, coluna: 9 };

    passosTexto.textContent = 0;
    colisoesTexto.textContent = 0;

    modoTexto.textContent = 'Manual';

    statusTexto.textContent =
        'Pronto para iniciar.';

    msgVitoria.classList.add('oculto');

    construirCenario();
}

// ==========================================
// 18. ALTERNAR PILOTO AUTOMÁTICO
// ==========================================

function alternarPilotoAutomatico() {

    if (missaoConcluida) return;

    modoAutomatico = !modoAutomatico;

    caminhoAutomatico = [];

    if (modoAutomatico) {

        modoTexto.textContent = 'Automático (IA)';

        statusTexto.textContent =
            'Calculando rota segura até a bateria...';

        if (!emExecucao) {

            iniciarSimulacao();

        } else {

            iniciarIntervaloAutomatico();
        }

    } else {

        clearInterval(intervaloAuto);

        intervaloAuto = null;

        modoTexto.textContent = 'Manual';

        statusTexto.textContent =
            emExecucao
                ? 'Modo manual ativado.'
                : 'Simulação pausada.';
    }
}

// ==========================================
// 19. CONCLUIR MISSÃO
// ==========================================

function concluirMissao() {

    if (missaoConcluida) return;

    missaoConcluida = true;

    pausarSimulacao();

    modoAutomatico = false;

    modoTexto.textContent = 'Missão concluída';

    statusTexto.textContent = 'Destino alcançado!';

    msgVitoria.classList.remove('oculto');
}

// ==========================================
// 20. CONTROLES DO TECLADO
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
// 21. EVENTOS DOS BOTÕES
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
// 22. INICIALIZAR PROJETO
// ==========================================

construirCenario();
