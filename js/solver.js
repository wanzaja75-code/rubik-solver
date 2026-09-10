/**
 * solver.js - Solver Rubik 3x3
 * Prioritas: reverse scramble > cubejs > fallback
 */

class RubikSolver {
    constructor() {
        this.lastScramble = null;
    }

    setLastScramble(moves) {
        this.lastScramble = [...moves];
    }

    solve(state, centers) {
        const validation = CubeValidator.validate(state);
        if (!validation.valid) {
            return {
                success: false,
                moves: [],
                error: validation.errors.join(' ')
            };
        }

        if (this.isSolved(state)) {
            return { success: true, moves: [], error: null };
        }

        // Prioritas 1: reverse scramble
        if (this.lastScramble && this.stateMatchesScramble(state)) {
            const solution = this.reverseScramble(this.lastScramble);
            return { success: true, moves: solution, error: null };
        }

        // Prioritas 2: cubejs
        if (typeof Cube !== 'undefined' && Cube.initSolver) {
            try {
                return this.solveWithCubeJS(state, centers);
            } catch (e) {
                console.warn('CubeJS gagal:', e);
            }
        }

        // Prioritas 3: fallback
        return this.solveWithOwnAlgorithm(state, centers);
    }

    stateMatchesScramble(state) {
        if (!this.lastScramble) return false;
        const testCube = new Cube();
        testCube.reset();
        testCube.applyMoves(this.lastScramble);
        const testState = testCube.getState();
        
        for (let i = 0; i < 54; i++) {
            if (testState[i] !== state[i]) return false;
        }
        return true;
    }

    reverseScramble(scramble) {
        const solution = [];
        for (let i = scramble.length - 1; i >= 0; i--) {
            solution.push(this.getInverseMove(scramble[i]));
        }
        return this.simplifyMoves(solution);
    }

    getInverseMove(move) {
        if (move.endsWith("'")) return move[0];
        if (move.endsWith('2')) return move;
        return move + "'";
    }

    simplifyMoves(moves) {
        if (moves.length === 0) return moves;

        const moveToNum = (m) => {
            if (m.endsWith("'")) return 3;
            if (m.endsWith('2')) return 2;
            return 1;
        };

        const numToMove = (face, num) => {
            const n = ((num - 1) % 4 + 4) % 4 + 1;
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

    solveWithCubeJS(state, centers) {
        const colorMap = this.buildColorMap(centers);
        const faceletStr = state.map(c => colorMap[c]).join('');
        
        const cube = Cube.fromString(faceletStr);
        const solution = cube.solve();
        
        if (!solution || solution === '') {
            throw new Error('CubeJS tidak menemukan solusi');
        }

        return { success: true, moves: this.parseSolution(solution), error: null };
    }

    buildColorMap(centers) {
        const map = {};
        map[centers.U] = '0';
        map[centers.R] = '1';
        map[centers.F] = '2';
        map[centers.D] = '3';
        map[centers.L] = '4';
        map[centers.B] = '5';
        return map;
    }

    parseSolution(solution) {
        if (!solution || solution === '') return [];
        return solution.trim().split(/\s+/).map(t => {
            const m = t.match(/^([UDLRFB])([2']?)$/);
            if (m) return m[1] + (m[2] || '');
            return t;
        }).filter(t => t);
    }

    solveWithOwnAlgorithm(state, centers) {
        const cube = new Cube();
        cube.setState(state);
        
        const moves = ['U', "U'", 'U2', 'D', "D'", 'D2', 'R', "R'", 'R2', 
                       'L', "L'", 'L2', 'F', "F'", 'F2', 'B', "B'", 'B2'];
        
        for (let depth = 1; depth <= 5; depth++) {
            const result = this.searchDepth(cube, moves, [], depth);
            if (result) return { success: true, moves: result, error: null };
        }

        return {
            success: false,
            moves: [],
            error: 'Posisi Rubik terlalu jauh dari solved. Pastikan koneksi internet untuk CubeJS.'
        };
    }

    searchDepth(cube, moves, path, maxDepth) {
        if (path.length === maxDepth) {
            const test = cube.clone();
            test.applyMoves(path);
            if (test.isSolved()) return [...path];
            return null;
        }

        for (const move of moves) {
            if (path.length > 0 && path[path.length - 1][0] === move[0]) continue;
            path.push(move);
            const result = this.searchDepth(cube, moves, path, maxDepth);
            if (result) return result;
            path.pop();
        }
        return null;
    }

    isSolved(state) {
        const faces = [
            [0, 8], [9, 17], [18, 26],
            [27, 35], [36, 44], [45, 53]
        ];
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
