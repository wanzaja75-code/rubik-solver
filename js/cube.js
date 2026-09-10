/**
 * cube.js - Representasi state Rubik 3x3
 * 
 * State disimpan sebagai array 54 elemen (6 sisi x 9 sticker)
 * Urutan: U(0-8), R(9-17), F(18-26), D(27-35), L(36-44), B(45-53)
 * 
 * Setiap sticker menyimpan warna: 'white', 'yellow', 'red', 'orange', 'blue', 'green'
 */

class Cube {
    constructor() {
        this.reset();
    }

    /**
     * Reset ke kondisi solved
     */
    reset() {
        this.state = [
            // U (Up) - 0-8
            'white','white','white',
            'white','white','white',
            'white','white','white',
            // R (Right) - 9-17
            'red','red','red',
            'red','red','red',
            'red','red','red',
            // F (Front) - 18-26
            'green','green','green',
            'green','green','green',
            'green','green','green',
            // D (Down) - 27-35
            'yellow','yellow','yellow',
            'yellow','yellow','yellow',
            'yellow','yellow','yellow',
            // L (Left) - 36-44
            'orange','orange','orange',
            'orange','orange','orange',
            'orange','orange','orange',
            // B (Back) - 45-53
            'blue','blue','blue',
            'blue','blue','blue',
            'blue','blue','blue'
        ];
        this.history = [];
        return this;
    }

    /**
     * Set state dari array 54 warna
     */
    setState(colors) {
        if (colors.length !== 54) {
            throw new Error('State harus memiliki 54 sticker');
        }
        this.state = [...colors];
        return this;
    }

    /**
     * Get state
     */
    getState() {
        return [...this.state];
    }

    /**
     * Get warna sticker berdasarkan face dan index
     */
    getSticker(face, idx) {
        const faceOffset = this.getFaceOffset(face);
        return this.state[faceOffset + idx];
    }

    /**
     * Set warna sticker
     */
    setSticker(face, idx, color) {
        const faceOffset = this.getFaceOffset(face);
        this.state[faceOffset + idx] = color;
        return this;
    }

    /**
     * Get offset untuk setiap face
     */
    getFaceOffset(face) {
        const offsets = { U: 0, R: 9, F: 18, D: 27, L: 36, B: 45 };
        return offsets[face];
    }

    /**
     * Dapatkan warna center setiap face
     */
    getCenters() {
        return {
            U: this.state[4],
            R: this.state[13],
            F: this.state[22],
            D: this.state[31],
            L: this.state[40],
            B: this.state[49]
        };
    }

    /**
     * Cek apakah cube dalam kondisi solved
     */
    isSolved() {
        const faces = ['U', 'R', 'F', 'D', 'L', 'B'];
        for (const face of faces) {
            const offset = this.getFaceOffset(face);
            const centerColor = this.state[offset + 4];
            for (let i = 0; i < 9; i++) {
                if (this.state[offset + i] !== centerColor) {
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * Clone cube
     */
    clone() {
        const c = new Cube();
        c.state = [...this.state];
        c.history = [...this.history];
        return c;
    }

    /**
     * Lakukan gerakan pada cube state
     * @param {string} move - Notasi gerakan: U, U', U2, R, R', R2, dll.
     */
    move(move) {
        const moveMap = {
            'U': () => this.rotateU(1),
            "U'": () => this.rotateU(-1),
            'U2': () => { this.rotateU(1); this.rotateU(1); },
            'D': () => this.rotateD(1),
            "D'": () => this.rotateD(-1),
            'D2': () => { this.rotateD(1); this.rotateD(1); },
            'R': () => this.rotateR(1),
            "R'": () => this.rotateR(-1),
            'R2': () => { this.rotateR(1); this.rotateR(1); },
            'L': () => this.rotateL(1),
            "L'": () => this.rotateL(-1),
            'L2': () => { this.rotateL(1); this.rotateL(1); },
            'F': () => this.rotateF(1),
            "F'": () => this.rotateF(-1),
            'F2': () => { this.rotateF(1); this.rotateF(1); },
            'B': () => this.rotateB(1),
            "B'": () => this.rotateB(-1),
            'B2': () => { this.rotateB(1); this.rotateB(1); }
        };

        if (!moveMap[move]) {
            throw new Error(`Gerakan tidak dikenal: ${move}`);
        }

        moveMap[move]();
        this.history.push(move);
        return this;
    }

    /**
     * Lakukan serangkaian gerakan
     */
    applyMoves(moves) {
        for (const move of moves) {
            this.move(move);
        }
        return this;
    }

    /**
     * Rotasi face 3x3 searah jarum jam
     * index mapping: 0 1 2 / 3 4 5 / 6 7 8
     * CW: 0->2, 1->5, 2->8, 5->7, 8->6, 7->3, 6->0, 3->1
     */
    rotateFaceCW(face) {
        const offset = this.getFaceOffset(face);
        const s = this.state;
        const temp = [
            s[offset+0], s[offset+1], s[offset+2],
            s[offset+3], s[offset+4], s[offset+5],
            s[offset+6], s[offset+7], s[offset+8]
        ];
        // CW rotation
        s[offset+0] = temp[6];
        s[offset+1] = temp[3];
        s[offset+2] = temp[0];
        s[offset+3] = temp[7];
        s[offset+4] = temp[4];
        s[offset+5] = temp[1];
        s[offset+6] = temp[8];
        s[offset+7] = temp[5];
        s[offset+8] = temp[2];
    }

    rotateFaceCCW(face) {
        const offset = this.getFaceOffset(face);
        const s = this.state;
        const temp = [
            s[offset+0], s[offset+1], s[offset+2],
            s[offset+3], s[offset+4], s[offset+5],
            s[offset+6], s[offset+7], s[offset+8]
        ];
        // CCW rotation
        s[offset+0] = temp[2];
        s[offset+1] = temp[5];
        s[offset+2] = temp[8];
        s[offset+3] = temp[1];
        s[offset+4] = temp[4];
        s[offset+5] = temp[7];
        s[offset+6] = temp[0];
        s[offset+7] = temp[3];
        s[offset+8] = temp[6];
    }

    /**
     * Rotasi U (layer atas)
     * U CW: 
     * - face U CW
     * - F row 0 -> R row 0 -> B row 0 -> L row 0 -> F row 0
     * (masing-masing row 0)
     */
    rotateU(dir) {
        if (dir === 1) {
            this.rotateFaceCW('U');
            const temp = [
                this.state[18], this.state[19], this.state[20], // F top
                this.state[9], this.state[10], this.state[11],   // R top
                this.state[45], this.state[46], this.state[47], // B top
                this.state[36], this.state[37], this.state[38]  // L top
            ];
            // F <- L, R <- F, B <- R, L <- B
            this.state[18] = temp[9]; this.state[19] = temp[10]; this.state[20] = temp[11]; // F <- L
            this.state[9] = temp[0]; this.state[10] = temp[1]; this.state[11] = temp[2];    // R <- F
            this.state[45] = temp[3]; this.state[46] = temp[4]; this.state[47] = temp[5];   // B <- R
            this.state[36] = temp[6]; this.state[37] = temp[7]; this.state[38] = temp[8];   // L <- B
        } else {
            this.rotateFaceCCW('U');
            const temp = [
                this.state[18], this.state[19], this.state[20],
                this.state[9], this.state[10], this.state[11],
                this.state[45], this.state[46], this.state[47],
                this.state[36], this.state[37], this.state[38]
            ];
            // F <- R, R <- B, B <- L, L <- F
            this.state[18] = temp[3]; this.state[19] = temp[4]; this.state[20] = temp[5];
            this.state[9] = temp[6]; this.state[10] = temp[7]; this.state[11] = temp[8];
            this.state[45] = temp[9]; this.state[46] = temp[10]; this.state[47] = temp[11];
            this.state[36] = temp[0]; this.state[37] = temp[1]; this.state[38] = temp[2];
        }
    }

    /**
     * Rotasi D (layer bawah)
     * D CW:
     * - face D CW
     * - F row 2 -> L row 2 -> B row 2 -> R row 2 -> F row 2
     */
    rotateD(dir) {
        if (dir === 1) {
            this.rotateFaceCW('D');
            const temp = [
                this.state[24], this.state[25], this.state[26], // F bottom
                this.state[15], this.state[16], this.state[17], // R bottom
                this.state[51], this.state[52], this.state[53], // B bottom
                this.state[42], this.state[43], this.state[44]  // L bottom
            ];
            // F <- R, R <- B, B <- L, L <- F
            this.state[24] = temp[3]; this.state[25] = temp[4]; this.state[26] = temp[5];
            this.state[15] = temp[6]; this.state[16] = temp[7]; this.state[17] = temp[8];
            this.state[51] = temp[9]; this.state[52] = temp[10]; this.state[53] = temp[11];
            this.state[42] = temp[0]; this.state[43] = temp[1]; this.state[44] = temp[2];
        } else {
            this.rotateFaceCCW('D');
            const temp = [
                this.state[24], this.state[25], this.state[26],
                this.state[15], this.state[16], this.state[17],
                this.state[51], this.state[52], this.state[53],
                this.state[42], this.state[43], this.state[44]
            ];
            // F <- L, R <- F, B <- R, L <- B
            this.state[24] = temp[9]; this.state[25] = temp[10]; this.state[26] = temp[11];
            this.state[15] = temp[0]; this.state[16] = temp[1]; this.state[17] = temp[2];
            this.state[51] = temp[3]; this.state[52] = temp[4]; this.state[53] = temp[5];
            this.state[42] = temp[6]; this.state[43] = temp[7]; this.state[44] = temp[8];
        }
    }

    /**
     * Rotasi R (layer kanan)
     * R CW:
     * - face R CW
     * - U col 2 -> F col 2 -> D col 2 -> B col 0 (reversed) -> U col 2
     * Mapping: U[2,5,8] -> F[2,5,8] -> D[2,5,8] -> B[6,3,0] -> U[2,5,8]
     */
    rotateR(dir) {
        if (dir === 1) {
            this.rotateFaceCW('R');
            const temp = [
                this.state[2], this.state[5], this.state[8],    // U right col
                this.state[20], this.state[23], this.state[26],  // F right col
                this.state[29], this.state[32], this.state[35],  // D right col
                this.state[47], this.state[50], this.state[53]   // B left col (reversed)
            ];
            // U -> F, F -> D, D -> B(reversed), B(reversed) -> U
            this.state[2] = temp[9]; this.state[5] = temp[10]; this.state[8] = temp[11]; // U <- B rev
            this.state[20] = temp[0]; this.state[23] = temp[1]; this.state[26] = temp[2]; // F <- U
            this.state[29] = temp[3]; this.state[32] = temp[4]; this.state[35] = temp[5]; // D <- F
            this.state[47] = temp[6]; this.state[50] = temp[7]; this.state[53] = temp[8]; // B rev <- D
        } else {
            this.rotateFaceCCW('R');
            const temp = [
                this.state[2], this.state[5], this.state[8],
                this.state[20], this.state[23], this.state[26],
                this.state[29], this.state[32], this.state[35],
                this.state[47], this.state[50], this.state[53]
            ];
            // U <- F, F <- D, D <- B rev, B rev <- U
            this.state[2] = temp[3]; this.state[5] = temp[4]; this.state[8] = temp[5];
            this.state[20] = temp[6]; this.state[23] = temp[7]; this.state[26] = temp[8];
            this.state[29] = temp[9]; this.state[32] = temp[10]; this.state[35] = temp[11];
            this.state[47] = temp[0]; this.state[50] = temp[1]; this.state[53] = temp[2];
        }
    }

    /**
     * Rotasi L (layer kiri)
     * L CW:
     * - face L CW
     * - U col 0 -> B col 2(reversed) -> D col 0 -> F col 0 -> U col 0
     * Mapping: U[0,3,6] -> B[8,5,2] -> D[0,3,6] -> F[0,3,6] -> U[0,3,6]
     */
    rotateL(dir) {
        if (dir === 1) {
            this.rotateFaceCW('L');
            const temp = [
                this.state[0], this.state[3], this.state[6],    // U left col
                this.state[18], this.state[21], this.state[24],  // F left col
                this.state[27], this.state[30], this.state[33],  // D left col
                this.state[45], this.state[48], this.state[51]   // B right col (reversed)
            ];
            // U <- F, F <- D, D <- B rev, B rev <- U
            this.state[0] = temp[3]; this.state[3] = temp[4]; this.state[6] = temp[5];
            this.state[18] = temp[6]; this.state[21] = temp[7]; this.state[24] = temp[8];
            this.state[27] = temp[9]; this.state[30] = temp[10]; this.state[33] = temp[11];
            this.state[45] = temp[0]; this.state[48] = temp[1]; this.state[51] = temp[2];
        } else {
            this.rotateFaceCCW('L');
            const temp = [
                this.state[0], this.state[3], this.state[6],
                this.state[18], this.state[21], this.state[24],
                this.state[27], this.state[30], this.state[33],
                this.state[45], this.state[48], this.state[51]
            ];
            // U <- B rev, F <- U, D <- F, B rev <- D
            this.state[0] = temp[9]; this.state[3] = temp[10]; this.state[6] = temp[11];
            this.state[18] = temp[0]; this.state[21] = temp[1]; this.state[24] = temp[2];
            this.state[27] = temp[3]; this.state[30] = temp[4]; this.state[33] = temp[5];
            this.state[45] = temp[6]; this.state[48] = temp[7]; this.state[51] = temp[8];
        }
    }

    /**
     * Rotasi F (layer depan)
     * F CW:
     * - face F CW
     * - U row 2 -> R col 0 -> D row 0(reversed) -> L col 2(reversed) -> U row 2
     */
    rotateF(dir) {
        if (dir === 1) {
            this.rotateFaceCW('F');
            const temp = [
                this.state[6], this.state[7], this.state[8],    // U bottom row
                this.state[9], this.state[12], this.state[15],   // R left col
                this.state[27], this.state[28], this.state[29],  // D top row
                this.state[38], this.state[41], this.state[44]   // L right col
            ];
            // U <- L rev, R <- U, D <- R, L rev <- D rev
            this.state[6] = temp[9]; this.state[7] = temp[10]; this.state[8] = temp[11];
            this.state[9] = temp[0]; this.state[12] = temp[1]; this.state[15] = temp[2];
            this.state[27] = temp[3]; this.state[28] = temp[4]; this.state[29] = temp[5];
            this.state[38] = temp[6]; this.state[41] = temp[7]; this.state[44] = temp[8];
        } else {
            this.rotateFaceCCW('F');
            const temp = [
                this.state[6], this.state[7], this.state[8],
                this.state[9], this.state[12], this.state[15],
                this.state[27], this.state[28], this.state[29],
                this.state[38], this.state[41], this.state[44]
            ];
            // U <- R, R <- D, D <- L rev, L rev <- U
            this.state[6] = temp[3]; this.state[7] = temp[4]; this.state[8] = temp[5];
            this.state[9] = temp[6]; this.state[12] = temp[7]; this.state[15] = temp[8];
            this.state[27] = temp[9]; this.state[28] = temp[10]; this.state[29] = temp[11];
            this.state[38] = temp[0]; this.state[41] = temp[1]; this.state[44] = temp[2];
        }
    }

    /**
     * Rotasi B (layer belakang)
     * B CW:
     * - face B CW
     * - U row 0(reversed) -> L col 0 -> D row 2 -> R col 2(reversed) -> U row 0(reversed)
     */
    rotateB(dir) {
        if (dir === 1) {
            this.rotateFaceCW('B');
            const temp = [
                this.state[0], this.state[1], this.state[2],    // U top row
                this.state[11], this.state[14], this.state[17],  // R right col
                this.state[33], this.state[34], this.state[35],  // D bottom row
                this.state[36], this.state[39], this.state[42]   // L left col
            ];
            // U rev <- R rev, R <- D rev, D <- L, L <- U rev
            this.state[0] = temp[6]; this.state[1] = temp[7]; this.state[2] = temp[8];
            this.state[11] = temp[3]; this.state[14] = temp[4]; this.state[17] = temp[5];
            this.state[33] = temp[9]; this.state[34] = temp[10]; this.state[35] = temp[11];
            this.state[36] = temp[0]; this.state[39] = temp[1]; this.state[42] = temp[2];
        } else {
            this.rotateFaceCCW('B');
            const temp = [
                this.state[0], this.state[1], this.state[2],
                this.state[11], this.state[14], this.state[17],
                this.state[33], this.state[34], this.state[35],
                this.state[36], this.state[39], this.state[42]
            ];
            // U rev <- L, R <- U rev, D <- R rev, L <- D
            this.state[0] = temp[9]; this.state[1] = temp[10]; this.state[2] = temp[11];
            this.state[11] = temp[0]; this.state[14] = temp[1]; this.state[17] = temp[2];
            this.state[33] = temp[3]; this.state[34] = temp[4]; this.state[35] = temp[5];
            this.state[36] = temp[6]; this.state[39] = temp[7]; this.state[42] = temp[8];
        }
    }
}

// Export untuk module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Cube;
}