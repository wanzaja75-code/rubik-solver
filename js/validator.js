/**
 * validator.js - Validasi konfigurasi Rubik
 */

class CubeValidator {
    static validate(state) {
        const errors = [];

        if (!state || state.length !== 54) {
            errors.push('Jumlah sticker harus 54. Saat ini: ' + (state ? state.length : 0));
            return { valid: false, errors };
        }

        const emptyStickers = state.filter(c => !c || c === '').length;
        if (emptyStickers > 0) {
            errors.push(`Masih ada ${emptyStickers} sticker yang belum diwarnai.`);
            return { valid: false, errors };
        }

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

        if (errors.length > 0) return { valid: false, errors };

        const centerColors = [
            state[4], state[13], state[22],
            state[31], state[40], state[49]
        ];

        const uniqueCenters = new Set(centerColors);
        if (uniqueCenters.size !== 6) {
            errors.push('Setiap sisi harus memiliki warna center yang berbeda.');
        }

        return { valid: errors.length === 0, errors };
    }

    static colorName(color) {
        const names = {
            'white': 'Putih', 'yellow': 'Kuning', 'red': 'Merah',
            'orange': 'Oranye', 'blue': 'Biru', 'green': 'Hijau'
        };
        return names[color] || color;
    }

    static isComplete(state) {
        if (!state || state.length !== 54) return false;
        return state.every(c => c && c !== '');
    }
}

if (typeof module !== 'undefined' && module.exports) module.exports = CubeValidator;
