/**
 * cube3d.js - Visualisasi Rubik 3D menggunakan Three.js
 * 
 * 27 cubie, masing-masing dengan sticker warna
 * Mendukung rotasi layer dengan animasi smooth
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
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // Animation state
        this.isAnimating = false;
        this.animationQueue = [];
        this.rotationSpeed = 0.15;
        
        // Warna Rubik
        this.colors = {
            'white': 0xffffff,
            'yellow': 0xffd500,
            'red': 0xc41e3a,
            'orange': 0xff5800,
            'blue': 0x0051ba,
            'green': 0x009e60
        };
        
        // Highlight
        this.highlightMaterial = null;
        this.highlightedCubies = [];
        
        // Mouse control
        this.isDragging = false;
        this.previousMouse = { x: 0, y: 0 };
        this.rotationVelocity = { x: 0, y: 0 };
        this.rotation = { x: 0.5, y: 0.5 };
        
        // Ukuran cubie
        this.cubieSize = 1;
        this.gap = 0.05;
        
        this.init();
    }

    /**
     * Inisialisasi scene, camera, renderer
     */
    init() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = null;

        // Camera
        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        this.camera.position.set(5, 5, 7);
        this.camera.lookAt(0, 0, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = false;
        this.container.appendChild(this.renderer.domElement);

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.5);
        dirLight1.position.set(1, 1, 1);
        this.scene.add(dirLight1);

        const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
        dirLight2.position.set(-1, -1, -0.5);
        this.scene.add(dirLight2);

        // Build cube
        this.buildCube();

        // Events
        this.setupEvents();

        // Start render loop
        this.animate();
    }

    /**
     * Build 27 cubies
     */
    buildCube() {
        // Clear existing
        for (const cubie of this.cubies) {
            this.scene.remove(cubie.mesh);
        }
        this.cubies = [];

        const size = this.cubieSize;
        const gap = this.gap;
        const step = size + gap;

        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                for (let z = -1; z <= 1; z++) {
                    const cubie = this.createCubie(x, y, z);
                    cubie.mesh.position.set(x * step, y * step, z * step);
                    this.scene.add(cubie.mesh);
                    this.cubies.push(cubie);
                }
            }
        }
    }

    /**
     * Buat satu cubie dengan 6 face material
     */
    createCubie(x, y, z) {
        const size = this.cubieSize;
        const geometry = new THREE.BoxGeometry(size, size, size);
        
        // Material untuk setiap face: right, left, top, bottom, front, back
        // Default: dark gray (body)
        const bodyColor = 0x1a1a1a;
        
        // Tentukan warna untuk setiap face berdasarkan posisi
        const materials = [
            new THREE.MeshStandardMaterial({ color: bodyColor }), // right (+x)
            new THREE.MeshStandardMaterial({ color: bodyColor }), // left (-x)
            new THREE.MeshStandardMaterial({ color: bodyColor }), // top (+y)
            new THREE.MeshStandardMaterial({ color: bodyColor }), // bottom (-y)
            new THREE.MeshStandardMaterial({ color: bodyColor }), // front (+z)
            new THREE.MeshStandardMaterial({ color: bodyColor })  // back (-z)
        ];

        // Set warna untuk face yang terlihat
        if (x === 1) materials[0].color.setHex(this.colors.red);
        if (x === -1) materials[1].color.setHex(this.colors.orange);
        if (y === 1) materials[2].color.setHex(this.colors.white);
        if (y === -1) materials[3].color.setHex(this.colors.yellow);
        if (z === 1) materials[4].color.setHex(this.colors.green);
        if (z === -1) materials[5].color.setHex(this.colors.blue);

        const mesh = new THREE.Mesh(geometry, materials);
        
        // Simpan posisi original untuk tracking
        const cubie = {
            mesh: mesh,
            originalPosition: { x, y, z },
            currentPosition: { x, y, z },
            x, y, z
        };

        return cubie;
    }

    /**
     * Setup event listeners
     */
    setupEvents() {
        const canvas = this.renderer.domElement;

        // Mouse events
        canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        canvas.addEventListener('mouseup', () => this.onMouseUp());
        canvas.addEventListener('mouseleave', () => this.onMouseUp());
        canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });

        // Touch events
        canvas.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
        canvas.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
        canvas.addEventListener('touchend', () => this.onTouchEnd());

        // Resize
        window.addEventListener('resize', () => this.onResize());
    }

    onMouseDown(e) {
        this.isDragging = true;
        this.previousMouse = { x: e.clientX, y: e.clientY };
        this.rotationVelocity = { x: 0, y: 0 };
    }

    onMouseMove(e) {
        if (!this.isDragging) return;
        const deltaX = e.clientX - this.previousMouse.x;
        const deltaY = e.clientY - this.previousMouse.y;
        
        this.rotation.y += deltaX * 0.01;
        this.rotation.x += deltaY * 0.01;
        
        this.rotationVelocity.x = deltaY * 0.01;
        this.rotationVelocity.y = deltaX * 0.01;
        
        this.previousMouse = { x: e.clientX, y: e.clientY };
    }

    onMouseUp() {
        this.isDragging = false;
    }

    onWheel(e) {
        e.preventDefault();
        const zoom = e.deltaY > 0 ? 1.05 : 0.95;
        this.camera.position.multiplyScalar(zoom);
        
        // Clamp
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
        
        const deltaX = e.touches[0].clientX - this.previousMouse.x;
        const deltaY = e.touches[0].clientY - this.previousMouse.y;
        
        this.rotation.y += deltaX * 0.01;
        this.rotation.x += deltaY * 0.01;
        
        this.rotationVelocity.x = deltaY * 0.01;
        this.rotationVelocity.y = deltaX * 0.01;
        
        this.previousMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }

    onTouchEnd() {
        this.isDragging = false;
    }

    onResize() {
        if (!this.container) return;
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    /**
     * Render loop
     */
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Apply rotation with inertia
        if (!this.isDragging) {
            this.rotation.x += this.rotationVelocity.x;
            this.rotation.y += this.rotationVelocity.y;
            this.rotationVelocity.x *= 0.95;
            this.rotationVelocity.y *= 0.95;
        }
        
        // Clamp rotation.x
        this.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.rotation.x));
        
        // Apply rotation to cube group
        this.scene.rotation.x = this.rotation.x;
        this.scene.rotation.y = this.rotation.y;
        
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Update cube state dari array 54 warna
     */
    updateFromState(state) {
        // Reset cube ke solved dulu
        this.buildCube();
        
        // Update sticker colors berdasarkan state
        // Mapping state index ke posisi cubie dan face
        this.applyStateToCubies(state);
    }

    /**
     * Apply state colors ke cubies
     * Mapping: setiap sticker di state di-map ke face cubie yang sesuai
     */
    applyStateToCubies(state) {
        // Face index mapping:
        // U=0-8, R=9-17, F=18-26, D=27-35, L=36-44, B=45-53
        
        // Untuk setiap cubie, tentukan sticker mana yang harus di-update
        for (const cubie of this.cubies) {
            const { x, y, z } = cubie.originalPosition;
            
            // Face: right (+x)
            if (x === 1) {
                const idx = this.getFaceStickerIndex('R', x, y, z);
                if (idx >= 0) {
                    const color = state[9 + idx];
                    cubie.mesh.material[0].color.setHex(this.colors[color]);
                }
            }
            // Face: left (-x)
            if (x === -1) {
                const idx = this.getFaceStickerIndex('L', x, y, z);
                if (idx >= 0) {
                    const color = state[36 + idx];
                    cubie.mesh.material[1].color.setHex(this.colors[color]);
                }
            }
            // Face: top (+y)
            if (y === 1) {
                const idx = this.getFaceStickerIndex('U', x, y, z);
                if (idx >= 0) {
                    const color = state[0 + idx];
                    cubie.mesh.material[2].color.setHex(this.colors[color]);
                }
            }
            // Face: bottom (-y)
            if (y === -1) {
                const idx = this.getFaceStickerIndex('D', x, y, z);
                if (idx >= 0) {
                    const color = state[27 + idx];
                    cubie.mesh.material[3].color.setHex(this.colors[color]);
                }
            }
            // Face: front (+z)
            if (z === 1) {
                const idx = this.getFaceStickerIndex('F', x, y, z);
                if (idx >= 0) {
                    const color = state[18 + idx];
                    cubie.mesh.material[4].color.setHex(this.colors[color]);
                }
            }
            // Face: back (-z)
            if (z === -1) {
                const idx = this.getFaceStickerIndex('B', x, y, z);
                if (idx >= 0) {
                    const color = state[45 + idx];
                    cubie.mesh.material[5].color.setHex(this.colors[color]);
                }
            }
        }
    }

    /**
     * Dapatkan index sticker (0-8) untuk face tertentu berdasarkan posisi cubie
     */
    getFaceStickerIndex(face, x, y, z) {
        // Mapping posisi 3D ke index 0-8 pada face 2D
        // Index face: 0 1 2 / 3 4 5 / 6 7 8
        
        switch (face) {
            case 'U': // y=1, lihat dari atas: x=kiri-kanan, z=depan-belakang
                // U face: baris = -z (depan ke belakang), kolom = x (kiri ke kanan)
                return (z + 1) * 3 + (x + 1);
            case 'D': // y=-1, lihat dari bawah
                return (1 - z) * 3 + (x + 1);
            case 'R': // x=1, lihat dari kanan: z=depan-belakang, y=atas-bawah
                return (1 - y) * 3 + (1 - z);
            case 'L': // x=-1, lihat dari kiri
                return (1 - y) * 3 + (z + 1);
            case 'F': // z=1, lihat dari depan: x=kiri-kanan, y=atas-bawah
                return (1 - y) * 3 + (x + 1);
            case 'B': // z=-1, lihat dari belakang
                return (1 - y) * 3 + (1 - x);
            default:
                return -1;
        }
    }

    /**
     * Highlight layer yang akan diputar
     */
    highlightLayer(face) {
        this.clearHighlight();
        
        const axis = this.getFaceAxis(face);
        const value = this.getFaceValue(face);
        
        for (const cubie of this.cubies) {
            if (cubie.originalPosition[axis] === value) {
                // Add highlight effect (outline)
                cubie.mesh.material.forEach(mat => {
                    mat.emissive = new THREE.Color(0x0071e3);
                    mat.emissiveIntensity = 0.3;
                });
                this.highlightedCubies.push(cubie);
            }
        }
    }

    clearHighlight() {
        for (const cubie of this.highlightedCubies) {
            cubie.mesh.material.forEach(mat => {
                mat.emissive = new THREE.Color(0x000000);
                mat.emissiveIntensity = 0;
            });
        }
        this.highlightedCubies = [];
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

    /**
     * Animasikan gerakan pada cube 3D
     * @param {string} move - Notasi gerakan
     * @param {Function} onComplete - Callback setelah selesai
     */
    animateMove(move, onComplete) {
        if (this.isAnimating) return;
        this.isAnimating = true;

        const face = move[0];
        const modifier = move.slice(1);
        
        // Tentukan sudut rotasi
        let angle = Math.PI / 2; // 90°
        if (modifier === "'") angle = -Math.PI / 2;
        if (modifier === '2') angle = Math.PI; // 180°

        // Highlight layer
        this.highlightLayer(face);

        // Dapatkan cubies yang akan diputar
        const axis = this.getFaceAxis(face);
        const value = this.getFaceValue(face);
        
        const affectedCubies = this.cubies.filter(
            c => c.mesh.position[axis] > value - 0.5 && 
                 c.mesh.position[axis] < value + 0.5
        );

        // Buat pivot group
        const pivot = new THREE.Group();
        this.scene.add(pivot);
        
        // Pindahkan cubies ke pivot
        for (const cubie of affectedCubies) {
            pivot.attach(cubie.mesh);
        }

        // Animasi
        const startTime = performance.now();
        const duration = 350; // ms
        const startAngle = 0;
        
        const animateRotation = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing smooth
            const eased = this.easeInOutCubic(progress);
            const currentAngle = startAngle + (angle * eased);
            
            // Apply rotation
            if (axis === 'x') pivot.rotation.x = currentAngle;
            if (axis === 'y') pivot.rotation.y = currentAngle;
            if (axis === 'z') pivot.rotation.z = currentAngle;

            if (progress < 1) {
                requestAnimationFrame(animateRotation);
            } else {
                // Selesai: kembalikan cubies ke scene
                pivot.rotation.set(0, 0, 0);
                pivot.updateMatrixWorld(true);
                
                for (const cubie of affectedCubies) {
                    this.scene.attach(cubie.mesh);
                    
                    // Update originalPosition
                    const pos = cubie.mesh.position;
                    cubie.originalPosition = {
                        x: Math.round(pos.x / (this.cubieSize + this.gap)),
                        y: Math.round(pos.y / (this.cubieSize + this.gap)),
                        z: Math.round(pos.z / (this.cubieSize + this.gap))
                    };
                    
                    // Snap position
                    pos.x = Math.round(pos.x / (this.cubieSize + this.gap)) * (this.cubieSize + this.gap);
                    pos.y = Math.round(pos.y / (this.cubieSize + this.gap)) * (this.cubieSize + this.gap);
                    pos.z = Math.round(pos.z / (this.cubieSize + this.gap)) * (this.cubieSize + this.gap);
                    
                    // Snap rotation
                    cubie.mesh.rotation.x = Math.round(cubie.mesh.rotation.x / (Math.PI/2)) * (Math.PI/2);
                    cubie.mesh.rotation.y = Math.round(cubie.mesh.rotation.y / (Math.PI/2)) * (Math.PI/2);
                    cubie.mesh.rotation.z = Math.round(cubie.mesh.rotation.z / (Math.PI/2)) * (Math.PI/2);
                }
                
                this.scene.remove(pivot);
                this.clearHighlight();
                this.isAnimating = false;
                
                if (onComplete) onComplete();
            }
        };

        requestAnimationFrame(animateRotation);
    }

    /**
     * Easing function
     */
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    /**
     * Reset cube ke solved state
     */
    reset() {
        this.buildCube();
        this.rotation = { x: 0.5, y: 0.5 };
        this.rotationVelocity = { x: 0, y: 0 };
    }

    /**
     * Dispose
     */
    dispose() {
        if (this.renderer) {
            this.renderer.dispose();
            if (this.renderer.domElement && this.renderer.domElement.parentNode) {
                this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
            }
        }
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Cube3D;
          }
