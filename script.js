// ==========================================
// 1. VARIÁVEIS E CONFIGURAÇÕES GLOBAIS
// ==========================================
const TAMANHO_BLOCO = 50; // Cada célula tem 50x50 pixels
const LINHAS = 10;
const COLUNAS = 10;

// Mapa 10x10: 0 = Caminho livre, 1 = Obstáculo, 2 = Partida, 3 = Destino
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

// Estado do Robô e da Simulação
let roboPos = { linha: 0, coluna: 0 };
let destinoPos = { linha: 9, coluna: 9 };
let dronePos = { linha: 4, coluna: 6, direcao: 1 }; // Elemento animado móvel

let emExecucao = false;
let modoAutomatico = false;
let passos = 0;
let colisoes = 0;

let intervaloLoop = null;
let intervaloAuto = null;

// Referências aos elementos do DOM
const cenarioEl = document.getElementById('cenario');
const statusTexto = document.getElementById('status-texto');
const modoTexto = document.getElementById('modo-texto');
const passosTexto = document.getElementById('contador-passos');
const colisoesTexto = document.getElementById('contador-colisoes');
const msgVitoria = document.getElementById('mensagem-vitoria');

let roboEl = null;
let droneEl = null;

// ==========================================
// 2. FUNÇÕES DE CONSTRUÇÃO DO CENÁRIO
// ==========================================
function construirCenario() {
    cenarioEl.innerHTML = ''; // Limpa cenário anterior

    // Laços de repetição aninhados para percorrer a matriz do mapa
    for (let l = 0; l < LINHAS; l++) {
        for (let c = 0; c < COLUNAS; c++) {
            const celula = document.createElement('div');
            celula.classList.add('celula');
            celula.style.top = `${l * TAMANHO_BLOCO}px`;
            celula.style.left = `${c * TAMANHO_BLOCO}px`;

            if (mapa[l][c] === 1) {
                celula.classList.add('obstaculo');
                celula.textContent = '🧱';
            } else if (mapa[l][c] === 2) {
                celula.classList.add('partida');
                roboPos = { linha: l, coluna: c };
            } else if (mapa[l][c] === 3) {
                celula.classList.add('destino');
                celula.textContent = '🔋';
                destinoPos = { linha: l, coluna: c };
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
    roboEl.innerHTML = `<div class="visor-robo"><div class="olho"></div><div class="olho"></div></div>`;
    atualizarPosicaoVisual(roboEl, roboPos.linha, roboPos.coluna);
    cenarioEl.appendChild(roboEl);
}

function criarDrone() {
    dronePos = { linha: 4, coluna: 6, direcao: 1 };
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

// ==========================================
// 3. LÓGICA DE MOVIMENTO E COLISÃO
// ==========================================
function moverRobo(dLinha, dColuna) {
    if (!emExecucao) return;

    const novaLinha = roboPos.linha + dLinha;
    const novaColuna = roboPos.coluna + dColuna;

    // 1. Verifica limites do cenário
    if (novaLinha < 0 || novaLinha >= LINHAS || novaColuna < 0 || novaColuna >= COLUNAS) {
        registrarColisao("Limite do mapa atingido!");
        return;
    }

    // 2. Verifica colisão com obstáculos fixos (rochas)
    if (mapa[novaLinha][novaColuna] === 1) {
        registrarColisao("Obstáculo bloqueando o caminho!");
        return;
    }

    // 3. Verifica colisão com o Drone Patrulha
    if (novaLinha === dronePos.linha && novaColuna === dronePos.coluna) {
        registrarColisao("Cuidado! Colisão com o Drone!");
        return;
    }

    // Movimento válido: atualiza posição
    roboPos.linha = novaLinha;
    roboPos.coluna = novaColuna;
    passos++;
    passosTexto.textContent = passos;
    statusTexto.textContent = "Explorando terreno...";
    atualizarPosicaoVisual(roboEl, roboPos.linha, roboPos.coluna);

    // 4. Verifica se chegou ao destino
    if (roboPos.linha === destinoPos.linha && roboPos.coluna === destinoPos.coluna) {
        concluirMissao();
    }
}

function registrarColisao(motivo) {
    colisoes++;
    colisoesTexto.textContent = colisoes;
    statusTexto.textContent = motivo;
}

// Animação contínua do Drone Patrulha (Elemento animado independente)
function atualizarDrone() {
    if (!emExecucao) return;

    const proximaColuna = dronePos.coluna + dronePos.direcao;

    // Inverte direção se bater na borda ou obstáculo
    if (proximaColuna < 6 || proximaColuna > 9 || mapa[dronePos.linha][proximaColuna] === 1) {
        dronePos.direcao *= -1;
    } else {
        dronePos.coluna = proximaColuna;
    }

    // Se o drone encostar no robô, empurra o robô de volta para a partida
    if (dronePos.linha === roboPos.linha && dronePos.coluna === roboPos.coluna) {
        registrarColisao("Atingido pelo Drone! Reiniciando posição...");
        roboPos = { linha: 0, coluna: 0 };
        atualizarPosicaoVisual(roboEl, roboPos.linha, roboPos.coluna);
    }

    atualizarPosicaoVisual(droneEl, dronePos.linha, dronePos.coluna);
}

// ==========================================
// 4. DESAFIO ADICIONAL: PILOTO AUTOMÁTICO (BFS)
// ==========================================
function calcularCaminhoAutomatico() {
    // Algoritmo de Busca em Largura (BFS) para encontrar o menor caminho até o destino
    const fila = [[roboPos.linha, roboPos.coluna, []]];
    const visitados = new Set([`${roboPos.linha},${roboPos.coluna}`]);
    const direcoes = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    while (fila.length > 0) {
        const [l, c, caminho] = fila.shift();

        if (l === destinoPos.linha && c === destinoPos.coluna) {
            return caminho;
        }

        for (const [dl, dc] of direcoes) {
            const nl = l + dl;
            const nc = c + dc;
            const chave = `${nl},${nc}`;

            if (nl >= 0 && nl < LINHAS && nc >= 0 && nc < COLUNAS &&
                mapa[nl][nc] !== 1 && !visitados.has(chave)) {
                visitados.add(chave);
                fila.push([nl, nc, [...caminho, [dl, dc]]]);
            }
        }
    }
    return [];
}

function alternarPilotoAutomatico() {
    if (!emExecucao) iniciarSimulacao();

    modoAutomatico = !modoAutomatico;
    modoTexto.textContent = modoAutomatico ? "Automático (IA)" : "Manual";

    if (modoAutomatico) {
        statusTexto.textContent = "Calculando rota automática...";
        intervaloAuto = setInterval(() => {
            if (!emExecucao || !modoAutomatico) return;
            const rota = calcularCaminhoAutomatico();
            if (rota.length > 0) {
                const [dl, dc] = rota[0];
                // Aguarda caso o drone esteja exatamente na próxima casa
                if (roboPos.linha + dl === dronePos.linha && roboPos.coluna + dc === dronePos.coluna) {
                    statusTexto.textContent = "Aguardando drone passar...";
                    return;
                }
                moverRobo(dl, dc);
            }
        }, 350);
    } else {
        clearInterval(intervaloAuto);
        statusTexto.textContent = "Modo manual ativado.";
    }
}

// ==========================================
// 5. CONTROLES DA ANIMAÇÃO E EVENTOS
// ==========================================
function iniciarSimulacao() {
    if (emExecucao) return;
    emExecucao = true;
    statusTexto.textContent = "Em execução! Use as setas.";
    intervaloLoop = setInterval(atualizarDrone, 600);
}

function pausarSimulacao() {
    emExecucao = false;
    clearInterval(intervaloLoop);
    statusTexto.textContent = "Simulação pausada.";
}

function reiniciarSimulacao() {
    pausarSimulacao();
    modoAutomatico = false;
    clearInterval(intervaloAuto);
    modoTexto.textContent = "Manual";
    passos = 0;
    colisoes = 0;
    passosTexto.textContent = passos;
    colisoesTexto.textContent = colisoes;
    statusTexto.textContent = "Pronto para iniciar.";
    msgVitoria.classList.add('oculto');
    construirCenario();
}

function concluirMissao() {
    pausarSimulacao();
    modoAutomatico = false;
    clearInterval(intervaloAuto);
    statusTexto.textContent = "Destino alcançado!";
    msgVitoria.classList.remove('oculto');
}

// Eventos de Teclado (Setas Direcionais)
document.addEventListener('keydown', (evento) => {
    if (!emExecucao || modoAutomatico) return;

    // Impede a rolagem da página ao usar as setas
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(evento.key)) {
        evento.preventDefault();
    }

    if (evento.key === 'ArrowUp') moverRobo(-1, 0);
    if (evento.key === 'ArrowDown') moverRobo(1, 0);
    if (evento.key === 'ArrowLeft') moverRobo(0, -1);
    if (evento.key === 'ArrowRight') moverRobo(0, 1);
});

// Eventos dos Botões
document.getElementById('btn-iniciar').addEventListener('click', iniciarSimulacao);
document.getElementById('btn-pausar').addEventListener('click', pausarSimulacao);
document.getElementById('btn-reiniciar').addEventListener('click', reiniciarSimulacao);
document.getElementById('btn-auto').addEventListener('click', alternarPilotoAutomatico);
document.getElementById('btn-jogar-novamente').addEventListener('click', reiniciarSimulacao);

// Inicializa o cenário ao carregar a página
construirCenario();