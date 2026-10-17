import * as THREE from 'three';
import { CONFIG } from './config.js';

export class SceneManager {
  constructor(container) {
    this.container = container;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      CONFIG.camera.fov,
      window.innerWidth / window.innerHeight,
      0.5,
      2000
    );

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    this.container.appendChild(this.renderer.domElement);

    // World & Environment Objects
    this.sunLight = null;
    this.hemiLight = null;
    this.clouds = [];
    this.islands = [];
    this.cloudPool = new THREE.Group();
    this.islandPool = new THREE.Group();
    this.windParticles = null;
    this.ocean = null;

    // Theme state
    this.currentTheme = CONFIG.waves[0].theme;
    this.targetTheme = CONFIG.waves[0].theme;
    this.themeTransitionProgress = 1.0;

    this.initLighting();
    this.initSky();
    this.initOcean();
    this.initFloatingIslands();
    this.initClouds();
    this.initWindParticles();

    window.addEventListener('resize', () => this.onResize());
  }

  initLighting() {
    this.hemiLight = new THREE.HemisphereLight(
      this.currentTheme.skyTop,
      this.currentTheme.skyBottom,
      0.9
    );
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(this.currentTheme.sunColor, 1.8);
    this.sunLight.position.set(120, 180, 80);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 400;
    this.sunLight.shadow.camera.left = -60;
    this.sunLight.shadow.camera.right = 60;
    this.sunLight.shadow.camera.top = 60;
    this.sunLight.shadow.camera.bottom = -60;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);

    // Atmospheric Fog
    this.scene.fog = new THREE.FogExp2(this.currentTheme.fogColor, 0.0022);
  }

  initSky() {
    // Stylized gradient sky dome
    const skyGeom = new THREE.SphereGeometry(1200, 32, 16);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(this.currentTheme.skyTop) },
        bottomColor: { value: new THREE.Color(this.currentTheme.horizon) },
        offset: { value: 60 },
        exponent: { value: 0.6 }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + offset).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
    });

    this.skyDome = new THREE.Mesh(skyGeom, skyMat);
    this.scene.add(this.skyDome);

    // Glowing Sun Billboard
    const sunGeom = new THREE.CircleGeometry(35, 32);
    const sunMat = new THREE.MeshBasicMaterial({
      color: 0xfff3c4,
      transparent: true,
      opacity: 0.9,
    });
    this.sunMesh = new THREE.Mesh(sunGeom, sunMat);
    this.sunMesh.position.copy(this.sunLight.position).normalize().multiplyScalar(900);
    this.sunMesh.lookAt(0, 0, 0);
    this.scene.add(this.sunMesh);
  }

  initOcean() {
    const oceanGeom = new THREE.PlaneGeometry(3000, 3000, 32, 32);
    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x004477,
      roughness: 0.25,
      metalness: 0.8,
      flatShading: true,
    });
    this.ocean = new THREE.Mesh(oceanGeom, oceanMat);
    this.ocean.rotation.x = -Math.PI / 2;
    this.ocean.position.y = -130;
    this.ocean.receiveShadow = true;
    this.scene.add(this.ocean);
  }

  // Floating Low-Poly Islands
  initFloatingIslands() {
    this.scene.add(this.islandPool);

    const islandMaterials = [
      new THREE.MeshStandardMaterial({ color: 0x2d8a4e, roughness: 0.8, flatShading: true }), // Green grass
      new THREE.MeshStandardMaterial({ color: 0x7c6f58, roughness: 0.9, flatShading: true }), // Earth rock
      new THREE.MeshStandardMaterial({ color: 0xe2c792, roughness: 0.7, flatShading: true }), // Sand beach
    ];

    for (let i = 0; i < 12; i++) {
      const island = new THREE.Group();

      // Island base / rock cone
      const size = 25 + Math.random() * 35;
      const rockGeom = new THREE.ConeGeometry(size, size * 1.2, 7);
      rockGeom.rotateX(Math.PI);
      const rock = new THREE.Mesh(rockGeom, islandMaterials[1]);
      rock.position.y = -size * 0.5;
      island.add(rock);

      // Island top / plateau
      const topGeom = new THREE.CylinderGeometry(size * 0.95, size, size * 0.2, 7);
      const top = new THREE.Mesh(topGeom, islandMaterials[0]);
      island.add(top);

      // Low poly trees
      for (let t = 0; t < 6; t++) {
        const treeGeom = new THREE.ConeGeometry(3, 8, 5);
        const treeMat = new THREE.MeshStandardMaterial({ color: 0x1b5e20, flatShading: true });
        const tree = new THREE.Mesh(treeGeom, treeMat);
        const angle = Math.random() * Math.PI * 2;
        const rad = Math.random() * (size * 0.7);
        tree.position.set(Math.cos(angle) * rad, 4, Math.sin(angle) * rad);
        island.add(tree);
      }

      const x = (Math.random() - 0.5) * 350;
      const y = -70 - Math.random() * 40;
      const z = -600 + i * 110;
      island.position.set(x, y, z);

      this.islands.push(island);
      this.islandPool.add(island);
    }
  }

  // Fluffy Procedural Low-Poly Cloud Clusters
  initClouds() {
    this.scene.add(this.cloudPool);

    this.cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0.05,
      flatShading: true,
      transparent: true,
      opacity: 0.88,
    });

    const puffGeom = new THREE.DodecahedronGeometry(1, 1);

    for (let i = 0; i < 35; i++) {
      const cloud = new THREE.Group();
      const numPuffs = 4 + Math.floor(Math.random() * 5);
      const baseScale = 8 + Math.random() * 12;

      for (let p = 0; p < numPuffs; p++) {
        const puff = new THREE.Mesh(puffGeom, this.cloudMat);
        puff.scale.set(
          baseScale * (0.8 + Math.random() * 0.6),
          baseScale * (0.5 + Math.random() * 0.4),
          baseScale * (0.8 + Math.random() * 0.6)
        );
        puff.position.set(
          (Math.random() - 0.5) * baseScale * 1.8,
          (Math.random() - 0.5) * baseScale * 0.6,
          (Math.random() - 0.5) * baseScale * 1.8
        );
        cloud.add(puff);
      }

      // Spread clouds across X, Y, and Z
      const x = (Math.random() - 0.5) * 450;
      const y = -15 + (Math.random() - 0.5) * 80;
      const z = -800 + i * 45;
      cloud.position.set(x, y, z);
      cloud.userData = { speedFactor: 0.8 + Math.random() * 0.4 };

      this.clouds.push(cloud);
      this.cloudPool.add(cloud);
    }
  }

  // High Speed Wind / Atmospheric Motes Particles
  initWindParticles() {
    const count = 400;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 160;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 80;
      positions[i * 3 + 2] = -250 + Math.random() * 350;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.2,
      transparent: true,
      opacity: 0.6,
    });

    this.windParticles = new THREE.Points(geom, mat);
    this.scene.add(this.windParticles);
  }

  // Smooth Theme Interpolation
  setTheme(theme) {
    this.targetTheme = theme;
    this.themeTransitionProgress = 0;
  }

  update(delta, forwardSpeed) {
    // 1. Scroll Clouds backward
    const cloudScroll = forwardSpeed * delta;
    this.clouds.forEach(cloud => {
      cloud.position.z += cloudScroll * cloud.userData.speedFactor;
      if (cloud.position.z > 80) {
        cloud.position.z = -750 - Math.random() * 100;
        cloud.position.x = (Math.random() - 0.5) * 450;
        cloud.position.y = -15 + (Math.random() - 0.5) * 80;
      }
    });

    // 2. Scroll Floating Islands backward
    this.islands.forEach(island => {
      island.position.z += forwardSpeed * 0.55 * delta;
      if (island.position.z > 120) {
        island.position.z = -700 - Math.random() * 150;
        island.position.x = (Math.random() - 0.5) * 400;
      }
    });

    // 3. Scroll Wind Motes
    if (this.windParticles) {
      const positions = this.windParticles.geometry.attributes.position.array;
      const count = positions.length / 3;
      const speed = forwardSpeed * 1.8 * delta;

      for (let i = 0; i < count; i++) {
        positions[i * 3 + 2] += speed;
        if (positions[i * 3 + 2] > 50) {
          positions[i * 3 + 2] = -250;
          positions[i * 3] = (Math.random() - 0.5) * 160;
          positions[i * 3 + 1] = (Math.random() - 0.5) * 80;
        }
      }
      this.windParticles.geometry.attributes.position.needsUpdate = true;
    }

    // 4. Smooth theme transition
    if (this.themeTransitionProgress < 1.0) {
      this.themeTransitionProgress = Math.min(1.0, this.themeTransitionProgress + delta * 0.8);
      const p = this.themeTransitionProgress;

      const topCol = new THREE.Color(this.currentTheme.skyTop).lerp(new THREE.Color(this.targetTheme.skyTop), p);
      const botCol = new THREE.Color(this.currentTheme.horizon).lerp(new THREE.Color(this.targetTheme.horizon), p);
      const fogCol = new THREE.Color(this.currentTheme.fogColor).lerp(new THREE.Color(this.targetTheme.fogColor), p);
      const sunCol = new THREE.Color(this.currentTheme.sunColor).lerp(new THREE.Color(this.targetTheme.sunColor), p);
      const cloudCol = new THREE.Color(this.currentTheme.cloudColor).lerp(new THREE.Color(this.targetTheme.cloudColor), p);

      this.skyDome.material.uniforms.topColor.value.copy(topCol);
      this.skyDome.material.uniforms.bottomColor.value.copy(botCol);
      this.scene.fog.color.copy(fogCol);
      this.sunLight.color.copy(sunCol);
      this.hemiLight.color.copy(topCol);
      this.cloudMat.color.copy(cloudCol);

      if (this.themeTransitionProgress >= 1.0) {
        this.currentTheme = this.targetTheme;
      }
    }
  }

  // Camera Follow Player Logic
  updateCamera(playerPos, playerRot, isBoosting, delta) {
    const targetFov = isBoosting ? CONFIG.camera.boostFov : CONFIG.camera.fov;
    if (Math.abs(this.camera.fov - targetFov) > 0.1) {
      this.camera.fov += (targetFov - this.camera.fov) * delta * 5.0;
      this.camera.updateProjectionMatrix();
    }

    // Camera target position: behind and slightly above player
    const desiredPos = new THREE.Vector3(
      playerPos.x * 0.85,
      playerPos.y * 0.85 + CONFIG.camera.height,
      playerPos.z + CONFIG.camera.distance
    );

    this.camera.position.lerp(desiredPos, CONFIG.camera.lerpSpeed * delta);

    // Look slightly ahead of player
    const lookTarget = new THREE.Vector3(
      playerPos.x * 0.35,
      playerPos.y * 0.35 + 0.5,
      playerPos.z - CONFIG.camera.lookAhead
    );
    this.camera.lookAt(lookTarget);
  }

  setGraphicsQuality(level) {
    if (level === 'low') {
      this.renderer.shadowMap.enabled = false;
      this.renderer.setPixelRatio(1.0);
      this.cloudPool.visible = true;
      if (this.windParticles) this.windParticles.visible = false;
    } else if (level === 'medium') {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.BasicShadowMap;
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      if (this.windParticles) this.windParticles.visible = true;
    } else {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
      if (this.windParticles) this.windParticles.visible = true;
    }
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
