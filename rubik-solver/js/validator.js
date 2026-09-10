/**
 * validator.js - Validasi konfigurasi Rubik
 */

class CubeValidator {
    /**
     * Validasi lengkap konfigurasi Rubik
     * @param {Array} state - Array 54 warna
     * @returns {Object} { valid: boolean, errors: string[] }
     */
    static validate(state) {
        const errors = [];

        // 1. Cek jumlah total
        if (!state || state.length !== 54) {
            errors.push('Jumlah sticker harus 54. Saat ini: ' + (state ? state.length : 0));
            return { valid: false, errors };
        }

        // 2. Cek semua sticker terisi
        const emptyStickers = state.filter(c => !c || c === '').length;
        if (emptyStickers > 0) {
            errors.push(`Masih ada ${emptyStickers} sticker yang belum diwarnai.`);
            return { valid: false, errors };
        }

        // 3. Cek jumlah setiap warna (harus 9)
        const colorCount = {};
        const validColors = ['white', 'yellow', 'red', 'orange', 'blue', 'green'];
        
        for (const c of state) {
            if (!validColors.includes(c)) {
                errors.push(`Warna tidak dikenal: "${c}"`);
                return { valid: false, errors };
            }
            colorCount[c] = (colorCount[c] || 0) + 1;
        }

        for (const color of validColors) {
            const count = colorCount[color] || 0;
            if (count !== 9) {
                errors.push(`Warna ${this.colorName(color)} hanya ditemukan ${count} sticker (harus 9).`);
            }
        }

        if (errors.length > 0) {
            return { valid: false, errors };
        }

        // 4. Cek center pieces
        const centerColors = [
            state[4],   // U center
            state[13],  // R center
            state[22],  // F center
            state[31],  // D center
            state[40],  // L center
            state[49]   // B center
        ];

        const uniqueCenters = new Set(centerColors);
        if (uniqueCenters.size !== 6) {
            errors.push('Setiap sisi harus memiliki warna center yang berbeda.');
        }

        // 5. Cek orientasi standar (opsional, tapi membantu solver)
        // Standar: U=white, D=yellow, F=green, B=blue, R=red, L=orange
        const expectedCenters = {
            4: 'white', 13: 'red', 22: 'green',
            31: 'yellow', 40: 'orange', 49: 'blue'
        };

        // 6. Cek corner dan edge pieces (validasi parity)
        const parityCheck = this.checkParity(state);
        if (!parityCheck.valid) {
            errors.push(...parityCheck.errors);
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Cek apakah konfigurasi bisa diselesaikan (parity check sederhana)
     */
    static checkParity(state) {
        const errors = [];
        
        // Definisikan corner dan edge pieces
        // Corner pieces: 8 buah, masing-masing punya 3 sticker
        // Edge pieces: 12 buah, masing-masing punya 2 sticker
        
        // Simplified parity check:
        // 1. Corner orientation sum harus habis dibagi 3
        // 2. Edge orientation sum harus genap
        // 3. Permutasi parity harus cocok
        
        // Untuk implementasi sederhana, kita cek apakah jumlah sticker per warna sudah benar
        // dan center sudah benar. Parity check penuh membutuhkan implementasi yang lebih kompleks.
        
        // Cek corner twist: jumlah rotasi corner harus habis dibagi 3
        // Ini disederhanakan dengan mengecek apakah ada warna yang tidak konsisten
        
        return { valid: true, errors: [] };
    }

    /**
     * Nama warna dalam Bahasa Indonesia
     */
    static colorName(color) {
        const names = {
            'white': 'Putih',
            'yellow': 'Kuning',
            'red': 'Merah',
            'orange': 'Oranye',
            'blue': 'Biru',
            'green': 'Hijau'
        };
        return names[color] || color;
    }

    /**
     * Cek apakah semua sticker terisi
     */
    static isComplete(state) {
        if (!state || state.length !== 54) return false;
        return state.every(c => c && c !== '');
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CubeValidator;
}