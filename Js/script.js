class FirstPersonDoom {
    constructor() {
        this.gameContainer = document.getElementById('gameContainer');
        this.playerElement = document.getElementById('player');
        
        this.player = {
            x: window.innerWidth / 2,
            health: 100,
            ammo: 100,
            maxAmmo: 100,
            speed: 5,
            aimX: 0,
            aimY: 0,
            isMoving: false,
            hasShield: false,
            shieldActive: false,
            shieldDuration: 3000,
            shieldCooldown: 0,
            shieldMaxCooldown: 8000
        };
        
        this.enemies = [];
        this.bullets = [];
        this.keys = {};
        this.score = 0;
        this.enemySpawnTimer = 0;
        this.maxEnemies = 8;
        this.gameRunning = true;
        this.wave = 1;
        this.enemiesInWave = 0;
        this.enemiesKilledInWave = 0;
        this.maxEnemiesPerWave = 5;
        this.waveActive = true;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.spawnInitialEnemies();
        this.updatePlayerVisual();
        this.gameLoop();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            if (e.code === 'KeyR') {
                this.reload();
            }
            
            if (e.code === 'KeyE' && this.player.hasShield) {
                this.activateShield();
            }
            
            e.preventDefault();
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!this.gameRunning) return;
            
            this.player.aimX = e.clientX;
            this.player.aimY = e.clientY;
            
            const crosshair = document.getElementById('crosshair');
            crosshair.style.left = this.player.aimX + 'px';
            crosshair.style.top = this.player.aimY + 'px';
        });
        
        document.addEventListener('click', (e) => {
            if (!this.gameRunning) return;
            this.shoot();
            e.preventDefault();
        });
        
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }
    
    spawnInitialEnemies() {
        this.showWaveAnnouncement();
        this.spawnWaveEnemies();
    }
    
    showWaveAnnouncement() {
        const announcement = document.createElement('div');
        announcement.id = 'wave-indicator';
        announcement.innerHTML = `
            <div>OLEADA ${this.wave}</div>
            <div style="font-size: 24px; margin-top: 10px;">
                ${this.wave === 3 ? '🛡️ ESCUDO DESBLOQUEADO!' : '¡PREPÁRATE!'}
            </div>
        `;
        this.gameContainer.appendChild(announcement);
        
        setTimeout(() => {
            announcement.remove();
        }, 3000);
    }
    
    spawnWaveEnemies() {
        this.enemiesInWave = 0;
        this.enemiesKilledInWave = 0;
        
        this.player.ammo = this.player.maxAmmo + ((this.wave - 1) * 10);
        this.player.maxAmmo = this.player.ammo;
        
        if (this.wave >= 3 && !this.player.hasShield) {
            this.player.hasShield = true;
            document.getElementById('shield-status').style.display = 'block';
            document.getElementById('shield-instruction').style.display = 'block';
        }
        
        for (let i = 0; i < this.maxEnemiesPerWave; i++) {
            setTimeout(() => {
                this.spawnEnemy();
            }, i * 1000);
        }
        
        if (this.wave >= 3) {
            setTimeout(() => {
                this.spawnSpecialEnemy();
            }, 2000);
            setTimeout(() => {
                this.spawnSpecialEnemy();
            }, 5000);
        }
    }
    
    spawnEnemy() {
        if (this.enemiesInWave >= this.maxEnemiesPerWave) return;
        
        let x, y;
        const side = Math.random();
        
        if (side < 0.4) {
            x = -80;
            y = Math.random() * (window.innerHeight * 0.4) + 50;
        } else if (side < 0.8) {
            x = window.innerWidth + 80;
            y = Math.random() * (window.innerHeight * 0.4) + 50;
        } else {
            x = Math.random() * (window.innerWidth - 160) + 80;
            y = -120;
        }
        
        const enemy = {
            x: x,
            y: y,
            health: this.wave,
            maxHealth: this.wave,
            speed: 0.5 + Math.random() * 1 + (this.wave * 0.3),
            lastShot: 0,
            shootCooldown: 2000 + Math.random() * 3000,
            element: this.createEnemyElement(x, y),
            type: 'normal'
        };
        
        this.enemies.push(enemy);
        this.enemiesInWave++;
        this.gameContainer.appendChild(enemy.element);
    }
    
    spawnSpecialEnemy() {
        let x, y;
        const corner = Math.random();
        
        if (corner < 0.5) {
            x = -100;
            y = 50;
        } else {
            x = window.innerWidth + 100;
            y = 50;
        }
        
        const specialEnemy = {
            x: x,
            y: y,
            health: this.wave * 2,
            maxHealth: this.wave * 2,
            speed: 1,
            lastShot: 0,
            shootCooldown: 1000,
            shotsRemaining: 3,
            element: this.createSpecialEnemyElement(x, y),
            type: 'special',
            state: 'entering'
        };
        
        this.enemies.push(specialEnemy);
        this.gameContainer.appendChild(specialEnemy.element);
    }
    
    createEnemyElement(x, y) {
        const enemyEl = document.createElement('div');
        enemyEl.className = 'enemy';
        enemyEl.style.left = x + 'px';
        enemyEl.style.top = y + 'px';
        enemyEl.style.transform = 'translate(-50%, -50%)';
        
        const spriteEl = document.createElement('div');
        spriteEl.className = 'enemy-sprite';
        enemyEl.appendChild(spriteEl);
        
        return enemyEl;
    }
    
    createSpecialEnemyElement(x, y) {
        const enemyEl = document.createElement('div');
        enemyEl.className = 'special-enemy';
        enemyEl.style.left = x + 'px';
        enemyEl.style.top = y + 'px';
        enemyEl.style.transform = 'translate(-50%, -50%)';
        
        const spriteEl = document.createElement('div');
        spriteEl.className = 'special-enemy-sprite';
        enemyEl.appendChild(spriteEl);
        
        return enemyEl;
    }
    
    update() {
        if (!this.gameRunning) return;
        
        this.updatePlayer();
        this.updateEnemies();
        this.updateBullets();
        this.checkCollisions();
        this.spawnEnemies();
        this.updateHUD();
    }
    
    updatePlayer() {
        let newX = this.player.x;
        let wasMoving = this.player.isMoving;
        this.player.isMoving = false;
        
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
            newX -= this.player.speed;
            this.player.isMoving = true;
        }
        if (this.keys['KeyD'] || this.keys['ArrowRight']) {
            newX += this.player.speed;
            this.player.isMoving = true;
        }
        
        this.player.x = Math.max(50, Math.min(window.innerWidth - 50, newX));
        
        if (newX !== this.player.x - (this.keys['KeyA'] || this.keys['ArrowLeft'] ? this.player.speed : 0) + (this.keys['KeyD'] || this.keys['ArrowRight'] ? this.player.speed : 0) || this.player.isMoving !== wasMoving) {
            this.updatePlayerVisual();
        }
    }
    
updatePlayerVisual() {
    this.playerElement.style.left = (this.player.x - 75) + 'px'; 
    
    if (this.player.isMoving) {
        this.playerElement.classList.add('walking');
    } else {
        this.playerElement.classList.remove('walking');
    }
}
    
    updateEnemies() {
        this.enemies.forEach((enemy, index) => {
            if (enemy.type === 'special') {
                this.updateSpecialEnemy(enemy, index);
                return;
            }
            
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            
            let dx = centerX - enemy.x;
            let dy = centerY - enemy.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 150) {
                enemy.x += (dx / distance) * enemy.speed;
                enemy.y += (dy / distance) * enemy.speed;
            } else {
                enemy.x += (Math.random() - 0.5) * 2;
            }
            
            enemy.element.style.left = enemy.x + 'px';
            enemy.element.style.top = enemy.y + 'px';
            
            const now = Date.now();
            if (now - enemy.lastShot > enemy.shootCooldown) {
                this.enemyShoot(enemy);
                enemy.lastShot = now;
            }
        });
    }
    
    updateSpecialEnemy(enemy, index) {
        const now = Date.now();
        
        if (enemy.state === 'entering') {
            const targetX = enemy.x < 0 ? 100 : window.innerWidth - 100;
            
            if (Math.abs(enemy.x - targetX) > 5) {
                enemy.x += (targetX - enemy.x) * 0.05;
            } else {
                enemy.state = 'shooting';
                enemy.lastShot = now;
            }
        }
        
        if (enemy.state === 'shooting') {
            if (now - enemy.lastShot > enemy.shootCooldown && enemy.shotsRemaining > 0) {
                this.specialEnemyShoot(enemy);
                enemy.lastShot = now;
                enemy.shotsRemaining--;
                
                if (enemy.shotsRemaining <= 0) {
                    enemy.state = 'leaving';
                }
            }
        }
        
        if (enemy.state === 'leaving') {
            const exitX = enemy.x < window.innerWidth / 2 ? -200 : window.innerWidth + 200;
            enemy.x += (exitX - enemy.x) * 0.1;
            
            if (Math.abs(enemy.x - exitX) < 10) {
                enemy.element.remove();
                this.enemies.splice(index, 1);
            }
        }
        
        enemy.element.style.left = enemy.x + 'px';
        enemy.element.style.top = enemy.y + 'px';
    }
    
    updateBullets() {
        this.bullets.forEach((bullet, index) => {
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;
            
            if (bullet.element) {
                bullet.element.style.left = bullet.x + 'px';
                bullet.element.style.top = bullet.y + 'px';
            }
            
            if (bullet.x < -20 || bullet.x > window.innerWidth + 20 || 
                bullet.y < -20 || bullet.y > window.innerHeight + 20) {
                if (bullet.element) {
                    bullet.element.remove();
                }
                this.bullets.splice(index, 1);
            }
        });
    }
    
    shoot() {
    if (this.player.ammo <= 0) return;
    
    this.player.ammo--;
    
    const dx = this.player.aimX - this.player.x;
    const dy = this.player.aimY - (window.innerHeight - 190); 
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    const speed = 8;
    const bullet = {
        x: this.player.x,
        y: window.innerHeight - 190, 
        vx: (dx / distance) * speed,
        vy: (dy / distance) * speed,
        fromPlayer: true,
        element: this.createBulletElement(this.player.x, window.innerHeight - 190, false)
    };
    
    this.bullets.push(bullet);
    this.gameContainer.appendChild(bullet.element);
    
    this.createMuzzleFlash();
}
    
    enemyShoot(enemy) {
        const dx = this.player.x - enemy.x;
        const dy = (window.innerHeight - 90) - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const speed = 4;
        const bullet = {
            x: enemy.x,
            y: enemy.y,
            vx: (dx / distance) * speed,
            vy: (dy / distance) * speed,
            fromPlayer: false,
            element: this.createBulletElement(enemy.x, enemy.y, true)
        };
        
        this.bullets.push(bullet);
        this.gameContainer.appendChild(bullet.element);
    }
    
    specialEnemyShoot(enemy) {
        for (let i = 0; i < 3; i++) {
            const angle = (i - 1) * 0.3;
            const dx = Math.cos(angle + Math.PI/2) * (enemy.x < window.innerWidth / 2 ? 1 : -1);
            const dy = Math.sin(angle + Math.PI/2);
            
            const speed = 6;
            const bullet = {
                x: enemy.x,
                y: enemy.y,
                vx: dx * speed,
                vy: dy * speed,
                fromPlayer: false,
                element: this.createBulletElement(enemy.x, enemy.y, true)
            };
            
            this.bullets.push(bullet);
            this.gameContainer.appendChild(bullet.element);
        }
    }
    
    createBulletElement(x, y, isEnemy) {
        const bulletEl = document.createElement('div');
        bulletEl.className = isEnemy ? 'bullet enemy-bullet' : 'bullet';
        bulletEl.style.left = x + 'px';
        bulletEl.style.top = y + 'px';
        bulletEl.style.transform = 'translate(-50%, -50%)';
        return bulletEl;
    }
    
    createMuzzleFlash() {
        const flash = document.createElement('div');
        flash.className = 'muzzle-flash';
        flash.style.left = this.player.x + 'px';
        this.gameContainer.appendChild(flash);
        
        setTimeout(() => {
            flash.remove();
        }, 150);
    }
    
checkCollisions() {
    this.bullets.forEach((bullet, bulletIndex) => {
        if (bullet.fromPlayer) {
                this.enemies.forEach((enemy, enemyIndex) => {
                    const dx = bullet.x - enemy.x;
                    const dy = bullet.y - enemy.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < 40) {
                        enemy.health -= 1;
                        
                        bullet.element.remove();
                        this.bullets.splice(bulletIndex, 1);
                        
                        if (enemy.health <= 0) {
                            enemy.element.remove();
                            this.enemies.splice(enemyIndex, 1);
                            this.score += 100;
                            this.enemiesKilledInWave++;
                            
                            this.checkWaveComplete();
                        }
                    }
                });
                } else {
            const dx = bullet.x - this.player.x;
            const dy = bullet.y - (window.innerHeight - 190); 
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 30) {
                    if (this.player.shieldActive) {
                        bullet.element.remove();
                        this.bullets.splice(bulletIndex, 1);
                        return;
                    }
                    
                    this.player.health -= 15;
                    
                    bullet.element.remove();
                    this.bullets.splice(bulletIndex, 1);
                    
                    this.showDamageEffect();
                }
            }
        });
    }
    
    checkWaveComplete() {
        const normalEnemies = this.enemies.filter(e => e.type === 'normal');
        
        if (this.enemiesKilledInWave >= this.maxEnemiesPerWave && normalEnemies.length === 0) {
            this.nextWave();
        }
    }
    
    nextWave() {
        this.wave++;
        this.waveActive = false;
        
        this.enemies.forEach(enemy => {
            if (enemy.type === 'special') {
                enemy.element.remove();
            }
        });
        this.enemies = this.enemies.filter(e => e.type !== 'special');
        
        setTimeout(() => {
            this.waveActive = true;
            this.showWaveAnnouncement();
            this.spawnWaveEnemies();
        }, 2000);
    }
    
    activateShield() {
        if (this.player.shieldCooldown > 0 || this.player.shieldActive) return;
        
        this.player.shieldActive = true;
        document.getElementById('shield-indicator').classList.add('active');
        
        setTimeout(() => {
            this.player.shieldActive = false;
            document.getElementById('shield-indicator').classList.remove('active');
            this.player.shieldCooldown = this.player.shieldMaxCooldown;
        }, this.player.shieldDuration);
    }
    
    showDamageEffect() {
        const damage = document.createElement('div');
        damage.className = 'damage-indicator';
        this.gameContainer.appendChild(damage);
        
        setTimeout(() => {
            damage.remove();
        }, 300);
    }
    
    spawnEnemies() {
        if (this.player.shieldCooldown > 0) {
            this.player.shieldCooldown -= 16;
        }
    }
    
    reload() {
        this.player.ammo = this.player.maxAmmo;
    }
    
    updateHUD() {
        document.getElementById('health').textContent = Math.max(0, this.player.health);
        document.getElementById('ammo').textContent = this.player.ammo;
        document.getElementById('enemyCount').textContent = this.enemies.length;
        document.getElementById('score').textContent = this.score;
        document.getElementById('wave').textContent = this.wave;
        
        if (this.player.hasShield) {
            const shieldStatus = document.getElementById('shield-cooldown');
            if (this.player.shieldActive) {
                shieldStatus.textContent = 'Activo';
                shieldStatus.style.color = '#00ff00';
            } else if (this.player.shieldCooldown > 0) {
                shieldStatus.textContent = `${Math.ceil(this.player.shieldCooldown/1000)}s`;
                shieldStatus.style.color = '#ff6600';
            } else {
                shieldStatus.textContent = 'Listo';
                shieldStatus.style.color = '#00ff00';
            }
        }
        
        if (this.player.health <= 0) {
            this.gameOver();
        }
    }
    
    gameOver() {
        this.gameRunning = false;
        
        const gameOverEl = document.createElement('div');
        gameOverEl.className = 'game-over';
        gameOverEl.innerHTML = `
            <div> GAME OVER </div>
            <div style="font-size: 24px; margin-top: 20px;">Puntuación: ${this.score}</div>
            <div style="font-size: 24px; margin-top: 10px;">Oleada alcanzada: ${this.wave}</div>
            <div style="font-size: 18px; margin-top: 20px;">Presiona F5 para reiniciar</div>
        `;
        
        this.gameContainer.appendChild(gameOverEl);
    }
    
    gameLoop() {
        this.update();
        requestAnimationFrame(() => this.gameLoop());
    }
}

window.addEventListener('load', () => {
    new FirstPersonDoom();
});