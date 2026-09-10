/**
 * app.js - Main application controller
 * Menghubungkan semua komponen
 */

class App {
    constructor() {
        this.cube = new Cube();
        this.scanner = new CubeScanner();
        this.solver = new RubikSolver();
        this.cube3d = null;
        this.ui = null;
        
        // Solution state
        this.solution = [];
        this.currentStep = 0;
        this.isPlaying = false;
        this.playbackSpeed = 400;
        this.playbackTimer = null;
        
        // Scramble state
        this.scrambleMoves = [];
        
        this.init();
    }

    init() {
        // Tunggu DOM siap
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        // Init UI
        this.ui = new UIController(this);
        
        // Init 3D cube setelah DOM ready
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

        document.getElementById('btn-help').addEventListener('click', () => {
            this.ui.showSection('help-section');
        });

        // Completion modal buttons
        document.getElementById('btn-solve-again').addEventListener('click', () => {
            document.getElementById('completion-modal').classList.add('hidden');
            this.cube.reset();
            this.solution = [];
            this.currentStep = 0;
            this.goHome();
        });

        document.getElementById('btn-scramble-again').addEventListener('click', () => {
            document.getElementById('completion-modal').classList.add('hidden');
            this.scramble();
        });
    }

    goHome() {
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
        
        // Cek apakah semua terisi
        if (!CubeValidator.isComplete(state)) {
            this.ui.showError('Lengkapi semua warna Rubik terlebih dahulu.');
            return;
        }

        // Validasi
        const result = CubeValidator.validate(state);
        if (!result.valid) {
            this.ui.showError('Susunan warna Rubik tidak valid. ' + result.errors.join(' '));
            return;
        }

        // Valid, lanjut ke solution
        this.ui.showSection('solution-section');
        document.getElementById('solution-info').classList.remove('hidden');
        
        // Update 3D cube
        if (this.cube3d) {
            this.cube3d.updateFromState(state);
        }
    }

    // ========== SCAN ==========
    setScanResult(face, colors) {
        const offset = this.cube.getFaceOffset(face);
        for (let i = 0; i < 9; i++) {
            this.cube.state[offset + i] = colors[i];
        }
    }

    finishScan() {
        // Validasi
        const state = this.cube.getState();
        const result = CubeValidator.validate(state);
        
        if (!result.valid) {
            this.ui.showError('Hasil scan tidak valid. ' + result.errors.join(' '));
            // Tetap lanjut ke manual untuk koreksi
            this.goToManualWithScan();
            return;
        }

        // Lanjut ke solution
        this.ui.showSection('solution-section');
        document.getElementById('solution-info').classList.remove('hidden');
        
        if (this.cube3d) {
            this.cube3d.updateFromState(state);
        }
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
        
        // Tampilkan output
        document.getElementById('solution-info').classList.add('hidden');
        document.getElementById('solution-output').classList.remove('hidden');
        document.getElementById('solution-count').textContent = this.solution.length;
        document.getElementById('solution-algorithm').textContent = this.solution.join(' ');
        
        // Update step display
        this.ui.updateStepDisplay(0, this.solution.length, '-', 'Tekan "Mulai Menyelesaikan"');
        this.ui.updateHistory([]);
        
        // Update 3D
        if (this.cube3d) {
            this.cube3d.updateFromState(state);
        }
    }

    startSolving() {
        this.currentStep = 0;
        this.isPlaying = false;
        this.updateStepUI();
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
                this.playbackTimer = setTimeout(() => this.playNext(), 100);
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
        
        // Undo: lakukan inverse move
        this.currentStep--;
        const move = this.solution[this.currentStep];
        const inverse = this.getInverseMove(move);
        
        this.executeMove(inverse, () => {
            this.updateStepUI();
        });
    }

    restartSolution() {
        this.pause();
        this.currentStep = 0;
        this.cube.reset();
        // Re-apply initial state
        // (simplified: reset to solved)
        if (this.cube3d) {
            this.cube3d.updateFromState(this.cube.getState());
        }
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
        // Update state
        this.cube.move(move);
        
        // Animasikan 3D
        if (this.cube3d) {
            this.cube3d.animateMove(move, () => {
                // Update 3D state setelah animasi
                this.cube3d.updateFromState(this.cube.getState());
                if (onComplete) onComplete();
            });
        } else {
            if (onComplete) onComplete();
        }
        
        // Update history
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
            current, 
            total, 
            move, 
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
        
        const scramble = RubikSolver.generateScramble(20);
        this.scrambleMoves = scramble;
        
        document.getElementById('scramble-output').classList.remove('hidden');
        document.getElementById('scramble-text').textContent = scramble.join(' ');
        
        // Animasikan scramble
        if (this.cube3d) {
            this.cube3d.updateFromState(this.cube.getState());
        }
        
        // Apply moves satu per satu dengan animasi
        let idx = 0;
        const applyNext = () => {
            if (idx >= scramble.length) {
                // Update 3D dengan state akhir
                if (this.cube3d) {
                    this.cube3d.updateFromState(this.cube.getState());
                }
                return;
            }
            const move = scramble[idx];
            this.cube.move(move);
            if (this.cube3d) {
                this.cube3d.animateMove(move, () => {
                    idx++;
                    applyNext();
                });
            } else {
                idx++;
                applyNext();
            }
        };
        applyNext();
    }

    solveScramble() {
        // Solve the scrambled cube
        this.findSolution();
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

// Global reference untuk onclick handlers
window.app = app;