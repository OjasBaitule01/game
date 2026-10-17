import * as THREE from 'three';
import { CONFIG } from './config.js';
import { modelFactory } from './models.js';

// Multi-Boss Formation Layout (Inverted V / Wingspan Armada)
const BOSS_FORMATION_SLOTS = {
  'boss_winged':     { offsetX: -28, offsetY:  3, targetZ: -72, weaveFreq: 0.85, weaveAmp: 8 },
  'boss_mask':       { offsetX: -14, offsetY: -2, targetZ: -62, weaveFreq: 0.75, weaveAmp: 10 },
  'boss_tenheaded':  { offsetX:   0, offsetY:  6, targetZ: -80, weaveFreq: 0.60, weaveAmp: 7 },
  'boss_golden':     { offsetX:  14, offsetY: -2, targetZ: -62, weaveFreq: 0.75, weaveAmp: 10 },
  'boss_buffalo':    { offsetX:  28, offsetY:  3, targetZ: -72, weaveFreq: 0.85, weaveAmp: 8 },
  'boss_asura':      { offsetX:   0, offsetY: -4, targetZ: -66, weaveFreq: 0.70, weaveAmp: 12 },
};

export class Enemy {
  constructor(type, waveNumber, scene) {
    this.type = type;
    this.scene = scene;
    this.waveNumber = waveNumber;

    // Difficulty scaling past wave 1
    const difficultyMultiplier = 1 + Math.max(0, waveNumber - 1) * 0.15;

    // Boss or Standard Enemy lookup
    this.isBoss = type.startsWith('boss_');
    this.bossConfig = this.isBoss ? (CONFIG.rakshasBosses.find(b => b.type === type || b.id === type) || CONFIG.rakshasBosses[0]) : null;

    if (this.isBoss) {
      this.name = this.bossConfig.name;
      this.title = this.bossConfig.title;
      this.image = this.bossConfig.image;
      this.auraName = this.bossConfig.auraName;
      this.auraColor = this.bossConfig.auraColor;
      this.maxHealth = Math.round(this.bossConfig.health * difficultyMultiplier);
      this.health = this.maxHealth;
      this.speed = this.bossConfig.speed * Math.min(1.3, 1 + (waveNumber - 1) * 0.05);
      this.points = this.bossConfig.points;
      this.fireInterval = Math.max(0.65, this.bossConfig.fireInterval - (waveNumber - 1) * 0.05);
      this.damage = this.bossConfig.damage;
      this.bulletSpeed = this.bossConfig.bulletSpeed || 170;
      this.mesh = modelFactory.createRakshasBoss(this.bossConfig);
      this.formationSlot = BOSS_FORMATION_SLOTS[type] || { offsetX: 0, offsetY: 4, targetZ: -65, weaveFreq: 0.7, weaveAmp: 10 };
    } else {
      const baseConfig = CONFIG.enemies[type] || CONFIG.enemies.scout;
      this.name = baseConfig.name;
      this.maxHealth = Math.round(baseConfig.health * difficultyMultiplier);
      this.health = this.maxHealth;
      this.speed = baseConfig.speed * Math.min(1.4, 1 + (waveNumber - 1) * 0.05);
      this.points = baseConfig.points;
      this.fireInterval = Math.max(1.1, baseConfig.fireInterval - (waveNumber - 1) * 0.12);
      this.damage = baseConfig.damage;
      this.bulletSpeed = 160;
      this.formationSlot = null;

      if (type === 'scout') {
        this.mesh = modelFactory.createScoutPlane();
      } else if (type === 'interceptor') {
        this.mesh = modelFactory.createInterceptorPlane();
      } else {
        this.mesh = modelFactory.createHeavyGunship();
      }
    }

    this.fireTimer = Math.random() * 1.5; // Random initial offset
    this.radius = this.mesh.userData.radius || 2.5;
    this.position = this.mesh.position;
    this.isDead = false;

    // AI Flight State
    const slotOffset = this.formationSlot ? Math.abs(this.formationSlot.offsetX) * 0.4 : 0;
    this.patternTime = slotOffset + Math.random() * 20;
    this.weaveFrequency = type === 'scout' ? 2.5 : (type === 'interceptor' ? 1.8 : (this.formationSlot ? this.formationSlot.weaveFreq : 0.7));
    this.weaveAmplitude = type === 'scout' ? 14 : (type === 'interceptor' ? 10 : (this.formationSlot ? this.formationSlot.weaveAmp : 12));
    this.baseX = this.formationSlot ? this.formationSlot.offsetX : 0;
    this.baseY = this.formationSlot ? this.formationSlot.offsetY : 0;
    this.bossAttackIndex = 0;

    // Flash material on hit
    this.hitFlashTimer = 0;
    this.originalMaterials = [];
    this.cacheOriginalMaterials(this.mesh);

    this.scene.add(this.mesh);
  }

  cacheOriginalMaterials(object) {
    object.traverse((child) => {
      if (child.isMesh && child.material) {
        this.originalMaterials.push({ mesh: child, mat: child.material });
      }
    });
  }

  spawn(x, y, z) {
    this.baseX = x;
    this.baseY = y;
    this.position.set(x, y, z);
    this.mesh.rotation.set(0, 0, 0);
  }

  update(delta, playerPos, weaponManager, audioManager) {
    if (this.isDead) return;

    this.patternTime += delta;

    // 1. Flight AI & Movement
    if (this.isBoss) {
      const slot = this.formationSlot || { offsetX: 0, offsetY: 4, targetZ: -65, weaveFreq: 0.7, weaveAmp: 10 };
      const targetZ = slot.targetZ || -65;

      // Smooth approach to designated formation depth
      if (this.position.z < targetZ) {
        this.position.z += this.speed * 1.6 * delta;
      } else {
        // Dynamic hovering at designated depth with gentle bob
        this.position.z = targetZ + Math.sin(this.patternTime * 1.2 + (slot.offsetX || 0) * 0.1) * 4;
      }

      // Smooth horizontal & vertical sweeping
      const weaveX = Math.sin(this.patternTime * slot.weaveFreq) * slot.weaveAmp;
      const weaveY = Math.cos(this.patternTime * 0.85 + (slot.offsetX || 0) * 0.1) * 3.5;

      // Group formation inertia tracking player position
      const targetBaseX = playerPos.x * 0.5 + slot.offsetX;
      const targetBaseY = playerPos.y * 0.4 + slot.offsetY;

      this.baseX += (targetBaseX - this.baseX) * 0.45 * delta;
      this.baseY += (targetBaseY - this.baseY) * 0.3 * delta;

      this.position.x = this.baseX + weaveX;
      this.position.y = this.baseY + weaveY;

      this.position.x = THREE.MathUtils.clamp(this.position.x, -48, 48);
      this.position.y = THREE.MathUtils.clamp(this.position.y, -12, 26);

      // Boss breathing scale & gentle pitch
      const breathe = 1.0 + Math.sin(this.patternTime * 3) * 0.025;
      this.mesh.scale.set(breathe, breathe, breathe);
      this.mesh.rotation.z = -Math.cos(this.patternTime * slot.weaveFreq) * 0.12;
      this.mesh.rotation.y = (playerPos.x - this.position.x) * 0.015;

      // Animate Orbiting Elemental Aura Spheres
      if (this.mesh.userData.auraSpheres) {
        const t = this.patternTime * 2.8;
        const count = this.mesh.userData.auraSpheres.length;
        const orbitW = this.mesh.userData.orbitWidth || 11.5;
        const orbitH = this.mesh.userData.orbitHeight || 7.0;
        this.mesh.userData.auraSpheres.forEach((sphere, idx) => {
          const angle = (idx / count) * Math.PI * 2 + t;
          sphere.position.set(
            Math.cos(angle) * orbitW,
            Math.sin(angle) * orbitH,
            Math.sin(angle * 2) * 1.8 + 0.5
          );
        });
      }

      // Pulsing flame / elemental aura light
      if (this.mesh.userData.bossLight) {
        this.mesh.userData.bossLight.intensity = 2.4 + Math.sin(this.patternTime * 8) * 0.8;
      }
    } else {
      // Standard enemy forward approach
      const forwardApproach = this.speed * delta;
      this.position.z += forwardApproach;

      const weaveX = Math.sin(this.patternTime * this.weaveFrequency) * this.weaveAmplitude;
      const weaveY = Math.cos(this.patternTime * (this.weaveFrequency * 0.7)) * (this.weaveAmplitude * 0.45);

      this.baseX += (playerPos.x - this.baseX) * 0.3 * delta;
      this.baseY += (playerPos.y - this.baseY) * 0.25 * delta;

      this.position.x = this.baseX + weaveX;
      this.position.y = this.baseY + weaveY;

      this.position.x = THREE.MathUtils.clamp(this.position.x, CONFIG.bounds.minX * 1.1, CONFIG.bounds.maxX * 1.1);
      this.position.y = THREE.MathUtils.clamp(this.position.y, CONFIG.bounds.minY * 1.1, CONFIG.bounds.maxY * 1.1);

      const bankTarget = -Math.cos(this.patternTime * this.weaveFrequency) * 0.55;
      this.mesh.rotation.z += (bankTarget - this.mesh.rotation.z) * 6.0 * delta;

      if (this.position.z > 25) {
        this.position.z = -350 - Math.random() * 80;
        this.baseX = (Math.random() - 0.5) * 60;
        this.baseY = (Math.random() - 0.5) * 30;
      }
    }

    // 2. Firing Logic
    this.fireTimer += delta;
    if (this.fireTimer >= this.fireInterval) {
      if (this.position.z < playerPos.z - 15 && this.position.z > -280) {
        this.shoot(playerPos, weaponManager, audioManager);
        this.fireTimer = 0;
      }
    }

    // 3. Hit Flash effect
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= delta;
      if (this.hitFlashTimer <= 0) {
        this.resetMaterials();
      }
    }
  }

  shoot(playerPos, weaponManager, audioManager) {
    const muzzles = this.mesh.userData.muzzles || [new THREE.Vector3(0, 0, 0)];

    if (this.isBoss) {
      const pattern = this.bossConfig ? this.bossConfig.attackPattern : 'flame';
      const spd = this.bulletSpeed || 170;

      if (pattern === 'wind_slash') {
        // Winged Rakshas: Sweeping gale blades from wings
        [muzzles[1], muzzles[2]].forEach((m, idx) => {
          const worldMuzzle = m.clone().applyMatrix4(this.mesh.matrixWorld);
          const target = playerPos.clone();
          target.x += (idx === 0 ? -9 : 9);
          weaponManager.spawnEnemyBullet(worldMuzzle, target, spd + 15, this.damage);
        });
        if (audioManager) audioManager.playEnemyLaser();
      } else if (pattern === 'blood_beam') {
        // Krodha Rakshas: Dual rapid wrath beams
        const centerMuzzle = muzzles[0].clone().applyMatrix4(this.mesh.matrixWorld);
        weaponManager.spawnEnemyBullet(centerMuzzle, playerPos, spd + 20, this.damage);
        setTimeout(() => {
          if (!this.isDead) weaponManager.spawnEnemyBullet(centerMuzzle, playerPos, spd + 20, this.damage);
        }, 110);
        if (audioManager) audioManager.playEnemyLaser();
      } else if (pattern === 'solar_burst') {
        // Swarna Rakshas: 3-way solar cleave salvos
        [-10, 0, 10].forEach(offset => {
          const worldMuzzle = (muzzles[3] || muzzles[0]).clone().applyMatrix4(this.mesh.matrixWorld);
          const target = playerPos.clone();
          target.x += offset;
          weaponManager.spawnEnemyBullet(worldMuzzle, target, spd, this.damage);
        });
        if (audioManager) audioManager.playEnemyLaser();
      } else if (pattern === 'horn_blast') {
        // Mahisha Rakshas: Double heavy horn magma blasts
        [muzzles[1], muzzles[2]].forEach(m => {
          const worldMuzzle = m.clone().applyMatrix4(this.mesh.matrixWorld);
          weaponManager.spawnEnemyBullet(worldMuzzle, playerPos, spd, this.damage);
        });
        if (audioManager) audioManager.playEnemyLaser();
      } else if (pattern === 'ten_beams') {
        // Dashanana Rakshas: 5-way spread chaos barrage
        [-16, -8, 0, 8, 16].forEach(offsetX => {
          const worldMuzzle = muzzles[0].clone().applyMatrix4(this.mesh.matrixWorld);
          const target = playerPos.clone();
          target.x += offsetX;
          weaponManager.spawnEnemyBullet(worldMuzzle, target, spd, this.damage);
        });
        if (audioManager) audioManager.playEnemyLaser();
      } else {
        // Asura Titan: Flame breath volley
        const mouthMuzzle = muzzles[0].clone().applyMatrix4(this.mesh.matrixWorld);
        weaponManager.spawnEnemyBullet(mouthMuzzle, playerPos, spd, this.damage);
        setTimeout(() => {
          if (!this.isDead) weaponManager.spawnEnemyBullet(mouthMuzzle, playerPos, spd, this.damage);
        }, 120);
        if (audioManager) audioManager.playEnemyLaser();
      }
    } else if (this.type === 'scout') {
      const worldMuzzle = muzzles[0].clone().applyMatrix4(this.mesh.matrixWorld);
      weaponManager.spawnEnemyBullet(worldMuzzle, playerPos, 160, this.damage);
      if (audioManager) audioManager.playEnemyLaser();
    } else if (this.type === 'interceptor') {
      muzzles.forEach((m, idx) => {
        setTimeout(() => {
          if (!this.isDead) {
            const worldMuzzle = m.clone().applyMatrix4(this.mesh.matrixWorld);
            weaponManager.spawnEnemyBullet(worldMuzzle, playerPos, 175, this.damage);
            if (audioManager) audioManager.playEnemyLaser();
          }
        }, idx * 100);
      });
    } else if (this.type === 'gunship') {
      muzzles.forEach((m, idx) => {
        const worldMuzzle = m.clone().applyMatrix4(this.mesh.matrixWorld);
        const offsetTarget = playerPos.clone();
        if (idx === 0) offsetTarget.x -= 10;
        if (idx === 2) offsetTarget.x += 10;
        weaponManager.spawnEnemyBullet(worldMuzzle, offsetTarget, 145, this.damage);
      });
      if (audioManager) audioManager.playEnemyLaser();
    }
  }

  takeDamage(amount) {
    if (this.isDead) return { destroyed: false };

    this.health -= amount;
    this.flashHit();

    if (this.health <= 0) {
      this.isDead = true;
      return { destroyed: true, points: this.points, position: this.position.clone() };
    }

    return { destroyed: false, points: 0 };
  }

  flashHit() {
    this.hitFlashTimer = 0.08;
    this.mesh.traverse((child) => {
      if (child.isMesh && child !== this.mesh.userData.shieldMesh) {
        child.material = modelFactory.materials.hitFlash;
      }
    });
  }

  resetMaterials() {
    this.originalMaterials.forEach(entry => {
      entry.mesh.material = entry.mat;
    });
  }

  destroy() {
    this.isDead = true;
    this.scene.remove(this.mesh);
  }
}

// ENEMY MANAGER & WAVE SPAWNER
export class EnemyManager {
  constructor(scene) {
    this.scene = scene;
    this.activeEnemies = [];

    this.currentWaveNumber = 1;
    this.waveConfig = null;
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.totalEnemiesInWave = 0;
    this.enemiesDefeatedInWave = 0;

    this.isWaveInProgress = false;
  }

  startWave(waveNumber) {
    this.currentWaveNumber = waveNumber;
    // Look up wave config or fallback
    const waveIdx = Math.min(waveNumber - 1, CONFIG.waves.length - 1);
    const baseWave = CONFIG.waves[waveIdx];

    // Scale counts for endless mode
    const scale = waveNumber > CONFIG.waves.length ? 1 + (waveNumber - CONFIG.waves.length) * 0.25 : 1;
    const scouts = Math.round((baseWave.scoutCount || 4) * scale);
    const interceptors = Math.round((baseWave.interceptorCount || 2) * scale);
    const gunships = Math.round((baseWave.gunshipCount || 0) * scale);

    // ALL 5 AURA BOSSES IN ALL WAVES!
    const fiveAuraBosses = CONFIG.fiveAuraBosses || [
      'boss_winged',
      'boss_mask',
      'boss_golden',
      'boss_buffalo',
      'boss_tenheaded'
    ];

    this.waveConfig = {
      ...baseWave,
      waveNumber,
      totalEnemies: fiveAuraBosses.length + scouts + interceptors + gunships,
      scoutCount: scouts,
      interceptorCount: interceptors,
      gunshipCount: gunships,
      hasBoss: true,
      bossTypes: fiveAuraBosses,
      spawnInterval: baseWave.spawnInterval || 1.3,
    };

    this.totalEnemiesInWave = this.waveConfig.totalEnemies;
    this.enemiesDefeatedInWave = 0;
    this.isWaveInProgress = true;

    // Queue all 5 Aura Bosses first so they appear in all waves immediately!
    this.spawnQueue = [...fiveAuraBosses];
    for (let i = 0; i < scouts; i++) this.spawnQueue.push('scout');
    for (let i = 0; i < interceptors; i++) this.spawnQueue.push('interceptor');
    for (let i = 0; i < gunships; i++) this.spawnQueue.push('gunship');

    // Rapid initial spawn for the 5 bosses
    this.spawnTimer = 0.15;
  }

  startBossBattle(bossId = null) {
    const fiveAuraBosses = CONFIG.fiveAuraBosses || [
      'boss_winged',
      'boss_mask',
      'boss_golden',
      'boss_buffalo',
      'boss_tenheaded'
    ];

    if (!bossId || bossId === 'all_5' || bossId === 'all') {
      this.currentWaveNumber = 1;
      const dashananaConfig = CONFIG.rakshasBosses.find(b => b.id === 'rakshas_tenheaded') || CONFIG.rakshasBosses[0];
      this.waveConfig = {
        waveNumber: 1,
        name: `ALL 5 RAKSHAS AURA BOSSES: TOTAL WAR`,
        totalEnemies: 9,
        scoutCount: 2,
        interceptorCount: 2,
        gunshipCount: 0,
        hasBoss: true,
        bossTypes: fiveAuraBosses,
        theme: dashananaConfig.theme,
      };
      this.totalEnemiesInWave = 9;
      this.enemiesDefeatedInWave = 0;
      this.isWaveInProgress = true;

      // Spawn all 5 bosses at the front!
      this.spawnQueue = [...fiveAuraBosses, 'scout', 'interceptor', 'scout', 'interceptor'];
      this.spawnTimer = 0.15;
      return { name: "ALL 5 AURA RAKSHAS TITANS", theme: this.waveConfig.theme };
    }

    // Specific single boss duel
    let selectedBoss = CONFIG.rakshasBosses.find(b => b.id === bossId || b.type === bossId) || CONFIG.rakshasBosses[0];
    this.currentWaveNumber = 1;
    this.waveConfig = {
      waveNumber: 1,
      name: `RAKSHAS HUNT: ${selectedBoss.name.toUpperCase()}`,
      totalEnemies: 5,
      scoutCount: 2,
      interceptorCount: 2,
      gunshipCount: 0,
      hasBoss: true,
      bossType: selectedBoss.type,
      theme: selectedBoss.theme,
    };
    this.totalEnemiesInWave = 5;
    this.enemiesDefeatedInWave = 0;
    this.isWaveInProgress = true;

    this.spawnQueue = [selectedBoss.type, 'scout', 'interceptor', 'scout', 'interceptor'];
    this.spawnTimer = 0.2;
    return selectedBoss;
  }

  getActiveBosses() {
    return this.activeEnemies.filter(e => e.isBoss && !e.isDead);
  }

  getActiveBoss() {
    return this.activeEnemies.find(e => e.isBoss && !e.isDead) || null;
  }

  update(delta, playerPos, weaponManager, audioManager) {
    if (!this.isWaveInProgress) return;

    // 1. Spawning from queue
    if (this.spawnQueue.length > 0) {
      this.spawnTimer -= delta;
      if (this.spawnTimer <= 0) {
        const nextType = this.spawnQueue[0];
        // Bosses spawn rapidly in succession (0.28s) to form their squad immediately
        this.spawnTimer = nextType && nextType.startsWith('boss_') ? 0.28 : (this.waveConfig.spawnInterval || 1.3);
        const enemyType = this.spawnQueue.shift();
        this.spawnEnemy(enemyType);
      }
    }

    // 2. Update active enemies
    for (let i = this.activeEnemies.length - 1; i >= 0; i--) {
      const enemy = this.activeEnemies[i];
      if (enemy.isDead) {
        enemy.destroy();
        this.activeEnemies.splice(i, 1);
        continue;
      }

      enemy.update(delta, playerPos, weaponManager, audioManager);
    }
  }

  spawnEnemy(type) {
    const enemy = new Enemy(type, this.currentWaveNumber, this.scene);

    if (type.startsWith('boss_')) {
      const slot = enemy.formationSlot || { offsetX: 0, offsetY: 6, targetZ: -65 };
      enemy.spawn(slot.offsetX, slot.offsetY, -320 - Math.abs(slot.offsetX) * 1.5);
    } else {
      // Stagger spawn positions outside camera view
      const spawnX = (Math.random() - 0.5) * 65;
      const spawnY = -10 + Math.random() * 25;
      const spawnZ = -300 - Math.random() * 80;
      enemy.spawn(spawnX, spawnY, spawnZ);
    }

    this.activeEnemies.push(enemy);
  }

  onEnemyDefeated(enemy) {
    this.enemiesDefeatedInWave++;
  }

  isWaveCleared() {
    return this.isWaveInProgress &&
           this.spawnQueue.length === 0 &&
           this.activeEnemies.length === 0;
  }

  getWaveProgress() {
    const remaining = Math.max(0, this.totalEnemiesInWave - this.enemiesDefeatedInWave);
    return {
      currentWave: this.currentWaveNumber,
      waveName: this.waveConfig ? this.waveConfig.name : `Sector ${this.currentWaveNumber}`,
      remaining,
      total: this.totalEnemiesInWave,
      percent: this.totalEnemiesInWave > 0 ? (this.enemiesDefeatedInWave / this.totalEnemiesInWave) : 0,
    };
  }

  clearAll() {
    this.activeEnemies.forEach(e => e.destroy());
    this.activeEnemies = [];
    this.spawnQueue = [];
    this.isWaveInProgress = false;
  }
}
