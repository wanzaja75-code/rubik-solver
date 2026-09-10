/**
 * cube3d.js - Visualisasi Rubik 3D menggunakan Three.js
 * VERSI FIX: smooth animation, tanpa rebuild tiap move
 */

class Cube3D {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error('Container tidak ditemukan:', containerId);
            return;
        }

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.cubies = [];
        this.isAnimating = false;
        this.animQueue = [];

        this.colors = {
            'white': 0xffffff, 'yellow': 0xffd500, 'red': 0xc41e3a,
            'orange': 0xff5800, 'blue': 0x0051ba, 'green': 0x009e60
        };

        this.isDragging = false;
        this.previousMouse = { x: 0, y: 0 };
        this.rotationVelocity = { x: 0, y: 0 };
        this.rotation = { x: 0.5, y: 0.5 };

        this.cubieSize = 1;
        this.gap = 0.05;
        this.step = this.cubieSize + this.gap;

        // Group untuk semua cubie — supaya rotate mudah
        this.cubeGroup = null;

        this.init();
    }

    init() {
        const width = this.container.clientWidth || 400;
        const height = this.container.clientHeight || 400;

        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        this.camera.position.set(5, 5, 7);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);

        const ambient = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(ambient);

        const d1 = new THREE.DirectionalLight(0xffffff, 0.5);
        d1.position.set(5, 8, 6);
        this.scene.add(d1);

        const d2 = new THREE.DirectionalLight(0xffffff, 0.35);
        d2.position.set(-5, -5, -5);
        this.scene.add(d2);

        // Group utama
        this.cubeGroup = new THREE.Group();
        this.scene.add(this.cubeGroup);

        this.buildCube();
        this.setupEvents();
        this.animate();
    }

    buildCube() {
        // Hapus cubie lama
        while (this.cubeGroup.children.length > 0) {
            const c = this.cubeGroup.children[0];
            this.cubeGroup.remove(c);
            if (c.geometry) c.geometry.dispose();
            if (c.material) {
                if (Array.isArray(c.material)) c.material.forEach(m => m.dispose());
                else c.material.dispose();
            }
        }
        this.cubies = [];

        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                for (let z = -1; z <= 1; z++) {
                    this.createCubie(x, y, z);
                }
            }
        }
    }

    createCubie(x, y, z) {
        const size = this.cubieSize;
        const geometry = new THREE.BoxGeometry(size, size, size);
        const bodyColor = 0x151515;

        const mats = [
            new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.5 }), // +x R
            new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.5 }), // -x L
            new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.5 }), // +y U
            new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.5 }), // -y D
            new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.5 }), // +z F
            new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.5 })  // -z B
        ];

        if (x === 1)  mats[0].color.setHex(this.colors.red);
        if (x === -1) mats[1].color.setHex(this.colors.orange);
        if (y === 1)  mats[2].color.setHex(this.colors.white);
        if (y === -1) mats[3].color.setHex(this.colors.yellow);
        if (z === 1)  mats[4].color.setHex(this.colors.green);
        if (z === -1) mats[5].color.setHex(this.colors.blue);

        const mesh = new THREE.Mesh(geometry, mats);
        mesh.position.set(x * this.step, y * this.step, z * this.step);

        // Simpan logical position (grid coordinate -1, 0, 1)
        mesh.userData.logicalPos = { x, y, z };

        this.cubeGroup.add(mesh);
        this.cubies.push(mesh);
    }

    /**
     * Update warna sticker berdasarkan state
     * Tidak rebuild cube — hanya update material colors
     */
    updateFromState(state) {
        for (const mesh of this.cubies) {
            const { x, y, z } = mesh.userData.logicalPos;

            if (x === 1) {
                const idx = this.getFaceStickerIndex('R', x, y, z);
                if (idx >= 0 && state[9 + idx]) {
                    mesh.material[0].color.setHex(this.colors[state[9 + idx]]);
                }
            }
            if (x === -1) {
                const idx = this.getFaceStickerIndex('L', x, y, z);
                if (idx >= 0 && state[36 + idx]) {
                    mesh.material[1].color.setHex(this.colors[state[36 + idx]]);
                }
            }
            if (y === 1) {
                const idx = this.getFaceStickerIndex('U', x, y, z);
                if (idx >= 0 && state[0 + idx]) {
                    mesh.material[2].color.setHex(this.colors[state[0 + idx]]);
                }
            }
            if (y === -1) {
                const idx = this.getFaceStickerIndex('D', x, y, z);
                if (idx >= 0 && state[27 + idx]) {
                    mesh.material[3].color.setHex(this.colors[state[27 + idx]]);
                }
            }
            if (z === 1) {
                const idx = this.getFaceStickerIndex('F', x, y, z);
                if (idx >= 0 && state[18 + idx]) {
                    mesh.material[4].color.setHex(this.colors[state[18 + idx]]);
                }
            }
            if (z === -1) {
                const idx = this.getFaceStickerIndex('B', x, y, z);
                if (idx >= 0 && state[45 + idx]) {
                    mesh.material[5].color.setHex(this.colors[state[45 + idx]]);
                }
            }
        }
    }

    getFaceStickerIndex(face, x, y, z) {
        switch (face) {
            case 'U': return (z + 1) * 3 + (x + 1);
            case 'D': return (1 - z) * 3 + (x + 1);
            case 'R': return (1 - y) * 3 + (1 - z);
            case 'L': return (1 - y) * 3 + (z + 1);
            case 'F': return (1 - y) * 3 + (x + 1);
            case 'B': return (1 - y) * 3 + (1 - x);
            default: return -1;
        }
    }

    setupEvents() {
        const canvas = this.renderer.domElement;

        canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('mouseup', () => this.onMouseUp());
        canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });

        canvas.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
        canvas.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
        canvas.addEventListener('touchend', () => this.onTouchEnd());

        window.addEventListener('resize', () => this.onResize());
    }

    onMouseDown(e) {
        this.isDragging = true;
        this.previousMouse = { x: e.clientX, y: e.clientY };
        this.rotationVelocity = { x: 0, y: 0 };
    }

    onMouseMove(e) {
        if (!this.isDragging) return;
        const dx = e.clientX - this.previousMouse.x;
        const dy = e.clientY - this.previousMouse.y;

        this.rotation.y += dx * 0.01;
        this.rotation.x += dy * 0.01;
        this.rotationVelocity.x = dy * 0.01;
        this.rotationVelocity.y = dx * 0.01;

        this.previousMouse = { x: e.clientX, y: e.clientY };
    }

    onMouseUp() { this.isDragging = false; }

    onWheel(e) {
        e.preventDefault();
        const zoom = e.deltaY > 0 ? 1.05 : 0.95;
        this.camera.position.multiplyScalar(zoom);
        const dist = this.camera.position.length();
        if (dist < 4) this.camera.position.setLength(4);
        if (dist > 15) this.camera.position.setLength(15);
    }

    onTouchStart(e) {
        if (e.touches.length === 1) {
            this.isDragging = true;
            this.previousMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            this.rotationVelocity = { x: 0, y: 0 };
        }
    }

    onTouchMove(e) {
        e.preventDefault();
        if (!this.isDragging || e.touches.length !== 1) return;

        const dx = e.touches[0].clientX - this.previousMouse.x;
        const dy = e.touches[0].clientY - this.previousMouse.y;

        this.rotation.y += dx * 0.01;
        this.rotation.x += dy * 0.01;
        this.rotationVelocity.x = dy * 0.01;
        this.rotationVelocity.y = dx * 0.01;

        this.previousMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }

    onTouchEnd() { this.isDragging = false; }

    onResize() {
        if (!this.container) return;
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        if (width === 0 || height === 0) return;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (!this.isDragging) {
            this.rotation.x += this.rotationVelocity.x;
            this.rotation.y += this.rotationVelocity.y;
            this.rotationVelocity.x *= 0.95;
            this.rotationVelocity.y *= 0.95;
        }

        this.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.rotation.x));

        // Rotasi scene (bukan cubeGroup) supaya layer animasi tidak terpengaruh
        this.scene.rotation.x = this.rotation.x;
        this.scene.rotation.y = this.rotation.y;

        this.renderer.render(this.scene, this.camera);
    }

    /**
     * ANIMASI MOVE YANG SMOOTH
     * 
     * Konsep:
     * - Kumpulkan cubie yang masuk layer
     * - Simpan posisi dunia awal mereka (world position + quaternion)
     * - Buat pivot object di origin
     * - Parent-kan cubie ke pivot (gunakan .attach())
     * - Animasikan rotasi pivot
     * - Setelah selesai, .attach() balik ke cubeGroup, lalu SNAP posisi + rotasi ke grid
     * - Update logicalPos + warna material (tanpa rebuild!)
     */
    animateMove(move, onComplete) {
        // Kalau sedang animasi, tahan dulu — queue
        if (this.isAnimating) {
            this.animQueue.push({ move, onComplete });
            return;
        }
        this.isAnimating = true;

        const face = move[0];
        const modifier = move.slice(1);

        let targetAngle = Math.PI / 2; // 90° CW
        if (modifier === "'") targetAngle = -Math.PI / 2;
        if (modifier === '2') targetAngle = Math.PI;

        const axis = this.getFaceAxis(face);
        const value = this.getFaceValue(face);

        // Ambil cubie yang masuk layer (berdasarkan logicalPos)
        const affected = this.cubies.filter(c => c.userData.logicalPos[axis] === value);

        // Pivot
        const pivot = new THREE.Group();
        this.cubeGroup.add(pivot);

        // Attach cubie ke pivot — .attach() menjaga world transform
        for (const c of affected) {
            pivot.attach(c);
        }

        const startTime = performance.now();
        const duration = 320;

        const easeInOutCubic = (t) =>
            t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

        const tick = (now) => {
            const elapsed = now - startTime;
            const p = Math.min(elapsed / duration, 1);
            const eased = easeInOutCubic(p);
            const angle = targetAngle * eased;

            pivot.rotation.set(0, 0, 0);
            if (axis === 'x') pivot.rotation.x = angle;
            if (axis === 'y') pivot.rotation.y = angle;
            if (axis === 'z') pivot.rotation.z = angle;

            if (p < 1) {
                requestAnimationFrame(tick);
            } else {
                // Snap pivot ke sudut exact dulu
                pivot.rotation.set(0, 0, 0);
                if (axis === 'x') pivot.rotation.x = targetAngle;
                if (axis === 'y') pivot.rotation.y = targetAngle;
                if (axis === 'z') pivot.rotation.z = targetAngle;
                pivot.updateMatrixWorld(true);

                // Kembalikan cubie ke cubeGroup
                for (const c of affected) {
                    this.cubeGroup.attach(c);
                }

                // Hapus pivot
                this.cubeGroup.remove(pivot);

                // === SNAP ke grid ===
                const s = this.step;
                for (const c of affected) {
                    // Snap posisi
                    c.position.x = Math.round(c.position.x / s) * s;
                    c.position.y = Math.round(c.position.y / s) * s;
                    c.position.z = Math.round(c.position.z / s) * s;

                    // Snap rotasi: kuaternion ke kelipatan 90° terdekat
                    this.snapRotation(c);

                    // Update logicalPos dari posisi baru
                    c.userData.logicalPos = {
                        x: Math.round(c.position.x / s),
                        y: Math.round(c.position.y / s),
                        z: Math.round(c.position.z / s)
                    };
                }

                // === Update warna sticker dari logicalPos baru ===
                // (bukan rebuild mesh, cuma update material color)
                this.refreshStickerColors();

                this.isAnimating = false;

                if (onComplete) onComplete();

                // Proses queue
                if (this.animQueue.length > 0) {
                    const next = this.animQueue.shift();
                    setTimeout(() => this.animateMove(next.move, next.onComplete), 0);
                }
            }
        };

        requestAnimationFrame(tick);
    }

    /**
     * Snap rotasi mesh ke kelipatan 90° (Math.PI/2)
     * Menggunakan matriks supaya akurat
     */
    snapRotation(mesh) {
        // Ambil matriks rotasi
        const e = new THREE.Euler().setFromQuaternion(mesh.quaternion, 'XYZ');
        const halfPi = Math.PI / 2;

        e.x = Math.round(e.x / halfPi) * halfPi;
        e.y = Math.round(e.y / halfPi) * halfPi;
        e.z = Math.round(e.z / halfPi) * halfPi;

        // Normalisasi sudut (hindari -0 dan 2π)
        ['x', 'y', 'z'].forEach(k => {
            if (Math.abs(e[k]) < 1e-6) e[k] = 0;
        });

        mesh.quaternion.setFromEuler(e);
    }

    /**
     * Update warna material cubie berdasarkan logicalPos saat ini
     * Dipanggil setelah move selesai. Ini menggantikan rebuild dari state.
     * 
     * PENTING: kita track WARNA sticker per-face, bukan dari state array.
     * Karena state array di-update terpisah oleh app.js, kita update
     * material color dari cube.state → tapi kita harus tahu mapping-nya.
     * 
     * Cara paling aman: simpan sticker color sebagai userData per-face
     * dan rotasikan bersamaan dengan cubie.
     */
    refreshStickerColors() {
        // Tidak ada yang perlu dilakukan di sini jika kita sudah maintain
        // sticker color di userData per-cubie. Lihat animateMove → tidak
        // ada update warna karena kita simpan warna di userData.
        // 
        // Tapi karena material color tidak auto-rotate saat mesh berputar,
        // kita harus rotasi warna antar face material secara manual.
        // 
        // Untuk simplisitas dan konsistensi, kita update dari state cube.js
        // yang sudah di-update oleh app.js.
        if (this.currentState && this.currentState.length === 54) {
            // Mapping state → material via logicalPos saat ini
            // (perlu mapping face 3D → face sticker index di state)
            // 
            // Karena warna di state SUDAH benar setelah move,
            // kita bisa langsung pakai updateFromState-like logic
            // tapi berdasarkan logicalPos (posisi cubie saat ini).
            this.applyStateFromCurrent(this.currentState);
        }
    }

    /**
     * Simpan referensi state terbaru dari app.js
     * supaya animateMove bisa update warna tanpa rebuild
     */
    setCurrentState(state) {
        this.currentState = [...state];
        this.updateFromState(this.currentState);
    }

    /**
     * Update warna material berdasarkan logicalPos + state
     * (dipanggil setelah move selesai untuk refresh)
     */
    applyStateFromCurrent(state) {
        for (const mesh of this.cubies) {
            const { x, y, z } = mesh.userData.logicalPos;

            // Reset dulu semua ke body color
            mesh.material.forEach(m => m.color.setHex(0x151515));

            if (x === 1) {
                const idx = this.getFaceStickerIndex('R', x, y, z);
                if (idx >= 0 && state[9 + idx]) {
                    mesh.material[0].color.setHex(this.colors[state[9 + idx]]);
                }
            }
            if (x === -1) {
                const idx = this.getFaceStickerIndex('L', x, y, z);
                if (idx >= 0 && state[36 + idx]) {
                    mesh.material[1].color.setHex(this.colors[state[36 + idx]]);
                }
            }
            if (y === 1) {
                const idx = this.getFaceStickerIndex('U', x, y, z);
                if (idx >= 0 && state[0 + idx]) {
                    mesh.material[2].color.setHex(this.colors[state[0 + idx]]);
                }
            }
            if (y === -1) {
                const idx = this.getFaceStickerIndex('D', x, y, z);
                if (idx >= 0 && state[27 + idx]) {
                    mesh.material[3].color.setHex(this.colors[state[27 + idx]]);
                }
            }
            if (z === 1) {
                const idx = this.getFaceStickerIndex('F', x, y, z);
                if (idx >= 0 && state[18 + idx]) {
                    mesh.material[4].color.setHex(this.colors[state[18 + idx]]);
                }
            }
            if (z === -1) {
                const idx = this.getFaceStickerIndex('B', x, y, z);
                if (idx >= 0 && state[45 + idx]) {
                    mesh.material[5].color.setHex(this.colors[state[45 + idx]]);
                }
            }
        }
    }

    getFaceAxis(face) {
        switch (face) {
            case 'U': case 'D': return 'y';
            case 'R': case 'L': return 'x';
            case 'F': case 'B': return 'z';
            default: return 'y';
        }
    }

    getFaceValue(face) {
        switch (face) {
            case 'U': return 1;
            case 'D': return -1;
            case 'R': return 1;
            case 'L': return -1;
            case 'F': return 1;
            case 'B': return -1;
            default: return 1;
        }
    }

    highlightLayer(face) {
        const axis = this.getFaceAxis(face);
        const value = this.getFaceValue(face);

        for (const mesh of this.cubies) {
            if (mesh.userData.logicalPos[axis] === value) {
                mesh.material.forEach(m => {
                    m.emissive = new THREE.Color(0x0a84ff);
                    m.emissiveIntensity = 0.35;
                });
            }
        }
    }

    clearHighlight() {
        for (const mesh of this.cubies) {
            mesh.material.forEach(m => {
                m.emissive = new THREE.Color(0x000000);
                m.emissiveIntensity = 0;
            });
        }
    }

    reset() {
        this.cubeGroup.rotation.set(0, 0, 0);
        this.buildCube();
        this.rotation = { x: 0.5, y: 0.5 };
        this.rotationVelocity = { x: 0, y: 0 };
    }

    dispose() {
        if (this.renderer) {
            this.renderer.dispose();
            if (this.renderer.domElement && this.renderer.domElement.parentNode) {
                this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
            }
        }
    }
}

if (typeof module !== 'undefined' && module.exports) module.exports = Cube3D;
