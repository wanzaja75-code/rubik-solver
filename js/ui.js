/**
 * ui.js - UI Controller dan event handling
 */

class UIController {
    constructor(app) {
        this.app = app;
        this.selectedColor = 'white';
        this.currentScanFace = 'F';
        this.scanFaces = ['F', 'R', 'B', 'L', 'U', 'D'];
        this.scanIndex = 0;
        this.scannedFaces = {};
        
        this.init();
    }

    init() {
        this.setupColorPicker();
        this.setupManualControls();
        this.setupScanControls();
        this.setupSolutionControls();
        this.setupPlaybackControls();
        this.setupMoveButtons();
        this.setupTheme();
    }

    // ========== COLOR PICKER ==========
    setupColorPicker() {
        const buttons = document.querySelectorAll('.color-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedColor = btn.getAttribute('data-color');
            });
        });
    }

    // ========== MANUAL CONTROLS ==========
    setupManualControls() {
        // Klik sticker
        document.querySelectorAll('.face .sticker').forEach(sticker => {
            sticker.addEventListener('click', (e) => {
                const face = e.target.closest('.face').getAttribute('data-face');
                const idx = parseInt(e.target.getAttribute('data-idx'));
                
                e.target.setAttribute('data-color', this.selectedColor);
                e.target.style.background = this.getColorHex(this.selectedColor);
                
                this.app.setStickerColor(face, idx, this.selectedColor);
            });
        });

        // Reset
        document.getElementById('btn-reset').addEventListener('click', () => {
            this.app.resetManualInput();
            this.updateManualFromState();
        });

        // Isi centers
        document.getElementById('btn-fill-centers').addEventListener('click', () => {
            this.app.fillCenters();
            this.updateManualFromState();
        });

        // Hapus semua
        document.getElementById('btn-clear').addEventListener('click', () => {
            this.app.clearAllStickers();
            this.updateManualFromState();
        });

        // Cek kubus
        document.getElementById('btn-check').addEventListener('click', () => {
            this.app.checkCube();
        });
    }

    updateManualFromState() {
        const state = this.app.cube.getState();
        const faces = ['U', 'R', 'F', 'D', 'L', 'B'];
        const offsets = { U: 0, R: 9, F: 18, D: 27, L: 36, B: 45 };
        
        faces.forEach(face => {
            const faceEl = document.getElementById(`face-${face}`);
            if (!faceEl) return;
            const offset = offsets[face];
            
            faceEl.querySelectorAll('.sticker').forEach((sticker, i) => {
                const color = state[offset + i];
                if (color) {
                    sticker.setAttribute('data-color', color);
                    sticker.style.background = this.getColorHex(color);
                } else {
                    sticker.removeAttribute('data-color');
                    sticker.style.background = '';
                }
            });
        });
    }

    getColorHex(color) {
        const hex = {
            'white': '#ffffff',
            'yellow': '#ffd500',
            'red': '#c41e3a',
            'orange': '#ff5800',
            'blue': '#0051ba',
            'green': '#009e60'
        };
        return hex[color] || '';
    }

    // ========== SCAN CONTROLS ==========
    setupScanControls() {
        document.getElementById('btn-open-camera').addEventListener('click', async () => {
            const scanner = this.app.scanner;
            const success = await scanner.initCamera();
            
            if (success) {
                document.getElementById('btn-open-camera').classList.add('hidden');
                document.getElementById('btn-capture').classList.remove('hidden');
            } else {
                this.showError('Kamera tidak dapat digunakan. Silakan gunakan input manual atau upload foto.');
            }
        });

        document.getElementById('btn-capture').addEventListener('click', () => {
            const colors = this.app.scanner.captureFrame();
            if (colors) {
                this.handleScanResult(colors);
            }
        });

        document.getElementById('file-upload').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const colors = await this.app.scanner.analyzeImageFromFile(file);
            this.handleScanResult(colors);
        });

        document.getElementById('btn-rescan').addEventListener('click', () => {
            document.getElementById('scan-result').classList.add('hidden');
            document.getElementById('btn-open-camera').classList.remove('hidden');
            document.getElementById('btn-capture').classList.add('hidden');
        });

        document.getElementById('btn-correct').addEventListener('click', () => {
            // Tampilkan grid koreksi manual
            this.app.goToManualWithScan();
        });

        document.getElementById('btn-use-result').addEventListener('click', () => {
            this.confirmScanResult();
        });
    }

    handleScanResult(colors) {
        // Simpan hasil sementara
        this.tempScanColors = colors;
        
        // Tampilkan preview
        this.app.scanner.renderPreview(colors, 'scan-face-preview');
        document.getElementById('scan-result').classList.remove('hidden');
    }

    confirmScanResult() {
        const face = this.scanFaces[this.scanIndex];
        
        // Simpan hasil scan ke state
        this.app.setScanResult(face, this.tempScanColors);
        this.scannedFaces[face] = this.tempScanColors;
        
        // Update progress
        this.scanIndex++;
        
        if (this.scanIndex >= 6) {
            // Semua sisi sudah di-scan
            this.app.finishScan();
        } else {
            // Lanjut ke sisi berikutnya
            this.updateScanProgress();
            document.getElementById('scan-result').classList.add('hidden');
            document.getElementById('btn-open-camera').classList.remove('hidden');
            document.getElementById('btn-capture').classList.add('hidden');
        }
    }

    updateScanProgress() {
        const faceNames = {
            'F': 'Depan',
            'R': 'Kanan',
            'B': 'Belakang',
            'L': 'Kiri',
            'U': 'Atas',
            'D': 'Bawah'
        };
        
        const text = document.getElementById('scan-step-text');
        text.textContent = `Langkah ${this.scanIndex + 1}/6: Foto sisi ${faceNames[this.scanFaces[this.scanIndex]]}`;
        
        // Update dots
        const dots = document.querySelectorAll('.step-dot');
        dots.forEach((dot, i) => {
            dot.classList.remove('active', 'done');
            if (i < this.scanIndex) dot.classList.add('done');
            if (i === this.scanIndex) dot.classList.add('active');
        });
    }

    // ========== SOLUTION CONTROLS ==========
    setupSolutionControls() {
        document.getElementById('btn-find-solution').addEventListener('click', () => {
            this.app.findSolution();
        });

        document.getElementById('btn-copy-solution').addEventListener('click', () => {
            const alg = document.getElementById('solution-algorithm').textContent;
            navigator.clipboard.writeText(alg).then(() => {
                const btn = document.getElementById('btn-copy-solution');
                btn.textContent = '✓ Tersalin!';
                setTimeout(() => {
                    btn.textContent = '📋 Salin Solusi';
                }, 2000);
            });
        });

        document.getElementById('btn-start-solve').addEventListener('click', () => {
            this.app.startSolving();
        });

        document.getElementById('btn-do-move').addEventListener('click', () => {
            this.app.doNextMove();
        });

        document.getElementById('btn-scramble').addEventListener('click', () => {
            this.app.scramble();
        });

        document.getElementById('btn-solve-scramble').addEventListener('click', () => {
            this.app.solveScramble();
        });
    }

    // ========== PLAYBACK CONTROLS ==========
    setupPlaybackControls() {
        document.getElementById('btn-play').addEventListener('click', () => {
            this.app.play();
            document.getElementById('btn-play').classList.add('hidden');
            document.getElementById('btn-pause').classList.remove('hidden');
        });

        document.getElementById('btn-pause').addEventListener('click', () => {
            this.app.pause();
            document.getElementById('btn-play').classList.remove('hidden');
            document.getElementById('btn-pause').classList.add('hidden');
        });

        document.getElementById('btn-prev').addEventListener('click', () => {
            this.app.previousStep();
        });

        document.getElementById('btn-next').addEventListener('click', () => {
            this.app.nextStep();
        });

        document.getElementById('btn-restart').addEventListener('click', () => {
            this.app.restartSolution();
        });

        document.getElementById('speed-slider').addEventListener('input', (e) => {
            this.app.setSpeed(parseInt(e.target.value));
        });
    }

    // ========== MOVE BUTTONS ==========
    setupMoveButtons() {
        document.querySelectorAll('.btn-move').forEach(btn => {
            btn.addEventListener('click', () => {
                const move = btn.getAttribute('data-move');
                this.app.executeManualMove(move);
            });
        });
    }

    // ========== THEME ==========
    setupTheme() {
        const toggle = document.getElementById('theme-toggle');
        const saved = localStorage.getItem('rubik-theme');
        
        if (saved === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            toggle.textContent = '☀️';
        }
        
        toggle.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            if (current === 'dark') {
                document.documentElement.removeAttribute('data-theme');
                toggle.textContent = '🌙';
                localStorage.setItem('rubik-theme', 'light');
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                toggle.textContent = '☀️';
                localStorage.setItem('rubik-theme', 'dark');
            }
        });
    }

    // ========== UTILITY ==========
    showError(msg) {
        const el = document.getElementById('manual-error');
        if (el) {
            el.textContent = msg;
            el.classList.remove('hidden');
            setTimeout(() => el.classList.add('hidden'), 5000);
        } else {
            alert(msg);
        }
    }

    showSection(id) {
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.getElementById(id).classList.add('active');
    }

    updateStepDisplay(current, total, move, description) {
        document.getElementById('step-current').textContent = current;
        document.getElementById('step-total').textContent = total;
        document.getElementById('step-move').textContent = move || '-';
        document.getElementById('step-description').textContent = description || '-';
    }

    updateHistory(history) {
        const el = document.getElementById('move-history');
        if (!el) return;
        el.innerHTML = history.map((m, i) => 
            `<span class="${i === history.length - 1 ? 'current' : ''}">${m}</span>`
        ).join('');
    }

    showCompletionModal() {
        document.getElementById('completion-modal').classList.remove('hidden');
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIController;
}