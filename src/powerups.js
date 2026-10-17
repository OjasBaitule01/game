import * as THREE from 'three';
import { CONFIG } from './config.js';
import { modelFactory } from './models.js';

export class PowerUp {
  constructor(type, position, scene) {
    this.type = type;
    this.scene = scene;

    this.mesh = modelFactory.createPowerUp(type);
    this.mesh.position.copy(position);
    this.scene.add(this.mesh);

    this.position = this.mesh.position;
    this.baseY = position.y;
    this.radius = 2.2;
    this.isCollected = false;

    this.lifetime = 0;
    this.maxLifetime = 16;
    this.floatOffset = Math.random() * 10;
  }

  update(delta, playerPos) {
    if (this.isCollected) return;

    this.lifetime += delta;

    // Spin animation
    this.mesh.rotation.y += delta * 2.2;
    this.mesh.rotation.x += delta * 1.1;

    // Bobbing motion around baseY
    this.mesh.position.y = this.baseY + Math.sin((this.lifetime + this.floatOffset) * 3) * 1.2;

    // Drift slowly backward with flight stream
    this.mesh.position.z += 18 * delta;

    // Magnetic pull when player is close (< 20 units)
    const distToPlayer = this.mesh.position.distanceTo(playerPos);
    if (distToPlayer < 22) {
      const magnetDir = new THREE.Vector3().subVectors(playerPos, this.mesh.position).normalize();
      this.mesh.position.add(magnetDir.multiplyScalar(35 * delta));
    }

    // Expire if lifetime exceeded or past camera
    if (this.lifetime > this.maxLifetime || this.mesh.position.z > 30) {
      this.destroy();
    }
  }

  destroy() {
    this.isCollected = true;
    this.scene.remove(this.mesh);
  }
}

export class PowerUpManager {
  constructor(scene) {
    this.scene = scene;
    this.activePowerups = [];
    this.ambientDropTimer = 12; // Periodic drop in flight path
  }

  update(delta, player, audioManager, uiManager, effectsManager) {
    // 1. Ambient periodic supply drop
    this.ambientDropTimer -= delta;
    if (this.ambientDropTimer <= 0) {
      this.ambientDropTimer = 15 + Math.random() * 10;
      this.spawnAmbientPowerup();
    }

    // 2. Update active powerups & check collection
    const pPos = player.position;
    const playerRadius = 2.6;

    for (let i = this.activePowerups.length - 1; i >= 0; i--) {
      const pu = this.activePowerups[i];
      if (pu.isCollected) {
        this.activePowerups.splice(i, 1);
        continue;
      }

      pu.update(delta, pPos);

      // Check collection
      const dist = pu.mesh.position.distanceTo(pPos);
      if (dist < playerRadius + pu.radius) {
        // Collected!
        pu.destroy();
        this.activePowerups.splice(i, 1);

        player.applyPowerup(pu.type);

        if (audioManager) audioManager.playPowerup();
        if (effectsManager) {
          effectsManager.spawnPowerupBurst(pu.mesh.position, pu.type);
          const flashClass = pu.type === 'repair' ? 'repair' : 'shield';
          effectsManager.flashScreen(flashClass);
        }

        const info = CONFIG.powerups.types.find(t => t.id === pu.type);
        if (uiManager && info) {
          uiManager.showCombatPopup(info.text, true, 'powerup');
        }
      }
    }
  }

  // Drop on enemy death
  tryDropFromEnemy(enemyPos, playerHealth, playerMissiles) {
    if (Math.random() > CONFIG.powerups.dropRate) return;

    // Smart weighted selection
    let type = 'repair';
    const rand = Math.random();

    if (playerHealth < 50 && rand < 0.45) {
      type = 'repair';
    } else if (playerMissiles <= 1 && rand < 0.4) {
      type = 'missiles';
    } else {
      const options = ['repair', 'shield', 'rapid', 'missiles'];
      type = options[Math.floor(Math.random() * options.length)];
    }

    const pu = new PowerUp(type, enemyPos, this.scene);
    this.activePowerups.push(pu);
  }

  spawnAmbientPowerup() {
    const options = ['repair', 'shield', 'rapid', 'missiles'];
    const type = options[Math.floor(Math.random() * options.length)];
    const pos = new THREE.Vector3(
      (Math.random() - 0.5) * 40,
      -10 + Math.random() * 20,
      -260
    );
    const pu = new PowerUp(type, pos, this.scene);
    this.activePowerups.push(pu);
  }

  clearAll() {
    this.activePowerups.forEach(pu => pu.destroy());
    this.activePowerups = [];
  }
}
