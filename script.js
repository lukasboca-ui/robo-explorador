// ==========================================
// 1. VARIÁVEIS E CONFIGURAÇÕES
// ==========================================

const LINHAS = 10;
const COLUNAS = 10;
const TAMANHO_BLOCO = 10;

// Mapa:
// 0 = Caminho livre
// 1 = Obstáculo
// 2 = Partida
// 3 = Destino

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

// Posições iniciais

let roboPos = {
    linha: 0,
    coluna: 0
};

let destinoPos = {
    linha: 9,
    coluna: 9
};

let dronePos = {
    linha: 4,
    coluna: 6
};

// Estados da simulação

let emExecucao = false;
let modoAutomatico = false;
let missaoConcluida = false;

let passos = 0;
let colisoes = 0;

// Temporizadores

let intervaloLoop = null;
let intervaloAuto = null;

// Caminho do piloto automático

let caminhoAutomatico = [];

// Referências HTML

const cenarioEl = document.getElementById('cenario');

const statusTexto =
    document.getElementById('status-texto');

const modoTexto =
    document.getElementById('modo-texto');

const passosTexto =
    document.getElementById('contador-passos');

const colisoesTexto =
    document.getElementById('contador-colisoes');

const msgVitoria =
    document.getElementById('mensagem-vitoria');

let roboEl = null;
let droneEl = null;


// ==========================================
// 2. ROTA DE PATRULHA DO DRONE
// ==========================================

// O drone percorre 33 posições do mapa.
// Depois de chegar ao final, volta pelo caminho.

const rotaDrone = [
    [4, 6],
    [4, 7],
    [4, 8],
    [4, 9],
    [3, 9],
    [3, 8],
    [2, 8],
    [1, 8],
    [0, 8],
    [0, 7],
    [0, 6],
    [0, 5],
    [0, 4],
    [1, 4],
    [2, 4],
    [2, 3],
    [2, 2],
    [2, 1],
    [2, 0],
    [3, 0],
    [4, 0],
    [4, 1],
    [4, 2],
    [4, 3],
    [4, 4],
    [5, 4],
    [6, 4],
    [6, 5],
    [6, 6],
    [6, 7],
    [6, 8],
    [6, 9],
    [5, 9]
];

let indiceRotaDrone = 0;
let direcaoDrone = 1;


// ==========================================
// 3. CONSTRUÇÃO DO CENÁRIO
// ==========================================

function construirCenario() {

    cenarioEl.innerHTML = '';

    // Percorre todas as linhas e colunas.

    for (let l = 0; l < LINHAS; l++) {

        for (let c = 0; c < COLUNAS; c++) {

            const celula = document.createElement('div');

            celula.classList.add('celula');

            celula.style.top =
                `${l * TAMANHO_BLOCO}%`;

            celula.style.left =
                `${c * TAMANHO_BLOCO}%`;

            // Verifica o tipo da célula.

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
// 4. CRIAÇÃO DO ROBÔ
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
// 5. CRIAÇÃO DO DRONE
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


// Atualiza a posição visual dos elementos.

function atualizarPosicaoVisual(elemento, linha, coluna) {

    elemento.style.top =
        `${linha * TAMANHO_BLOCO}%`;

    elemento.style.left =
        `${coluna * TAMANHO_BLOCO}%`;
}


// ==========================================
// 6. MOVIMENTAÇÃO DO ROBÔ
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

    // Verifica as rochas.

    if (mapa[novaLinha][novaColuna] === 1) {

        registrarColisao('Rocha bloqueando o caminho!');
        return;
    }

    // Verifica o drone.

    if (
        novaLinha === dronePos.linha &&
        novaColuna === dronePos.coluna
    ) {

        registrarColisao('Cuidado! Colisão com o Drone!');
        return;
    }

    // Movimento permitido.

    roboPos.linha = novaLinha;
    roboPos.coluna = novaColuna;

    passos++;

    passosTexto.textContent = passos;

    statusTexto.textContent =
        'Explorando terreno...';

    atualizarPosicaoVisual(
        roboEl,
        roboPos.linha,
        roboPos.coluna
    );

    // Verifica se chegou à bateria.

    if (
        roboPos.linha === destinoPos.linha &&
        roboPos.coluna === destinoPos.coluna
    ) {

        concluirMissao();
    }
}


// ==========================================
// 7. REGISTRO DE COLISÕES
// ==========================================

function registrarColisao(motivo) {

    colisoes++;

    colisoesTexto.textContent = colisoes;

    statusTexto.textContent = motivo;
}


// ==========================================
// 8. MOVIMENTAÇÃO DO DRONE
// ==========================================

function atualizarDrone() {

    if (!emExecucao || missaoConcluida) return;

    let proximoIndice =
        indiceRotaDrone + direcaoDrone;

    // Inverte a direção quando chega ao final.

    if (
        proximoIndice >= rotaDrone.length ||
        proximoIndice < 0
    ) {

        direcaoDrone *= -1;

        proximoIndice =
            indiceRotaDrone + direcaoDrone;
    }

    const proximaPosicao =
        rotaDrone[proximoIndice];

    const novaLinha = proximaPosicao[0];
    const novaColuna = proximaPosicao[1];

    // Verifica se o drone atingiu o robô.

    if (
        novaLinha === roboPos.linha &&
        novaColuna === roboPos.coluna
    ) {

        registrarColisao(
            'Atingido pelo Drone! Voltando à partida...'
        );

        // Devolve o robô à partida.

        roboPos = {
            linha: 0,
            coluna: 0
        };

        atualizarPosicaoVisual(
            roboEl,
            roboPos.linha,
            roboPos.coluna
        );

        // Descarta o caminho antigo.

        caminhoAutomatico = [];
    }

    // Atualiza a posição do drone.

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
// 9. PILOTO AUTOMÁTICO - BFS
// ==========================================

function calcularCaminhoAutomatico() {

    // Fila utilizada na busca em largura.

    const fila = [{
        linha: roboPos.linha,
        coluna: roboPos.coluna,
        caminho: []
    }];

    const visitados = new Set();

    visitados.add(
        `${roboPos.linha},${roboPos.coluna}`
    );

    // Movimentos possíveis.

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

        // Verifica se chegou ao destino.

        if (
            l === destinoPos.linha &&
            c === destinoPos.coluna
        ) {

            return caminho;
        }

        // Testa todas as direções.

        for (const [dl, dc] of direcoes) {

            const nl = l + dl;
            const nc = c + dc;

            const chave = `${nl},${nc}`;

            const dentroDoMapa =
                nl >= 0 &&
                nl < LINHAS &&
                nc >= 0 &&
                nc < COLUNAS;

            // Verifica se o caminho é permitido.

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


// ==========================================
// 10. EXECUÇÃO DO PILOTO AUTOMÁTICO
// ==========================================

function executarPilotoAutomatico() {

    if (
        !emExecucao ||
        !modoAutomatico ||
        missaoConcluida
    ) return;

    // Calcula a rota atual.

    caminhoAutomatico =
        calcularCaminhoAutomatico();

    // Verifica se existe caminho.

    if (caminhoAutomatico === null) {

        statusTexto.textContent =
            'Não foi possível encontrar uma rota!';

        pausarSimulacao();

        return;
    }

    // Se já está no destino.

    if (caminhoAutomatico.length === 0) {

        concluirMissao();

        return;
    }

    // Escolhe o próximo movimento.

    const [dl, dc] = caminhoAutomatico[0];

    const proximaLinha = roboPos.linha + dl;
    const proximaColuna = roboPos.coluna + dc;

    // Espera se o drone estiver na próxima casa.

    if (
        proximaLinha === dronePos.linha &&
        proximaColuna === dronePos.coluna
    ) {

        statusTexto.textContent =
            'Aguardando drone passar...';

        return;
    }

    // Executa o movimento.

    moverRobo(dl, dc);
}


// ==========================================
// 11. INICIAR A SIMULAÇÃO
// ==========================================

function iniciarSimulacao() {

    if (emExecucao || missaoConcluida) return;

    emExecucao = true;

    statusTexto.textContent =
        'Em execução! Use as setas.';

    // Inicia a movimentação do drone.

    intervaloLoop = setInterval(
        atualizarDrone,
        600
    );

    // Inicia o piloto se estiver ativado.

    if (modoAutomatico) {

        iniciarIntervaloAutomatico();
    }
}


// ==========================================
// 12. INTERVALO DO PILOTO AUTOMÁTICO
// ==========================================

function iniciarIntervaloAutomatico() {

    clearInterval(intervaloAuto);

    intervaloAuto = setInterval(
        executarPilotoAutomatico,
        350
    );
}


// ==========================================
// 13. PAUSAR A SIMULAÇÃO
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
// 14. REINICIAR A SIMULAÇÃO
// ==========================================

function reiniciarSimulacao() {

    pausarSimulacao();

    modoAutomatico = false;
    missaoConcluida = false;

    caminhoAutomatico = [];

    passos = 0;
    colisoes = 0;

    passosTexto.textContent = 0;
    colisoesTexto.textContent = 0;

    modoTexto.textContent = 'Manual';

    statusTexto.textContent =
        'Pronto para iniciar.';

    msgVitoria.classList.add('oculto');

    // Reconstrói o mapa e reinicia os elementos.

    construirCenario();
}


// ==========================================
// 15. ALTERNAR PILOTO AUTOMÁTICO
// ==========================================

function alternarPilotoAutomatico() {

    if (missaoConcluida) return;

    modoAutomatico = !modoAutomatico;

    caminhoAutomatico = [];

    if (modoAutomatico) {

        modoTexto.textContent =
            'Automático (IA)';

        statusTexto.textContent =
            'Piloto Automático ativado!';

        if (!emExecucao) {

            iniciarSimulacao();

        } else {

            iniciarIntervaloAutomatico();
        }

    } else {

        modoTexto.textContent = 'Manual';

        clearInterval(intervaloAuto);

        intervaloAuto = null;

        statusTexto.textContent =
            emExecucao
                ? 'Modo manual ativado.'
                : 'Simulação pausada.';
    }
}


// ==========================================
// 16. CONCLUIR A MISSÃO
// ==========================================

function concluirMissao() {

    if (missaoConcluida) return;

    missaoConcluida = true;

    pausarSimulacao();

    modoAutomatico = false;

    modoTexto.textContent =
        'Missão concluída';

    statusTexto.textContent =
        'Destino alcançado!';

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
// 19. INICIALIZAÇÃO DO PROJETO
// ==========================================

construirCenario();
