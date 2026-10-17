// Sky Hunter 3D — Game Configuration & Tuning Values

export const CONFIG = {
  // Playable flight bounds (XZ plane, Y elevation)
  bounds: {
    minX: -42,
    maxX: 42,
    minY: -20,
    maxY: 24,
    // Camera and flight forward speed
    baseSpeed: 70,
    boostSpeed: 125,
  },

  // Player Aircraft Settings
  player: {
    maxHealth: 100,
    pitchSpeed: 38,       // Vertical maneuver speed
    rollSpeed: 48,        // Horizontal maneuver speed
    maxBankAngle: 0.65,   // Roll banking angle in radians (~37 deg)
    maxPitchAngle: 0.40,  // Pitch angle in radians (~23 deg)
    smoothing: 8.0,       // Inertia damping
    invincibleDuration: 1.2, // i-frames duration in seconds
    
    // Afterburner Boost
    boostDuration: 3.5,   // Max continuous boost in seconds
    boostRechargeRate: 0.45, // Seconds of boost recharged per real second
    
    // Weapons
    initialMissiles: 4,
    maxMissiles: 6,
    missileCooldown: 0.8, // seconds between missile launches
  },

  // Primary Weapons (Machine Guns / Twin Lasers)
  weapons: {
    primary: {
      speed: 280,
      damage: 25,
      fireRate: 0.12,        // Seconds between rounds
      rapidFireRate: 0.065,  // When Rapid Fire powerup active
      range: 260,
      bulletSize: { width: 0.25, height: 0.25, length: 3.5 },
      color: 0x00f0ff,
    },
    missile: {
      speed: 130,
      turnRate: 3.8,         // Homing responsiveness
      damage: 130,
      blastRadius: 18,
      range: 350,
      color: 0xff0055,
    },
    enemyLaser: {
      speed: 160,
      damage: 15,
      range: 240,
      color: 0xff3344,
    }
  },

  // Enemy Aircraft Types
  enemies: {
    scout: {
      type: 'scout',
      name: 'Scout Fighter',
      health: 30,
      speed: 42,
      points: 100,
      fireInterval: 2.2,
      damage: 10,
      color: 0x00d2ff,
      accentColor: 0xff0055,
      scale: 0.85,
    },
    interceptor: {
      type: 'interceptor',
      name: 'Interceptor',
      health: 70,
      speed: 34,
      points: 250,
      fireInterval: 2.6,
      damage: 14,
      burstCount: 2,
      color: 0xff0077,
      accentColor: 0x8800ff,
      scale: 1.1,
    },
    gunship: {
      type: 'gunship',
      name: 'Heavy Gunship',
      health: 180,
      speed: 22,
      points: 500,
      fireInterval: 3.0,
      damage: 18,
      spreadFire: true,
      color: 0xffb703,
      accentColor: 0x111111,
      scale: 1.6,
    },
  },

  // MULTIPLE RAKSHAS AURA BOSSES (From User's Custom Photos)
  rakshasBosses: [
    {
      id: 'asura_boss',
      type: 'boss_asura',
      name: 'Asura Titan',
      title: 'Lord of Infernal Flame',
      image: '/assets/asura_boss.jpg',
      health: 1200,
      speed: 16,
      points: 3000,
      fireInterval: 1.1,
      damage: 22,
      auraColor: 0xff3700,
      auraName: 'Infernal Magma Aura',
      bulletColor: 0xff4500,
      width: 18,
      height: 10.125,
      bulletSpeed: 165,
      attackPattern: 'flame',
      theme: {
        skyTop: 0x1f0707,
        skyBottom: 0x881313,
        horizon: 0xea580c,
        sunColor: 0xfed7aa,
        fogColor: 0x7f1d1d,
        cloudColor: 0xf97316,
        ambientColor: 0xd97706,
      }
    },
    {
      id: 'rakshas_winged',
      type: 'boss_winged',
      name: 'Winged Vayu Rakshas',
      title: 'Four-Armed Gale Demon',
      image: '/assets/rakshas_winged.jpg',
      health: 1300,
      speed: 20,
      points: 3500,
      fireInterval: 0.95,
      damage: 24,
      auraColor: 0x00d2ff,
      auraName: 'Storm Tempest Aura',
      bulletColor: 0x00f0ff,
      width: 11,
      height: 16.5,
      bulletSpeed: 195,
      attackPattern: 'wind_slash',
      theme: {
        skyTop: 0x042f2e,
        skyBottom: 0x0f766e,
        horizon: 0x2dd4bf,
        sunColor: 0xccfbf1,
        fogColor: 0x115e59,
        cloudColor: 0x5eead4,
        ambientColor: 0x14b8a6,
      }
    },
    {
      id: 'rakshas_mask',
      type: 'boss_mask',
      name: 'Krodha Rakshas',
      title: 'Yakshagana Wrath Visage',
      image: '/assets/rakshas_mask.png',
      health: 1150,
      speed: 18,
      points: 3200,
      fireInterval: 0.88,
      damage: 24,
      auraColor: 0xff0055,
      auraName: 'Crimson Fury Aura',
      bulletColor: 0xff0044,
      width: 10,
      height: 16.8,
      bulletSpeed: 185,
      attackPattern: 'blood_beam',
      theme: {
        skyTop: 0x3b0764,
        skyBottom: 0x86198f,
        horizon: 0xf43f5e,
        sunColor: 0xffedd5,
        fogColor: 0x701a75,
        cloudColor: 0xf472b6,
        ambientColor: 0xd946ef,
      }
    },
    {
      id: 'rakshas_golden',
      type: 'boss_golden',
      name: 'Swarna Rakshas',
      title: 'Golden Horned Overlord',
      image: '/assets/rakshas_golden.png',
      health: 1500,
      speed: 15,
      points: 4000,
      fireInterval: 1.15,
      damage: 26,
      auraColor: 0xffd700,
      auraName: 'Solar Cleaver Aura',
      bulletColor: 0xffb700,
      width: 11,
      height: 16.5,
      bulletSpeed: 175,
      attackPattern: 'solar_burst',
      theme: {
        skyTop: 0x451a03,
        skyBottom: 0x92400e,
        horizon: 0xfbbf24,
        sunColor: 0xfef3c7,
        fogColor: 0x78350f,
        cloudColor: 0xfde68a,
        ambientColor: 0xf59e0b,
      }
    },
    {
      id: 'rakshas_buffalo',
      type: 'boss_buffalo',
      name: 'Mahisha Rakshas',
      title: 'Horned Earth Colossus',
      image: '/assets/rakshas_buffalo.png',
      health: 1650,
      speed: 16,
      points: 4500,
      fireInterval: 1.1,
      damage: 28,
      auraColor: 0xff6200,
      auraName: 'Earthquake Magma Aura',
      bulletColor: 0xff4d00,
      width: 13,
      height: 13,
      bulletSpeed: 170,
      attackPattern: 'horn_blast',
      theme: {
        skyTop: 0x27170a,
        skyBottom: 0x7c2d12,
        horizon: 0xf97316,
        sunColor: 0xffedd5,
        fogColor: 0x9a3412,
        cloudColor: 0xfdba74,
        ambientColor: 0xea580c,
      }
    },
    {
      id: 'rakshas_tenheaded',
      type: 'boss_tenheaded',
      name: 'Dashanana Rakshas',
      title: 'Ten-Headed Supreme Sovereign',
      image: '/assets/rakshas_tenheaded.png',
      health: 2000,
      speed: 14,
      points: 5000,
      fireInterval: 0.95,
      damage: 30,
      auraColor: 0xa855f7,
      auraName: 'Chaos Void Aura',
      bulletColor: 0xc084fc,
      width: 18,
      height: 12,
      bulletSpeed: 180,
      attackPattern: 'ten_beams',
      theme: {
        skyTop: 0x0f172a,
        skyBottom: 0x3b0764,
        horizon: 0xc084fc,
        sunColor: 0xf3e8ff,
        fogColor: 0x581c87,
        cloudColor: 0xd8b4fe,
        ambientColor: 0x9333ea,
      }
    }
  ],

  // The 5 Mythological Rakshas Titans with Elemental Auras
  fiveAuraBosses: [
    'boss_winged',     // Winged Vayu Rakshas — Storm Tempest Aura (Cyan)
    'boss_mask',       // Krodha Rakshas — Crimson Fury Aura (Magenta)
    'boss_golden',     // Swarna Rakshas — Solar Cleaver Aura (Gold)
    'boss_buffalo',    // Mahisha Rakshas — Earthquake Magma Aura (Orange)
    'boss_tenheaded'   // Dashanana Rakshas — Chaos Void Aura (Purple)
  ],

  // Wave Progression — All 5 Aura Bosses in All Waves!
  waves: [
    {
      waveNumber: 1,
      name: "The 5 Rakshas Titans — Skies of Vayu",
      totalEnemies: 9,
      scoutCount: 4,
      interceptorCount: 0,
      gunshipCount: 0,
      spawnInterval: 1.4,
      hasAllBosses: true,
      bossTypes: ['boss_winged', 'boss_mask', 'boss_golden', 'boss_buffalo', 'boss_tenheaded'],
      theme: {
        skyTop: 0x042f2e,
        skyBottom: 0x0f766e,
        horizon: 0x2dd4bf,
        sunColor: 0xccfbf1,
        fogColor: 0x115e59,
        cloudColor: 0x5eead4,
        ambientColor: 0x14b8a6,
      }
    },
    {
      waveNumber: 2,
      name: "Wrath of the 5 Overlords — Crimson Tempest",
      totalEnemies: 11,
      scoutCount: 4,
      interceptorCount: 2,
      gunshipCount: 0,
      spawnInterval: 1.3,
      hasAllBosses: true,
      bossTypes: ['boss_winged', 'boss_mask', 'boss_golden', 'boss_buffalo', 'boss_tenheaded'],
      theme: {
        skyTop: 0x3b0764,
        skyBottom: 0x86198f,
        horizon: 0xf43f5e,
        sunColor: 0xffedd5,
        fogColor: 0x701a75,
        cloudColor: 0xf472b6,
        ambientColor: 0xd946ef,
      }
    },
    {
      waveNumber: 3,
      name: "Solar Demon War — The 5 Golden Titans",
      totalEnemies: 13,
      scoutCount: 4,
      interceptorCount: 4,
      gunshipCount: 0,
      spawnInterval: 1.2,
      hasAllBosses: true,
      bossTypes: ['boss_winged', 'boss_mask', 'boss_golden', 'boss_buffalo', 'boss_tenheaded'],
      theme: {
        skyTop: 0x451a03,
        skyBottom: 0x92400e,
        horizon: 0xfbbf24,
        sunColor: 0xfef3c7,
        fogColor: 0x78350f,
        cloudColor: 0xfde68a,
        ambientColor: 0xf59e0b,
      }
    },
    {
      waveNumber: 4,
      name: "Caldera Earthshaker — The 5 Hellfire Colossi",
      totalEnemies: 15,
      scoutCount: 4,
      interceptorCount: 4,
      gunshipCount: 2,
      spawnInterval: 1.1,
      hasAllBosses: true,
      bossTypes: ['boss_winged', 'boss_mask', 'boss_golden', 'boss_buffalo', 'boss_tenheaded'],
      theme: {
        skyTop: 0x27170a,
        skyBottom: 0x7c2d12,
        horizon: 0xf97316,
        sunColor: 0xffedd5,
        fogColor: 0x9a3412,
        cloudColor: 0xfdba74,
        ambientColor: 0xea580c,
      }
    },
    {
      waveNumber: 5,
      name: "Void Apocalypse — Supreme Dashanana & The 5 Titans",
      totalEnemies: 17,
      scoutCount: 6,
      interceptorCount: 4,
      gunshipCount: 2,
      spawnInterval: 1.0,
      hasAllBosses: true,
      bossTypes: ['boss_winged', 'boss_mask', 'boss_golden', 'boss_buffalo', 'boss_tenheaded'],
      theme: {
        skyTop: 0x0f172a,
        skyBottom: 0x3b0764,
        horizon: 0xc084fc,
        sunColor: 0xf3e8ff,
        fogColor: 0x581c87,
        cloudColor: 0xd8b4fe,
        ambientColor: 0x9333ea,
      }
    }
  ],

  // Power-up Settings
  powerups: {
    dropRate: 0.38, // 38% chance per destroyed enemy
    duration: 10,   // Active duration for timed buffs (shield, rapid fire)
    types: [
      { id: 'repair', name: 'Repair Kit', color: 0x00ff88, weight: 30, text: '+35 HULL INTEGRITY' },
      { id: 'shield', name: 'Energy Shield', color: 0x00f0ff, weight: 25, text: 'ENERGY SHIELD ACTIVATED' },
      { id: 'rapid', name: 'Rapid Fire', color: 0xffaa00, weight: 25, text: 'RAPID FIRE OVERDRIVE' },
      { id: 'missiles', name: 'Missile Pack', color: 0xc044ff, weight: 20, text: '+3 HOMING MISSILES' },
    ]
  },

  // Camera Settings
  camera: {
    fov: 60,
    boostFov: 72,
    distance: 14,
    height: 3.8,
    lookAhead: 28,
    lerpSpeed: 7.0,
  }
};
