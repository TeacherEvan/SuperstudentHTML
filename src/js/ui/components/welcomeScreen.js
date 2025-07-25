/**
 * Welcome Screen with Animated Background
 * As specified in SuperStudentHTML.md
 */
export class WelcomeScreen {
  constructor(canvas, ctx, resourceManager) {
    this.canvas = canvas;
    this.bgCanvas = document.createElement('canvas');
    this.bgCanvas.className = 'welcome-bg-canvas';
    this.bgCtx = this.bgCanvas.getContext('2d');
    this.syncCanvasSize();
    this.resourceManager = resourceManager;
    this.particles = [];
    this.animationId = null;
    this.isVisible = false;
    
    // Animation properties
    this.time = 0;
    this.maxParticles = 150;
    this.particleSpeed = 0.5;
    
    // Callbacks
    this.onStartGame = null;
    this.onShowOptions = null;
    
    this.particleColors = ['#ff595e','#ffca3a','#8ac926','#1982c4','#6a4c93'];
    
    this.setupParticles();
    this.setupUI();

    // Keep background canvas in sync on resize
    window.addEventListener('resize', () => this.onResize());
  }
  
  setupParticles() {
    // Create animated background particles (color confetti style)
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push({
        x: Math.random() * this.bgCanvas.width,
        y: Math.random() * this.bgCanvas.height,
        size: Math.random() * 6 + 2,
        speed: Math.random() * this.particleSpeed + 0.3,
        opacity: Math.random() * 0.9 + 0.1,
        color: this.particleColors[Math.floor(Math.random()*this.particleColors.length)]
      });
    }
  }
  
  setupUI() {
    // Create DOM elements for welcome screen UI
    this.createWelcomeScreenHTML();
    this.attachEventListeners();
  }
  
  createWelcomeScreenHTML() {
    // Remove existing welcome screen if present
    const existing = document.getElementById('welcome-screen');
    if (existing) existing.remove();

    const welcomeDiv = document.createElement('div');
    welcomeDiv.id = 'welcome-screen';
    welcomeDiv.className = 'welcome-screen-overlay';

    // Insert background canvas first
    welcomeDiv.appendChild(this.bgCanvas);

    welcomeDiv.innerHTML += `
      <div class="welcome-content">
        <h1 class="game-title">Super Student</h1>
        <div class="display-size-section">
          <p class="choose-text">Choose Display Size</p>
          <div class="display-btn-group">
            <button class="display-btn default" data-mode="DEFAULT">Default</button>
            <button class="display-btn qboard" data-mode="QBOARD">QBoard</button>
          </div>
          <p class="mode-selected-text" style="display:none;"></p>
        </div>
        <footer class="collaboration-footer">
          <p>In collaboration with <span class="highlight">SANGSOM Kindergarten</span></p>
        </footer>
      </div>`;

    document.body.appendChild(welcomeDiv);
    this.addWelcomeScreenCSS();
  }
  
  addWelcomeScreenCSS() {
    const style = document.createElement('style');
    style.textContent = `
      .welcome-screen-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0,0,0,0.8);
        backdrop-filter: blur(2px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.5s ease-in-out;
      }
      .welcome-screen-overlay.visible { opacity:1; }
      .welcome-content { text-align:center; color:white; max-width:90vw; }
      .game-title { font-size:10vw; margin:0 0 40px 0; color:#ffd700; font-weight:900; text-shadow:3px 3px 8px rgba(0,0,0,0.6); }
      .choose-text { font-size:1.2rem; margin-bottom:16px; letter-spacing:1px; }
      .display-btn-group { display:flex; gap:40px; justify-content:center; flex-wrap:wrap; margin-bottom:30px; }
      .display-btn {
        width:200px; height:60px; font-size:1.1rem; font-weight:600; background:transparent; border:3px solid currentColor; color:white; cursor:pointer; transition:transform 0.2s, opacity 0.3s;
      }
      .display-btn.default { color:#00bfff; }
      .display-btn.qboard { color:#ff4080; }
      .display-btn:hover { transform:translateY(-4px); }
      .display-btn.selected { opacity:0.6; cursor:default; }
      .collaboration-footer { position:absolute; bottom:40px; left:50%; transform:translateX(-50%); font-size:2vw; }
      .highlight { color:#ffd700; }
      @media(max-width:768px){ .game-title { font-size:12vw; } .display-btn { width:160px; height:50px; } .collaboration-footer{ font-size:4vw;} }
      /* Background canvas */
      .welcome-bg-canvas { position:absolute; top:0; left:0; width:100%; height:100%; z-index:-1; }
    `;
    document.head.appendChild(style);
  }
  
  attachEventListeners() {
    const updateSelection = (button) => {
      document.querySelectorAll('.display-btn').forEach(btn => btn.classList.remove('selected'));
      button.classList.add('selected');
      const mode = button.dataset.mode;
      this.resourceManager.setDisplayMode(mode);
      const textEl = document.querySelector('.mode-selected-text');
      if (textEl){
        textEl.style.display='block';
        textEl.textContent=`Display mode set to ${mode}. Loading...`;
      }
      setTimeout(()=>{ if(this.onStartGame){ this.hide(); this.onStartGame(); } }, 1200);
    };

    setTimeout(()=>{
      document.querySelectorAll('.display-btn').forEach(btn => {
        btn.addEventListener('click',()=> updateSelection(btn));
      });
    },100);
  }
  
  show() {
    this.isVisible = true;
    this.startAnimation();
    
    setTimeout(() => {
      const welcomeScreen = document.getElementById('welcome-screen');
      if (welcomeScreen) {
        welcomeScreen.classList.add('visible');
      }
    }, 100);
  }
  
  hide() {
    this.isVisible = false;
    this.stopAnimation();
    
    const welcomeScreen = document.getElementById('welcome-screen');
    if (welcomeScreen) {
      welcomeScreen.classList.remove('visible');
      setTimeout(() => {
        welcomeScreen.remove();
      }, 500);
    }
  }
  
  startAnimation() {
    // Prevent multiple animation loops
    if (this.animationId) {
      console.warn('Animation already running');
      return;
    }
    
    const animate = () => {
      // Check visibility state at the beginning of each frame
      if (!this.isVisible) {
        this.animationId = null;
        return;
      }
      
      this.updateAnimatedBackground();
      this.renderAnimatedBackground();
      
      // Only schedule next frame if still visible
      if (this.isVisible) {
        this.animationId = requestAnimationFrame(animate);
      } else {
        this.animationId = null;
      }
    };
    
    // Start the animation loop
    this.animationId = requestAnimationFrame(animate);
  }
  
  stopAnimation() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
  
  updateAnimatedBackground() {
    this.time += 0.01;
    
    this.particles.forEach(particle => {
      particle.y -= particle.speed;
      
      if (particle.y < -10) {
        particle.y = this.bgCanvas.height + 10;
        particle.x = Math.random() * this.bgCanvas.width;
      }
      
      particle.opacity = 0.5 + Math.sin(this.time * 0.1) * 0.3;
    });
  }
  
  renderAnimatedBackground() {
    const ctx = this.bgCtx;
    ctx.fillStyle = 'rgba(0,0,0,0.9)';
    ctx.fillRect(0,0,this.bgCanvas.width,this.bgCanvas.height);
    this.particles.forEach(p=>{
      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x,p.y,p.size,0,Math.PI*2);
      ctx.fill();
      ctx.restore();
    });
  }
  
  onResize() {
    this.syncCanvasSize();
    // Re-position particles within new bounds
    this.particles.forEach(particle => {
      if (particle.x > this.bgCanvas.width) {
        particle.x = Math.random() * this.bgCanvas.width;
      }
      if (particle.y > this.bgCanvas.height) {
        particle.y = Math.random() * this.bgCanvas.height;
      }
    });
  }
  
  syncCanvasSize() {
    this.bgCanvas.width = window.innerWidth;
    this.bgCanvas.height = window.innerHeight;
  }
  
  setCallbacks(startGameCallback, showOptionsCallback) {
    this.onStartGame = startGameCallback;
    this.onShowOptions = showOptionsCallback;
  }
} 