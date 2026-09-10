/**
 * solver.js - Solver Rubik 3x3 berbasis Layer-by-Layer
 * 100% offline, tidak butuh library eksternal
 */

class RubikSolver {
    constructor() {}

    solve(state, centers) {
        const validation = CubeValidator.validate(state);
        if (!validation.valid) {
            return { success: false, moves: [], error: validation.errors.join(' ') };
        }

        if (this.isSolved(state)) {
            return { success: true, moves: [], error: null };
        }

        try {
            const cube = new Cube();
            cube.setState(state);
            const solution = this.solveLayerByLayer(cube);
            
            if (!solution.success) {
                return { success: false, moves: [], error: solution.error };
            }

            // Verifikasi
            const verify = new Cube();
            verify.setState(state);
            verify.applyMoves(solution.moves);
            
            if (!verify.isSolved()) {
                return { 
                    success: false, 
                    moves: [], 
                    error: 'Solusi tidak valid. Periksa input warna.' 
                };
            }

            return { success: true, moves: solution.moves, error: null };
        } catch (e) {
            console.error('Solver error:', e);
            return { success: false, moves: [], error: 'Error solver: ' + e.message };
        }
    }

    solveLayerByLayer(cube) {
        const allMoves = [];
        const applyMove = (m) => { cube.move(m); allMoves.push(m); };
        const applySeq = (s) => { for (const m of s) applyMove(m); };

        try {
            // STEP 1: WHITE CROSS
            this.solveWhiteCross(cube, applyMove, applySeq);
            
            // STEP 2: WHITE CORNERS
            this.solveWhiteCorners(cube, applyMove, applySeq);
            
            // STEP 3: MIDDLE LAYER
            this.solveMiddleLayer(cube, applyMove, applySeq);
            
            // STEP 4: YELLOW CROSS
            this.solveYellowCross(cube, applyMove, applySeq);
            
            // STEP 5: YELLOW EDGES
            this.solveYellowEdges(cube, applyMove, applySeq);
            
            // STEP 6: YELLOW CORNERS PERMUTE
            this.solveYellowCornersPermute(cube, applyMove, applySeq);
            
            // STEP 7: YELLOW CORNERS ORIENT
            this.solveYellowCornersOrient(cube, applyMove, applySeq);

            return { success: true, moves: this.simplifyMoves(allMoves) };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    simplifyMoves(moves) {
        if (!moves || moves.length === 0) return [];

        const moveToNum = (m) => {
            if (m.endsWith("'")) return 3;
            if (m.endsWith('2')) return 2;
            return 1;
        };

        const numToMove = (face, n) => {
            n = ((n - 1) % 4 + 4) % 4 + 1;
            if (n === 1) return face;
            if (n === 2) return face + '2';
            if (n === 3) return face + "'";
            return face;
        };

        const stack = [];
        for (const move of moves) {
            const face = move[0];
            const num = moveToNum(move);
            if (stack.length > 0 && stack[stack.length - 1].face === face) {
                stack[stack.length - 1].num += num;
            } else {
                stack.push({ face, num });
            }
        }

        const result = [];
        for (const item of stack) {
            if (item.num % 4 === 0) continue;
            result.push(numToMove(item.face, item.num));
        }
        return result;
    }

    // ============================================================
    // STEP 1: WHITE CROSS
    // ============================================================
    
    solveWhiteCross(cube, push, pushSeq) {
        let safety = 0;
        while (!this.isWhiteCrossSolved(cube) && safety < 100) {
            safety++;
            
            // Edge putih di U, posisi salah
            for (const uIdx of [1, 3, 5, 7]) {
                if (cube.getSticker('U', uIdx) === 'white' && !this.isWhiteEdgeCorrect(cube, uIdx)) {
                    const setup = { 1: ['B2'], 3: ['L2'], 5: ['R2'], 7: ['F2'] }[uIdx];
                    pushSeq(setup);
                    break;
                }
            }
            
            // Edge putih di D — naikkan
            for (const dIdx of [1, 3, 5, 7]) {
                if (cube.getSticker('D', dIdx) === 'white') {
                    const faceMap = { 1: 'B', 3: 'L', 5: 'R', 7: 'F' };
                    const face = faceMap[dIdx];
                    if (face) {
                        // Putar D supaya edge di F (D pos 7), lalu F2
                        const dRot = { 1: ['D2'], 3: ["D'"], 5: ['D'], 7: [] }[dIdx];
                        pushSeq(dRot);
                        pushSeq(['F', 'F']);
                        break;
                    }
                }
            }
            
            // Edge putih di middle layer
            let middleFound = false;
            for (const face of ['F', 'R', 'B', 'L']) {
                for (const idx of [3, 5]) {
                    if (cube.getSticker(face, idx) === 'white') {
                        const setup = {
                            'F': { 3: ["L'"], 5: ['R'] },
                            'R': { 3: ["F'"], 5: ['B'] },
                            'B': { 3: ["R'"], 5: ['L'] },
                            'L': { 3: ["B'"], 5: ['F'] }
                        }[face][idx];
                        pushSeq(setup);
                        middleFound = true;
                        break;
                    }
                }
                if (middleFound) break;
            }
            
            if (middleFound) continue;
            
            // Kalau tidak ada yang bisa dilakukan, putar U
            if (!this.isWhiteCrossSolved(cube)) push('U');
        }
    }

    isWhiteCrossSolved(cube) {
        if (cube.getSticker('U', 1) !== 'white' || cube.getSticker('U', 3) !== 'white' ||
            cube.getSticker('U', 5) !== 'white' || cube.getSticker('U', 7) !== 'white') return false;
        return cube.getSticker('B', 1) === cube.getSticker('B', 4) &&
               cube.getSticker('L', 1) === cube.getSticker('L', 4) &&
               cube.getSticker('F', 1) === cube.getSticker('F', 4) &&
               cube.getSticker('R', 1) === cube.getSticker('R', 4);
    }

    isWhiteEdgeCorrect(cube, uIdx) {
        const sideFace = { 1: 'B', 3: 'L', 5: 'R', 7: 'F' }[uIdx];
        return cube.getSticker(sideFace, 1) === cube.getSticker(sideFace, 4);
    }

    // ============================================================
    // STEP 2: WHITE CORNERS
    // ============================================================
    
    solveWhiteCorners(cube, push, pushSeq) {
        let safety = 0;
        while (!this.isWhiteCornersSolved(cube) && safety < 100) {
            safety++;
            let moved = false;

            // Cek corner di U yang belum benar
            for (const pos of [0, 2, 6, 8]) {
                if (cube.getSticker('U', pos) === 'white' && !this.isWhiteCornerCorrect(cube, pos)) {
                    // Keluarkan corner dari U
                    const setup = { 0: ["L'", "U'", 'L'], 2: ['R', 'U', "R'"], 6: ["B'", "U'", 'B'], 8: ['R', "U'", "R'"] }[pos];
                    pushSeq(setup);
                    moved = true;
                    break;
                }
            }
            if (moved) continue;

            // Cari corner putih di D
            for (const dPos of [0, 2, 6, 8]) {
                const faces = {
                    0: [['L', 8], ['F', 6]],
                    2: [['R', 6], ['F', 8]],
                    6: [['L', 6], ['B', 8]],
                    8: [['R', 8], ['B', 6]]
                }[dPos];
                const hasWhite = faces.some(([f, i]) => cube.getSticker(f, i) === 'white');
                
                if (hasWhite) {
                    // Putar D supaya corner di D pos 8 (F-R)
                    const dRot = { 0: ['D'], 2: ['D2'], 6: ["D'"], 8: [] }[dPos];
                    pushSeq(dRot);
                    
                    // Algoritma R U R' U' sampai masuk (max 5x)
                    for (let k = 0; k < 6; k++) {
                        pushSeq(['R', 'U', "R'", "U'"]);
                        if (this.isWhiteCornerCorrect(cube, 8)) break;
                    }
                    moved = true;
                    break;
                }
            }
            if (moved) continue;

            push('U');
        }
    }

    isWhiteCornersSolved(cube) {
        for (const pos of [0, 2, 6, 8]) {
            if (!this.isWhiteCornerCorrect(cube, pos)) return false;
        }
        return true;
    }

    isWhiteCornerCorrect(cube, pos) {
        if (cube.getSticker('U', pos) !== 'white') return false;
        const faces = {
            0: [['L', 2], ['B', 0]],
            2: [['R', 0], ['F', 2]],
            6: [['B', 2], ['L', 0]],
            8: [['R', 2], ['F', 0]]
        }[pos];
        if (!faces) return false;
        return faces.every(([f, i]) => cube.getSticker(f, i) === cube.getSticker(f, 4));
    }

    // ============================================================
    // STEP 3: MIDDLE LAYER
    // ============================================================
    
    solveMiddleLayer(cube, push, pushSeq) {
        let safety = 0;
        while (!this.isMiddleLayerSolved(cube) && safety < 100) {
            safety++;
            let moved = false;

            // Cari edge di U tanpa kuning
            for (const uIdx of [1, 3, 5, 7]) {
                const topColor = cube.getSticker('U', uIdx);
                const sideFace = { 1: 'B', 3: 'L', 5: 'R', 7: 'F' }[uIdx];
                const sideColor = cube.getSticker(sideFace, 1);
                
                if (topColor === 'yellow' || sideColor === 'yellow') continue;

                // Kalau sideColor cocok dengan center, kita bisa masukkan
                if (sideColor === cube.getSticker(sideFace, 4)) {
                    const targetFace = this.findFaceByCenter(cube, topColor);
                    if (targetFace) {
                        const isRight = this.isRightOf(sideFace, targetFace);
                        if (isRight) {
                            pushSeq(['U', 'R', "U'", "R'", "U'", "F'", 'U', 'F']);
                        } else {
                            pushSeq(["U'", "L'", 'U', 'L', 'U', 'F', "U'", "F'"]);
                        }
                    }
                    moved = true;
                    break;
                } else {
                    push('U');
                    moved = true;
                    break;
                }
            }
            if (moved) continue;

            // Tidak ada edge di U, ambil dari middle layer
            for (const face of ['F', 'R', 'B', 'L']) {
                for (const idx of [3, 5]) {
                    const c = cube.getSticker(face, idx);
                    if (c !== 'yellow' && c !== 'white') {
                        if (idx === 3) {
                            pushSeq(["U'", "L'", 'U', 'L', 'U', 'F', "U'", "F'"]);
                        } else {
                            pushSeq(['U', 'R', "U'", "R'", "U'", "F'", 'U', 'F']);
                        }
                        moved = true;
                        break;
                    }
                }
                if (moved) break;
            }
            if (moved) continue;

            push('U');
        }
    }

    isMiddleLayerSolved(cube) {
        for (const face of ['F', 'R', 'B', 'L']) {
            const center = cube.getSticker(face, 4);
            if (cube.getSticker(face, 3) !== center) return false;
            if (cube.getSticker(face, 5) !== center) return false;
        }
        return true;
    }

    findFaceByCenter(cube, color) {
        for (const face of ['F', 'R', 'B', 'L']) {
            if (cube.getSticker(face, 4) === color) return face;
        }
        return null;
    }

    isRightOf(a, b) {
        const order = ['F', 'R', 'B', 'L'];
        const ia = order.indexOf(a);
        const ib = order.indexOf(b);
        return (ib - ia + 4) % 4 === 1;
    }

    // ============================================================
    // STEP 4: YELLOW CROSS
    // ============================================================
    
    solveYellowCross(cube, push, pushSeq) {
        let safety = 0;
        while (!this.isYellowCrossSolved(cube) && safety < 20) {
            safety++;
            const count = this.countYellowEdgesOnU(cube);
            
            if (count === 0) {
                pushSeq(['F', 'R', 'U', "R'", "U'", "F'"]);
            } else if (count === 2) {
                if (this.isYellowLine(cube)) {
                    // Line horizontal
                    if (cube.getSticker('U', 3) === 'yellow' && cube.getSticker('U', 5) === 'yellow') {
                        pushSeq(['F', 'R', 'U', "R'", "U'", "F'"]);
                    } else {
                        push('U');
                    }
                } else {
                    // L-shape: putar sampai di back-left
                    let rot = 0;
                    while (!(cube.getSticker('U', 1) === 'yellow' && cube.getSticker('U', 3) === 'yellow') && rot < 4) {
                        push('U');
                        rot++;
                    }
                    pushSeq(['F', 'R', 'U', "R'", "U'", "F'"]);
                }
            } else {
                push('U');
            }
        }
    }

    isYellowCrossSolved(cube) {
        return cube.getSticker('U', 1) === 'yellow' &&
               cube.getSticker('U', 3) === 'yellow' &&
               cube.getSticker('U', 5) === 'yellow' &&
               cube.getSticker('U', 7) === 'yellow';
    }

    countYellowEdgesOnU(cube) {
        let c = 0;
        for (const i of [1, 3, 5, 7]) if (cube.getSticker('U', i) === 'yellow') c++;
        return c;
    }

    isYellowLine(cube) {
        if (cube.getSticker('U', 3) === 'yellow' && cube.getSticker('U', 5) === 'yellow') return true;
        if (cube.getSticker('U', 1) === 'yellow' && cube.getSticker('U', 7) === 'yellow') return true;
        return false;
    }

    // ============================================================
    // STEP 5: YELLOW EDGES PERMUTE
    // ============================================================
    
    solveYellowEdges(cube, push, pushSeq) {
        let safety = 0;
        while (!this.isYellowEdgesSolved(cube) && safety < 20) {
            safety++;
            const solved = this.countSolvedYellowEdges(cube);
            
            if (solved === 4) break;
            
            if (solved === 1) {
                // Putar U supaya edge benar di back (U pos 1)
                let rot = 0;
                while (cube.getSticker('B', 1) !== cube.getSticker('B', 4) && rot < 4) {
                    push('U');
                    rot++;
                }
                pushSeq(['R', 'U', "R'", 'U', 'R', 'U2', "R'", 'U']);
            } else {
                pushSeq(['R', 'U', "R'", 'U', 'R', 'U2', "R'", 'U']);
            }
        }
    }

    isYellowEdgesSolved(cube) {
        const map = { 1: 'B', 3: 'L', 5: 'R', 7: 'F' };
        for (const [uIdx, face] of Object.entries(map)) {
            if (cube.getSticker(face, 1) !== cube.getSticker(face, 4)) return false;
        }
        return true;
    }

    countSolvedYellowEdges(cube) {
        const map = { 1: 'B', 3: 'L', 5: 'R', 7: 'F' };
        let c = 0;
        for (const [uIdx, face] of Object.entries(map)) {
            if (cube.getSticker(face, 1) === cube.getSticker(face, 4)) c++;
        }
        return c;
    }

    // ============================================================
    // STEP 6: YELLOW CORNERS PERMUTE
    // ============================================================
    
    solveYellowCornersPermute(cube, push, pushSeq) {
        let safety = 0;
        while (!this.areYellowCornersPermuted(cube) && safety < 20) {
            safety++;
            
            const solvedCorner = this.findSolvedYellowCornerIdx(cube);
            
            if (solvedCorner !== -1) {
                // Putar U supaya corner yang benar di U pos 8
                let rot = 0;
                while (this.findSolvedYellowCornerIdx(cube) !== 8 && rot < 4) {
                    push('U');
                    rot++;
                }
                pushSeq(['U', 'R', "U'", "L'", 'U', "R'", "U'", 'L']);
            } else {
                pushSeq(['U', 'R', "U'", "L'", 'U', "R'", "U'", 'L']);
            }
        }
    }

    areYellowCornersPermuted(cube) {
        for (const pos of [0, 2, 6, 8]) {
            if (!this.isYellowCornerPermutedAt(cube, pos)) return false;
        }
        return true;
    }

    findSolvedYellowCornerIdx(cube) {
        for (const pos of [0, 2, 6, 8]) {
            if (this.isYellowCornerPermutedAt(cube, pos)) return pos;
        }
        return -1;
    }

    isYellowCornerPermutedAt(cube, pos) {
        const corners = {
            0: [['B', 0], ['L', 2]],
            2: [['F', 2], ['R', 0]],
            6: [['B', 2], ['L', 0]],
            8: [['F', 0], ['R', 2]]
        }[pos];
        if (!corners) return false;
        
        for (const [face, i] of corners) {
            const color = cube.getSticker(face, i);
            const centerColor = cube.getSticker(face, 4);
            if (color !== centerColor && color !== 'yellow') return false;
        }
        return true;
    }

    // ============================================================
    // STEP 7: YELLOW CORNERS ORIENT
    // ============================================================
    
    solveYellowCornersOrient(cube, push, pushSeq) {
        let safety = 0;
        while (!cube.isSolved() && safety < 20) {
            safety++;
            
            // Cari corner kuning yang belum di atas
            let unsolvedPos = -1;
            for (const pos of [0, 2, 6, 8]) {
                if (cube.getSticker('U', pos) !== 'yellow') {
                    unsolvedPos = pos;
                    break;
                }
            }
            
            if (unsolvedPos === -1) {
                // Semua kuning di atas, putar U untuk align
                if (!cube.isSolved()) push('U');
                continue;
            }
            
            // Putar U supaya corner unsolved di U pos 8
            let rot = 0;
            while (cube.getSticker('U', 8) === 'yellow' && rot < 4) {
                push('U');
                rot++;
            }
            
            // R' D' R D sampai kuning di atas
            for (let k = 0; k < 8; k++) {
                pushSeq(["R'", "D'", 'R', 'D']);
                if (cube.getSticker('U', 8) === 'yellow') break;
            }
        }
        
        // Align U
        for (let i = 0; i < 4; i++) {
            if (cube.isSolved()) break;
            push('U');
        }
    }

    // ============================================================
    // UTIL
    // ============================================================
    
    isSolved(state) {
        const faces = [[0, 8], [9, 17], [18, 26], [27, 35], [36, 44], [45, 53]];
        for (const [start, end] of faces) {
            const center = state[start + 4];
            for (let i = start; i <= end; i++) {
                if (state[i] !== center) return false;
            }
        }
        return true;
    }

    static generateScramble(length = 20) {
        const moves = ['U', 'D', 'R', 'L', 'F', 'B'];
        const suffixes = ['', "'", '2'];
        const scramble = [];
        let lastFace = '';
        
        for (let i = 0; i < length; i++) {
            let face;
            do {
                face = moves[Math.floor(Math.random() * moves.length)];
            } while (face === lastFace);
            
            const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
            scramble.push(face + suffix);
            lastFace = face;
        }
        return scramble;
    }
}

if (typeof module !== 'undefined' && module.exports) module.exports = RubikSolver;
