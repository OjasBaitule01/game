import * as THREE from 'three';

// Procedural Low-Poly 3D Aircraft & Asset Factory
export class ModelFactory {
  constructor() {
    this.materials = this.initMaterials();
  }

  initMaterials() {
    return {
      // Player Materials
      playerFuselage: new THREE.MeshStandardMaterial({
        color: 0x1a73e8,
        roughness: 0.35,
        metalness: 0.65,
        flatShading: true,
      }),
      playerAccent: new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.4,
        metalness: 0.4,
        flatShading: true,
      }),
      playerTrim: new THREE.MeshStandardMaterial({
        color: 0xff3b30,
        roughness: 0.3,
        metalness: 0.5,
        flatShading: true,
      }),
      playerCanopy: new THREE.MeshPhysicalMaterial({
        color: 0x00f0ff,
        metalness: 0.2,
        roughness: 0.1,
        transmission: 0.85,
        transparent: true,
        opacity: 0.85,
        reflectivity: 0.9,
      }),
      playerEngineGlow: new THREE.MeshBasicMaterial({
        color: 0x00ffff,
      }),

      // Scout Enemy Materials
      scoutBody: new THREE.MeshStandardMaterial({
        color: 0x0ea5e9,
        roughness: 0.3,
        metalness: 0.7,
        flatShading: true,
      }),
      scoutAccent: new THREE.MeshStandardMaterial({
        color: 0x0369a1,
        roughness: 0.4,
        metalness: 0.5,
        flatShading: true,
      }),
      enemyEngineGlow: new THREE.MeshBasicMaterial({
        color: 0xff3344,
      }),

      // Interceptor Enemy Materials
      interceptorBody: new THREE.MeshStandardMaterial({
        color: 0xd946ef,
        roughness: 0.3,
        metalness: 0.65,
        flatShading: true,
      }),
      interceptorAccent: new THREE.MeshStandardMaterial({
        color: 0x86198f,
        roughness: 0.4,
        metalness: 0.5,
        flatShading: true,
      }),

      // Gunship Enemy Materials
      gunshipBody: new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        roughness: 0.45,
        metalness: 0.5,
        flatShading: true,
      }),
      gunshipAccent: new THREE.MeshStandardMaterial({
        color: 0x1f2937,
        roughness: 0.5,
        metalness: 0.3,
        flatShading: true,
      }),
      gunshipGlow: new THREE.MeshBasicMaterial({
        color: 0xffa500,
      }),

      // Missile Materials
      missileBody: new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.3,
        metalness: 0.7,
      }),
      missileWarhead: new THREE.MeshStandardMaterial({
        color: 0xff0055,
        roughness: 0.2,
        metalness: 0.5,
      }),
      missileFlame: new THREE.MeshBasicMaterial({
        color: 0xff8800,
      }),

      // Damage Flash Material (reusable)
      hitFlash: new THREE.MeshBasicMaterial({
        color: 0xffffff,
      }),

      // Power-up Materials
      puRepair: new THREE.MeshStandardMaterial({
        color: 0x00ff88,
        emissive: 0x00aa55,
        emissiveIntensity: 0.6,
        roughness: 0.2,
        metalness: 0.5,
      }),
      puShield: new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        emissive: 0x0088cc,
        emissiveIntensity: 0.6,
        roughness: 0.2,
        metalness: 0.5,
      }),
      puRapid: new THREE.MeshStandardMaterial({
        color: 0xff8800,
        emissive: 0xcc5500,
        emissiveIntensity: 0.6,
        roughness: 0.2,
        metalness: 0.5,
      }),
      puMissile: new THREE.MeshStandardMaterial({
        color: 0xc044ff,
        emissive: 0x8800cc,
        emissiveIntensity: 0.6,
        roughness: 0.2,
        metalness: 0.5,
      }),
    };
  }

  // CREATE PLAYER FIGHTER PLANE
  createPlayerPlane() {
    const group = new THREE.Group();

    // 1. Main Fuselage
    const fuselageGeom = new THREE.ConeGeometry(0.9, 6.2, 7);
    fuselageGeom.rotateX(Math.PI / 2);
    const fuselage = new THREE.Mesh(fuselageGeom, this.materials.playerFuselage);
    fuselage.scale.set(1.1, 0.65, 1);
    group.add(fuselage);

    // 2. Cockpit Canopy Glass
    const canopyGeom = new THREE.SphereGeometry(0.55, 8, 8);
    canopyGeom.scale(0.7, 0.6, 2.0);
    const canopy = new THREE.Mesh(canopyGeom, this.materials.playerCanopy);
    canopy.position.set(0, 0.42, 0.3);
    group.add(canopy);

    // 3. Main Swept Wings
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 1.2);
    wingShape.lineTo(4.8, -1.2);
    wingShape.lineTo(4.7, -1.8);
    wingShape.lineTo(0.5, -1.0);
    wingShape.lineTo(-0.5, -1.0);
    wingShape.lineTo(-4.7, -1.8);
    wingShape.lineTo(-4.8, -1.2);
    wingShape.closePath();

    const extrudeSettings = { depth: 0.12, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.04, bevelThickness: 0.04 };
    const wingGeom = new THREE.ExtrudeGeometry(wingShape, extrudeSettings);
    wingGeom.rotateX(Math.PI / 2);
    const wings = new THREE.Mesh(wingGeom, this.materials.playerFuselage);
    wings.position.set(0, 0.02, 0);
    group.add(wings);

    // Wing stripes / trim
    const stripeGeom = new THREE.BoxGeometry(0.35, 0.14, 1.4);
    const leftStripe = new THREE.Mesh(stripeGeom, this.materials.playerTrim);
    leftStripe.position.set(-2.8, 0.05, -0.6);
    leftStripe.rotation.y = -0.3;
    const rightStripe = leftStripe.clone();
    rightStripe.position.set(2.8, 0.05, -0.6);
    rightStripe.rotation.y = 0.3;
    group.add(leftStripe, rightStripe);

    // Wingtip Missile Rails
    const railGeom = new THREE.BoxGeometry(0.18, 0.18, 1.8);
    const leftRail = new THREE.Mesh(railGeom, this.materials.playerAccent);
    leftRail.position.set(-4.75, 0.02, -1.3);
    const rightRail = leftRail.clone();
    rightRail.position.set(4.75, 0.02, -1.3);
    group.add(leftRail, rightRail);

    // 4. Twin Canted Vertical Stabilizers / Rudders
    const finShape = new THREE.Shape();
    finShape.moveTo(0, 0);
    finShape.lineTo(0.6, 1.5);
    finShape.lineTo(0.1, 1.5);
    finShape.lineTo(-0.5, 0);
    finShape.closePath();

    const finGeom = new THREE.ExtrudeGeometry(finShape, { depth: 0.08, bevelEnabled: false });
    const leftFin = new THREE.Mesh(finGeom, this.materials.playerAccent);
    leftFin.position.set(-0.8, 0.2, -1.8);
    leftFin.rotation.z = -0.25; // Canted outwards
    leftFin.rotation.y = Math.PI / 2;

    const rightFin = new THREE.Mesh(finGeom, this.materials.playerAccent);
    rightFin.position.set(0.8, 0.2, -1.8);
    rightFin.rotation.z = 0.25;
    rightFin.rotation.y = Math.PI / 2;
    group.add(leftFin, rightFin);

    // 5. Twin Jet Engine Exhausts
    const engineGeom = new THREE.CylinderGeometry(0.32, 0.38, 1.5, 8);
    engineGeom.rotateX(Math.PI / 2);
    const leftEngine = new THREE.Mesh(engineGeom, this.materials.playerAccent);
    leftEngine.position.set(-0.6, 0, -2.4);

    const rightEngine = leftEngine.clone();
    rightEngine.position.set(0.6, 0, -2.4);
    group.add(leftEngine, rightEngine);

    // Glowing Engine Cores
    const glowGeom = new THREE.CylinderGeometry(0.24, 0.24, 0.15, 8);
    glowGeom.rotateX(Math.PI / 2);
    const leftGlow = new THREE.Mesh(glowGeom, this.materials.playerEngineGlow);
    leftGlow.position.set(-0.6, 0, -3.15);
    const rightGlow = leftGlow.clone();
    rightGlow.position.set(0.6, 0, -3.15);
    group.add(leftGlow, rightGlow);

    // Energy Shield Bubble (Hidden by default, shown when shield active)
    const shieldGeom = new THREE.SphereGeometry(3.6, 16, 16);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: 0,
    });
    const shieldMesh = new THREE.Mesh(shieldGeom, shieldMat);
    shieldMesh.name = 'shieldMesh';
    group.add(shieldMesh);

    group.castShadow = true;
    group.receiveShadow = true;

    // Hardpoint positions for weapon firing
    group.userData = {
      muzzles: [
        new THREE.Vector3(-1.8, 0.05, 1.2),
        new THREE.Vector3(1.8, 0.05, 1.2),
      ],
      missileHardpoints: [
        new THREE.Vector3(-4.75, 0.02, -0.6),
        new THREE.Vector3(4.75, 0.02, -0.6),
      ],
      engineGlows: [leftGlow, rightGlow],
      shieldMesh: shieldMesh,
    };

    return group;
  }

  // CREATE SCOUT ENEMY
  createScoutPlane() {
    const group = new THREE.Group();

    // Fuselage
    const fuselageGeom = new THREE.ConeGeometry(0.7, 4.5, 6);
    fuselageGeom.rotateX(Math.PI / 2);
    const fuselage = new THREE.Mesh(fuselageGeom, this.materials.scoutBody);
    fuselage.scale.set(0.9, 0.6, 1);
    group.add(fuselage);

    // Needle Cockpit
    const canopyGeom = new THREE.BoxGeometry(0.4, 0.35, 1.2);
    const canopy = new THREE.Mesh(canopyGeom, this.materials.scoutAccent);
    canopy.position.set(0, 0.25, 0.2);
    group.add(canopy);

    // Swept delta wings
    const wingGeom = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      // Left wing
      0, 0, 1.0,
      -3.2, 0, -1.2,
      0, 0, -1.5,
      // Right wing
      0, 0, 1.0,
      0, 0, -1.5,
      3.2, 0, -1.2
    ]);
    wingGeom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    wingGeom.computeVertexNormals();
    const wings = new THREE.Mesh(wingGeom, this.materials.scoutAccent);
    group.add(wings);

    // Single Central Tail Fin
    const finGeom = new THREE.BoxGeometry(0.1, 0.9, 1.0);
    const fin = new THREE.Mesh(finGeom, this.materials.scoutBody);
    fin.position.set(0, 0.55, -1.4);
    group.add(fin);

    // Engine Thruster Glow
    const glowGeom = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 6);
    glowGeom.rotateX(Math.PI / 2);
    const glow = new THREE.Mesh(glowGeom, this.materials.enemyEngineGlow);
    glow.position.set(0, 0, -2.3);
    group.add(glow);

    group.userData = {
      muzzles: [new THREE.Vector3(0, 0, 2.2)],
      radius: 2.2,
      hitMesh: fuselage,
    };

    return group;
  }

  // CREATE INTERCEPTOR ENEMY
  createInterceptorPlane() {
    const group = new THREE.Group();

    // Dual Fuselage / Twin Hull
    const hullGeom = new THREE.BoxGeometry(0.7, 0.6, 5.0);
    const leftHull = new THREE.Mesh(hullGeom, this.materials.interceptorBody);
    leftHull.position.set(-1.0, 0, 0);

    const rightHull = new THREE.Mesh(hullGeom, this.materials.interceptorBody);
    rightHull.position.set(1.0, 0, 0);
    group.add(leftHull, rightHull);

    // Center Cockpit Pod
    const podGeom = new THREE.ConeGeometry(0.65, 3.8, 6);
    podGeom.rotateX(Math.PI / 2);
    const centerPod = new THREE.Mesh(podGeom, this.materials.interceptorAccent);
    centerPod.position.set(0, 0.15, 0.4);
    group.add(centerPod);

    // Wide Connecting Wing
    const wingGeom = new THREE.BoxGeometry(4.8, 0.15, 2.2);
    const wing = new THREE.Mesh(wingGeom, this.materials.interceptorAccent);
    wing.position.set(0, 0, -0.4);
    group.add(wing);

    // Twin Tail Fins
    const finGeom = new THREE.BoxGeometry(0.12, 1.1, 1.2);
    const leftFin = new THREE.Mesh(finGeom, this.materials.interceptorBody);
    leftFin.position.set(-1.0, 0.6, -2.1);
    leftFin.rotation.z = -0.15;

    const rightFin = new THREE.Mesh(finGeom, this.materials.interceptorBody);
    rightFin.position.set(1.0, 0.6, -2.1);
    rightFin.rotation.z = 0.15;
    group.add(leftFin, rightFin);

    // Twin Engine Glows
    const glowGeom = new THREE.CylinderGeometry(0.25, 0.25, 0.1, 6);
    glowGeom.rotateX(Math.PI / 2);
    const leftGlow = new THREE.Mesh(glowGeom, this.materials.enemyEngineGlow);
    leftGlow.position.set(-1.0, 0, -2.55);

    const rightGlow = leftGlow.clone();
    rightGlow.position.set(1.0, 0, -2.55);
    group.add(leftGlow, rightGlow);

    group.userData = {
      muzzles: [
        new THREE.Vector3(-1.0, 0, 2.4),
        new THREE.Vector3(1.0, 0, 2.4),
      ],
      radius: 3.0,
      hitMesh: centerPod,
    };

    return group;
  }

  // CREATE HEAVY GUNSHIP ENEMY
  createHeavyGunship() {
    const group = new THREE.Group();

    // Heavy Diamond Wing / Armored Body
    const bodyGeom = new THREE.BoxGeometry(3.6, 1.2, 5.8);
    const mainBody = new THREE.Mesh(bodyGeom, this.materials.gunshipBody);
    group.add(mainBody);

    // Armored Cockpit Bridge
    const bridgeGeom = new THREE.BoxGeometry(1.6, 0.7, 2.6);
    const bridge = new THREE.Mesh(bridgeGeom, this.materials.gunshipAccent);
    bridge.position.set(0, 0.85, 0.6);
    group.add(bridge);

    // Heavy Outrigger Wings
    const wingGeom = new THREE.BoxGeometry(8.2, 0.28, 2.8);
    const wings = new THREE.Mesh(wingGeom, this.materials.gunshipAccent);
    wings.position.set(0, -0.1, -0.6);
    group.add(wings);

    // Dual Weapon Pods / Turrets
    const turretGeom = new THREE.CylinderGeometry(0.5, 0.5, 1.4, 8);
    turretGeom.rotateX(Math.PI / 2);
    const leftTurret = new THREE.Mesh(turretGeom, this.materials.gunshipAccent);
    leftTurret.position.set(-2.8, -0.1, 1.2);

    const rightTurret = leftTurret.clone();
    rightTurret.position.set(2.8, -0.1, 1.2);
    group.add(leftTurret, rightTurret);

    // 4 Heavy Engine Pods
    const engineGeom = new THREE.CylinderGeometry(0.35, 0.42, 1.8, 8);
    engineGeom.rotateX(Math.PI / 2);
    [-2.2, -0.8, 0.8, 2.2].forEach(x => {
      const eng = new THREE.Mesh(engineGeom, this.materials.gunshipAccent);
      eng.position.set(x, 0, -2.8);
      group.add(eng);

      const glow = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.28, 0.1, 8),
        this.materials.gunshipGlow
      );
      glow.geometry.rotateX(Math.PI / 2);
      glow.position.set(x, 0, -3.75);
      group.add(glow);
    });

    group.userData = {
      muzzles: [
        new THREE.Vector3(-2.8, -0.1, 2.0),
        new THREE.Vector3(0, 0.3, 2.6),
        new THREE.Vector3(2.8, -0.1, 2.0),
      ],
      radius: 4.8,
      hitMesh: mainBody,
    };

    return group;
  }

  // CREATE DYNAMIC RAKSHAS AURA BOSS (From User's Custom Photos)
  createRakshasBoss(bossConfig = null) {
    const group = new THREE.Group();

    const config = bossConfig || {
      image: '/assets/asura_boss.jpg',
      width: 18,
      height: 10.125,
      auraColor: 0xff3700,
    };

    const width = config.width || 16;
    const height = config.height || 12;
    const auraColor = config.auraColor || 0xff3700;

    // 1. Load Boss Photo Texture
    const textureLoader = new THREE.TextureLoader();
    const bossTexture = textureLoader.load(config.image || '/assets/asura_boss.jpg');
    bossTexture.colorSpace = THREE.SRGBColorSpace;

    // 2. High Detail Boss Billboard Quad
    const planeGeom = new THREE.PlaneGeometry(width, height);
    const bossMat = new THREE.MeshStandardMaterial({
      map: bossTexture,
      roughness: 0.4,
      metalness: 0.3,
      emissive: new THREE.Color(auraColor).multiplyScalar(0.2),
      emissiveIntensity: 0.3,
      side: THREE.DoubleSide,
    });
    const mainBody = new THREE.Mesh(planeGeom, bossMat);
    mainBody.position.z = 0.4;
    group.add(mainBody);

    // 3. Ornate Bronze & Obsidian Relic Backplate / Frame
    const frameGeom = new THREE.BoxGeometry(width + 1.2, height + 1.2, 0.7);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x1c120c,
      roughness: 0.6,
      metalness: 0.65,
      flatShading: true,
    });
    const frame = new THREE.Mesh(frameGeom, frameMat);
    group.add(frame);

    // 4. Glowing Aura Border Trim
    const borderGeom = new THREE.BoxGeometry(width + 0.4, height + 0.4, 0.75);
    const borderMat = new THREE.MeshBasicMaterial({
      color: auraColor,
      wireframe: true,
    });
    const border = new THREE.Mesh(borderGeom, borderMat);
    group.add(border);

    // 5. Demonic Spikes / Horns on Frame Corners
    const hornGeom = new THREE.ConeGeometry(0.75, 3.8, 6);
    hornGeom.rotateX(Math.PI / 2);
    const hornMat = new THREE.MeshStandardMaterial({
      color: 0x22110c,
      roughness: 0.3,
      metalness: 0.6,
      flatShading: true,
    });

    // Top-left horn
    const hornTL = new THREE.Mesh(hornGeom, hornMat);
    hornTL.position.set(-width * 0.5 - 0.4, height * 0.5 + 0.4, 0);
    hornTL.rotation.z = Math.PI * 0.75;
    hornTL.rotation.y = 0.2;

    // Top-right horn
    const hornTR = new THREE.Mesh(hornGeom, hornMat);
    hornTR.position.set(width * 0.5 + 0.4, height * 0.5 + 0.4, 0);
    hornTR.rotation.z = -Math.PI * 0.75;
    hornTR.rotation.y = -0.2;

    // Bottom spikes
    const hornBL = new THREE.Mesh(hornGeom, hornMat);
    hornBL.position.set(-width * 0.5 - 0.2, -height * 0.5 - 0.2, 0);
    hornBL.rotation.z = Math.PI * 0.25;

    const hornBR = new THREE.Mesh(hornGeom, hornMat);
    hornBR.position.set(width * 0.5 + 0.2, -height * 0.5 - 0.2, 0);
    hornBR.rotation.z = -Math.PI * 0.25;

    group.add(hornTL, hornTR, hornBL, hornBR);

    // 6. Orbiting Elemental Aura Spheres
    const auraSpheres = [];
    const sphereGeom = new THREE.SphereGeometry(0.55, 8, 8);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: auraColor,
    });

    for (let i = 0; i < 8; i++) {
      const sphere = new THREE.Mesh(sphereGeom, sphereMat);
      group.add(sphere);
      auraSpheres.push(sphere);
    }

    // 7. Dynamic Hellfire/Elemental PointLight casting radiant glow
    const bossLight = new THREE.PointLight(auraColor, 3.0, 50);
    bossLight.position.set(0, 0, 2.5);
    group.add(bossLight);

    group.userData = {
      muzzles: [
        new THREE.Vector3(0, height * 0.25, 1.0),            // Head / Crown / Mouth
        new THREE.Vector3(-width * 0.38, -height * 0.25, 1.0), // Left Weapon / Claw
        new THREE.Vector3(width * 0.38, -height * 0.25, 1.0),  // Right Weapon / Claw
        new THREE.Vector3(0, 0, 1.0),                        // Center Core
      ],
      radius: Math.max(width, height) * 0.52,
      hitMesh: mainBody,
      auraSpheres: auraSpheres,
      bossLight: bossLight,
      mainBody: mainBody,
      orbitWidth: width * 0.65,
      orbitHeight: height * 0.65,
    };

    return group;
  }

  // Alias for backward compatibility
  createAsuraBoss(bossConfig) {
    return this.createRakshasBoss(bossConfig);
  }

  // CREATE MISSILE 3D MESH
  createMissile() {
    const group = new THREE.Group();

    // Rocket Body
    const bodyGeom = new THREE.CylinderGeometry(0.18, 0.18, 1.8, 8);
    bodyGeom.rotateX(Math.PI / 2);
    const body = new THREE.Mesh(bodyGeom, this.materials.missileBody);
    group.add(body);

    // Warhead Cone
    const warheadGeom = new THREE.ConeGeometry(0.18, 0.55, 8);
    warheadGeom.rotateX(Math.PI / 2);
    const warhead = new THREE.Mesh(warheadGeom, this.materials.missileWarhead);
    warhead.position.set(0, 0, 1.15);
    group.add(warhead);

    // 4 Cross Stabilizing Fins
    const finGeom = new THREE.BoxGeometry(0.8, 0.04, 0.4);
    const finH = new THREE.Mesh(finGeom, this.materials.missileWarhead);
    finH.position.set(0, 0, -0.65);
    const finV = new THREE.Mesh(finGeom, this.materials.missileWarhead);
    finV.position.set(0, 0, -0.65);
    finV.rotation.z = Math.PI / 2;
    group.add(finH, finV);

    // Thruster Flare
    const flareGeom = new THREE.ConeGeometry(0.15, 0.6, 6);
    flareGeom.rotateX(-Math.PI / 2);
    const flare = new THREE.Mesh(flareGeom, this.materials.missileFlame);
    flare.position.set(0, 0, -1.1);
    group.add(flare);

    group.userData = { flare };
    return group;
  }

  // CREATE POWER-UP 3D MESH
  createPowerUp(type) {
    const group = new THREE.Group();

    let mat = this.materials.puRepair;
    if (type === 'shield') mat = this.materials.puShield;
    else if (type === 'rapid') mat = this.materials.puRapid;
    else if (type === 'missiles') mat = this.materials.puMissile;

    // Glowing Octahedron Diamond
    const crystalGeom = new THREE.OctahedronGeometry(1.2, 0);
    const crystal = new THREE.Mesh(crystalGeom, mat);
    group.add(crystal);

    // Outer Orbiting Wireframe Ring
    const ringGeom = new THREE.TorusGeometry(1.7, 0.08, 6, 16);
    const ringMat = new THREE.MeshBasicMaterial({
      color: mat.color,
      wireframe: true,
      transparent: true,
      opacity: 0.7,
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    group.add(ring);

    group.userData = {
      type,
      crystal,
      ring,
      rotationSpeed: 2.5,
    };

    return group;
  }
}

export const modelFactory = new ModelFactory();

export function createPlayerJetModel() {
  return modelFactory.createPlayerPlane();
}
