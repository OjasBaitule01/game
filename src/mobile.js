// Sky Hunter 3D — Mobile Touch Controller & Virtual Joystick
import * as THREE from 'three';

export class MobileControlsManager {
  constructor(game, player) {
    this.game = game;
    this.player = player;

    this.container = document.getElementById('mobile-controls');
    this.joystickZone = document.getElementById('touch-joystick-zone');
    this.joystickBase = document.getElementById('joystick-base');
    this.joystickThumb = document.getElementById('joystick-thumb');

    // Attack Buttons
    this.btnFire = document.getElementById('btn-touch-fire');
    this.btnMissile = document.getElementById('btn-touch-missile');
    this.btnBomb = document.getElementById('btn-touch-bomb');
    this.btnShield = document.getElementById('btn-touch-shield');
    this.btnBoost = document.getElementById('btn-touch-boost');

    // Utility Quick Toggles
    this.btnAutofire = document.getElementById('btn-touch-autofire');
    this.btnUnlimited = document.getElementById('btn-touch-unlimited');
    this.btnToggleHud = document.getElementById('btn-toggle-touch');

    // Button Status Badges
    this.missileTouchCount = document.getElementById('missile-touch-count');
    this.bombTouchStatus = document.getElementById('bomb-touch-status');
    this.shieldTouchStatus = document.getElementById('shield-touch-status');

    this.activeJoystickTouchId = null;
    this.maxRadius = 48; // Maximum joystick thumb travel in px
    this.centerOrigin = { x: 0, y: 0 };
    this.isDraggingJoystick = false;

    // Detect touch capability or mobile screen
    this.isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || window.innerWidth <= 1024;
    this.isEnabled = true; // Enabled so virtual controls work on both desktop preview and mobile

    this.init();
  }

  init() {
    if (!this.container) return;

    // Show controls by default (can be toggled anytime via [🕹️] button)
    this.container.classList.add('touch-active');

    if (this.btnAutofire) {
      this.btnAutofire.classList.toggle('active', this.player.autoFire);
    }
    if (this.btnUnlimited) {
      this.btnUnlimited.classList.toggle('active', this.player.unlimitedAmmo);
    }

    this.initJoystick();
    this.initActionButtons();
    this.initHudToggle();
  }

  initJoystick() {
    if (!this.joystickZone || !this.joystickBase || !this.joystickThumb) return;

    // Touch events on Virtual Joystick Zone
    this.joystickZone.addEventListener('touchstart', (e) => this.handleJoystickStart(e), { passive: false });
    window.addEventListener('touchmove', (e) => this.handleJoystickMove(e), { passive: false });
    window.addEventListener('touchend', (e) => this.handleJoystickEnd(e), { passive: false });
    window.addEventListener('touchcancel', (e) => this.handleJoystickEnd(e), { passive: false });

    // Mouse / Pointer fallback for desktop testing
    this.joystickBase.addEventListener('mousedown', (e) => {
      this.isDraggingJoystick = true;
      const rect = this.joystickBase.getBoundingClientRect();
      this.centerOrigin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      this.joystickBase.classList.add('active');
      this.updateJoystickPosition(e.clientX, e.clientY);
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDraggingJoystick) return;
      this.updateJoystickPosition(e.clientX, e.clientY);
    });

    window.addEventListener('mouseup', () => {
      if (!this.isDraggingJoystick) return;
      this.isDraggingJoystick = false;
      this.joystickBase.classList.remove('active');
      this.resetJoystick();
    });
  }

  handleJoystickStart(e) {
    if (this.activeJoystickTouchId !== null) return;

    const touch = e.changedTouches[0];
    this.activeJoystickTouchId = touch.identifier;

    const rect = this.joystickBase.getBoundingClientRect();
    this.centerOrigin = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };

    this.joystickBase.classList.add('active');
    this.updateJoystickPosition(touch.clientX, touch.clientY);
    e.preventDefault();
  }

  handleJoystickMove(e) {
    if (this.activeJoystickTouchId === null) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === this.activeJoystickTouchId) {
        this.updateJoystickPosition(touch.clientX, touch.clientY);
        e.preventDefault();
        break;
      }
    }
  }

  handleJoystickEnd(e) {
    if (this.activeJoystickTouchId === null) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === this.activeJoystickTouchId) {
        this.activeJoystickTouchId = null;
        this.joystickBase.classList.remove('active');
        this.resetJoystick();
        e.preventDefault();
        break;
      }
    }
  }

  updateJoystickPosition(clientX, clientY) {
    const dx = clientX - this.centerOrigin.x;
    const dy = clientY - this.centerOrigin.y;
    const dist = Math.hypot(dx, dy);

    let travelX = dx;
    let travelY = dy;

    if (dist > this.maxRadius) {
      travelX = (dx / dist) * this.maxRadius;
      travelY = (dy / dist) * this.maxRadius;
    }

    this.joystickThumb.style.transform = `translate(${travelX}px, ${travelY}px)`;

    // Compute normalized vectors (-1.0 to 1.0)
    // Screen Y down is negative flight pitch (dive), up is positive (climb)
    const normX = travelX / this.maxRadius;
    const normY = -travelY / this.maxRadius;

    this.player.setTouchSteer(normX, normY);
  }

  resetJoystick() {
    this.joystickThumb.style.transform = 'translate(0px, 0px)';
    this.player.setTouchSteer(0, 0);
  }

  initActionButtons() {
    // 1. Primary Cannons Fire Button (Hold or tap to fire lasers)
    if (this.btnFire) {
      const startFire = (e) => {
        e.preventDefault();
        this.btnFire.classList.add('pressed');
        this.player.setTouchFire(true);
      };
      const stopFire = (e) => {
        e.preventDefault();
        this.btnFire.classList.remove('pressed');
        this.player.setTouchFire(false);
      };

      this.btnFire.addEventListener('touchstart', startFire, { passive: false });
      this.btnFire.addEventListener('touchend', stopFire, { passive: false });
      this.btnFire.addEventListener('touchcancel', stopFire, { passive: false });
      this.btnFire.addEventListener('mousedown', startFire);
      this.btnFire.addEventListener('mouseup', stopFire);
      this.btnFire.addEventListener('mouseleave', stopFire);
    }

    // 2. Guided Missiles Attack Button (Tap to fire guided missile)
    if (this.btnMissile) {
      const fireMissile = (e) => {
        e.preventDefault();
        this.btnMissile.classList.add('pressed');
        setTimeout(() => this.btnMissile.classList.remove('pressed'), 180);

        if (this.player.canLaunchMissile() || this.player.unlimitedAmmo) {
          const launch = this.player.triggerMissileLaunch();
          const target = this.game.weaponManager.findClosestTargetInCone(
            this.player.position,
            this.game.enemyManager.activeEnemies
          );
          this.game.weaponManager.spawnMissile(launch.position, target);
          this.game.audio.playMissileLaunch();
        }
      };

      this.btnMissile.addEventListener('touchstart', fireMissile, { passive: false });
      this.btnMissile.addEventListener('click', fireMissile);
    }

    // 3. EMP Nova Bomb Superweapon Attack Button
    if (this.btnBomb) {
      const fireBomb = (e) => {
        e.preventDefault();
        this.btnBomb.classList.add('pressed');
        setTimeout(() => this.btnBomb.classList.remove('pressed'), 250);

        const success = this.player.triggerNovaBomb(
          this.game.weaponManager,
          this.game.enemyManager,
          this.game.effectsManager,
          this.game.audio,
          (enemy, pts, pos) => this.game.onEnemyDestroyed(enemy, pts, pos)
        );

        if (success) {
          this.game.ui.showCombatPopup('💥 EMP NOVA SUPERWEAPON DETONATED!', true, 'crit');
        } else {
          this.game.ui.showCombatPopup(`EMP RECHARGING (${Math.ceil(this.player.bombCooldownTimer)}s)`, false);
        }
      };

      this.btnBomb.addEventListener('touchstart', fireBomb, { passive: false });
      this.btnBomb.addEventListener('click', fireBomb);
    }

    // 4. Force Shield Defense Button
    if (this.btnShield) {
      const triggerShield = (e) => {
        e.preventDefault();
        this.btnShield.classList.add('pressed');
        setTimeout(() => this.btnShield.classList.remove('pressed'), 200);

        this.player.triggerShieldBurst(this.game.audio, this.game.effectsManager);
        this.game.ui.showCombatPopup('🛡️ KINETIC SHIELD ENGAGED (6s)', true, 'powerup');
      };

      this.btnShield.addEventListener('touchstart', triggerShield, { passive: false });
      this.btnShield.addEventListener('click', triggerShield);
    }

    // 5. Afterburner Boost Button (Hold or tap to boost)
    if (this.btnBoost) {
      const startBoost = (e) => {
        e.preventDefault();
        this.btnBoost.classList.add('pressed');
        this.player.setTouchBoost(true);
      };
      const stopBoost = (e) => {
        e.preventDefault();
        this.btnBoost.classList.remove('pressed');
        this.player.setTouchBoost(false);
      };

      this.btnBoost.addEventListener('touchstart', startBoost, { passive: false });
      this.btnBoost.addEventListener('touchend', stopBoost, { passive: false });
      this.btnBoost.addEventListener('touchcancel', stopBoost, { passive: false });
      this.btnBoost.addEventListener('mousedown', startBoost);
      this.btnBoost.addEventListener('mouseup', stopBoost);
      this.btnBoost.addEventListener('mouseleave', stopBoost);
    }

    // 6. Auto-Fire Quick Toggle Button
    if (this.btnAutofire) {
      const toggleAutofire = (e) => {
        e.preventDefault();
        const active = this.player.toggleAutoFire();
        this.btnAutofire.classList.toggle('active', active);
        this.game.ui.showCombatPopup(active ? '⚡ AUTO-FIRE ENGAGED' : 'MANUAL TRIGGER ACTIVE', false, 'powerup');
      };

      this.btnAutofire.addEventListener('touchstart', toggleAutofire, { passive: false });
      this.btnAutofire.addEventListener('click', toggleAutofire);
    }

    // 7. Unlimited Ammo Quick Toggle Button
    if (this.btnUnlimited) {
      const toggleUnlimited = (e) => {
        e.preventDefault();
        this.player.unlimitedAmmo = !this.player.unlimitedAmmo;
        this.game.ui.settings.unlimitedAmmo = this.player.unlimitedAmmo;
        if (this.game.ui.settingUnlimitedAmmo) {
          this.game.ui.settingUnlimitedAmmo.checked = this.player.unlimitedAmmo;
        }
        this.game.ui.savePersistence();
        this.btnUnlimited.classList.toggle('active', this.player.unlimitedAmmo);
        const text = this.player.unlimitedAmmo ? '⚡ UNLIMITED AMMO ACTIVE!' : 'AMMO DEPLETION ACTIVE';
        this.game.ui.showCombatPopup(text, true, 'powerup');
      };

      this.btnUnlimited.addEventListener('touchstart', toggleUnlimited, { passive: false });
      this.btnUnlimited.addEventListener('click', toggleUnlimited);
    }
  }

  initHudToggle() {
    if (this.btnToggleHud) {
      this.btnToggleHud.addEventListener('click', () => {
        if (!this.container) return;
        this.container.classList.toggle('touch-active');
        const isVisible = this.container.classList.contains('touch-active');
        this.game.ui.showCombatPopup(isVisible ? '🕹️ ON-SCREEN CONTROLS ON' : '🕹️ CONTROLS HIDDEN', false);
      });
    }
  }

  show() {
    if (this.container) {
      this.container.classList.remove('hidden');
      this.container.classList.add('touch-active');
    }
  }

  hide() {
    if (this.container) {
      this.container.classList.add('hidden');
      this.resetJoystick();
      this.player.setTouchFire(false);
      this.player.setTouchBoost(false);
    }
  }

  update() {
    // Keep button active states in sync with player state
    if (this.btnAutofire) {
      this.btnAutofire.classList.toggle('active', this.player.autoFire);
    }
    if (this.btnUnlimited) {
      this.btnUnlimited.classList.toggle('active', this.player.unlimitedAmmo);
    }

    // Dynamic missile count label
    if (this.missileTouchCount) {
      this.missileTouchCount.textContent = this.player.unlimitedAmmo ? '∞' : `x${this.player.missiles}`;
    }

    // Dynamic bomb cooldown label
    if (this.bombTouchStatus) {
      if (this.player.unlimitedAmmo || this.player.bombCooldownTimer <= 0) {
        this.bombTouchStatus.textContent = 'READY';
        this.bombTouchStatus.style.color = '#00f0ff';
      } else {
        this.bombTouchStatus.textContent = `${Math.ceil(this.player.bombCooldownTimer)}s`;
        this.bombTouchStatus.style.color = '#ffaa00';
      }
    }

    // Dynamic shield status label
    if (this.shieldTouchStatus) {
      if (this.player.shieldTime > 0) {
        this.shieldTouchStatus.textContent = `${Math.ceil(this.player.shieldTime)}s`;
        this.shieldTouchStatus.style.color = '#00ff88';
      } else {
        this.shieldTouchStatus.textContent = 'READY';
        this.shieldTouchStatus.style.color = '#38bdf8';
      }
    }
  }
}
