/**
 * app.js - Main application controller
 */

class App {
    constructor() {
        this.cube = new Cube();
        this.scanner = new CubeScanner();
        this.solver = new RubikSolver();
        this.cube3d = null;
        this.ui = null;
        
        this.solution = [];
        this.currentStep = 0;
        this.isPlaying = false;
        this.playbackSpeed = 400;
        this.playbackTimer = null;
        
        this.scrambleMoves = [];
        
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        this.ui = new UIController(this);
        
        setTimeout(() => {
            this.cube3d = new Cube3D('cube-3d-viewport');
            this.cube3d.updateFromState(this.cube.getState());
        }, 100);

        // Home buttons
        document.getElementById('btn-manual').addEventListener('click', () => {
            this.ui.showSection('manual-section');
        });

        document.getElementById('btn-scan').addEventListener('click', () => {
            this.ui.showSection('scan-section');
            this.ui.updateScanProgress();
        });

        document.getElementById('btn-auto-home').addEventListener('click', () => {
            this.ui.showSection('solution-section');
            document.getElementById('solution-output').classList.remove('hidden');
            document.getElementById('solution-info').classList.add('hidden');
            setTimeout(() => this.autoScrambleAndSolve(), 200);
        });

        document.getElementById('btn-help').addEventListener('click', () => {
            this.ui.showSection('help-section');
        });

        // Completion modal
        document.getElementById('btn-solve-again').addEventListener('click', () => {
            document.getElementById('completion-modal').classList.add('hidden');
            this.cube.reset();
            this.solution = [];
            this.currentStep = 0;
            if (this.cube3d) this.cube3d.updateFromState(this.cube.getState());
            this.goHome();
        });

        document.getElementById('btn-scramble-again').addEventListener('click', () => {
            document.getElementById('completion-modal').classList.add('hidden');
            setTimeout(() => this.autoScrambleAndSolve(), 100);
        });
    }

    goHome() {
        this.pause();
        this.ui.showSection('home-section');
        this.scanner.stopCamera();
    }

    // ========== MANUAL INPUT ==========
    setStickerColor(face, idx, color) {
        this.cube.setSticker(face, idx, color);
    }

    resetManualInput() {
        this.cube.reset();
    }

    fillCenters() {
        const centers = {
            U: 'white', R: 'red', F: 'green',
            D: 'yellow', L: 'orange', B: 'blue'
        };
        for (const [face, color] of Object.entries(centers)) {
            this.cube.setSticker(face, 4, color);
        }
    }

    clearAllStickers() {
        this.cube.state = this.cube.state.map(() => '');
    }

    checkCube() {
        const state = this.cube.getState();
        
        if (!CubeValidator.isComplete(state)) {
            this.ui.showError('Lengkapi semua warna Rubik terlebih dahulu.');
            return;
        }

        const result = CubeValidator.validate(state);
        if (!result.valid) {
            this.ui.showError('Susunan warna Rubik tidak valid. ' + result.errors.join(' '));
            return;
        }

        this.ui.showSection('solution-section');
        document.getElementById('solution-info').classList.remove('hidden');
        document.getElementById('solution-output').classList.add('hidden');
        
        if (this.cube3d) this.cube3d.updateFromState(state);
    }

    // ========== SCAN ==========
    setScanResult(face, colors) {
        const offset = this.cube.getFaceOffset(face);
        for (let i = 0; i < 9; i++) {
            this.cube.state[offset + i] = colors[i];
        }
    }

    finishScan() {
        const state = this.cube.getState();
        const result = CubeValidator.validate(state);
        
        if (!result.valid) {
            this.ui.showError('Hasil scan tidak valid. ' + result.errors.join(' '));
            this.goToManualWithScan();
            return;
        }

        this.ui.showSection('solution-section');
        document.getElementById('solution-info').classList.remove('hidden');
        document.getElementById('solution-output').classList.add('hidden');
        
        if (this.cube3d) this.cube3d.updateFromState(state);
    }

    goToManualWithScan() {
        this.ui.showSection('manual-section');
        this.ui.updateManualFromState();
    }

    // ========== SOLUTION ==========
    findSolution() {
        const state = this.cube.getState();
        const centers = this.cube.getCenters();
        
        const result = this.solver.solve(state, centers);
        
        if (!result.success) {
            this.ui.showError('Posisi Rubik tidak dapat diselesaikan. ' + (result.error || 'Periksa kembali input warna.'));
            return;
        }

        this.solution = result.moves;
        this.currentStep = 0;
        
        document.getElementById('solution-info').classList.add('hidden');
        document.getElementById('solution-output').classList.remove('hidden');
        document.getElementById('solution-count').textContent = this.solution.length;
        document.getElementById('solution-algorithm').textContent = this.solution.join(' ') || '(Sudah solved)';
        
        this.ui.updateStepDisplay(0, this.solution.length, '-', 'Tekan "Mulai Menyelesaikan"');
        this.ui.updateHistory([]);
        
        if (this.cube3d) this.cube3d.updateFromState(state);
    }

    startSolving() {
        this.currentStep = 0;
        this.isPlaying = false;
        this.updateStepUI();
        // Auto start play
        setTimeout(() => {
            this.play();
            document.getElementById('btn-play').classList.add('hidden');
            document.getElementById('btn-pause').classList.remove('hidden');
        }, 300);
    }

    // ========== PLAYBACK ==========
    play() {
        if (this.currentStep >= this.solution.length) {
            this.currentStep = 0;
            this.cube.reset();
            if (this.cube3d) this.cube3d.updateFromState(this.cube.getState());
        }
        this.isPlaying = true;
        this.playNext();
    }

    pause() {
        this.isPlaying = false;
        if (this.playbackTimer) {
            clearTimeout(this.playbackTimer);
            this.playbackTimer = null;
        }
    }

    playNext() {
        if (!this.isPlaying) return;
        if (this.currentStep >= this.solution.length) {
            this.isPlaying = false;
            document.getElementById('btn-play').classList.remove('hidden');
            document.getElementById('btn-pause').classList.add('hidden');
            this.onSolutionComplete();
            return;
        }

        const move = this.solution[this.currentStep];
        this.executeMove(move, () => {
            this.currentStep++;
            this.updateStepUI();
            
            if (this.currentStep >= this.solution.length) {
                this.isPlaying = false;
                document.getElementById('btn-play').classList.remove('hidden');
                document.getElementById('btn-pause').classList.add('hidden');
                this.onSolutionComplete();
            } else {
                this.playbackTimer = setTimeout(() => this.playNext(), this.playbackSpeed - 350);
            }
        });
    }

    nextStep() {
        if (this.currentStep >= this.solution.length) return;
        const move = this.solution[this.currentStep];
        this.executeMove(move, () => {
            this.currentStep++;
            this.updateStepUI();
        });
    }

    previousStep() {
        if (this.currentStep <= 0) return;
        
        this.currentStep--;
        const move = this.solution[this.currentStep];
        const inverse = this.getInverseMove(move);
        
        this.executeMove(inverse, () => {
            this.updateStepUI();
        });
    }

    restartSolution() {
        this.pause();
        this.cube.reset();
        this.currentStep = 0;
        if (this.cube3d) this.cube3d.updateFromState(this.cube.getState());
        this.updateStepUI();
    }

    doNextMove() {
        if (this.currentStep >= this.solution.length) return;
        const move = this.solution[this.currentStep];
        this.executeMove(move, () => {
            this.currentStep++;
            this.updateStepUI();
        });
    }

    executeMove(move, onComplete) {
        this.cube.move(move);
        
        if (this.cube3d) {
            this.cube3d.animateMove(move, () => {
                this.cube3d.updateFromState(this.cube.getState());
                if (onComplete) onComplete();
            });
        } else {
            if (onComplete) onComplete();
        }
        
        this.ui.updateHistory(this.cube.history);
    }

    executeManualMove(move) {
        this.executeMove(move, () => {
            this.ui.updateHistory(this.cube.history);
        });
    }

    updateStepUI() {
        const total = this.solution.length;
        const current = Math.min(this.currentStep + 1, total);
        const move = this.currentStep < total ? this.solution[this.currentStep] : '-';
        
        const descriptions = {
            'U': 'Putar sisi ATAS searah jarum jam',
            "U'": 'Putar sisi ATAS berlawanan jarum jam',
            'U2': 'Putar sisi ATAS 180°',
            'D': 'Putar sisi BAWAH searah jarum jam',
            "D'": 'Putar sisi BAWAH berlawanan jarum jam',
            'D2': 'Putar sisi BAWAH 180°',
            'R': 'Putar sisi KANAN searah jarum jam',
            "R'": 'Putar sisi KANAN berlawanan jarum jam',
            'R2': 'Putar sisi KANAN 180°',
            'L': 'Putar sisi KIRI searah jarum jam',
            "L'": 'Putar sisi KIRI berlawanan jarum jam',
            'L2': 'Putar sisi KIRI 180°',
            'F': 'Putar sisi DEPAN searah jarum jam',
            "F'": 'Putar sisi DEPAN berlawanan jarum jam',
            'F2': 'Putar sisi DEPAN 180°',
            'B': 'Putar sisi BELAKANG searah jarum jam',
            "B'": 'Putar sisi BELAKANG berlawanan jarum jam',
            'B2': 'Putar sisi BELAKANG 180°'
        };
        
        this.ui.updateStepDisplay(
            current, total, move,
            descriptions[move] || '-'
        );
    }

    onSolutionComplete() {
        if (this.cube.isSolved()) {
            this.ui.showCompletionModal();
        }
    }

    // ========== SCRAMBLE ==========
    scramble() {
        this.pause();
        this.cube.reset();
        
        if (this.cube3d) this.cube3d.updateFromState(this.cube.getState());
        
        const scramble = RubikSolver.generateScramble(20);
        this.scrambleMoves = scramble;
        this.solver.setLastScramble(scramble);
        
        document.getElementById('scramble-output').classList.remove('hidden');
        document.getElementById('scramble-text').textContent = scramble.join(' ');
        
        document.getElementById('solution-info').classList.add('hidden');
        document.getElementById('solution-output').classList.add('hidden');
        
        this.ui.updateStepDisplay(0, 0, '-', '⏳ Mengacak Rubik...');
        
        this.animateSequence(scramble, () => {
            document.getElementById('solution-info').classList.remove('hidden');
            document.getElementById('solution-info').querySelector('.success-msg').textContent = '✓ Rubik sudah diacak!';
            document.getElementById('solution-output').classList.add('hidden');
        });
    }

    animateSequence(moves, onComplete) {
        let idx = 0;
        const step = () => {
            if (idx >= moves.length) {
                if (onComplete) onComplete();
                return;
            }
            const move = moves[idx];
            this.cube.move(move);
            
            if (this.cube3d) {
                this.cube3d.animateMove(move, () => {
                    idx++;
                    setTimeout(step, 80);
                });
            } else {
                idx++;
                step();
            }
        };
        step();
    }

    solveScramble() {
        if (!this.scrambleMoves || this.scrambleMoves.length === 0) {
            alert('Tidak ada scramble aktif. Klik "Acak Rubik" dulu.');
            return;
        }

        this.pause();
        document.getElementById('solution-info').classList.add('hidden');
        document.getElementById('solution-output').classList.remove('hidden');

        const state = this.cube.getState();
        const centers = this.cube.getCenters();
        
        const result = this.solver.solve(state, centers);

        if (!result.success) {
            this.ui.showError('Gagal mencari solusi scramble. ' + (result.error || ''));
            return;
        }

        this.solution = result.moves;
        this.currentStep = 0;

        document.getElementById('solution-count').textContent = this.solution.length;
        document.getElementById('solution-algorithm').textContent = this.solution.join(' ');
        
        this.ui.updateStepDisplay(0, this.solution.length, '-', 'Tekan Play untuk memulai');
        this.ui.updateHistory([]);

        if (this.cube3d) this.cube3d.updateFromState(state);

        // Auto play
        setTimeout(() => {
            this.play();
            document.getElementById('btn-play').classList.add('hidden');
            document.getElementById('btn-pause').classList.remove('hidden');
        }, 500);
    }

    /**
     * Acak otomatis, cari solusi, dan langsung mainkan
     */
    autoScrambleAndSolve() {
        this.pause();
        this.cube.reset();
        
        if (this.cube3d) this.cube3d.updateFromState(this.cube.getState());

        // 1. Scramble
        const scramble = RubikSolver.generateScramble(20);
        this.scrambleMoves = scramble;
        this.solver.setLastScramble(scramble);
        
        document.getElementById('scramble-output').classList.remove('hidden');
        document.getElementById('scramble-text').textContent = scramble.join(' ');
        document.getElementById('solution-info').classList.add('hidden');
        document.getElementById('solution-output').classList.remove('hidden');

        this.ui.updateStepDisplay(0, 0, '-', '⏳ Mengacak Rubik...');
        this.ui.updateHistory([]);

        // 2. Animasikan scramble
        this.animateSequence(scramble, () => {
            // 3. Cari solusi
            const state = this.cube.getState();
            const centers = this.cube.getCenters();
            const result = this.solver.solve(state, centers);

            if (!result.success) {
                this.ui.showError('Gagal mencari solusi. ' + (result.error || ''));
                return;
            }

            this.solution = result.moves;
            this.currentStep = 0;

            document.getElementById('solution-count').textContent = this.solution.length;
            document.getElementById('solution-algorithm').textContent = this.solution.join(' ');
            
            this.ui.updateStepDisplay(0, this.solution.length, '-', '⏳ Memulai penyelesaian otomatis...');

            // 4. Auto-play setelah jeda
            setTimeout(() => {
                this.play();
                document.getElementById('btn-play').classList.add('hidden');
                document.getElementById('btn-pause').classList.remove('hidden');
            }, 800);
        });
    }

    // ========== UTILITY ==========
    getInverseMove(move) {
        if (move.endsWith("'")) return move[0];
        if (move.endsWith('2')) return move;
        return move + "'";
    }

    setSpeed(ms) {
        this.playbackSpeed = ms;
    }
}

// ========== INITIALIZE ==========
const app = new App();
window.app = app;
