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

const DIRECOES = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1]
];

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
// 4. CRIAR PERSONAGENS
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

function criarDrone() {
    dronePos = { linha: 4, coluna: 6 };

    droneEl = document.createElement('div');
    droneEl.classList.add('drone');
    droneEl.textContent = '⚡';

    atualizarPosicaoVisual(droneEl, dronePos.linha, dronePos.coluna);
    cenarioEl.appendChild(droneEl);
}

function atualizarPosicaoVisual(elemento, linha, coluna) {
    elemento.style.top = `${linha * TAMANHO_BLOCO}px`;
    elemento.style.left = `${coluna * TAMANHO_BLOCO}px`;
}

function registrarColisao(motivo) {
    colisoes++;
    colisoesTexto.textContent = colisoes;
    statusTexto.textContent = motivo;
}

function posicaoValida(linha, coluna) {
    return (
        linha >= 0 &&
        linha < LINHAS &&
        coluna >= 0 &&
        coluna < COLUNAS &&
        mapa[linha][coluna] !== 1
    );
}

// ==========================================
// 5. MOVIMENTAR ROBÔ
// ==========================================

function moverRobo(dLinha, dColuna) {
    if (!emExecucao || missaoConcluida) return;

    const novaLinha = roboPos.linha + dLinha;
    const novaColuna = roboPos.coluna + dColuna;

    if (!posicaoValida(novaLinha, novaColuna)) {
        registrarColisao('Obstáculo ou limite do mapa!');
        return;
    }

    if (
        novaLinha === dronePos.linha &&
        novaColuna === dronePos.coluna
    ) {
        registrarColisao('Cuidado! O drone está nessa posição!');
        return;
    }

    roboPos = {
        linha: novaLinha,
        coluna: novaColuna
    };

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
// 6. BUSCAR CAMINHO
// ==========================================

function buscarCaminho(origem, destino, bloquearDrone = false) {
    const fila = [{
        linha: origem.linha,
        coluna: origem.coluna,
        caminho: []
    }];

    const visitados = new Set([
        `${origem.linha},${origem.coluna}`
    ]);

    while (fila.length > 0) {
        const atual = fila.shift();

        if (
            atual.linha === destino.linha &&
            atual.coluna === destino.coluna
        ) {
            return atual.caminho;
        }

        for (const [dl, dc] of DIRECOES) {
            const nl = atual.linha + dl;
            const nc = atual.coluna + dc;

            const chave = `${nl},${nc}`;

            if (!posicaoValida(nl, nc)) continue;
            if (visitados.has(chave)) continue;

            if (
                bloquearDrone &&
                nl === dronePos.linha &&
                nc === dronePos.coluna
            ) {
                continue;
            }

            visitados.add(chave);

            fila.push({
                linha: nl,
                coluna: nc,
                caminho: [...atual.caminho, [dl, dc]]
            });
        }
    }

    return null;
}

// ==========================================
// 7. MOVIMENTAÇÃO DO DRONE
// ==========================================

function atualizarDrone() {
    if (!emExecucao || missaoConcluida) return;

    const movimentos = [];

    for (const [dl, dc] of DIRECOES) {
        const nl = dronePos.linha + dl;
        const nc = dronePos.coluna + dc;

        if (!posicaoValida(nl, nc)) continue;

        movimentos.push({
            linha: nl,
            coluna: nc,
            dl,
            dc
        });
    }

    if (movimentos.length === 0) return;

    // Calcula o caminho mais curto até o robô.
    const caminho = buscarCaminho(dronePos, roboPos);

    let escolhido = null;

    // 70% de chance de perseguir o robô.
    if (caminho && caminho.length > 0 && Math.random() < 0.7) {
        const [dl, dc] = caminho[0];

        escolhido = movimentos.find(m =>
            m.dl === dl && m.dc === dc
        );
    }

    // 30% de chance de andar aleatoriamente.
    if (!escolhido) {
        const alternativas = movimentos.filter(m =>
            !(m.linha === roboPos.linha &&
              m.coluna === roboPos.coluna)
        );

        const opcoes = alternativas.length > 0
            ? alternativas
            : movimentos;

        escolhido = opcoes[
            Math.floor(Math.random() * opcoes.length)
        ];
    }

    dronePos = {
        linha: escolhido.linha,
        coluna: escolhido.coluna
    };

    // Verifica se o drone alcançou o robô.
    if (
        dronePos.linha === roboPos.linha &&
        dronePos.coluna === roboPos.coluna
    ) {
        registrarColisao('O drone encontrou o robô! Voltando à partida.');

        roboPos = { linha: 0, coluna: 0 };

        atualizarPosicaoVisual(
            roboEl,
            roboPos.linha,
            roboPos.coluna
        );
    }

    atualizarPosicaoVisual(
        droneEl,
        dronePos.linha,
        dronePos.coluna
    );
}

// ==========================================
// 8. PILOTO AUTOMÁTICO
// ==========================================

function calcularCaminhoAutomatico() {
    return buscarCaminho(roboPos, destinoPos, true);
}

function executarPilotoAutomatico() {
    if (!emExecucao || !modoAutomatico || missaoConcluida) {
        return;
    }

    const rota = calcularCaminhoAutomatico();

    if (rota === null) {
        statusTexto.textContent = 'Procurando outro caminho...';
        return;
    }

    if (rota.length === 0) {
        concluirMissao();
        return;
    }

    const [dl, dc] = rota[0];

    moverRobo(dl, dc);
}

// ==========================================
// 9. INICIAR SIMULAÇÃO
// ==========================================

function iniciarSimulacao() {
    if (emExecucao || missaoConcluida) return;

    emExecucao = true;

    statusTexto.textContent = modoAutomatico
        ? 'Piloto automático em execução!'
        : 'Em execução! Use as setas.';

    intervaloLoop = setInterval(atualizarDrone, 650);

    if (modoAutomatico) {
        clearInterval(intervaloAuto);

        intervaloAuto = setInterval(
            executarPilotoAutomatico,
            400
        );
    }
}

// ==========================================
// 10. PAUSAR SIMULAÇÃO
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
// 11. REINICIAR SIMULAÇÃO
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
// 12. PILOTO AUTOMÁTICO
// ==========================================

function alternarPilotoAutomatico() {
    if (missaoConcluida) return;

    modoAutomatico = !modoAutomatico;

    clearInterval(intervaloAuto);
    intervaloAuto = null;

    if (modoAutomatico) {
        modoTexto.textContent = 'Automático (IA)';
        statusTexto.textContent = 'Calculando rota até a bateria...';

        if (!emExecucao) {
            iniciarSimulacao();
        } else {
            intervaloAuto = setInterval(
                executarPilotoAutomatico,
                400
            );
        }
    } else {
        modoTexto.textContent = 'Manual';
        statusTexto.textContent = 'Modo manual ativado.';
    }
}

// ==========================================
// 13. CONCLUIR MISSÃO
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
// 14. TECLADO
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
// 15. BOTÕES
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
// 16. INICIALIZAR
// ==========================================

construirCenario();