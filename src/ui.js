import { CONFIG } from './config.js';

export class UIManager {
  constructor(game) {
    this.game = game;

    // Cache DOM Elements
    this.hud = document.getElementById('hud');
    this.screenMenu = document.getElementById('screen-menu');
    this.screenHelp = document.getElementById('screen-help');
    this.screenSettings = document.getElementById('screen-settings');
    this.screenPause = document.getElementById('screen-pause');
    this.screenGameOver = document.getElementById('screen-gameover');

    // HUD Elements
    this.hpBar = document.getElementById('hud-hp-bar');
    this.hpText = document.getElementById('hud-hp-text');
    this.shieldContainer = document.getElementById('hud-shield-container');
    this.shieldBar = document.getElementById('hud-shield-bar');
    this.shieldText = document.getElementById('hud-shield-text');
    this.buffsContainer = document.getElementById('hud-buffs');

    this.waveBadge = document.getElementById('hud-wave-badge');
    this.waveName = document.getElementById('hud-wave-name');
    this.enemiesCount = document.getElementById('hud-enemies-count');
    this.waveProgressBar = document.getElementById('hud-wave-progress-bar');

    this.scoreVal = document.getElementById('hud-score');
    this.bestScoreVal = document.getElementById('hud-best-score');
    this.missileSlots = document.getElementById('missile-slots');
    this.boostBar = document.getElementById('hud-boost-bar');
    this.boostStatus = document.getElementById('hud-boost-status');

    this.announcementBanner = document.getElementById('announcement-banner');
    this.announcementTitle = document.getElementById('announcement-title');
    this.announcementSub = document.getElementById('announcement-sub');
    this.targetIndicatorsContainer = document.getElementById('target-indicators');
    this.combatPopups = document.getElementById('combat-popups');

    // Boss HUD Elements
    this.bossHud = document.getElementById('boss-hud');
    this.bossHpBar = document.getElementById('boss-hp-bar');
    this.bossHpNumeric = document.getElementById('boss-hp-numeric');
    this.btnBossBattle = document.getElementById('btn-boss-battle');
    this.bossHudImg = document.getElementById('boss-hud-img');
    this.bossHudName = document.getElementById('boss-hud-name');
    this.bossHudBadge = document.getElementById('boss-hud-badge');
    this.bossHudGlow = document.getElementById('boss-hud-glow');

    // Multi-Boss Squad HUD
    this.bossSquadHud = document.getElementById('boss-squad-hud');
    this.bossSquadMap = new Map();
    this.lastSquadIds = '';

    // Boss Selection Modal Elements
    this.screenBossSelect = document.getElementById('screen-boss-select');
    this.bossCardsGrid = document.getElementById('boss-cards-grid');
    this.btnBossRandom = document.getElementById('btn-boss-random');
    this.btnBossSelectClose = document.getElementById('btn-boss-select-close');
    this.btnBossSelectBack = document.getElementById('btn-boss-select-back');

    // Menu High Score elements
    this.menuHighScore = document.getElementById('menu-high-score');
    this.menuMaxWave = document.getElementById('menu-max-wave');

    // Settings input elements
    this.settingMasterVol = document.getElementById('setting-master-vol');
    this.settingMusicVol = document.getElementById('setting-music-vol');
    this.settingSfxVol = document.getElementById('setting-sfx-vol');
    this.valMasterVol = document.getElementById('val-master-vol');
    this.valMusicVol = document.getElementById('val-music-vol');
    this.valSfxVol = document.getElementById('val-sfx-vol');

    this.settingMouseSteer = document.getElementById('setting-mouse-steer');
    this.settingMouseSens = document.getElementById('setting-mouse-sens');
    this.valMouseSens = document.getElementById('val-mouse-sens');

    this.settingGraphics = document.getElementById('setting-graphics');
    this.settingReducedFx = document.getElementById('setting-reduced-fx');
    this.settingUnlimitedAmmo = document.getElementById('setting-unlimited-ammo');
    this.settingTouchControls = document.getElementById('setting-touch-controls');

    // Game Over elements
    this.goFinalScore = document.getElementById('go-final-score');
    this.goBestScore = document.getElementById('go-best-score');
    this.goWaveReached = document.getElementById('go-wave-reached');
    this.goEnemiesDestroyed = document.getElementById('go-enemies-destroyed');

    // Persistent storage state
    this.highScore = 0;
    this.maxWave = 1;
    this.settings = {
      masterVol: 80,
      musicVol: 70,
      sfxVol: 85,
      mouseSteer: false,
      mouseSens: 5,
      graphics: 'high',
      reducedFx: false,
      unlimitedAmmo: true,
      touchControls: 'auto',
    };

    this.loadPersistence();
    this.bindEvents();
    this.applySettings();
    this.populateBossCards();
  }

  loadPersistence() {
    try {
      const savedHigh = localStorage.getItem('skyhunter_highscore');
      if (savedHigh !== null) this.highScore = parseInt(savedHigh, 10) || 0;

      const savedWave = localStorage.getItem('skyhunter_maxwave');
      if (savedWave !== null) this.maxWave = parseInt(savedWave, 10) || 1;

      const savedSettings = localStorage.getItem('skyhunter_settings');
      if (savedSettings) {
        this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }

    this.updateMenuStats();
  }

  savePersistence() {
    try {
      localStorage.setItem('skyhunter_highscore', this.highScore.toString());
      localStorage.setItem('skyhunter_maxwave', this.maxWave.toString());
      localStorage.setItem('skyhunter_settings', JSON.stringify(this.settings));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }

  recordScore(score, wave) {
    let newRecord = false;
    if (score > this.highScore) {
      this.highScore = score;
      newRecord = true;
    }
    if (wave > this.maxWave) {
      this.maxWave = wave;
    }
    this.savePersistence();
    this.updateMenuStats();
    return newRecord;
  }

  updateMenuStats() {
    if (this.menuHighScore) this.menuHighScore.textContent = this.highScore.toLocaleString();
    if (this.menuMaxWave) this.menuMaxWave.textContent = this.maxWave.toString();
    if (this.bestScoreVal) this.bestScoreVal.textContent = this.padScore(this.highScore);
  }

  padScore(num) {
    return num.toString().padStart(6, '0');
  }

  // Populate Boss Selection Modal
  populateBossCards() {
    if (!this.bossCardsGrid) return;
    this.bossCardsGrid.innerHTML = '';

    // 1. Featured "ALL 5 AURA BOSSES — SIMULTANEOUS WAR" card
    const allCard = document.createElement('div');
    allCard.className = 'boss-card-item featured-all';
    allCard.innerHTML = `
      <div class="boss-card-top">
        <div class="boss-card-img-wrap" style="border-color: #a855f7; box-shadow: 0 0 16px #a855f7;">
          <img src="/assets/rakshas_tenheaded.png" class="boss-card-img" alt="All 5 Titans" />
        </div>
        <div class="boss-card-meta">
          <div class="boss-card-name" style="color: #ffb703;">⚡ ALL 5 RAKSHAS AURA BOSSES (PENTACLE WAR)</div>
          <div class="boss-card-title">Simultaneous 5-Titan Combat Gauntlet</div>
          <span class="boss-card-badge" style="color: #ff0077; border-color: #ff0077;">ALL 5 ELEMENTAL AURAS COMBINED</span>
        </div>
      </div>
      <div class="boss-card-stats">
        <span>ENEMIES: <strong>5 TITANS AT ONCE</strong></span>
        <span>ARSENAL: <strong style="color: #00ff88;">UNLIMITED AMMO [U]</strong></span>
        <span>BOUNTY: <strong>25,000 PTS</strong></span>
      </div>
      <button class="btn-boss-hunt pulse-boss" data-boss-id="all_5">
        ⚡ ENGAGE ALL 5 AURA TITANS SIMULTANEOUSLY
      </button>
    `;
    this.bossCardsGrid.appendChild(allCard);

    // 2. Individual Boss Cards
    CONFIG.rakshasBosses.forEach(boss => {
      const card = document.createElement('div');
      card.className = 'boss-card-item';
      const hex = `#${boss.auraColor.toString(16).padStart(6, '0')}`;
      card.style.setProperty('--card-aura-color', hex);

      card.innerHTML = `
        <div class="boss-card-top">
          <div class="boss-card-img-wrap" style="border-color: ${hex}; box-shadow: 0 0 10px ${hex};">
            <img src="${boss.image}" class="boss-card-img" alt="${boss.name}" />
          </div>
          <div class="boss-card-meta">
            <div class="boss-card-name">${boss.name}</div>
            <div class="boss-card-title">${boss.title}</div>
            <span class="boss-card-badge" style="color: ${hex}; border-color: ${hex};">${boss.auraName.toUpperCase()}</span>
          </div>
        </div>
        <div class="boss-card-stats">
          <span>HP: <strong>${boss.health}</strong></span>
          <span>SPEED: <strong>${boss.speed}</strong></span>
          <span>VALUE: <strong>${boss.points} PTS</strong></span>
        </div>
        <button class="btn-boss-hunt" data-boss-id="${boss.id}" style="background: linear-gradient(135deg, ${hex}, #ff3700);">
          HUNT ${boss.name.toUpperCase()}
        </button>
      `;
      this.bossCardsGrid.appendChild(card);
    });

    // Wire up all click buttons
    this.bossCardsGrid.querySelectorAll('.btn-boss-hunt').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const bossId = e.currentTarget.getAttribute('data-boss-id');
        this.hideModal(this.screenBossSelect);
        this.game.startBossMission(bossId);
      });
    });
  }

  bindEvents() {
    // Menu Play
    const btnPlay = document.getElementById('btn-play');
    if (btnPlay) {
      btnPlay.addEventListener('click', () => {
        this.game.audio.playClick();
        this.game.startMission();
      });
    }

    // Boss Battle Button -> Opens Boss Gauntlet Selection Modal
    if (this.btnBossBattle) {
      this.btnBossBattle.addEventListener('click', () => {
        this.game.audio.playClick();
        this.showModal(this.screenBossSelect);
      });
    }

    // Boss Selection Modal Buttons
    if (this.btnBossRandom) {
      this.btnBossRandom.addEventListener('click', () => {
        this.hideModal(this.screenBossSelect);
        this.game.startBossMission('all_5');
      });
    }
    if (this.btnBossSelectClose) {
      this.btnBossSelectClose.addEventListener('click', () => this.hideModal(this.screenBossSelect));
    }
    if (this.btnBossSelectBack) {
      this.btnBossSelectBack.addEventListener('click', () => this.hideModal(this.screenBossSelect));
    }

    // Help Modal
    const btnHelp = document.getElementById('btn-how-to-play');
    const btnHelpClose = document.getElementById('btn-help-close');
    const btnHelpBack = document.getElementById('btn-help-back');
    if (btnHelp) btnHelp.addEventListener('click', () => this.showModal(this.screenHelp));
    if (btnHelpClose) btnHelpClose.addEventListener('click', () => this.hideModal(this.screenHelp));
    if (btnHelpBack) btnHelpBack.addEventListener('click', () => this.hideModal(this.screenHelp));

    // Settings Modal
    const btnSettings = document.getElementById('btn-settings');
    const btnSettingsClose = document.getElementById('btn-settings-close');
    const btnSettingsSave = document.getElementById('btn-settings-save');
    if (btnSettings) btnSettings.addEventListener('click', () => this.showModal(this.screenSettings));
    if (btnSettingsClose) btnSettingsClose.addEventListener('click', () => this.hideModal(this.screenSettings));
    if (btnSettingsSave) {
      btnSettingsSave.addEventListener('click', () => {
        this.readSettingsInputs();
        this.applySettings();
        this.savePersistence();
        this.hideModal(this.screenSettings);
      });
    }

    // Settings Sliders Live update
    if (this.settingMasterVol) {
      this.settingMasterVol.addEventListener('input', (e) => {
        this.valMasterVol.textContent = `${e.target.value}%`;
        this.game.audio.setMasterVolume(e.target.value / 100);
      });
    }
    if (this.settingMusicVol) {
      this.settingMusicVol.addEventListener('input', (e) => {
        this.valMusicVol.textContent = `${e.target.value}%`;
        this.game.audio.setMusicVolume(e.target.value / 100);
      });
    }
    if (this.settingSfxVol) {
      this.settingSfxVol.addEventListener('input', (e) => {
        this.valSfxVol.textContent = `${e.target.value}%`;
        this.game.audio.setSfxVolume(e.target.value / 100);
      });
    }
    if (this.settingMouseSens) {
      this.settingMouseSens.addEventListener('input', (e) => {
        this.valMouseSens.textContent = e.target.value;
      });
    }

    // Pause button in HUD
    const btnPauseHud = document.getElementById('btn-pause-hud');
    if (btnPauseHud) {
      btnPauseHud.addEventListener('click', () => {
        this.game.togglePause();
      });
    }

    // Pause Screen Buttons
    const btnPauseResume = document.getElementById('btn-pause-resume');
    const btnPauseRestart = document.getElementById('btn-pause-restart');
    const btnPauseSettings = document.getElementById('btn-pause-settings');
    const btnPauseMenu = document.getElementById('btn-pause-menu');

    if (btnPauseResume) btnPauseResume.addEventListener('click', () => this.game.togglePause());
    if (btnPauseRestart) btnPauseRestart.addEventListener('click', () => this.game.restartMission());
    if (btnPauseSettings) btnPauseSettings.addEventListener('click', () => this.showModal(this.screenSettings));
    if (btnPauseMenu) btnPauseMenu.addEventListener('click', () => this.game.returnToMenu());

    // Game Over Buttons
    const btnGoRestart = document.getElementById('btn-gameover-restart');
    const btnGoMenu = document.getElementById('btn-gameover-menu');
    if (btnGoRestart) btnGoRestart.addEventListener('click', () => this.game.restartMission());
    if (btnGoMenu) btnGoMenu.addEventListener('click', () => this.game.returnToMenu());

    // Keyboard Shortcuts: Pause (P/Esc) and Unlimited Ammo (U)
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (this.game.state === 'PLAYING' || this.game.state === 'PAUSED') {
          this.game.togglePause();
        }
      } else if (e.code === 'KeyU') {
        if (this.game.player) {
          this.game.player.unlimitedAmmo = !this.game.player.unlimitedAmmo;
          this.settings.unlimitedAmmo = this.game.player.unlimitedAmmo;
          if (this.settingUnlimitedAmmo) this.settingUnlimitedAmmo.checked = this.settings.unlimitedAmmo;
          this.savePersistence();
          const statusText = this.game.player.unlimitedAmmo ? '⚡ UNLIMITED AMMO ACTIVATED!' : 'AMMO DEPLETION RESTORED';
          this.showCombatPopup(statusText, true, 'powerup');
        }
      }
    });
  }

  readSettingsInputs() {
    this.settings.masterVol = parseInt(this.settingMasterVol.value, 10);
    this.settings.musicVol = parseInt(this.settingMusicVol.value, 10);
    this.settings.sfxVol = parseInt(this.settingSfxVol.value, 10);
    this.settings.mouseSteer = this.settingMouseSteer.checked;
    this.settings.mouseSens = parseInt(this.settingMouseSens.value, 10);
    this.settings.graphics = this.settingGraphics.value;
    this.settings.reducedFx = this.settingReducedFx.checked;
    this.settings.unlimitedAmmo = this.settingUnlimitedAmmo ? this.settingUnlimitedAmmo.checked : true;
    if (this.settingTouchControls) this.settings.touchControls = this.settingTouchControls.value;
  }

  applySettings() {
    // Populate form fields
    if (this.settingMasterVol) this.settingMasterVol.value = this.settings.masterVol;
    if (this.valMasterVol) this.valMasterVol.textContent = `${this.settings.masterVol}%`;

    if (this.settingMusicVol) this.settingMusicVol.value = this.settings.musicVol;
    if (this.valMusicVol) this.valMusicVol.textContent = `${this.settings.musicVol}%`;

    if (this.settingSfxVol) this.settingSfxVol.value = this.settings.sfxVol;
    if (this.valSfxVol) this.valSfxVol.textContent = `${this.settings.sfxVol}%`;

    if (this.settingMouseSteer) this.settingMouseSteer.checked = this.settings.mouseSteer;
    if (this.settingMouseSens) this.settingMouseSens.value = this.settings.mouseSens;
    if (this.valMouseSens) this.valMouseSens.textContent = this.settings.mouseSens;

    if (this.settingGraphics) this.settingGraphics.value = this.settings.graphics;
    if (this.settingReducedFx) this.settingReducedFx.checked = this.settings.reducedFx;
    if (this.settingUnlimitedAmmo) this.settingUnlimitedAmmo.checked = this.settings.unlimitedAmmo !== false;
    if (this.settingTouchControls && this.settings.touchControls) {
      this.settingTouchControls.value = this.settings.touchControls;
    }

    // Apply to Game subsystems
    if (this.game.audio) {
      this.game.audio.setMasterVolume(this.settings.masterVol / 100);
      this.game.audio.setMusicVolume(this.settings.musicVol / 100);
      this.game.audio.setSfxVolume(this.settings.sfxVol / 100);
    }

    if (this.game.player) {
      this.game.player.mouseSteerEnabled = this.settings.mouseSteer;
      this.game.player.mouseSensitivity = this.settings.mouseSens;
      this.game.player.unlimitedAmmo = this.settings.unlimitedAmmo !== false;
    }

    if (this.game.sceneManager) {
      this.game.sceneManager.setGraphicsQuality(this.settings.graphics);
    }

    if (this.game.effectsManager) {
      this.game.effectsManager.setReducedFx(this.settings.reducedFx);
    }

    // Apply touch controls visibility
    if (this.game.mobileControls && this.game.mobileControls.container) {
      const mode = this.settings.touchControls || 'auto';
      if (mode === 'always') {
        this.game.mobileControls.container.classList.add('touch-active');
      } else if (mode === 'hidden') {
        this.game.mobileControls.container.classList.remove('touch-active');
      } else {
        // Auto
        if (this.game.mobileControls.isTouchDevice) {
          this.game.mobileControls.container.classList.add('touch-active');
        } else {
          this.game.mobileControls.container.classList.remove('touch-active');
        }
      }
    }
  }

  showModal(el) {
    if (el) el.classList.remove('hidden');
    if (this.game.audio) this.game.audio.playClick();
  }

  hideModal(el) {
    if (el) el.classList.add('hidden');
    if (this.game.audio) this.game.audio.playClick();
  }

  // SCREEN TRANSITIONS
  showMenuScreen() {
    this.screenMenu.classList.remove('hidden');
    this.hud.classList.add('hidden');
    this.screenPause.classList.add('hidden');
    this.screenGameOver.classList.add('hidden');
    if (this.bossHud) this.bossHud.classList.add('hidden');
    if (this.bossSquadHud) this.bossSquadHud.classList.add('hidden');
    this.updateMenuStats();
  }

  showHudScreen() {
    this.screenMenu.classList.add('hidden');
    this.hud.classList.remove('hidden');
    this.screenPause.classList.add('hidden');
    this.screenGameOver.classList.add('hidden');
    if (this.screenBossSelect) this.screenBossSelect.classList.add('hidden');
  }

  showPauseScreen() {
    this.screenPause.classList.remove('hidden');
  }

  hidePauseScreen() {
    this.screenPause.classList.add('hidden');
  }

  showGameOverScreen(stats) {
    this.hud.classList.add('hidden');
    this.screenPause.classList.add('hidden');
    this.screenGameOver.classList.remove('hidden');
    if (this.bossHud) this.bossHud.classList.add('hidden');
    if (this.bossSquadHud) this.bossSquadHud.classList.add('hidden');

    if (this.goFinalScore) this.goFinalScore.textContent = stats.score.toLocaleString();
    if (this.goBestScore) this.goBestScore.textContent = this.highScore.toLocaleString();
    if (this.goWaveReached) this.goWaveReached.textContent = `Wave ${stats.wave}`;
    if (this.goEnemiesDestroyed) this.goEnemiesDestroyed.textContent = stats.enemiesDestroyed.toString();
  }

  // WAVE BANNER ANNOUNCEMENT
  showWaveAnnouncement(waveNum, waveName) {
    if (!this.announcementBanner) return;

    this.announcementTitle.textContent = `WAVE ${waveNum}`;
    this.announcementSub.textContent = waveName.toUpperCase();

    this.announcementBanner.classList.remove('hidden');
    // Re-trigger CSS animation
    this.announcementBanner.style.animation = 'none';
    this.announcementBanner.offsetHeight; // trigger reflow
    this.announcementBanner.style.animation = null;

    setTimeout(() => {
      this.announcementBanner.classList.add('hidden');
    }, 2500);
  }

  // COMBAT NOTIFICATION POPUP
  showCombatPopup(text, isBig = false, typeClass = '') {
    if (!this.combatPopups) return;

    const popup = document.createElement('div');
    popup.className = `combat-popup ${typeClass} ${isBig ? 'crit' : ''}`;
    popup.textContent = text;
    popup.style.left = '50%';
    popup.style.top = '38%';

    this.combatPopups.appendChild(popup);
    setTimeout(() => popup.remove(), 1200);
  }

  // REALTIME HUD UPDATE
  updateHud(player, score, waveProgress, camera, enemies, activeBoss = null, activeBosses = []) {
    // 1. Health Bar
    const hpPct = Math.max(0, Math.min(100, (player.health / player.maxHealth) * 100));
    this.hpBar.style.width = `${hpPct}%`;
    this.hpText.textContent = `${Math.ceil(player.health)}%`;

    if (hpPct > 50) {
      this.hpBar.className = 'bar-fill hp-bar-fill';
    } else if (hpPct > 25) {
      this.hpBar.className = 'bar-fill hp-bar-fill warning';
    } else {
      this.hpBar.className = 'bar-fill hp-bar-fill danger';
    }

    // 2. Shield Bar
    if (player.shieldTime > 0) {
      this.shieldContainer.classList.remove('hidden');
      const shieldPct = (player.shieldTime / CONFIG.powerups.duration) * 100;
      this.shieldBar.style.width = `${shieldPct}%`;
      this.shieldText.textContent = `${Math.ceil(player.shieldTime)}s`;
    } else {
      this.shieldContainer.classList.add('hidden');
    }

    // 3. Active Buff Chips
    this.buffsContainer.innerHTML = '';
    if (player.rapidFireTime > 0) {
      const chip = document.createElement('div');
      chip.className = 'buff-chip rapid';
      chip.innerHTML = `⚡ RAPID FIRE (${Math.ceil(player.rapidFireTime)}s)`;
      this.buffsContainer.appendChild(chip);
    }
    if (player.shieldTime > 0) {
      const chip = document.createElement('div');
      chip.className = 'buff-chip shield';
      chip.innerHTML = `🛡 SHIELD ACTIVE`;
      this.buffsContainer.appendChild(chip);
    }

    // 4. Wave & Hostile Tracking
    this.waveBadge.textContent = `WAVE ${waveProgress.currentWave}`;
    this.waveName.textContent = waveProgress.waveName;
    this.enemiesCount.textContent = `${waveProgress.remaining} / ${waveProgress.total}`;
    this.waveProgressBar.style.width = `${(1 - waveProgress.remaining / Math.max(1, waveProgress.total)) * 100}%`;

    // 5. Score
    this.scoreVal.textContent = this.padScore(score);
    this.bestScoreVal.textContent = this.padScore(Math.max(score, this.highScore));

    // 6. Missile Slots
    this.missileSlots.innerHTML = '';
    const isUnlimited = player.unlimitedAmmo;
    for (let i = 0; i < player.maxMissiles; i++) {
      const pip = document.createElement('div');
      pip.className = `missile-pip ${isUnlimited || i < player.missiles ? 'loaded' : ''}`;
      this.missileSlots.appendChild(pip);
    }
    const missileSub = document.getElementById('missile-cooldown-text');
    if (missileSub) {
      missileSub.textContent = isUnlimited ? '⚡ UNLIMITED MISSILES [U]' : (player.missileCooldownTimer > 0 ? 'RELOADING...' : 'READY TO FIRE');
      missileSub.style.color = isUnlimited ? '#00ff88' : '#9cb3c9';
    }

    // 7. Boost Gauge
    const boostPct = (player.boostGauge / player.boostMax) * 100;
    this.boostBar.style.width = `${boostPct}%`;
    if (player.isBoosting) {
      this.boostBar.classList.add('boosting');
      this.boostStatus.textContent = 'AFTERBURNER ENGAGED';
      this.boostStatus.style.color = '#ffaa00';
    } else {
      this.boostBar.classList.remove('boosting');
      this.boostStatus.textContent = boostPct < 15 ? 'RECHARGING BOOST...' : 'BOOST READY';
      this.boostStatus.style.color = '#9cb3c9';
    }

    // 8. Boss Health Bars (Support Single Boss & Multi-Boss Squad)
    const livingBosses = activeBosses && activeBosses.length > 0 ? activeBosses : (activeBoss && !activeBoss.isDead ? [activeBoss] : []);

    if (livingBosses.length > 1) {
      // Multi-boss squad row at top
      if (this.bossHud) this.bossHud.classList.add('hidden');
      if (this.bossSquadHud) {
        this.bossSquadHud.classList.remove('hidden');
        this.updateBossSquadHud(livingBosses);
      }
    } else if (livingBosses.length === 1) {
      // Single boss detailed bar
      if (this.bossSquadHud) this.bossSquadHud.classList.add('hidden');
      const boss = livingBosses[0];
      if (this.bossHud) {
        this.bossHud.classList.remove('hidden');
        const bossHpPct = Math.max(0, (boss.health / boss.maxHealth) * 100);
        if (this.bossHpBar) this.bossHpBar.style.width = `${bossHpPct}%`;
        if (this.bossHpNumeric) this.bossHpNumeric.textContent = `${Math.max(0, Math.ceil(boss.health))} / ${boss.maxHealth} HP`;

        if (this.bossHudImg && boss.image) this.bossHudImg.src = boss.image;
        if (this.bossHudName && boss.name) this.bossHudName.textContent = boss.name;
        if (this.bossHudBadge && boss.auraName) this.bossHudBadge.textContent = boss.auraName.toUpperCase();
        if (boss.auraColor !== undefined) {
          const hex = `#${boss.auraColor.toString(16).padStart(6, '0')}`;
          this.bossHud.style.borderColor = hex;
          this.bossHud.style.boxShadow = `0 0 25px ${hex}80, inset 0 0 15px ${hex}33`;
          if (this.bossHudImg && this.bossHudImg.parentElement) {
            this.bossHudImg.parentElement.style.borderColor = hex;
          }
          if (this.bossHudBadge) {
            this.bossHudBadge.style.backgroundColor = hex;
            this.bossHudBadge.style.boxShadow = `0 0 8px ${hex}`;
          }
        }
      }
    } else {
      if (this.bossHud) this.bossHud.classList.add('hidden');
      if (this.bossSquadHud) this.bossSquadHud.classList.add('hidden');
    }

    // 9. 3D Projected Target Lock Brackets over on-screen enemies
    this.updateTargetBrackets(camera, enemies);
  }

  updateBossSquadHud(activeBosses) {
    if (!this.bossSquadHud) return;

    // Check if we need to rebuild the squad elements
    const currentIds = activeBosses.map(b => (b.bossConfig ? b.bossConfig.id : b.type)).join(',');
    if (this.lastSquadIds !== currentIds) {
      this.lastSquadIds = currentIds;
      this.bossSquadHud.innerHTML = '';
      this.bossSquadMap.clear();

      activeBosses.forEach(boss => {
        const item = document.createElement('div');
        item.className = 'boss-squad-item';
        const hex = `#${(boss.auraColor !== undefined ? boss.auraColor : 0xff4500).toString(16).padStart(6, '0')}`;
        item.style.borderColor = `${hex}88`;
        item.style.boxShadow = `0 4px 16px rgba(0,0,0,0.6), 0 0 10px ${hex}44`;

        item.innerHTML = `
          <div class="boss-squad-thumb-wrap" style="border-color: ${hex}; box-shadow: 0 0 8px ${hex}88;">
            <img class="boss-squad-thumb" src="${boss.image}" alt="${boss.name}" />
          </div>
          <div class="boss-squad-item-info">
            <div class="boss-squad-item-name" title="${boss.name}">${boss.name}</div>
            <div class="boss-squad-hp-bg">
              <div class="boss-squad-hp-fill" style="width: 100%; background: linear-gradient(90deg, ${hex}, #ffaa00);"></div>
            </div>
          </div>
        `;

        this.bossSquadHud.appendChild(item);
        const bossKey = boss.bossConfig ? boss.bossConfig.id : boss.type;
        this.bossSquadMap.set(bossKey, {
          el: item,
          hpFill: item.querySelector('.boss-squad-hp-fill'),
          nameEl: item.querySelector('.boss-squad-item-name')
        });
      });
    }

    // Live update health percentage of each boss
    activeBosses.forEach(boss => {
      const bossKey = boss.bossConfig ? boss.bossConfig.id : boss.type;
      const entry = this.bossSquadMap.get(bossKey);
      if (entry) {
        const hpPct = Math.max(0, (boss.health / boss.maxHealth) * 100);
        entry.hpFill.style.width = `${hpPct}%`;
        if (boss.isDead || boss.health <= 0) {
          entry.el.classList.add('dead');
          entry.nameEl.textContent = `${boss.name} [DEAD]`;
        }
      }
    });
  }

  updateTargetBrackets(camera, enemies) {
    if (!this.targetIndicatorsContainer) return;
    this.targetIndicatorsContainer.innerHTML = '';

    // Find closest enemy in front of player for lock highlight
    let closestEnemy = null;
    let minDist = Infinity;

    enemies.forEach(e => {
      if (e.isDead || e.position.z >= camera.position.z - 4) return;
      const d = e.position.distanceTo(camera.position);
      if (d < minDist && d < 280) {
        minDist = d;
        closestEnemy = e;
      }
    });

    enemies.forEach(enemy => {
      if (enemy.isDead || enemy.position.z >= camera.position.z - 4) return;

      const screenPos = enemy.position.clone().project(camera);
      // Behind camera check
      if (screenPos.z > 1) return;

      const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;

      // Offscreen margin check
      if (x < -40 || x > window.innerWidth + 40 || y < -40 || y > window.innerHeight + 40) return;

      const bracket = document.createElement('div');
      const isLocked = enemy === closestEnemy;
      bracket.className = `enemy-target-bracket ${isLocked ? 'locked' : ''}`;
      bracket.style.left = `${x}px`;
      bracket.style.top = `${y}px`;

      // Mini Health bar above enemy
      const hpBar = document.createElement('div');
      hpBar.className = 'enemy-hp-mini';
      const hpFill = document.createElement('div');
      hpFill.className = 'enemy-hp-mini-fill';
      hpFill.style.width = `${Math.max(0, (enemy.health / enemy.maxHealth) * 100)}%`;
      hpBar.appendChild(hpFill);
      bracket.appendChild(hpBar);

      this.targetIndicatorsContainer.appendChild(bracket);
    });
  }
}
