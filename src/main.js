import * as THREE from 'three';
import { CONFIG } from './config.js';
import { audio } from './audio.js';
import { SceneManager } from './scene.js';
import { Player } from './player.js';
import { WeaponManager } from './weapons.js';
import { EnemyManager } from './enemies.js';
import { PowerUpManager } from './powerups.js';
import { EffectsManager } from './effects.js';
import { UIManager } from './ui.js';
import { MobileControlsManager } from './mobile.js';

class SkyHunterGame {
  constructor() {
    this.state = 'MENU'; // MENU, PLAYING, PAUSED, GAME_OVER

    this.container = document.getElementById('canvas-container');
    this.sceneManager = new SceneManager(this.container);
    this.audio = audio;

    this.effectsManager = new EffectsManager(this.sceneManager.scene, this.sceneManager.camera);
    this.weaponManager = new WeaponManager(this.sceneManager.scene);
    this.player = new Player(this.sceneManager.scene);
    this.enemyManager = new EnemyManager(this.sceneManager.scene);
    this.powerUpManager = new PowerUpManager(this.sceneManager.scene);
    this.ui = new UIManager(this);
    this.mobileControls = new MobileControlsManager(this, this.player);

    // Session Statistics
    this.score = 0;
    this.currentWave = 1;
    this.enemiesDestroyed = 0;

    // High-precision Delta Time Management
    this.prevTime = performance.now();
    this.waveTransitionTimer = 0;

    // Menu Cinematic Idle
    this.idleTime = 0;

    this.init();
  }

  init() {
    this.ui.showMenuScreen();

    // Start requestAnimationFrame game loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  // START MISSION
  startMission() {
    this.audio.ensureContext();
    this.audio.startBgm();

    this.state = 'PLAYING';
    this.score = 0;
    this.currentWave = 1;
    this.enemiesDestroyed = 0;
    this.waveTransitionTimer = 0;

    this.player.reset();
    this.weaponManager.clearAll();
    this.enemyManager.clearAll();
    this.powerUpManager.clearAll();
    this.effectsManager.clearAll();

    // Set initial environment theme
    this.sceneManager.setTheme(CONFIG.waves[0].theme);

    // Start Wave 1
    this.startCurrentWave();
    this.ui.showHudScreen();
    if (this.mobileControls) this.mobileControls.show();
  }

  // DEDICATED RAKSHAS BOSS HUNT
  startBossMission(bossId = null) {
    this.audio.ensureContext();
    this.audio.startBgm();

    this.state = 'PLAYING';
    this.score = 0;
    this.currentWave = 1;
    this.enemiesDestroyed = 0;
    this.waveTransitionTimer = 0;

    this.player.reset();
    this.player.unlimitedAmmo = true; // Unlimited Ammo active for boss hunt
    this.player.missiles = CONFIG.player.maxMissiles;
    this.weaponManager.clearAll();
    this.enemyManager.clearAll();
    this.powerUpManager.clearAll();
    this.effectsManager.clearAll();

    // Launch all 5 or specific Rakshas boss battle
    const boss = this.enemyManager.startBossBattle(bossId);
    if (boss && boss.theme) {
      this.sceneManager.setTheme(boss.theme);
    } else {
      this.sceneManager.setTheme(CONFIG.waves[0].theme);
    }

    const titleText = (bossId === 'all_5' || !bossId) ? 'ALL 5 RAKSHAS AURA TITANS UNLEASHED!' : `${boss.name.toUpperCase()} DETECTED!`;
    this.ui.showWaveAnnouncement(1, titleText);
    this.ui.showHudScreen();
    if (this.mobileControls) this.mobileControls.show();
  }

  startCurrentWave() {
    this.enemyManager.startWave(this.currentWave);

    const waveInfo = this.enemyManager.getWaveProgress();
    this.ui.showWaveAnnouncement(this.currentWave, waveInfo.waveName);

    // Update scene theme based on wave
    const waveThemeIdx = Math.min(this.currentWave - 1, CONFIG.waves.length - 1);
    this.sceneManager.setTheme(CONFIG.waves[waveThemeIdx].theme);
  }

  // ADVANCE TO NEXT WAVE
  advanceWave() {
    this.currentWave++;
    this.audio.playWaveClear();
    this.ui.showCombatPopup('SECTOR SECURED!', true, 'crit');

    this.waveTransitionTimer = 2.5; // Breather before next wave
  }

  // TOGGLE PAUSE
  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      this.audio.pauseAll();
      this.ui.showPauseScreen();
      if (this.mobileControls) this.mobileControls.hide();
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.audio.resumeAll();
      this.ui.hidePauseScreen();
      if (this.mobileControls) this.mobileControls.show();
      this.prevTime = performance.now(); // Avoid huge delta time jump
    }
  }

  // RESTART MISSION
  restartMission() {
    this.startMission();
  }

  // RETURN TO MENU
  returnToMenu() {
    this.state = 'MENU';
    this.audio.stopBgm();
    this.audio.stopEngineHum();

    this.player.reset();
    this.weaponManager.clearAll();
    this.enemyManager.clearAll();
    this.powerUpManager.clearAll();
    this.effectsManager.clearAll();

    if (this.mobileControls) this.mobileControls.hide();
    this.ui.showMenuScreen();
  }

  // TRIGGER GAME OVER
  triggerGameOver() {
    this.state = 'GAME_OVER';
    this.audio.playExplosion(true);
    this.audio.stopEngineHum();

    // Huge explosion on player position
    this.effectsManager.spawnExplosion(this.player.position, true);
    this.effectsManager.flashScreen('damage');

    // Record high score & wave
    this.ui.recordScore(this.score, this.currentWave);
    if (this.mobileControls) this.mobileControls.hide();

    setTimeout(() => {
      if (this.state === 'GAME_OVER') {
        this.ui.showGameOverScreen({
          score: this.score,
          wave: this.currentWave,
          enemiesDestroyed: this.enemiesDestroyed,
        });
      }
    }, 1200);
  }

  // MAIN GAME LOOP
  animate(timestamp) {
    requestAnimationFrame(this.animate);

    const now = performance.now();
    const rawDelta = (now - this.prevTime) / 1000;
    this.prevTime = now;

    // Cap delta time to prevent large physics jumps (e.g. background tab)
    const delta = Math.min(rawDelta, 0.1);

    if (this.state === 'MENU') {
      this.updateMenuCinematic(delta);
    } else if (this.state === 'PLAYING') {
      this.updateCombat(delta);
    }

    // Always render 3D scene
    this.sceneManager.render();
  }

  // MENU CINEMATIC SHOWCASE (Player plane banking smoothly in sky)
  updateMenuCinematic(delta) {
    this.idleTime += delta;

    // Gentle barrel roll / banking sway
    const x = Math.sin(this.idleTime * 0.8) * 12;
    const y = Math.cos(this.idleTime * 0.5) * 4;
    this.player.position.set(x, y, 0);
    this.player.mesh.position.copy(this.player.position);

    const roll = -Math.cos(this.idleTime * 0.8) * 0.45;
    const pitch = -Math.sin(this.idleTime * 0.5) * 0.2;
    this.player.mesh.rotation.set(pitch, -x * 0.02, roll);

    // Scroll scene at cruising speed
    this.sceneManager.update(delta, CONFIG.bounds.baseSpeed * 0.7);
    this.sceneManager.updateCamera(this.player.position, this.player.mesh.rotation, false, delta);
  }

  // PLAYING STATE UPDATE
  updateCombat(delta) {
    const isBoosting = this.player.isBoosting;
    const flightSpeed = isBoosting ? CONFIG.bounds.boostSpeed : CONFIG.bounds.baseSpeed;

    // 1. Update Player
    this.player.update(delta);
    this.audio.updateEnginePitch(isBoosting, true);

    // 2. Primary Weapons Firing (Machine Guns)
    if (this.player.canFirePrimary()) {
      const shot = this.player.triggerPrimaryFire();
      this.weaponManager.spawnPlayerBullet(shot.position);
      this.audio.playLaser(shot.isAlternate);
    }

    // 3. Secondary Weapons Launch (Guided Missiles)
    if (this.player.canLaunchMissile()) {
      const launch = this.player.triggerMissileLaunch();
      const target = this.weaponManager.findClosestTargetInCone(
        this.player.position,
        this.enemyManager.activeEnemies
      );
      this.weaponManager.spawnMissile(launch.position, target);
      this.audio.playMissileLaunch();
    }

    // 4. Nova EMP Bomb Trigger (Key B or Touch Bomb)
    if (this.player.keys.bomb) {
      this.player.keys.bomb = false;
      this.player.triggerNovaBomb(
        this.weaponManager,
        this.enemyManager,
        this.effectsManager,
        this.audio,
        (enemy, pts, pos) => this.onEnemyDestroyed(enemy, pts, pos)
      );
    }

    // 5. Force Shield Trigger (Key E/C or Touch Shield)
    if (this.player.keys.shield) {
      this.player.keys.shield = false;
      this.player.triggerShieldBurst(this.audio, this.effectsManager);
    }

    // 4. Update Weapons, Projectiles & Homing Guidance
    this.weaponManager.update(delta, this.enemyManager.activeEnemies, this.effectsManager);

    // 5. Update Enemies & AI
    this.enemyManager.update(delta, this.player.position, this.weaponManager, this.audio);

    // 6. Update Power-ups
    this.powerUpManager.update(delta, this.player, this.audio, this.ui, this.effectsManager);

    // 7. Update Visual Effects & Particles
    this.effectsManager.update(delta, isBoosting);

    // 8. Update World Scene & Scrolling Clouds
    this.sceneManager.update(delta, flightSpeed);
    this.sceneManager.updateCamera(this.player.position, this.player.mesh.rotation, isBoosting, delta);

    // 9. Check Collisions & Combat Hits
    this.handleCombatCollisions();

    // 10. Check Wave Completion
    if (this.enemyManager.isWaveCleared()) {
      if (this.waveTransitionTimer > 0) {
        this.waveTransitionTimer -= delta;
        if (this.waveTransitionTimer <= 0) {
          this.startCurrentWave();
        }
      } else {
        this.advanceWave();
      }
    }

    // 11. Update HUD UI
    const waveProgress = this.enemyManager.getWaveProgress();
    const activeBoss = this.enemyManager.getActiveBoss();
    const activeBosses = this.enemyManager.getActiveBosses();
    this.ui.updateHud(
      this.player,
      this.score,
      waveProgress,
      this.sceneManager.camera,
      this.enemyManager.activeEnemies,
      activeBoss,
      activeBosses
    );

    // 12. Update Mobile Touch Controls
    if (this.mobileControls) this.mobileControls.update();
  }

  handleCombatCollisions() {
    // 1. Player Lasers Hit Enemies
    this.weaponManager.checkPlayerBulletHits(this.enemyManager.activeEnemies, (enemy, damage, hitPos) => {
      this.audio.playHit(false);
      this.effectsManager.spawnFloatingText(hitPos, `-${damage}`);

      const result = enemy.takeDamage(damage);
      if (result.destroyed) {
        this.onEnemyDestroyed(enemy, result.points, result.position);
      }
    });

    // 2. Missiles Hit & Blast Enemies
    this.weaponManager.checkMissileHits(this.enemyManager.activeEnemies, (detonatePos, blastDamage, radius) => {
      this.audio.playExplosion(true);
      this.effectsManager.spawnExplosion(detonatePos, true);

      // Area blast damage to all enemies within radius
      this.enemyManager.activeEnemies.forEach(enemy => {
        if (enemy.isDead) return;
        const dist = enemy.position.distanceTo(detonatePos);
        if (dist < radius) {
          const falloff = 1 - (dist / radius) * 0.4;
          const damage = Math.round(blastDamage * falloff);
          this.effectsManager.spawnFloatingText(enemy.position, `CRIT -${damage}`, true);

          const result = enemy.takeDamage(damage);
          if (result.destroyed) {
            this.onEnemyDestroyed(enemy, result.points, result.position);
          }
        }
      });
    });

    // 3. Enemy Bullets Hit Player
    this.weaponManager.checkEnemyBulletHits(this.player, (damage, hitPos) => {
      const res = this.player.takeDamage(damage);
      if (res.hit) {
        this.audio.playHit(res.shielded);
        this.effectsManager.flashScreen(res.shielded ? 'shield' : 'damage');

        if (res.dead) {
          this.triggerGameOver();
        }
      }
    });

    // 4. Direct Aircraft Collisions
    const pPos = this.player.position;
    const playerRadius = 2.4;

    for (const enemy of this.enemyManager.activeEnemies) {
      if (enemy.isDead) continue;
      const dist = enemy.position.distanceTo(pPos);
      if (dist < playerRadius + enemy.radius) {
        // Collision impact!
        this.audio.playExplosion(false);
        this.effectsManager.spawnExplosion(enemy.position, false);

        // Heavy mutual damage
        enemy.takeDamage(100);
        const res = this.player.takeDamage(30);

        if (res.dead) {
          this.triggerGameOver();
        }
      }
    }
  }

  onEnemyDestroyed(enemy, points, pos) {
    this.enemiesDestroyed++;
    this.score += points;

    if (enemy.isBoss) {
      // Epic multi-stage explosion for the Titan Boss!
      this.audio.playExplosion(true);
      this.audio.playWaveClear();
      this.effectsManager.spawnExplosion(pos, true);
      this.effectsManager.flashScreen('damage');
      this.effectsManager.spawnFloatingText(pos, `+${points} ${enemy.name ? enemy.name.toUpperCase() : 'TITAN'} SLAYED!`, true);

      // Staggered secondary blast explosions across his body
      for (let i = 1; i <= 4; i++) {
        setTimeout(() => {
          const offsetPos = pos.clone();
          offsetPos.x += (Math.random() - 0.5) * 14;
          offsetPos.y += (Math.random() - 0.5) * 8;
          this.audio.playExplosion(true);
          this.effectsManager.spawnExplosion(offsetPos, true);
        }, i * 200);
      }

      // Drop massive power-up cluster
      for (let i = 0; i < 4; i++) {
        setTimeout(() => {
          this.powerUpManager.spawnAmbientPowerup();
        }, i * 150);
      }
    } else {
      this.audio.playExplosion(enemy.type === 'gunship');
      this.effectsManager.spawnExplosion(pos, enemy.type === 'gunship');
      this.effectsManager.spawnFloatingText(pos, `+${points} PTS`, points >= 250);
      this.powerUpManager.tryDropFromEnemy(pos, this.player.health, this.player.missiles);
    }

    // Register with enemy manager for wave tracking
    this.enemyManager.onEnemyDefeated(enemy);
  }
}

// Instantiate game on window load
window.addEventListener('DOMContentLoaded', () => {
  new SkyHunterGame();
});
