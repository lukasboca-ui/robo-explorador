
document.addEventListener('DOMContentLoaded', iniciarJogo);

function iniciarJogo() {

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
    let dronePos = { linha: 4, coluna: 6 };
    let destinoPos = { linha: 9, coluna: 9 };

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

    if (!cenarioEl) {
        console.error('Não encontrei o elemento #cenario no HTML.');
        return;
    }

    // ==========================================
    // 3. FUNÇÕES AUXILIARES
    // ==========================================

    function atualizarStatus(texto) {
        if (statusTexto) statusTexto.textContent = texto;
    }

    function atualizarModo(texto) {
        if (modoTexto) modoTexto.textContent = texto;
    }

    function atualizarContadores() {
        if (passosTexto) passosTexto.textContent = passos;
        if (colisoesTexto) colisoesTexto.textContent = colisoes;
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

    function atualizarPosicaoVisual(elemento, linha, coluna) {
        if (!elemento) return;

        elemento.style.top = `${linha * TAMANHO_BLOCO}px`;
        elemento.style.left = `${coluna * TAMANHO_BLOCO}px`;
    }

    function registrarColisao(motivo) {
        colisoes++;
        atualizarContadores();
        atualizarStatus(motivo);
    }

    function pararRelogios() {
        clearInterval(intervaloLoop);
        clearInterval(intervaloAuto);

        intervaloLoop = null;
        intervaloAuto = null;
    }

    // ==========================================
    // 4. CONSTRUIR MAPA
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
        dronePos = { linha: 4, coluna: 6 };

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
    // 7. TELA DE DERROTA
    // ==========================================

    function perderJogo() {
        if (missaoConcluida) return;

        missaoConcluida = true;
        emExecucao = false;
        modoAutomatico = false;

        pararRelogios();

        registrarColisao('O drone capturou o robô!');
        atualizarModo('Derrota');
        atualizarStatus('VOCÊ PERDEU!');

        // Evita criar várias telas.
        document.getElementById('tela-game-over')?.remove();

        const tela = document.createElement('div');
        tela.id = 'tela-game-over';

        tela.style.cssText = `
            position: fixed;
            inset: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.92);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 999999;
            padding: 20px;
            box-sizing: border-box;
        `;

        tela.innerHTML = `
            <div style="
                background: #1e293b;
                color: white;
                width: 100%;
                max-width: 420px;
                padding: 35px 25px;
                border-radius: 22px;
                border: 3px solid #ef4444;
                text-align: center;
                box-shadow: 0 0 40px rgba(239,68,68,0.45);
                box-sizing: border-box;
            ">
                <div style="font-size: 75px;">🚨</div>

                <h1 style="
                    color: #ef4444;
                    font-size: 38px;
                    margin: 15px 0;
                ">
                    VOCÊ PERDEU!
                </h1>

                <p style="
                    font-size: 17px;
                    color: #e2e8f0;
                ">
                    O drone encontrou seu robô!
                    A missão foi encerrada.
                </p>

                <button id="tentar-novamente" style="
                    background: #ef4444;
                    color: white;
                    border: none;
                    padding: 15px 25px;
                    border-radius: 12px;
                    font-size: 17px;
                    font-weight: bold;
                    cursor: pointer;
                    margin-top: 15px;
                ">
                    🔄 TENTAR NOVAMENTE
                </button>
            </div>
        `;

        document.body.appendChild(tela);

        document
            .getElementById('tentar-novamente')
            .addEventListener('click', reiniciarSimulacao);
    }

    // ==========================================
    // 8. MOVIMENTAR ROBÔ
    // ==========================================

    function moverRobo(dLinha, dColuna) {
        if (!emExecucao || missaoConcluida) return;

        const novaLinha = roboPos.linha + dLinha;
        const novaColuna = roboPos.coluna + dColuna;

        if (!posicaoValida(novaLinha, novaColuna)) {
            registrarColisao('Obstáculo ou limite do mapa!');
            return;
        }

        // COLISÃO COM O DRONE.
        if (
            novaLinha === dronePos.linha &&
            novaColuna === dronePos.coluna
        ) {
            perderJogo();
            return;
        }

        roboPos = {
            linha: novaLinha,
            coluna: novaColuna
        };

        passos++;
        atualizarContadores();

        atualizarStatus('Explorando terreno...');

        atualizarPosicaoVisual(
            roboEl,
            roboPos.linha,
            roboPos.coluna
        );

        if (
            roboPos.linha === destinoPos.linha &&
            roboPos.coluna === destinoPos.coluna
        ) {
            concluirMissao();
        }
    }

    // ==========================================
    // 9. BUSCAR CAMINHO COM BFS
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
    // 10. MOVIMENTAR DRONE
    // ==========================================

    function atualizarDrone() {
        if (!emExecucao || missaoConcluida) return;

        // Confere se já existe colisão.
        if (
            dronePos.linha === roboPos.linha &&
            dronePos.coluna === roboPos.coluna
        ) {
            perderJogo();
            return;
        }

        const opcoes = [];

        for (const [dl, dc] of DIRECOES) {
            const linha = dronePos.linha + dl;
            const coluna = dronePos.coluna + dc;

            if (!posicaoValida(linha, coluna)) continue;

            opcoes.push({
                linha,
                coluna,
                dl,
                dc
            });
        }

        if (opcoes.length === 0) return;

        const caminho = buscarCaminho(
            dronePos,
            roboPos,
            false
        );

        let escolhido = null;

        // 75% de chance de perseguir o robô.
        if (
            caminho &&
            caminho.length > 0 &&
            Math.random() < 0.75
        ) {
            const [dl, dc] = caminho[0];

            escolhido = opcoes.find(
                p => p.dl === dl && p.dc === dc
            );
        }

        // Caso contrário, escolhe um movimento aleatório.
        if (!escolhido) {
            escolhido = opcoes[
                Math.floor(Math.random() * opcoes.length)
            ];
        }

        dronePos = {
            linha: escolhido.linha,
            coluna: escolhido.coluna
        };

        atualizarPosicaoVisual(
            droneEl,
            dronePos.linha,
            dronePos.coluna
        );

        // COLISÃO: DRONE ENCOSTOU NO ROBÔ.
        if (
            dronePos.linha === roboPos.linha &&
            dronePos.coluna === roboPos.coluna
        ) {
            perderJogo();
            return;
        }
    }

    // ==========================================
    // 11. PILOTO AUTOMÁTICO
    // ==========================================

    function calcularCaminhoAutomatico() {
        return buscarCaminho(
            roboPos,
            destinoPos,
            true
        );
    }

    function executarPilotoAutomatico() {
        if (
            !emExecucao ||
            !modoAutomatico ||
            missaoConcluida
        ) {
            return;
        }

        const rota = calcularCaminhoAutomatico();

        if (rota === null) {
            atualizarStatus('Esperando uma passagem livre do drone...');
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
    // 12. INICIAR SIMULAÇÃO
    // ==========================================

    function iniciarSimulacao() {
        if (emExecucao || missaoConcluida) return;

        emExecucao = true;

        atualizarStatus(
            modoAutomatico
                ? 'Piloto automático em execução!'
                : 'Em execução! Use as setas.'
        );

        intervaloLoop = setInterval(atualizarDrone, 650);

        if (modoAutomatico) {
            intervaloAuto = setInterval(
                executarPilotoAutomatico,
                400
            );
        }
    }

    // ==========================================
    // 13. PAUSAR SIMULAÇÃO
    // ==========================================

    function pausarSimulacao() {
        if (missaoConcluida) return;

        emExecucao = false;
        pararRelogios();

        atualizarStatus('Simulação pausada.');
    }

    // ==========================================
    // 14. REINICIAR SIMULAÇÃO
    // ==========================================

    function reiniciarSimulacao() {
        pararRelogios();

        document.getElementById('tela-game-over')?.remove();

        emExecucao = false;
        modoAutomatico = false;
        missaoConcluida = false;

        passos = 0;
        colisoes = 0;

        roboPos = { linha: 0, coluna: 0 };
        dronePos = { linha: 4, coluna: 6 };
        destinoPos = { linha: 9, coluna: 9 };

        atualizarContadores();
        atualizarModo('Manual');
        atualizarStatus('Pronto para iniciar.');

        if (msgVitoria) {
            msgVitoria.classList.add('oculto');
        }

        construirCenario();
    }

    // ==========================================
    // 15. PILOTO AUTOMÁTICO LIGAR/DESLIGAR
    // ==========================================

    function alternarPilotoAutomatico() {
        if (missaoConcluida) return;

        modoAutomatico = !modoAutomatico;

        clearInterval(intervaloAuto);
        intervaloAuto = null;

        if (modoAutomatico) {
            atualizarModo('Automático (IA)');
            atualizarStatus('Calculando rota até a bateria...');

            if (!emExecucao) {
                iniciarSimulacao();
            } else {
                intervaloAuto = setInterval(
                    executarPilotoAutomatico,
                    400
                );
            }
        } else {
            atualizarModo('Manual');
            atualizarStatus('Modo manual ativado.');
        }
    }

    // ==========================================
    // 16. CONCLUIR MISSÃO
    // ==========================================

    function concluirMissao() {
        if (missaoConcluida) return;

        missaoConcluida = true;
        emExecucao = false;
        modoAutomatico = false;

        pararRelogios();

        atualizarModo('Concluído');
        atualizarStatus('Destino alcançado!');

        if (msgVitoria) {
            msgVitoria.classList.remove('oculto');
        }
    }

    // ==========================================
    // 17. CONTROLES DO TECLADO
    // ==========================================

    document.addEventListener('keydown', evento => {
        if (!emExecucao || modoAutomatico || missaoConcluida) {
            return;
        }

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
    // 18. BOTÕES
    // ==========================================

    function ligarBotao(id, funcao) {
        const botao = document.getElementById(id);

        if (botao) {
            botao.addEventListener('click', funcao);
        } else {
            console.warn(`Botão não encontrado: ${id}`);
        }
    }

    ligarBotao('btn-iniciar', iniciarSimulacao);
    ligarBotao('btn-pausar', pausarSimulacao);
    ligarBotao('btn-reiniciar', reiniciarSimulacao);
    ligarBotao('btn-auto', alternarPilotoAutomatico);
    ligarBotao('btn-jogar-novamente', reiniciarSimulacao);

    // ==========================================
    // 19. INICIALIZAR JOGO
    // ==========================================

    construirCenario();
    atualizarContadores();
    atualizarModo('Manual');
    atualizarStatus('Pronto para iniciar.');

}
