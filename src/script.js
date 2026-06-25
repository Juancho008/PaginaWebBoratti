    // --- 1. UI & Scroll Observer ---
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
        else entry.target.classList.remove('visible'); 
      });
    }, { threshold: 0.15 });

    document.querySelectorAll('.reveal-up').forEach(el => observer.observe(el));

    const navToggle = document.querySelector('.nav-toggle');
    const siteNav = document.querySelector('.site-nav');
    const siteMenu = document.getElementById('site-menu');
    const navLinks = document.querySelectorAll('.site-nav__link');

    const updateNavScrollState = () => {
      siteNav?.classList.toggle('is-scrolled', window.scrollY > 24);
    };

    updateNavScrollState();
    window.addEventListener('scroll', updateNavScrollState, { passive: true });

    const closeNav = () => {
      if (!navToggle || !siteMenu) return;
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Abrir menú');
      siteMenu.classList.remove('is-open');
      document.body.classList.remove('nav-open');
    };

    navToggle?.addEventListener('click', () => {
      const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!isOpen));
      navToggle.setAttribute('aria-label', isOpen ? 'Abrir menú' : 'Cerrar menú');
      siteMenu?.classList.toggle('is-open', !isOpen);
      document.body.classList.toggle('nav-open', !isOpen);
    });

    navLinks.forEach(link => link.addEventListener('click', closeNav));

    window.addEventListener('resize', () => {
      if (window.innerWidth >= 768) closeNav();
    });

    const heroSlides = document.querySelectorAll('.hero__slide');
    if (heroSlides.length > 1) {
      let heroSlideIndex = 0;
      const slideInterval = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 5000;

      const showHeroSlide = (index) => {
        heroSlides.forEach((slide, i) => {
          slide.classList.toggle('is-active', i === index);
        });
      };

      if (slideInterval > 0) {
        setInterval(() => {
          heroSlideIndex = (heroSlideIndex + 1) % heroSlides.length;
          showHeroSlide(heroSlideIndex);
        }, slideInterval);
      }
    }

    const partnersTrack = document.querySelector('.partners-carousel__track');
    const partnersDots = document.querySelectorAll('.partners-carousel__dot');
    const partnersPanelCount = partnersTrack?.children.length ?? 0;

    if (partnersTrack && partnersPanelCount > 1) {
      let partnersIndex = 0;
      const partnersInterval = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 5000;

      const showPartnersPanel = (index) => {
        partnersTrack.style.transform = `translateX(-${index * 100}%)`;
        partnersDots.forEach((dot, i) => {
          dot.classList.toggle('is-active', i === index);
        });
      };

      if (partnersInterval > 0) {
        setInterval(() => {
          partnersIndex = (partnersIndex + 1) % partnersPanelCount;
          showPartnersPanel(partnersIndex);
        }, partnersInterval);
      }
    }

    let currentScroll = 0;
    let targetScroll = 0;

    window.addEventListener('scroll', () => {
      const scrollTop = window.scrollY;
      const scrollHeight = document.body.scrollHeight - window.innerHeight;
      targetScroll = Math.max(0, Math.min(1, scrollTop / scrollHeight));
    });

    // --- 2. Three.js Setup (Starting Underwater) ---
    const canvas = document.getElementById('bg-canvas');
    const scene = new THREE.Scene();
    
    const palette = {
      surface: new THREE.Color(0x0064b5), // Bright underwater blue
      mid: new THREE.Color(0x001e36),     // Deeper blue
      deep: new THREE.Color(0x000a14),    // Very dark blue
      abyss: new THREE.Color(0x000000)    // Pitch black
    };

    // Initialize environment immediately underwater
    scene.background = palette.surface;
    scene.fog = new THREE.FogExp2(palette.surface, 0.003);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 10000);
    // Position camera below the surface (Y=0), looking slightly up
    camera.position.set(0, 10, 100);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
    sunLight.position.set(-100, 200, 50);
    scene.add(sunLight);

    // --- 3. Realistic Water Surface (Viewed from below) ---
    const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
    const water = new THREE.Water(waterGeometry, {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: new THREE.TextureLoader().load(
        'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg', 
        (texture) => { texture.wrapS = texture.wrapT = THREE.RepeatWrapping; }
      ),
      sunDirection: sunLight.position.clone().normalize(),
      sunColor: 0xffffff,
      waterColor: 0x001e3f,
      distortionScale: 3.7,
      fog: true
    });
    water.rotation.x = -Math.PI / 2;
    water.material.side = THREE.DoubleSide; // Crucial for seeing the underside
    scene.add(water);

    // --- 4. Marine Snow (Particles) ---
    const particlesGeo = new THREE.BufferGeometry();
    const particlesCount = isMobile ? 1200 : 3500;
    const posArray = new Float32Array(particlesCount * 3);
    const speeds = new Float32Array(particlesCount);
    
    for(let i = 0; i < particlesCount * 3; i+=3) {
      posArray[i] = (Math.random() - 0.5) * 600;      
      posArray[i+1] = (Math.random() - 1.0) * 1200;   
      posArray[i+2] = (Math.random() - 0.5) * 600;    
      speeds[i/3] = Math.random() * 0.2 + 0.1;        
    }
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particlesGeo.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));
    
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 16; pCanvas.height = 16;
    const pCtx = pCanvas.getContext('2d');
    const gradient = pCtx.createRadialGradient(8, 8, 0, 8, 8, 8);
    gradient.addColorStop(0, 'rgba(255,255,255,0.8)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    pCtx.fillStyle = gradient;
    pCtx.fillRect(0, 0, 16, 16);
    
    const particlesMat = new THREE.PointsMaterial({
      size: 2.5,
      map: new THREE.CanvasTexture(pCanvas),
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const marineSnow = new THREE.Points(particlesGeo, particlesMat);
    scene.add(marineSnow);

    // --- 5. Interactions ---
    let mouseX = 0;
    let mouseY = 0;

    const updatePointer = (clientX, clientY) => {
      mouseX = (clientX / window.innerWidth - 0.5) * 2;
      mouseY = (clientY / window.innerHeight - 0.5) * 2;
    };

    document.addEventListener('mousemove', (e) => updatePointer(e.clientX, e.clientY));
    document.addEventListener('touchmove', (e) => {
      if (e.touches[0]) updatePointer(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 768 ? 1.5 : 2));
    });

    // --- 6. Animation Loop ---
    const clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      currentScroll += (targetScroll - currentScroll) * 0.08;

      water.material.uniforms['time'].value += 1.0 / 60.0;

      const positions = marineSnow.geometry.attributes.position.array;
      const particleSpeeds = marineSnow.geometry.attributes.speed.array;
      for(let i = 0; i < particlesCount; i++) {
        const i3 = i * 3;
        positions[i3 + 1] += particleSpeeds[i]; 
        positions[i3] += Math.sin(time * 0.5 + positions[i3+1] * 0.05) * 0.1; 
        
        if (positions[i3 + 1] > 0) {
          positions[i3 + 1] = -1200; 
        }
      }
      marineSnow.geometry.attributes.position.needsUpdate = true;

      // --- Constant View Physics ---
      // The camera stays underwater and breathes slightly, looking up at the surface
      const breath = Math.sin(time * 1.5) * 2.0;
      const targetY = -25; // Locked depth
      
      camera.position.y += (targetY + breath - camera.position.y) * 0.05;
      camera.position.x += (mouseX * 15 - camera.position.x) * 0.05;
      
      // Always look slightly up and forward so the glowing surface is visible
      camera.lookAt(0, 15, -100); 

      // --- Environment Lighting/Fog Simulation based on scroll ---
      let targetColor;
      let fogDens = 0.003;

      if (currentScroll < 0.3) {
        // Just below surface -> Mid depth
        const p = currentScroll / 0.3;
        targetColor = palette.surface.clone().lerp(palette.mid, p);
        fogDens = 0.003 + (p * 0.007); // Fog thickens
        sunLight.intensity = 2.5 * (1 - p); // Surface glow fades
        ambientLight.intensity = 0.7 * (1 - p*0.3);
      } else if (currentScroll < 0.7) {
        // Mid depth -> Deep
        const p = (currentScroll - 0.3) / 0.4;
        targetColor = palette.mid.clone().lerp(palette.deep, p);
        fogDens = 0.01 + (p * 0.01);
        sunLight.intensity = 0;
        ambientLight.intensity = 0.49 * (1 - p);
      } else {
        // Deep -> The Abyss
        const p = (currentScroll - 0.7) / 0.3;
        targetColor = palette.deep.clone().lerp(palette.abyss, p);
        fogDens = 0.02 + (p * 0.015);
        ambientLight.intensity = 0;
      }

      scene.background.lerp(targetColor, 0.1);
      scene.fog.color.lerp(targetColor, 0.1);
      scene.fog.density = THREE.MathUtils.lerp(scene.fog.density, fogDens, 0.1);

      renderer.render(scene, camera);
    }

    animate();
    window.dispatchEvent(new Event('scroll'));