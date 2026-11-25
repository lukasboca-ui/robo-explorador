
// ==========================================
// 1. CONFIGURAÇÕES
// ==========================================

const LINHAS = 10;
const COLUNAS = 10;
const TAMANHO_BLOCO = 50;

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

let roboEl = null;
let droneEl = null;

// ==========================================
// 2. ELEMENTOS HTML
// ==========================================

const cenarioEl = document.getElementById('cenario');
const statusTexto = document.getElementById('status-texto');
const modoTexto = document.getElementById('modo-texto');
const passosTexto = document.getElementById('contador-passos');
const colisoesTexto = document.getElementById('contador-colisoes');
const msgVitoria = document.getElementById('mensagem-vitoria');

// ==========================================
// 3. CONSTRUIR CENÁRIO
// ==========================================

function construirCenario() {

    cenarioEl.innerHTML = '';

    for (let l = 0; l < LINHAS; l++) {
        for (let c = 0; c < COLUNAS; c++) {

            const celula = document.createElement('div');

            celula.classList.add('celula');

            celula.style.top = `${l * TAMANHO_BLOCO}px`;
            celula.style.left = `${c * TAMANHO_BLOCO}px`;

            if (mapa[l][c] === 1) {
                celula.classList.add('obstaculo');
                celula.textContent = '🧱';
            }

            if (mapa[l][c] === 2) {
                celula.classList.add('partida');
            }

            if (mapa[l][c] === 3) {
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
// 4. CRIAR ROBÔ
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

    atualizarPosicaoVisual(roboEl, roboPos.linha, roboPos.coluna);

    cenarioEl.appendChild(roboEl);
}

// ==========================================
// 5. CRIAR DRONE
// ==========================================

function criarDrone() {

    dronePos = {
        linha: 4,
        coluna: 6,
        direcao: 1
    };

    droneEl = document.createElement('div');

    droneEl.classList.add('drone');
    droneEl.textContent = '⚡';

    atualizarPosicaoVisual(droneEl, dronePos.linha, dronePos.coluna);

    cenarioEl.appendChild(droneEl);
}

// ==========================================
// 6. ATUALIZAR POSIÇÃO VISUAL
// ==========================================

function atualizarPosicaoVisual(elemento, linha, coluna) {

    elemento.style.top = `${linha * TAMANHO_BLOCO}px`;
    elemento.style.left = `${coluna * TAMANHO_BLOCO}px`;
}

// ==========================================
// 7. REGISTRAR COLISÃO
// ==========================================

function registrarColisao(motivo) {

    colisoes++;

    colisoesTexto.textContent = colisoes;
    statusTexto.textContent = motivo;
}

// ==========================================
// 8. MOVIMENTAR ROBÔ
// ==========================================

function moverRobo(dLinha, dColuna) {

    if (!emExecucao || missaoConcluida) return;

    const novaLinha = roboPos.linha + dLinha;
    const novaColuna = roboPos.coluna + dColuna;

    if (
        novaLinha < 0 ||
        novaLinha >= LINHAS ||
        novaColuna < 0 ||
        novaColuna >= COLUNAS
    ) {
        registrarColisao('Limite do mapa atingido!');
        return;
    }

    if (mapa[novaLinha][novaColuna] === 1) {
        registrarColisao('Obstáculo bloqueando o caminho!');
        return;
    }

    if (
        novaLinha === dronePos.linha &&
        novaColuna === dronePos.coluna
    ) {
        registrarColisao('Cuidado! Colisão com o Drone!');
        return;
    }

    roboPos.linha = novaLinha;
    roboPos.coluna = novaColuna;

    passos++;

    passosTexto.textContent = passos;

    statusTexto.textContent = 'Explorando terreno...';

    atualizarPosicaoVisual(roboEl, roboPos.linha, roboPos.coluna);

    if (
        roboPos.linha === destinoPos.linha &&
        roboPos.coluna === destinoPos.coluna
    ) {
        concluirMissao();
    }
}

// ==========================================
// 9. MOVIMENTAR DRONE
// ==========================================

function atualizarDrone() {

    if (!emExecucao || missaoConcluida) return;

    const proximaColuna = dronePos.coluna + dronePos.direcao;

    // Drone vai e volta entre as colunas 6 e 9

    if (proximaColuna < 6 || proximaColuna > 9) {
        dronePos.direcao *= -1;
    } else {
        dronePos.coluna = proximaColuna;
    }

    // Detectar colisão

    if (
        dronePos.linha === roboPos.linha &&
        dronePos.coluna === roboPos.coluna
    ) {

        registrarColisao('Atingido pelo drone! Voltando à partida.');

        roboPos = { linha: 0, coluna: 0 };

        atualizarPosicaoVisual(roboEl, 0, 0);
    }

    atualizarPosicaoVisual(
        droneEl,
        dronePos.linha,
        dronePos.coluna
    );
}

// ==========================================
// 10. PILOTO AUTOMÁTICO - BUSCA BFS
// ==========================================

function calcularCaminhoAutomatico() {

    const fila = [{
        linha: roboPos.linha,
        coluna: roboPos.coluna,
        caminho: []
    }];

    const visitados = new Set();

    visitados.add(`${roboPos.linha},${roboPos.coluna}`);

    const direcoes = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1]
    ];

    while (fila.length > 0) {

        const atual = fila.shift();

        // O objetivo é sempre a bateria

        if (
            atual.linha === destinoPos.linha &&
            atual.coluna === destinoPos.coluna
        ) {
            return atual.caminho;
        }

        for (const [dl, dc] of direcoes) {

            const nl = atual.linha + dl;
            const nc = atual.coluna + dc;

            const chave = `${nl},${nc}`;

            if (
                nl >= 0 &&
                nl < LINHAS &&
                nc >= 0 &&
                nc < COLUNAS &&
                mapa[nl][nc] !== 1 &&
                !visitados.has(chave)
            ) {

                visitados.add(chave);

                fila.push({
                    linha: nl,
                    coluna: nc,
                    caminho: [...atual.caminho, [dl, dc]]
                });
            }
        }
    }

    return null;
}

// ==========================================
// 11. EXECUTAR PILOTO AUTOMÁTICO
// ==========================================

function executarPilotoAutomatico() {

    if (!emExecucao || !modoAutomatico || missaoConcluida) return;

    const rota = calcularCaminhoAutomatico();

    if (rota === null) {
        statusTexto.textContent = 'Procurando caminho livre...';
        return;
    }

    if (rota.length === 0) {
        concluirMissao();
        return;
    }

    const [dl, dc] = rota[0];

    const novaLinha = roboPos.linha + dl;
    const novaColuna = roboPos.coluna + dc;

    // Espera se o drone estiver na próxima casa

    if (
        novaLinha === dronePos.linha &&
        novaColuna === dronePos.coluna
    ) {
        statusTexto.textContent = 'Aguardando o drone passar...';
        return;
    }

    moverRobo(dl, dc);
}

// ==========================================
// 12. INICIAR SIMULAÇÃO
// ==========================================

function iniciarSimulacao() {

    if (emExecucao || missaoConcluida) return;

    emExecucao = true;

    statusTexto.textContent = 'Em execução! Use as setas.';

    intervaloLoop = setInterval(atualizarDrone, 600);

    if (modoAutomatico) {
        intervaloAuto = setInterval(executarPilotoAutomatico, 350);
    }
}

// ==========================================
// 13. PAUSAR SIMULAÇÃO
// ==========================================

function pausarSimulacao() {

    emExecucao = false;

    clearInterval(intervaloLoop);
    clearInterval(intervaloAuto);

    intervaloLoop = null;
    intervaloAuto = null;

    if (!missaoConcluida) {
        statusTexto.textContent = 'Simulação pausada.';
    }
}

// ==========================================
// 14. REINICIAR SIMULAÇÃO
// ==========================================

function reiniciarSimulacao() {

    pausarSimulacao();

    modoAutomatico = false;
    missaoConcluida = false;

    passos = 0;
    colisoes = 0;

    roboPos = { linha: 0, coluna: 0 };
    destinoPos = { linha: 9, coluna: 9 };

    passosTexto.textContent = 0;
    colisoesTexto.textContent = 0;

    modoTexto.textContent = 'Manual';

    statusTexto.textContent = 'Pronto para iniciar.';

    msgVitoria.classList.add('oculto');

    construirCenario();
}

// ==========================================
// 15. ALTERNAR PILOTO AUTOMÁTICO
// ==========================================

function alternarPilotoAutomatico() {

    if (missaoConcluida) return;

    modoAutomatico = !modoAutomatico;

    clearInterval(intervaloAuto);

    if (modoAutomatico) {

        modoTexto.textContent = 'Automático (IA)';

        statusTexto.textContent = 'Calculando rota até a bateria...';

        if (!emExecucao) {
            iniciarSimulacao();
        } else {
            intervaloAuto = setInterval(executarPilotoAutomatico, 350);
        }

    } else {

        modoTexto.textContent = 'Manual';

        statusTexto.textContent = 'Modo manual ativado.';
    }
}

// ==========================================
// 16. CONCLUIR MISSÃO
// ==========================================

function concluirMissao() {

    if (missaoConcluida) return;

    missaoConcluida = true;

    pausarSimulacao();

    modoAutomatico = false;

    modoTexto.textContent = 'Concluído';

    statusTexto.textContent = 'Destino alcançado!';

    msgVitoria.classList.remove('oculto');
}

// ==========================================
// 17. EVENTOS DO TECLADO
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
// 18. EVENTOS DOS BOTÕES
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
// 19. INICIALIZAR
// ==========================================

construirCenario();
