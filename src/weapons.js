import * as THREE from 'three';
import { CONFIG } from './config.js';
import { modelFactory } from './models.js';

export class WeaponManager {
  constructor(scene) {
    this.scene = scene;

    this.playerProjectiles = [];
    this.enemyProjectiles = [];
    this.missiles = [];
    this.muzzleFlashes = [];

    // Shared Geometries & Materials for efficiency
    this.playerBulletGeom = new THREE.CylinderGeometry(0.18, 0.18, 3.8, 6);
    this.playerBulletGeom.rotateX(Math.PI / 2);
    this.playerBulletMat = new THREE.MeshBasicMaterial({
      color: CONFIG.weapons.primary.color,
    });

    this.enemyBulletGeom = new THREE.SphereGeometry(0.5, 6, 6);
    this.enemyBulletMat = new THREE.MeshBasicMaterial({
      color: CONFIG.weapons.enemyLaser.color,
    });

    this.flashGeom = new THREE.SphereGeometry(0.65, 6, 6);
    this.flashMat = new THREE.MeshBasicMaterial({
      color: 0x88ffff,
      transparent: true,
      opacity: 0.9,
    });
  }

  // FIRE PLAYER PRIMARY BULLET
  spawnPlayerBullet(position) {
    const mesh = new THREE.Mesh(this.playerBulletGeom, this.playerBulletMat);
    mesh.position.copy(position);

    const projectile = {
      mesh,
      velocity: new THREE.Vector3(0, 0, -CONFIG.weapons.primary.speed),
      damage: CONFIG.weapons.primary.damage,
      distanceTraveled: 0,
      maxDistance: CONFIG.weapons.primary.range,
      radius: 0.6,
    };

    this.scene.add(mesh);
    this.playerProjectiles.push(projectile);

    this.spawnMuzzleFlash(position, 0x00f0ff);
  }

  // SPAWN ENEMY BULLET
  spawnEnemyBullet(startPos, targetPos, speed = CONFIG.weapons.enemyLaser.speed, damage = CONFIG.weapons.enemyLaser.damage) {
    const mesh = new THREE.Mesh(this.enemyBulletGeom, this.enemyBulletMat);
    mesh.position.copy(startPos);

    // Direction towards target with slight inaccuracy
    const dir = new THREE.Vector3().subVectors(targetPos, startPos).normalize();
    // Add small random spread (+- 0.05)
    dir.x += (Math.random() - 0.5) * 0.08;
    dir.y += (Math.random() - 0.5) * 0.08;
    dir.normalize();

    const projectile = {
      mesh,
      velocity: dir.multiplyScalar(speed),
      damage: damage,
      distanceTraveled: 0,
      maxDistance: CONFIG.weapons.enemyLaser.range,
      radius: 0.8,
    };

    this.scene.add(mesh);
    this.enemyProjectiles.push(projectile);

    this.spawnMuzzleFlash(startPos, 0xff3344);
  }

  // LAUNCH HOMING MISSILE
  spawnMissile(position, targetEnemy) {
    const mesh = modelFactory.createMissile();
    mesh.position.copy(position);
    mesh.rotation.y = Math.PI; // Face forward (-Z)

    const missile = {
      mesh,
      velocity: new THREE.Vector3(0, 0, -CONFIG.weapons.missile.speed * 0.6), // Initial launch velocity
      speed: CONFIG.weapons.missile.speed,
      turnRate: CONFIG.weapons.missile.turnRate,
      target: targetEnemy,
      lifetime: 0,
      maxLifetime: 4.5,
      damage: CONFIG.weapons.missile.damage,
      blastRadius: CONFIG.weapons.missile.blastRadius,
      trailTimer: 0,
    };

    this.scene.add(mesh);
    this.missiles.push(missile);

    this.spawnMuzzleFlash(position, 0xffa500);
  }

  // MUZZLE FLASH
  spawnMuzzleFlash(pos, color) {
    const flash = new THREE.Mesh(
      this.flashGeom,
      new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.85 })
    );
    flash.position.copy(pos);
    flash.userData = { life: 0.06 };
    this.scene.add(flash);
    this.muzzleFlashes.push(flash);
  }

  update(delta, enemies, effectsManager) {
    // 1. Update Player Bullets
    for (let i = this.playerProjectiles.length - 1; i >= 0; i--) {
      const p = this.playerProjectiles[i];
      const move = p.velocity.clone().multiplyScalar(delta);
      p.mesh.position.add(move);
      p.distanceTraveled += move.length();

      if (p.distanceTraveled > p.maxDistance) {
        this.scene.remove(p.mesh);
        this.playerProjectiles.splice(i, 1);
      }
    }

    // 2. Update Enemy Bullets
    for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
      const p = this.enemyProjectiles[i];
      const move = p.velocity.clone().multiplyScalar(delta);
      p.mesh.position.add(move);
      p.distanceTraveled += move.length();

      if (p.distanceTraveled > p.maxDistance || p.mesh.position.z > 30) {
        this.scene.remove(p.mesh);
        this.enemyProjectiles.splice(i, 1);
      }
    }

    // 3. Update Homing Missiles
    for (let i = this.missiles.length - 1; i >= 0; i--) {
      const m = this.missiles[i];
      m.lifetime += delta;

      // Retarget if current target is dead or disappeared
      if (!m.target || m.target.isDead) {
        m.target = this.findClosestTargetInCone(m.mesh.position, enemies);
      }

      // Homing guidance
      let desiredDir = new THREE.Vector3(0, 0, -1);
      if (m.target && !m.target.isDead) {
        desiredDir.subVectors(m.target.position, m.mesh.position).normalize();
      }

      // Current direction
      const currentDir = m.velocity.clone().normalize();
      // Spherical lerp towards target direction
      currentDir.lerp(desiredDir, m.turnRate * delta).normalize();

      // Accelerate to top speed
      m.speed = Math.min(CONFIG.weapons.missile.speed, m.speed + delta * 80);
      m.velocity.copy(currentDir).multiplyScalar(m.speed);
      m.mesh.position.add(m.velocity.clone().multiplyScalar(delta));

      // Orient missile mesh along flight vector
      m.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), currentDir.negate());

      // Thruster trail particle
      m.trailTimer += delta;
      if (m.trailTimer > 0.03 && effectsManager) {
        m.trailTimer = 0;
        effectsManager.spawnMissileSmoke(m.mesh.position);
      }

      // Expire or direct impact check
      if (m.lifetime > m.maxLifetime) {
        if (effectsManager) effectsManager.spawnExplosion(m.mesh.position, true);
        this.scene.remove(m.mesh);
        this.missiles.splice(i, 1);
      }
    }

    // 4. Update Muzzle Flashes
    for (let i = this.muzzleFlashes.length - 1; i >= 0; i--) {
      const f = this.muzzleFlashes[i];
      f.userData.life -= delta;
      f.scale.multiplyScalar(0.9);
      if (f.userData.life <= 0) {
        this.scene.remove(f);
        this.muzzleFlashes.splice(i, 1);
      }
    }
  }

  // Find target in front arc for missile lock-on
  findClosestTargetInCone(origin, enemies) {
    let bestTarget = null;
    let minDistance = Infinity;

    for (const enemy of enemies) {
      if (enemy.isDead) continue;
      // Must be ahead of origin (z < origin.z)
      if (enemy.position.z >= origin.z) continue;

      const dist = origin.distanceTo(enemy.position);
      if (dist < minDistance && dist < 220) {
        minDistance = dist;
        bestTarget = enemy;
      }
    }

    return bestTarget;
  }

  // Check Player Laser hits on Enemies
  checkPlayerBulletHits(enemies, onHit) {
    for (let b = this.playerProjectiles.length - 1; b >= 0; b--) {
      const bullet = this.playerProjectiles[b];
      const bulletPos = bullet.mesh.position;

      for (const enemy of enemies) {
        if (enemy.isDead) continue;

        const dist = bulletPos.distanceTo(enemy.position);
        if (dist < enemy.radius + bullet.radius) {
          // Hit detected!
          this.scene.remove(bullet.mesh);
          this.playerProjectiles.splice(b, 1);

          onHit(enemy, bullet.damage, bulletPos);
          break; // Bullet consumed
        }
      }
    }
  }

  // Check Missile detonations on Enemies
  checkMissileHits(enemies, onDetonate) {
    for (let m = this.missiles.length - 1; m >= 0; m--) {
      const missile = this.missiles[m];
      const mPos = missile.mesh.position;

      for (const enemy of enemies) {
        if (enemy.isDead) continue;

        const dist = mPos.distanceTo(enemy.position);
        if (dist < enemy.radius + 1.8) {
          // Direct hit! Detonate area blast
          this.scene.remove(missile.mesh);
          this.missiles.splice(m, 1);

          // Area blast damage to all enemies within radius
          onDetonate(mPos, missile.damage, missile.blastRadius);
          break;
        }
      }
    }
  }

  // Check Enemy Bullet hits on Player
  checkEnemyBulletHits(player, onHit) {
    const pPos = player.position;
    const playerRadius = 2.4;

    for (let b = this.enemyProjectiles.length - 1; b >= 0; b--) {
      const bullet = this.enemyProjectiles[b];
      const dist = bullet.mesh.position.distanceTo(pPos);

      if (dist < playerRadius + bullet.radius) {
        this.scene.remove(bullet.mesh);
        this.enemyProjectiles.splice(b, 1);

        onHit(bullet.damage, bullet.mesh.position);
      }
    }
  }

  // Clear all enemy projectiles (used by Nova EMP Bomb)
  clearEnemyProjectiles() {
    this.enemyProjectiles.forEach(b => this.scene.remove(b.mesh));
    this.enemyProjectiles = [];
  }

  // Clean all active projectiles on restart or state change
  clearAll() {
    this.playerProjectiles.forEach(p => this.scene.remove(p.mesh));
    this.playerProjectiles = [];

    this.enemyProjectiles.forEach(p => this.scene.remove(p.mesh));
    this.enemyProjectiles = [];

    this.missiles.forEach(m => this.scene.remove(m.mesh));
    this.missiles = [];

    this.muzzleFlashes.forEach(f => this.scene.remove(f));
    this.muzzleFlashes = [];
  }
}
