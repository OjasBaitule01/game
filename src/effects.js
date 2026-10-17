import * as THREE from 'three';

export class EffectsManager {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;

    this.particles = [];
    this.speedLinesCanvas = document.getElementById('speed-lines');
    this.speedLinesCtx = this.speedLinesCanvas ? this.speedLinesCanvas.getContext('2d') : null;
    this.screenFlashEl = document.getElementById('screen-flash');
    this.combatPopupsEl = document.getElementById('combat-popups');

    this.isReducedFx = false;

    // Resize speed lines canvas
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    // Speed lines particles
    this.speedLines = [];
    this.initSpeedLines();
  }

  resizeCanvas() {
    if (!this.speedLinesCanvas) return;
    this.speedLinesCanvas.width = window.innerWidth;
    this.speedLinesCanvas.height = window.innerHeight;
  }

  initSpeedLines() {
    this.speedLines = [];
    for (let i = 0; i < 40; i++) {
      this.speedLines.push({
        angle: Math.random() * Math.PI * 2,
        distance: 100 + Math.random() * 300,
        length: 60 + Math.random() * 120,
        speed: 800 + Math.random() * 1200,
        alpha: 0.2 + Math.random() * 0.5,
      });
    }
  }

  // EXPLOSION EFFECT
  spawnExplosion(pos, isLarge = false) {
    const particleCount = this.isReducedFx ? (isLarge ? 12 : 8) : (isLarge ? 28 : 16);

    // 1. Expanding Core Sphere
    const coreGeom = new THREE.SphereGeometry(isLarge ? 3.0 : 1.8, 8, 8);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.95,
    });
    const core = new THREE.Mesh(coreGeom, coreMat);
    core.position.copy(pos);
    this.scene.add(core);

    this.particles.push({
      mesh: core,
      type: 'expand_fade',
      scaleSpeed: isLarge ? 22 : 16,
      fadeSpeed: 2.2,
      opacity: 0.95,
    });

    // 2. Shockwave Ring
    const ringGeom = new THREE.RingGeometry(0.8, 1.4, 16);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xff3300,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.position.copy(pos);
    ring.lookAt(this.camera.position);
    this.scene.add(ring);

    this.particles.push({
      mesh: ring,
      type: 'expand_fade',
      scaleSpeed: isLarge ? 30 : 20,
      fadeSpeed: 2.5,
      opacity: 0.8,
    });

    // 3. Debris Shards
    const shardGeom = new THREE.DodecahedronGeometry(0.4, 0);
    const shardColors = [0xffdd00, 0xff5500, 0x333333, 0x888888];

    for (let i = 0; i < particleCount; i++) {
      const color = shardColors[Math.floor(Math.random() * shardColors.length)];
      const shardMat = new THREE.MeshBasicMaterial({ color: color });
      const shard = new THREE.Mesh(shardGeom, shardMat);
      shard.position.copy(pos);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 45,
        (Math.random() - 0.5) * 45,
        (Math.random() - 0.5) * 45
      );

      this.scene.add(shard);
      this.particles.push({
        mesh: shard,
        velocity: vel,
        type: 'debris',
        lifetime: 0.6 + Math.random() * 0.4,
        rotSpeed: new THREE.Vector3(
          Math.random() * 10,
          Math.random() * 10,
          Math.random() * 10
        ),
      });
    }
  }

  // NOVA SHOCKWAVE EFFECT (Supersonic EMP Bomb Blast)
  spawnNovaShockwave(pos) {
    const ringGeom = new THREE.RingGeometry(1.5, 3.2, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.position.copy(pos);
    ring.rotation.x = Math.PI / 2;

    this.scene.add(ring);
    this.particles.push({
      mesh: ring,
      type: 'expand_fade',
      scaleSpeed: 55,
      fadeSpeed: 1.8,
      opacity: 0.95,
    });

    // Secondary golden shockwave ring
    const ringGeom2 = new THREE.RingGeometry(2.0, 3.8, 48);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const ring2 = new THREE.Mesh(ringGeom2, ringMat2);
    ring2.position.copy(pos);

    this.scene.add(ring2);
    this.particles.push({
      mesh: ring2,
      type: 'expand_fade',
      scaleSpeed: 45,
      fadeSpeed: 1.5,
      opacity: 0.85,
    });

    // Electric Nova Spark Dispersal
    const sparkCount = this.isReducedFx ? 18 : 36;
    const sparkGeom = new THREE.SphereGeometry(0.45, 4, 4);
    const sparkMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

    for (let i = 0; i < sparkCount; i++) {
      const spark = new THREE.Mesh(sparkGeom, sparkMat);
      spark.position.copy(pos);
      const angle = (i / sparkCount) * Math.PI * 2;
      const speed = 35 + Math.random() * 20;
      const vel = new THREE.Vector3(Math.cos(angle) * speed, Math.sin(angle) * speed, (Math.random() - 0.5) * 20);

      this.scene.add(spark);
      this.particles.push({
        mesh: spark,
        velocity: vel,
        type: 'debris',
        lifetime: 0.7,
      });
    }
  }

  // MISSILE SMOKE PUFF
  spawnMissileSmoke(pos) {
    if (this.isReducedFx) return;

    const geom = new THREE.DodecahedronGeometry(0.35, 0);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xdddddd,
      transparent: true,
      opacity: 0.7,
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.copy(pos);
    mesh.position.x += (Math.random() - 0.5) * 0.3;
    mesh.position.y += (Math.random() - 0.5) * 0.3;

    this.scene.add(mesh);
    this.particles.push({
      mesh,
      type: 'smoke',
      fadeSpeed: 2.8,
      opacity: 0.7,
      scaleSpeed: 3.5,
    });
  }

  // POWERUP BURST
  spawnPowerupBurst(pos, type) {
    let color = 0x00ff88;
    if (type === 'shield') color = 0x00f0ff;
    if (type === 'rapid') color = 0xffaa00;
    if (type === 'missiles') color = 0xc044ff;

    const count = this.isReducedFx ? 8 : 16;
    const geom = new THREE.SphereGeometry(0.3, 4, 4);
    const mat = new THREE.MeshBasicMaterial({ color: color });

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.copy(pos);

      const angle = (i / count) * Math.PI * 2;
      const speed = 20;
      const vel = new THREE.Vector3(Math.cos(angle) * speed, Math.sin(angle) * speed, 0);

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: vel,
        type: 'debris',
        lifetime: 0.4,
      });
    }
  }

  // SCREEN FLASH
  flashScreen(type = 'damage') {
    if (!this.screenFlashEl) return;
    this.screenFlashEl.className = `screen-flash ${type}`;
    setTimeout(() => {
      if (this.screenFlashEl) this.screenFlashEl.className = 'screen-flash';
    }, 120);
  }

  // FLOATING COMBAT TEXT (3D to 2D projection)
  spawnFloatingText(worldPos, text, isCrit = false) {
    if (!this.combatPopupsEl) return;

    // Project world coordinates to 2D screen
    const screenPos = worldPos.clone().project(this.camera);

    // Behind camera check
    if (screenPos.z > 1) return;

    const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;

    const popup = document.createElement('div');
    popup.className = `combat-popup ${isCrit ? 'crit' : ''}`;
    popup.textContent = text;
    popup.style.left = `${x}px`;
    popup.style.top = `${y}px`;

    this.combatPopupsEl.appendChild(popup);
    setTimeout(() => popup.remove(), 1200);
  }

  // UPDATE PARTICLES & SPEED LINES
  update(delta, isBoosting) {
    // 1. Update 3D Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      if (p.type === 'debris') {
        p.lifetime -= delta;
        p.mesh.position.add(p.velocity.clone().multiplyScalar(delta));
        if (p.rotSpeed) {
          p.mesh.rotation.x += p.rotSpeed.x * delta;
          p.mesh.rotation.y += p.rotSpeed.y * delta;
        }
        if (p.lifetime <= 0) {
          this.scene.remove(p.mesh);
          this.particles.splice(i, 1);
        }
      } else if (p.type === 'expand_fade') {
        p.opacity -= p.fadeSpeed * delta;
        p.mesh.material.opacity = Math.max(0, p.opacity);
        p.mesh.scale.addScalar(p.scaleSpeed * delta);
        if (p.opacity <= 0) {
          this.scene.remove(p.mesh);
          this.particles.splice(i, 1);
        }
      } else if (p.type === 'smoke') {
        p.opacity -= p.fadeSpeed * delta;
        p.mesh.material.opacity = Math.max(0, p.opacity);
        p.mesh.scale.addScalar(p.scaleSpeed * delta);
        p.mesh.position.z += 12 * delta; // Drift back
        if (p.opacity <= 0) {
          this.scene.remove(p.mesh);
          this.particles.splice(i, 1);
        }
      }
    }

    // 2. Update Speed Lines Canvas during Boost
    this.updateSpeedLines(delta, isBoosting);
  }

  updateSpeedLines(delta, isBoosting) {
    if (!this.speedLinesCanvas || !this.speedLinesCtx) return;

    if (!isBoosting || this.isReducedFx) {
      if (this.speedLinesCanvas.classList.contains('active')) {
        this.speedLinesCanvas.classList.remove('active');
        this.speedLinesCtx.clearRect(0, 0, this.speedLinesCanvas.width, this.speedLinesCanvas.height);
      }
      return;
    }

    if (!this.speedLinesCanvas.classList.contains('active')) {
      this.speedLinesCanvas.classList.add('active');
    }

    const ctx = this.speedLinesCtx;
    const w = this.speedLinesCanvas.width;
    const h = this.speedLinesCanvas.height;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.8;

    this.speedLines.forEach(line => {
      line.distance += line.speed * delta;
      if (line.distance > Math.max(w, h)) {
        line.distance = 40 + Math.random() * 80;
        line.angle = Math.random() * Math.PI * 2;
      }

      const cos = Math.cos(line.angle);
      const sin = Math.sin(line.angle);

      const x1 = cx + cos * line.distance;
      const y1 = cy + sin * line.distance;
      const x2 = cx + cos * (line.distance + line.length);
      const y2 = cy + sin * (line.distance + line.length);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.globalAlpha = line.alpha;
      ctx.stroke();
    });

    ctx.globalAlpha = 1.0;
  }

  setReducedFx(val) {
    this.isReducedFx = val;
  }

  clearAll() {
    this.particles.forEach(p => this.scene.remove(p.mesh));
    this.particles = [];
    if (this.speedLinesCtx && this.speedLinesCanvas) {
      this.speedLinesCtx.clearRect(0, 0, this.speedLinesCanvas.width, this.speedLinesCanvas.height);
      this.speedLinesCanvas.classList.remove('active');
    }
  }
}
