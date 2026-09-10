/**
 * scanner.js - Scan warna Rubik dari kamera/foto
 */

class CubeScanner {
    constructor() {
        this.video = null;
        this.canvas = null;
        this.ctx = null;
        this.stream = null;
        this.isActive = false;
        
        // Reference colors (RGB) - akan di-tune
        this.referenceColors = {
            'white': { r: 255, g: 255, b: 255 },
            'yellow': { r: 255, g: 213, b: 0 },
            'red': { r: 196, g: 30, b: 58 },
            'orange': { r: 255, g: 88, b: 0 },
            'blue': { r: 0, g: 81, b: 186 },
            'green': { r: 0, g: 158, b: 96 }
        };
    }

    /**
     * Inisialisasi kamera
     */
    async initCamera() {
        this.video = document.getElementById('camera-feed');
        this.canvas = document.getElementById('camera-canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 640 },
                    height: { ideal: 640 }
                }
            });
            this.video.srcObject = this.stream;
            this.isActive = true;
            return true;
        } catch (e) {
            console.error('Kamera error:', e);
            return false;
        }
    }

    /**
     * Stop kamera
     */
    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        this.isActive = false;
    }

    /**
     * Ambil frame dari video, analisis 9 sticker
     */
    captureFrame() {
        if (!this.video || !this.canvas) return null;

        const size = Math.min(this.video.videoWidth, this.video.videoHeight);
        this.canvas.width = size;
        this.canvas.height = size;
        
        // Crop tengah square
        const sx = (this.video.videoWidth - size) / 2;
        const sy = (this.video.videoHeight - size) / 2;
        
        this.ctx.drawImage(this.video, sx, sy, size, size, 0, 0, size, size);
        
        return this.analyzeImage(this.canvas);
    }

    /**
     * Analisis gambar dari file upload
     */
    analyzeImageFromFile(file) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const size = Math.min(img.width, img.height);
                this.canvas.width = size;
                this.canvas.height = size;
                
                const sx = (img.width - size) / 2;
                const sy = (img.height - size) / 2;
                
                this.ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);
                resolve(this.analyzeImage(this.canvas));
            };
            img.src = URL.createObjectURL(file);
        });
    }

    /**
     * Analisis canvas: ambil 9 warna dari grid 3x3
     */
    analyzeImage(canvas) {
        const ctx = canvas.getContext('2d');
        const size = canvas.width;
        const cellSize = size / 3;
        const colors = [];

        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                // Ambil sampel dari tengah setiap cell
                const cx = Math.floor(col * cellSize + cellSize / 2);
                const cy = Math.floor(row * cellSize + cellSize / 2);
                
                // Ambil rata-rata dari area kecil di tengah cell
                const sampleSize = Math.max(5, Math.floor(cellSize * 0.15));
                const sample = this.getAverageColor(ctx, cx, cy, sampleSize);
                
                const classified = this.classifyColor(sample);
                colors.push(classified);
            }
        }

        return colors;
    }

    /**
     * Ambil rata-rata warna dari area
     */
    getAverageColor(ctx, cx, cy, size) {
        const half = Math.floor(size / 2);
        const x = Math.max(0, cx - half);
        const y = Math.max(0, cy - half);
        const w = Math.min(size, ctx.canvas.width - x);
        const h = Math.min(size, ctx.canvas.height - y);
        
        if (w <= 0 || h <= 0) return { r: 0, g: 0, b: 0 };
        
        const imageData = ctx.getImageData(x, y, w, h).data;
        let r = 0, g = 0, b = 0, count = 0;
        
        for (let i = 0; i < imageData.length; i += 4) {
            // Skip very dark pixels (noise)
            const brightness = (imageData[i] + imageData[i+1] + imageData[i+2]) / 3;
            if (brightness < 30) continue;
            
            r += imageData[i];
            g += imageData[i+1];
            b += imageData[i+2];
            count++;
        }
        
        if (count === 0) return { r: 0, g: 0, b: 0 };
        
        return {
            r: Math.round(r / count),
            g: Math.round(g / count),
            b: Math.round(b / count)
        };
    }

    /**
     * Klasifikasikan warna RGB ke salah satu warna Rubik
     * Menggunakan HSV untuk akurasi lebih baik
     */
    classifyColor(rgb) {
        const hsv = this.rgbToHsv(rgb.r, rgb.g, rgb.b);
        
        // Cek berdasarkan hue dan saturation
        const { h, s, v } = hsv;
        
        // Putih: saturation rendah, value tinggi
        if (s < 0.15 && v > 0.7) return 'white';
        
        // Hitam/gelap: value rendah
        if (v < 0.15) return 'white'; // fallback
        
        // Kuning: hue sekitar 50-70
        if (h >= 40 && h <= 70 && s > 0.3) return 'yellow';
        
        // Merah: hue sekitar 0-15 atau 345-360
        if ((h >= 0 && h <= 15) || (h >= 345 && h <= 360)) {
            if (s > 0.4) return 'red';
        }
        
        // Oranye: hue sekitar 15-40
        if (h > 15 && h < 45 && s > 0.4) return 'orange';
        
        // Hijau: hue sekitar 70-160
        if (h >= 70 && h <= 160 && s > 0.3) return 'green';
        
        // Biru: hue sekitar 160-260
        if (h >= 160 && h <= 260 && s > 0.3) return 'blue';
        
        // Merah (lanjutan): hue > 300
        if (h > 300 && h < 345 && s > 0.4) return 'red';
        
        // Fallback berdasarkan nilai RGB
        return this.classifyByRGB(rgb);
    }

    /**
     * Fallback klasifikasi berdasarkan RGB
     */
    classifyByRGB(rgb) {
        const { r, g, b } = rgb;
        
        // Hitung jarak ke setiap reference color
        let minDist = Infinity;
        let bestColor = 'white';
        
        for (const [color, ref] of Object.entries(this.referenceColors)) {
            const dist = Math.sqrt(
                Math.pow(r - ref.r, 2) +
                Math.pow(g - ref.g, 2) +
                Math.pow(b - ref.b, 2)
            );
            if (dist < minDist) {
                minDist = dist;
                bestColor = color;
            }
        }
        
        return bestColor;
    }

    /**
     * Konversi RGB ke HSV
     */
    rgbToHsv(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const diff = max - min;
        
        let h = 0;
        if (diff !== 0) {
            if (max === r) h = 60 * (((g - b) / diff) % 6);
            else if (max === g) h = 60 * ((b - r) / diff + 2);
            else h = 60 * ((r - g) / diff + 4);
        }
        if (h < 0) h += 360;
        
        const s = max === 0 ? 0 : diff / max;
        const v = max;
        
        return { h, s, v };
    }

    /**
     * Tampilkan preview hasil scan
     */
    renderPreview(colors, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = '';
        for (const color of colors) {
            const div = document.createElement('div');
            div.className = 'sticker';
            div.setAttribute('data-color', color);
            div.style.background = this.getColorHex(color);
            container.appendChild(div);
        }
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
        return hex[color] || '#888888';
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CubeScanner;
}