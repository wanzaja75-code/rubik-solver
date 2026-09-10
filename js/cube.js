/**
 * cube.js - Representasi state Rubik 3x3
 * Urutan face: U(0-8), R(9-17), F(18-26), D(27-35), L(36-44), B(45-53)
 */

class Cube {
    constructor() {
        this.reset();
    }

    reset() {
        this.state = [
            'white','white','white','white','white','white','white','white','white',
            'red','red','red','red','red','red','red','red','red',
            'green','green','green','green','green','green','green','green','green',
            'yellow','yellow','yellow','yellow','yellow','yellow','yellow','yellow','yellow',
            'orange','orange','orange','orange','orange','orange','orange','orange','orange',
            'blue','blue','blue','blue','blue','blue','blue','blue','blue'
        ];
        this.history = [];
        return this;
    }

    setState(colors) {
        if (colors.length !== 54) throw new Error('State harus memiliki 54 sticker');
        this.state = [...colors];
        return this;
    }

    getState() { return [...this.state]; }

    getSticker(face, idx) {
        return this.state[this.getFaceOffset(face) + idx];
    }

    setSticker(face, idx, color) {
        this.state[this.getFaceOffset(face) + idx] = color;
        return this;
    }

    getFaceOffset(face) {
        const offsets = { U: 0, R: 9, F: 18, D: 27, L: 36, B: 45 };
        return offsets[face];
    }

    getCenters() {
        return {
            U: this.state[4], R: this.state[13], F: this.state[22],
            D: this.state[31], L: this.state[40], B: this.state[49]
        };
    }

    isSolved() {
        const faces = ['U', 'R', 'F', 'D', 'L', 'B'];
        for (const face of faces) {
            const offset = this.getFaceOffset(face);
            const centerColor = this.state[offset + 4];
            for (let i = 0; i < 9; i++) {
                if (this.state[offset + i] !== centerColor) return false;
            }
        }
        return true;
    }

    clone() {
        const c = new Cube();
        c.state = [...this.state];
        c.history = [...this.history];
        return c;
    }

    move(move) {
        const moveMap = {
            'U': () => this.rotateU(1), "U'": () => this.rotateU(-1),
            'U2': () => { this.rotateU(1); this.rotateU(1); },
            'D': () => this.rotateD(1), "D'": () => this.rotateD(-1),
            'D2': () => { this.rotateD(1); this.rotateD(1); },
            'R': () => this.rotateR(1), "R'": () => this.rotateR(-1),
            'R2': () => { this.rotateR(1); this.rotateR(1); },
            'L': () => this.rotateL(1), "L'": () => this.rotateL(-1),
            'L2': () => { this.rotateL(1); this.rotateL(1); },
            'F': () => this.rotateF(1), "F'": () => this.rotateF(-1),
            'F2': () => { this.rotateF(1); this.rotateF(1); },
            'B': () => this.rotateB(1), "B'": () => this.rotateB(-1),
            'B2': () => { this.rotateB(1); this.rotateB(1); }
        };
        if (!moveMap[move]) throw new Error(`Gerakan tidak dikenal: ${move}`);
        moveMap[move]();
        this.history.push(move);
        return this;
    }

    applyMoves(moves) {
        for (const move of moves) this.move(move);
        return this;
    }

    rotateFaceCW(face) {
        const o = this.getFaceOffset(face);
        const s = this.state;
        const t = [
            s[o],s[o+1],s[o+2],
            s[o+3],s[o+4],s[o+5],
            s[o+6],s[o+7],s[o+8]
        ];
        s[o] = t[6]; s[o+1] = t[3]; s[o+2] = t[0];
        s[o+3] = t[7]; s[o+4] = t[4]; s[o+5] = t[1];
        s[o+6] = t[8]; s[o+7] = t[5]; s[o+8] = t[2];
    }

    rotateFaceCCW(face) {
        const o = this.getFaceOffset(face);
        const s = this.state;
        const t = [
            s[o],s[o+1],s[o+2],
            s[o+3],s[o+4],s[o+5],
            s[o+6],s[o+7],s[o+8]
        ];
        s[o] = t[2]; s[o+1] = t[5]; s[o+2] = t[8];
        s[o+3] = t[1]; s[o+4] = t[4]; s[o+5] = t[7];
        s[o+6] = t[0]; s[o+7] = t[3]; s[o+8] = t[6];
    }

    rotateU(dir) {
        if (dir === 1) {
            this.rotateFaceCW('U');
            const t = [
                this.state[18], this.state[19], this.state[20],
                this.state[9], this.state[10], this.state[11],
                this.state[45], this.state[46], this.state[47],
                this.state[36], this.state[37], this.state[38]
            ];
            this.state[18]=t[9]; this.state[19]=t[10]; this.state[20]=t[11];
            this.state[9]=t[0]; this.state[10]=t[1]; this.state[11]=t[2];
            this.state[45]=t[3]; this.state[46]=t[4]; this.state[47]=t[5];
            this.state[36]=t[6]; this.state[37]=t[7]; this.state[38]=t[8];
        } else {
            this.rotateFaceCCW('U');
            const t = [
                this.state[18], this.state[19], this.state[20],
                this.state[9], this.state[10], this.state[11],
                this.state[45], this.state[46], this.state[47],
                this.state[36], this.state[37], this.state[38]
            ];
            this.state[18]=t[3]; this.state[19]=t[4]; this.state[20]=t[5];
            this.state[9]=t[6]; this.state[10]=t[7]; this.state[11]=t[8];
            this.state[45]=t[9]; this.state[46]=t[10]; this.state[47]=t[11];
            this.state[36]=t[0]; this.state[37]=t[1]; this.state[38]=t[2];
        }
    }

    rotateD(dir) {
        if (dir === 1) {
            this.rotateFaceCW('D');
            const t = [
                this.state[24], this.state[25], this.state[26],
                this.state[15], this.state[16], this.state[17],
                this.state[51], this.state[52], this.state[53],
                this.state[42], this.state[43], this.state[44]
            ];
            this.state[24]=t[3]; this.state[25]=t[4]; this.state[26]=t[5];
            this.state[15]=t[6]; this.state[16]=t[7]; this.state[17]=t[8];
            this.state[51]=t[9]; this.state[52]=t[10]; this.state[53]=t[11];
            this.state[42]=t[0]; this.state[43]=t[1]; this.state[44]=t[2];
        } else {
            this.rotateFaceCCW('D');
            const t = [
                this.state[24], this.state[25], this.state[26],
                this.state[15], this.state[16], this.state[17],
                this.state[51], this.state[52], this.state[53],
                this.state[42], this.state[43], this.state[44]
            ];
            this.state[24]=t[9]; this.state[25]=t[10]; this.state[26]=t[11];
            this.state[15]=t[0]; this.state[16]=t[1]; this.state[17]=t[2];
            this.state[51]=t[3]; this.state[52]=t[4]; this.state[53]=t[5];
            this.state[42]=t[6]; this.state[43]=t[7]; this.state[44]=t[8];
        }
    }

    rotateR(dir) {
        if (dir === 1) {
            this.rotateFaceCW('R');
            const t = [
                this.state[2], this.state[5], this.state[8],
                this.state[20], this.state[23], this.state[26],
                this.state[29], this.state[32], this.state[35],
                this.state[47], this.state[50], this.state[53]
            ];
            this.state[2]=t[9]; this.state[5]=t[10]; this.state[8]=t[11];
            this.state[20]=t[0]; this.state[23]=t[1]; this.state[26]=t[2];
            this.state[29]=t[3]; this.state[32]=t[4]; this.state[35]=t[5];
            this.state[47]=t[6]; this.state[50]=t[7]; this.state[53]=t[8];
        } else {
            this.rotateFaceCCW('R');
            const t = [
                this.state[2], this.state[5], this.state[8],
                this.state[20], this.state[23], this.state[26],
                this.state[29], this.state[32], this.state[35],
                this.state[47], this.state[50], this.state[53]
            ];
            this.state[2]=t[3]; this.state[5]=t[4]; this.state[8]=t[5];
            this.state[20]=t[6]; this.state[23]=t[7]; this.state[26]=t[8];
            this.state[29]=t[9]; this.state[32]=t[10]; this.state[35]=t[11];
            this.state[47]=t[0]; this.state[50]=t[1]; this.state[53]=t[2];
        }
    }

    rotateL(dir) {
        if (dir === 1) {
            this.rotateFaceCW('L');
            const t = [
                this.state[0], this.state[3], this.state[6],
                this.state[18], this.state[21], this.state[24],
                this.state[27], this.state[30], this.state[33],
                this.state[45], this.state[48], this.state[51]
            ];
            this.state[0]=t[3]; this.state[3]=t[4]; this.state[6]=t[5];
            this.state[18]=t[6]; this.state[21]=t[7]; this.state[24]=t[8];
            this.state[27]=t[9]; this.state[30]=t[10]; this.state[33]=t[11];
            this.state[45]=t[0]; this.state[48]=t[1]; this.state[51]=t[2];
        } else {
            this.rotateFaceCCW('L');
            const t = [
                this.state[0], this.state[3], this.state[6],
                this.state[18], this.state[21], this.state[24],
                this.state[27], this.state[30], this.state[33],
                this.state[45], this.state[48], this.state[51]
            ];
            this.state[0]=t[9]; this.state[3]=t[10]; this.state[6]=t[11];
            this.state[18]=t[0]; this.state[21]=t[1]; this.state[24]=t[2];
            this.state[27]=t[3]; this.state[30]=t[4]; this.state[33]=t[5];
            this.state[45]=t[6]; this.state[48]=t[7]; this.state[51]=t[8];
        }
    }

    rotateF(dir) {
        if (dir === 1) {
            this.rotateFaceCW('F');
            const t = [
                this.state[6], this.state[7], this.state[8],
                this.state[9], this.state[12], this.state[15],
                this.state[27], this.state[28], this.state[29],
                this.state[38], this.state[41], this.state[44]
            ];
            this.state[6]=t[9]; this.state[7]=t[10]; this.state[8]=t[11];
            this.state[9]=t[0]; this.state[12]=t[1]; this.state[15]=t[2];
            this.state[27]=t[3]; this.state[28]=t[4]; this.state[29]=t[5];
            this.state[38]=t[6]; this.state[41]=t[7]; this.state[44]=t[8];
        } else {
            this.rotateFaceCCW('F');
            const t = [
                this.state[6], this.state[7], this.state[8],
                this.state[9], this.state[12], this.state[15],
                this.state[27], this.state[28], this.state[29],
                this.state[38], this.state[41], this.state[44]
            ];
            this.state[6]=t[3]; this.state[7]=t[4]; this.state[8]=t[5];
            this.state[9]=t[6]; this.state[12]=t[7]; this.state[15]=t[8];
            this.state[27]=t[9]; this.state[28]=t[10]; this.state[29]=t[11];
            this.state[38]=t[0]; this.state[41]=t[1]; this.state[44]=t[2];
        }
    }

    rotateB(dir) {
        if (dir === 1) {
            this.rotateFaceCW('B');
            const t = [
                this.state[0], this.state[1], this.state[2],
                this.state[11], this.state[14], this.state[17],
                this.state[33], this.state[34], this.state[35],
                this.state[36], this.state[39], this.state[42]
            ];
            this.state[0]=t[6]; this.state[1]=t[7]; this.state[2]=t[8];
            this.state[11]=t[3]; this.state[14]=t[4]; this.state[17]=t[5];
            this.state[33]=t[9]; this.state[34]=t[10]; this.state[35]=t[11];
            this.state[36]=t[0]; this.state[39]=t[1]; this.state[42]=t[2];
        } else {
            this.rotateFaceCCW('B');
            const t = [
                this.state[0], this.state[1], this.state[2],
                this.state[11], this.state[14], this.state[17],
                this.state[33], this.state[34], this.state[35],
                this.state[36], this.state[39], this.state[42]
            ];
            this.state[0]=t[9]; this.state[1]=t[10]; this.state[2]=t[11];
            this.state[11]=t[0]; this.state[14]=t[1]; this.state[17]=t[2];
            this.state[33]=t[3]; this.state[34]=t[4]; this.state[35]=t[5];
            this.state[36]=t[6]; this.state[39]=t[7]; this.state[42]=t[8];
        }
    }
}

if (typeof module !== 'undefined' && module.exports) module.exports = Cube;
