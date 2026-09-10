/**
 * cube3d.js - Visualisasi Rubik 3D menggunakan Three.js
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

        this.colors = {
            'white': 0xffffff, 'yellow': 0xffd500, 'red': 0xc41e3a,
            'orange': 0xff5800, 'blue': 0x0051ba, 'green': 0x009e60
        };

        this.highlightedCubies = [];
        this.isDragging = false;
        this.previousMouse = { x: 0, y: 0 };
        this.rotationVelocity = { x: 0, y: 0 };
        this.rotation = { x: 0.5, y: 0.5 };

        this.cubieSize = 1;
        this.gap = 0.05;

        this.init();
    }

    init() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        this.scene = new THREE.Scene();
        this.scene.background = null;

        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        this.camera.position.set(5, 5, 7);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.5);
        dirLight1.position.set(1, 1, 1);
        this.scene.add(dirLight1);

        const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
        dirLight2.position.set(-1, -1, -0.5);
        this.scene.add(dirLight2);

        this.buildCube();
        this.setupEvents();
        this.animate();
    }

    buildCube() {
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

    createCubie(x, y, z) {
        const size = this.cubieSize;
        const geometry = new THREE.BoxGeometry(size, size, size);
        const bodyColor = 0x1a1a1a;
        
        const materials = [
            new THREE.MeshStandardMaterial({ color: bodyColor }),
            new THREE.MeshStandardMaterial({ color: bodyColor }),
            new THREE.MeshStandardMaterial({ color: bodyColor }),
            new THREE.MeshStandardMaterial({ color: bodyColor }),
            new THREE.MeshStandardMaterial({ color: bodyColor }),
            new THREE.MeshStandardMaterial({ color: bodyColor })
        ];

        if (x === 1) materials[0].color.setHex(this.colors.red);
        if (x === -1) materials[1].color.setHex(this.colors.orange);
        if (y === 1) materials[2].color.setHex(this.colors.white);
        if (y === -1) materials[3].color.setHex(this.colors.yellow);
        if (z === 1) materials[4].color.setHex(this.colors.green);
        if (z === -1) materials[5].color.setHex(this.colors.blue);

        const mesh = new THREE.Mesh(geometry, materials);
        
        return {
            mesh: mesh,
            originalPosition: { x, y, z },
            x, y, z
        };
    }

    setupEvents() {
        const canvas = this.renderer.domElement;

        canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        canvas.addEventListener('mouseup', () => this.onMouseUp());
        canvas.addEventListener('mouseleave', () => this.onMouseUp());
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
        
        this.scene.rotation.x = this.rotation.x;
        this.scene.rotation.y = this.rotation.y;
        
        this.renderer.render(this.scene, this.camera);
    }

    updateFromState(state) {
        this.buildCube();
        this.applyStateToCubies(state);
    }

    applyStateToCubies(state) {
        for (const cubie of this.cubies) {
            const { x, y, z } = cubie.originalPosition;
            
            if (x === 1) {
                const idx = this.getFaceStickerIndex('R', x, y, z);
                if (idx >= 0 && state[9 + idx]) {
                    cubie.mesh.material[0].color.setHex(this.colors[state[9 + idx]]);
                }
            }
            if (x === -1) {
                const idx = this.getFaceStickerIndex('L', x, y, z);
                if (idx >= 0 && state[36 + idx]) {
                    cubie.mesh.material[1].color.setHex(this.colors[state[36 + idx]]);
                }
            }
            if (y === 1) {
                const idx = this.getFaceStickerIndex('U', x, y, z);
                if (idx >= 0 && state[0 + idx]) {
                    cubie.mesh.material[2].color.setHex(this.colors[state[0 + idx]]);
                }
            }
            if (y === -1) {
                const idx = this.getFaceStickerIndex('D', x, y, z);
                if (idx >= 0 && state[27 + idx]) {
                    cubie.mesh.material[3].color.setHex(this.colors[state[27 + idx]]);
                }
            }
            if (z === 1) {
                const idx = this.getFaceStickerIndex('F', x, y, z);
                if (idx >= 0 && state[18 + idx]) {
                    cubie.mesh.material[4].color.setHex(this.colors[state[18 + idx]]);
                }
            }
            if (z === -1) {
                const idx = this.getFaceStickerIndex('B', x, y, z);
                if (idx >= 0 && state[45 + idx]) {
                    cubie.mesh.material[5].color.setHex(this.colors[state[45 + idx]]);
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

    highlightLayer(face) {
        this.clearHighlight();
        const axis = this.getFaceAxis(face);
        const value = this.getFaceValue(face);
        
        for (const cubie of this.cubies) {
            if (cubie.originalPosition[axis] === value) {
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

    animateMove(move, onComplete) {
        if (this.isAnimating) {
            if (onComplete) onComplete();
            return;
        }
        this.isAnimating = true;

        const face = move[0];
        const modifier = move.slice(1);
        
        let angle = Math.PI / 2;
        if (modifier === "'") angle = -Math.PI / 2;
        if (modifier === '2') angle = Math.PI;

        this.highlightLayer(face);

        const axis = this.getFaceAxis(face);
        const value = this.getFaceValue(face);
        
        const affectedCubies = this.cubies.filter(
            c => c.mesh.position[axis] > value - 0.5 && 
                 c.mesh.position[axis] < value + 0.5
        );

        const pivot = new THREE.Group();
        this.scene.add(pivot);
        
        for (const cubie of affectedCubies) {
            pivot.attach(cubie.mesh);
        }

        const startTime = performance.now();
        const duration = 350;
        
        const animateRotation = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = this.easeInOutCubic(progress);
            const currentAngle = angle * eased;
            
            if (axis === 'x') pivot.rotation.x = currentAngle;
            if (axis === 'y') pivot.rotation.y = currentAngle;
            if (axis === 'z') pivot.rotation.z = currentAngle;

            if (progress < 1) {
                requestAnimationFrame(animateRotation);
            } else {
                pivot.rotation.set(0, 0, 0);
                pivot.updateMatrixWorld(true);
                
                const step = this.cubieSize + this.gap;
                for (const cubie of affectedCubies) {
                    this.scene.attach(cubie.mesh);
                    
                    const pos = cubie.mesh.position;
                    cubie.originalPosition = {
                        x: Math.round(pos.x / step),
                        y: Math.round(pos.y / step),
                        z: Math.round(pos.z / step)
                    };
                    
                    pos.x = Math.round(pos.x / step) * step;
                    pos.y = Math.round(pos.y / step) * step;
                    pos.z = Math.round(pos.z / step) * step;
                    
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

    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    reset() {
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
