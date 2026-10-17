// Sky Hunter 3D — Player Aircraft Controller & Flight Physics
import * as THREE from 'three';
import { CONFIG } from './config.js';
import { createPlayerJetModel } from './models.js';

export class Player {
  constructor(scene) {
    this.scene = scene;

    // Movement & Physics
    this.position = new THREE.Vector3(0, 0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.rotation = new THREE.Euler(0, 0, 0, 'YXZ');

    // Health & Status
    this.maxHealth = CONFIG.player.maxHealth;
    this.health = this.maxHealth;
    this.shieldTime = 0;       // Seconds remaining on shield
    this.rapidFireTime = 0;    // Seconds remaining on rapid fire
    this.invulnerableTime = 0; // i-frames timer
    this.isDead = false;

    // Afterburner Boost
    this.boostMax = CONFIG.player.boostDuration;
    this.boostGauge = this.boostMax;
    this.isBoosting = false;

    // Missiles
    this.missiles = CONFIG.player.initialMissiles;
    this.maxMissiles = CONFIG.player.maxMissiles;
    this.missileCooldownTimer = 0;
    this.unlimitedAmmo = true; // Unlimited Ammo Mode

    // Input States
    this.keys = {
      up: false,
      down: false,
      left: false,
      right: false,
      fire: false,
      missile: false,
      boost: false,
      bomb: false,
      shield: false,
    };

    // Mouse Steering
    this.mouseSteerEnabled = false;
    this.mouseSensitivity = 5;
    this.mouseOffset = { x: 0, y: 0 };

    // Mobile Touch Steering & Auto-Fire
    this.touchOffset = { x: 0, y: 0 };
    this.autoFire = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || window.innerWidth <= 1024;
    this.bombCooldownTimer = 0;

    // Fire timing
    this.fireCooldown = 0;
    this.currentMuzzleIdx = 0;

    // Build 3D Jet Mesh
    this.mesh = createPlayerJetModel();
    this.scene.add(this.mesh);

    this.initInputListeners();
  }

  initInputListeners() {
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    window.addEventListener('mousedown', (e) => {
      if (e.button === 0) this.keys.fire = true;
      if (e.button === 2) this.keys.missile = true;
    });
    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.keys.fire = false;
      if (e.button === 2) this.keys.missile = false;
    });
    window.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  onKeyDown(e) {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keys.up = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keys.down = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keys.left = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keys.right = true;
        break;
      case 'Space':
        this.keys.fire = true;
        break;
      case 'KeyF':
        this.keys.missile = true;
        break;
      case 'KeyB':
        this.keys.bomb = true;
        break;
      case 'KeyE':
      case 'KeyC':
        this.keys.shield = true;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.boost = true;
        break;
    }
  }

  onKeyUp(e) {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keys.up = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keys.down = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keys.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keys.right = false;
        break;
      case 'Space':
        this.keys.fire = false;
        break;
      case 'KeyF':
        this.keys.missile = false;
        break;
      case 'KeyB':
        this.keys.bomb = false;
        break;
      case 'KeyE':
      case 'KeyC':
        this.keys.shield = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.boost = false;
        break;
    }
  }

  onMouseMove(e) {
    if (!this.mouseSteerEnabled) return;
    const halfW = window.innerWidth / 2;
    const halfH = window.innerHeight / 2;
    this.mouseOffset.x = ((e.clientX - halfW) / halfW) * (this.mouseSensitivity / 5);
    this.mouseOffset.y = (-(e.clientY - halfH) / halfH) * (this.mouseSensitivity / 5);
  }

  reset() {
    this.health = this.maxHealth;
    this.isDead = false;
    this.position.set(0, 0, 0);
    this.velocity.set(0, 0, 0);
    this.rotation.set(0, 0, 0);
    this.mesh.position.set(0, 0, 0);
    this.mesh.rotation.set(0, 0, 0);
    this.mesh.visible = true;

    this.shieldTime = 0;
    this.rapidFireTime = 0;
    this.invulnerableTime = 0;
    this.boostGauge = this.boostMax;
    this.missiles = CONFIG.player.initialMissiles;
    this.missileCooldownTimer = 0;
    this.fireCooldown = 0;
    this.bombCooldownTimer = 0;

    // Reset shield mesh
    if (this.mesh.userData.shieldMesh) {
      this.mesh.userData.shieldMesh.material.opacity = 0;
    }
  }

  update(delta) {
    if (this.isDead) return;

    // 1. Process Boost & Throttle
    if (this.keys.boost && this.boostGauge > 0.1) {
      this.isBoosting = true;
      this.boostGauge = Math.max(0, this.boostGauge - delta);
    } else {
      this.isBoosting = false;
      this.boostGauge = Math.min(this.boostMax, this.boostGauge + delta * CONFIG.player.boostRechargeRate);
    }

    // 2. Flight Movement Inputs (Keyboard + Mouse + Mobile Touch Joystick)
    let moveX = 0;
    let moveY = 0;

    if (this.keys.left) moveX -= 1;
    if (this.keys.right) moveX += 1;
    if (this.keys.up) moveY += 1;
    if (this.keys.down) moveY -= 1;

    if (this.mouseSteerEnabled) {
      moveX += this.mouseOffset.x;
      moveY += this.mouseOffset.y;
    }

    // Touch Virtual Joystick input
    moveX += this.touchOffset.x;
    moveY += this.touchOffset.y;

    // Clamp input magnitude
    const len = Math.hypot(moveX, moveY);
    if (len > 1.0) {
      moveX /= len;
      moveY /= len;
    }

    // Target Velocity
    const speed = this.isBoosting ? CONFIG.bounds.boostSpeed * 0.45 : CONFIG.bounds.baseSpeed * 0.45;
    const targetVx = moveX * speed;
    const targetVy = moveY * speed;

    this.velocity.x += (targetVx - this.velocity.x) * CONFIG.player.smoothing * delta;
    this.velocity.y += (targetVy - this.velocity.y) * CONFIG.player.smoothing * delta;

    // Apply movement
    this.position.x += this.velocity.x * delta;
    this.position.y += this.velocity.y * delta;

    // Clamp inside playable box
    this.position.x = THREE.MathUtils.clamp(this.position.x, CONFIG.bounds.minX, CONFIG.bounds.maxX);
    this.position.y = THREE.MathUtils.clamp(this.position.y, CONFIG.bounds.minY, CONFIG.bounds.maxY);

    this.mesh.position.copy(this.position);

    // 3. Dynamic Banking & Pitching Animations
    const targetRoll = -moveX * CONFIG.player.maxBankAngle;
    const targetPitch = moveY * CONFIG.player.maxPitchAngle;

    this.mesh.rotation.z += (targetRoll - this.mesh.rotation.z) * 8.0 * delta;
    this.mesh.rotation.x += (targetPitch - this.mesh.rotation.x) * 8.0 * delta;
    this.mesh.rotation.y = -moveX * 0.15; // Subtle yaw into turn

    // 4. Update Engine Nozzle Glow
    if (this.mesh.userData.engineGlows) {
      const glowScale = this.isBoosting ? 1.6 : (len > 0.1 ? 1.2 : 0.9);
      this.mesh.userData.engineGlows.forEach(glow => {
        glow.scale.set(glowScale, glowScale, this.isBoosting ? 2.2 : 1.0);
      });
    }

    // 5. Update Timers & Buffs
    if (this.shieldTime > 0) {
      this.shieldTime = Math.max(0, this.shieldTime - delta);
      if (this.mesh.userData.shieldMesh) {
        this.mesh.userData.shieldMesh.material.opacity = 0.5 + Math.sin(Date.now() * 0.01) * 0.2;
        this.mesh.userData.shieldMesh.rotation.y += delta * 1.5;
      }
    } else if (this.mesh.userData.shieldMesh) {
      this.mesh.userData.shieldMesh.material.opacity = 0;
    }

    if (this.rapidFireTime > 0) {
      this.rapidFireTime = Math.max(0, this.rapidFireTime - delta);
    }

    if (this.invulnerableTime > 0) {
      this.invulnerableTime = Math.max(0, this.invulnerableTime - delta);
      // Flash visibility during i-frames
      this.mesh.visible = Math.floor(this.invulnerableTime * 20) % 2 === 0;
    } else {
      this.mesh.visible = true;
    }

    if (this.missileCooldownTimer > 0) {
      this.missileCooldownTimer = Math.max(0, this.missileCooldownTimer - delta);
    }

    if (this.fireCooldown > 0) {
      this.fireCooldown = Math.max(0, this.fireCooldown - delta);
    }

    if (this.bombCooldownTimer > 0) {
      this.bombCooldownTimer = Math.max(0, this.bombCooldownTimer - delta);
    }
  }

  // Take Damage
  takeDamage(amount) {
    if (this.isDead || this.invulnerableTime > 0) return { hit: false, shielded: false };

    // Shield absorbs all damage
    if (this.shieldTime > 0) {
      this.shieldTime = Math.max(0, this.shieldTime - 2.5); // Depletes shield faster under fire
      return { hit: true, shielded: true };
    }

    this.health = Math.max(0, this.health - amount);
    this.invulnerableTime = CONFIG.player.invincibleDuration;

    if (this.health <= 0) {
      this.isDead = true;
      this.mesh.visible = false;
    }

    return { hit: true, shielded: false, dead: this.isDead };
  }

  // Apply Power-ups
  applyPowerup(type) {
    if (type === 'repair') {
      this.health = Math.min(this.maxHealth, this.health + 35);
    } else if (type === 'shield') {
      this.shieldTime = CONFIG.powerups.duration;
    } else if (type === 'rapid') {
      this.rapidFireTime = CONFIG.powerups.duration;
    } else if (type === 'missiles') {
      this.missiles = Math.min(this.maxMissiles, this.missiles + 3);
    }
  }

  // Check if primary weapon can fire (Manual trigger OR Auto-Fire active)
  canFirePrimary() {
    return !this.isDead && (this.keys.fire || this.autoFire) && this.fireCooldown <= 0;
  }

  triggerPrimaryFire() {
    let rate = this.rapidFireTime > 0 ? CONFIG.weapons.primary.rapidFireRate : CONFIG.weapons.primary.fireRate;
    if (this.unlimitedAmmo) {
      rate = Math.min(rate, 0.055); // Hyper-speed rapid machine guns
    }
    this.fireCooldown = rate;

    // Alternate left/right wing guns
    const muzzles = this.mesh.userData.muzzles;
    const muzzle = muzzles[this.currentMuzzleIdx];
    this.currentMuzzleIdx = (this.currentMuzzleIdx + 1) % muzzles.length;

    // World position of the chosen muzzle
    const worldPos = muzzle.clone().applyMatrix4(this.mesh.matrixWorld);
    return { position: worldPos, isAlternate: this.currentMuzzleIdx === 0 };
  }

  // Check if missile can launch
  canLaunchMissile() {
    if (this.isDead || !this.keys.missile || this.missileCooldownTimer > 0) return false;
    return this.unlimitedAmmo || this.missiles > 0;
  }

  triggerMissileLaunch() {
    if (!this.unlimitedAmmo) {
      this.missiles--;
      this.missileCooldownTimer = CONFIG.player.missileCooldown;
    } else {
      // With unlimited ammo, missiles never deplete and launch rapidly
      this.missileCooldownTimer = 0.22;
      this.missiles = this.maxMissiles;
    }

    // Launch from wing rail
    const hardpoints = this.mesh.userData.missileHardpoints;
    const hp = hardpoints[this.missiles % hardpoints.length];
    const worldPos = hp.clone().applyMatrix4(this.mesh.matrixWorld);

    return { position: worldPos };
  }

  // Trigger Nova EMP Bomb Superweapon
  triggerNovaBomb(weaponManager, enemyManager, effectsManager, audioManager, onEnemyDestroyed) {
    if (this.isDead) return false;
    if (this.bombCooldownTimer > 0 && !this.unlimitedAmmo) return false;

    this.bombCooldownTimer = this.unlimitedAmmo ? 0.4 : 9.0;

    // Visual Nova Shockwave
    if (effectsManager) {
      effectsManager.spawnNovaShockwave(this.position);
      effectsManager.flashScreen('nova');
      effectsManager.spawnFloatingText(this.position, '💥 EMP NOVA BLAST!', true);
    }

    // Audio SFX
    if (audioManager) {
      audioManager.playBombBlast();
    }

    // Clear all incoming enemy projectiles
    if (weaponManager) {
      weaponManager.clearEnemyProjectiles();
    }

    // Heavy damage to all active enemies within 160m
    if (enemyManager && enemyManager.activeEnemies) {
      const blastRadius = 160;
      const blastDmg = 550;

      for (let i = enemyManager.activeEnemies.length - 1; i >= 0; i--) {
        const enemy = enemyManager.activeEnemies[i];
        if (enemy.isDead) continue;

        const dist = this.position.distanceTo(enemy.position);
        if (dist <= blastRadius) {
          const res = enemy.takeDamage(blastDmg);
          if (effectsManager) {
            effectsManager.spawnExplosion(enemy.position, enemy.isBoss);
            effectsManager.spawnFloatingText(enemy.position, `💥 EMP -${blastDmg}`, true);
          }
          if (res.destroyed && onEnemyDestroyed) {
            onEnemyDestroyed(enemy, res.points, res.position);
          }
        }
      }
    }

    return true;
  }

  // Trigger Force Field Shield
  triggerShieldBurst(audioManager, effectsManager) {
    if (this.isDead) return false;
    this.shieldTime = 6.0; // 6 seconds invulnerability force field

    if (effectsManager) {
      effectsManager.spawnPowerupBurst(this.position, 'shield');
      effectsManager.flashScreen('shield');
      effectsManager.spawnFloatingText(this.position, '🛡️ FORCE SHIELD ACTIVE!', true);
    }
    if (audioManager) {
      audioManager.playShieldEngage();
    }
    return true;
  }

  // Mobile Touch Control Helpers
  setTouchSteer(x, y) {
    this.touchOffset.x = THREE.MathUtils.clamp(x, -1, 1);
    this.touchOffset.y = THREE.MathUtils.clamp(y, -1, 1);

    // Sync bank & pitch animation keys for visual flair
    this.keys.left = x < -0.25;
    this.keys.right = x > 0.25;
    this.keys.up = y > 0.25;
    this.keys.down = y < -0.25;
  }

  setTouchFire(active) {
    this.keys.fire = !!active;
  }

  setTouchMissile(active) {
    this.keys.missile = !!active;
  }

  setTouchBoost(active) {
    this.keys.boost = !!active;
  }

  toggleAutoFire() {
    this.autoFire = !this.autoFire;
    return this.autoFire;
  }
}
