# Nangi Pungi vaibhav joshi aur uski londiya — Arcade Fighter Plane Combat Game

[![Three.js](https://img.shields.io/badge/Three.js-r128+-049ef4?style=flat-square&logo=three.js&logoColor=white)](https://threejs.org/)
[![Vite](https://img.shields.io/badge/Vite-Build_Tool-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![WebGL](https://img.shields.io/badge/WebGL-Hardware_Accelerated-990000?style=flat-square&logo=webgl&logoColor=white)](https://www.khronos.org/webgl/)
[![Mobile Ready](https://img.shields.io/badge/Mobile-Touch_Joystick_%26_Attacks-00f0ff?style=flat-square)](https://github.com/OjasBaitule01/game)

**Nangi Pungi vaibhav joshi aur uski londiya** is a colorful, high-octane 3D arcade air combat game built with modern Three.js and the Web Audio API. Pilot a high-performance supersonic fighter jet through dynamic atmospheric environments, dogfight swarms of enemy aircraft, engage in multi-stage boss battles against the legendary **5 Rakshas Aura Titans**, collect power-ups, and execute explosive special attacks.

Play seamlessly across **Desktop (Keyboard + Mouse)** and **Mobile (Virtual Joystick + Multi-Button Combat Deck)**!

---

## 🎮 Features

- **Intuitive Dual Flight Controls**:
  - **Desktop**: Classic keyboard flight controls (`WASD` / Arrows, `Space`, `F`, `Shift`, `B`, `E`) with optional mouse aiming.
  - **Mobile Touch Controller**:
    - **Virtual Analog Joystick**: 360° flight gimbal with directional climb/dive/banking guides and smooth analog tracking.
    - **5 Dedicated Attack & Defense Buttons**:
      1. 🔥 **Twin Cannons**: Rapid-fire machine guns with wing alternate tracers.
      2. 🚀 **Guided Missiles**: Homing seeker missiles that lock onto enemy aircraft and bosses in front cone.
      3. 💣 **EMP Nova Bomb**: Superweapon shockwave clearing all enemy bullets and dealing massive area destruction.
      4. 🛡️ **Kinetic Shield**: Instant 6-second invulnerable energy barrier.
      5. ⚡ **Afterburners**: Supersonic boost with cinematic speed lines.
    - **⚡ Auto-Fire Toggle**: Hands-free automatic gun fire for comfortable mobile gaming.
    - **∞ Unlimited Ammo Toggle**: Infinite missiles and hyper-speed rapid lasers.
    - **🕹️ HUD Quick Toggle**: Show/hide on-screen controls anytime with a single click.

- **All 5 Rakshas Aura Titans**:
  - **Asura Titan**: Crimson Hellfire Aura.
  - **Ravana Titan**: Shadow Violet Cosmic Aura.
  - **Kumbhakarna Titan**: Acid Green Bio-Toxic Aura.
  - **Meghnad Titan**: Golden Sunburst Celestial Aura.
  - **Maricha Titan**: Cyan Frost Glacier Aura.
  - **Pentacle War Gauntlet**: Engage all 5 Aura Titans simultaneously!

- **Procedural 3D Low-Poly Engine**:
  - High-performance custom low-poly models (Player Jet, Scout Drones, Fast Interceptors, Heavy Gunships, Missiles, Power-up Crystals).
  - Volumetric cloud fields, procedural islands, and rolling ocean waves.
  - Multi-theme skybox transitions (Azure Skies, Sunset Blaze, Neon Cyberpunk, Volcanic Tempest).

- **Synthesized Web Audio Engine**:
  - 100% procedural Web Audio synthesizer—no external MP3/WAV assets required.
  - Dynamic dynamic engine hum with pitch shifts during afterburners.
  - Unique sound effects for lasers, missile whoosh, explosions, EMP bass drops, shield hums, and victory fanfares.

---

## 🕹️ Controls Guide

### Desktop Controls

| Action | Primary Key | Secondary Key / Mouse |
| :--- | :--- | :--- |
| **Steer Jet (Pitch & Roll)** | `W` / `A` / `S` / `D` | `Arrow Keys` / Mouse Drag |
| **Twin Laser Cannons** | `Spacebar` | Left Mouse Button |
| **Homing Guided Missiles** | `F` | Right Mouse Button |
| **EMP Nova Bomb** | `B` | On-Screen Button |
| **Kinetic Force Shield** | `E` / `C` | On-Screen Button |
| **Afterburner Speed Boost** | `Shift` (Left/Right) | On-Screen Button |
| **Toggle Unlimited Ammo** | `U` | On-Screen Button |
| **Pause / Resume Mission** | `Esc` / `P` | Top Bar Pause Button |

### Mobile Touch Controls

- **Left Thumb**: Drag the glowing **Flight Stick** in any direction for smooth 360° steering and banking.
- **Right Thumb**:
  - Tap or hold **🔥 CANNONS** to fire lasers.
  - Tap **🚀 MISSILE** to launch seeking missiles.
  - Tap **💣 EMP BOMB** to trigger the screen-clearing nova blast.
  - Tap **🛡️ SHIELD** to activate invulnerability force field.
  - Hold **⚡ BOOST** for maximum acceleration.
  - Tap **[⚡ AUTO-FIRE]** for continuous automated firing.
  - Tap **[∞ UNLIMITED]** for infinite munitions.
  - Tap **[🕹️]** in the top-right header to toggle on-screen controls on/off anytime.

---

## 🚀 Quick Start & Local Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- `npm` (comes with Node.js)

### Installation

```bash
# Clone the repository
git clone https://github.com/OjasBaitule01/game.git

# Navigate into the project folder
cd game

# Install dependencies
npm install

# Start local development server
npm run dev
```

Open your browser and navigate to `http://localhost:3000/`.

To play on your mobile phone on the same Wi-Fi network, navigate to `http://<your-local-ip>:3000/`.

### Production Build

```bash
npm run build
```

The optimized static assets will be compiled into the `dist/` directory, ready to deploy to GitHub Pages, Vercel, Netlify, or any static hosting service.

---

## 🛠️ Project Structure

```text
├── index.html          # Game viewport, HUD overlay, and Touch Controls UI
├── style.css           # Sci-fi cyberpunk HUD, animations & responsive styling
├── package.json        # Project metadata and build scripts
├── assets/             # Rakshas boss artworks and textures
└── src/
    ├── main.js         # Core game state manager and game loop
    ├── config.js       # Game balancing, waves, bosses, and physics tuning
    ├── player.js       # Aircraft physics, weapon triggers, and steering
    ├── mobile.js       # Virtual Joystick and multi-button touch event manager
    ├── models.js       # Procedural low-poly 3D models (Jet, Enemies, Power-ups)
    ├── scene.js        # Three.js scene, lighting, skybox, ocean, and clouds
    ├── weapons.js      # Bullets, homing missiles, targeting, and collisions
    ├── enemies.js      # Enemy flight AI, formations, and Rakshas Boss behaviors
    ├── powerups.js     # Repair, Shield, Rapid-Fire, and Missile drop pickups
    ├── effects.js      # Nova shockwaves, debris, particles, and screen flashes
    ├── audio.js        # Web Audio API procedural sound effects & background music
    └── ui.js           # Scoreboards, health bars, modals, and settings
```

---

## 📜 License

This project is licensed under the MIT License — feel free to modify, extend, and share!
