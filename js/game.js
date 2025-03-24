class Demo extends Phaser.Scene {
    constructor() {
        super('demo');
        this.ENEMY_START_Y = 50;  // Constant for enemy starting Y position
    }

    preload() {
        // Create a simple square sprite for the player
        const graphics = this.add.graphics();
        graphics.fillStyle(0x00ff00);
        graphics.fillRect(0, 0, 32, 32);
        graphics.generateTexture('player', 32, 32);

        // Create a projectile sprite (thin red rectangle)
        graphics.clear();
        graphics.fillStyle(0xff0000);
        graphics.fillRect(0, 0, 2, 20);  // Width: 2, Height: 20
        graphics.generateTexture('projectile', 2, 20);  // Width: 2, Height: 20

        // Create enemy projectile sprite (thin yellow rectangle)
        graphics.clear();
        graphics.fillStyle(0xffff00);
        graphics.fillRect(0, 0, 2, 20);
        graphics.generateTexture('enemyProjectile', 2, 20);

        // Create enemy sprites with different colors for health states
        const colors = [0x0000ff, 0x000099, 0x000066, 0x000033];  // Different shades of blue
        colors.forEach((color, index) => {
            graphics.clear();
            // Fill with enemy color first
            graphics.fillStyle(color);
            graphics.fillRect(0, 0, 32, 32);
            // Draw thicker white border on top
            graphics.lineStyle(4, 0xffffff);
            graphics.strokeRect(0, 0, 32, 32);
            graphics.generateTexture(`enemy${4-index}`, 32, 32);  // enemy4 is full health, enemy1 is lowest
        });
        
        graphics.destroy();
    }

    createEnemyRow(yPosition) {
        const enemyCount = 8;
        const spacing = 80;
        const startX = (this.game.config.width - (enemyCount - 1) * spacing) / 2;
        
        // Generate a random phase offset for this row
        const phaseOffset = Math.random() * Math.PI * 2;
        
        for (let i = 0; i < enemyCount; i++) {
            const enemy = this.enemies.create(startX + i * spacing, yPosition, 'enemy4');
            enemy.health = 4;  // Set initial health
            enemy.startX = startX + i * spacing;  // Store initial X position
            enemy.startY = yPosition;  // Store initial Y position
            enemy.phaseOffset = phaseOffset;  // Store the phase offset for this enemy
            enemy.lastShot = 0;  // Initialize last shot time
            enemy.shootCooldown = 2000 + Math.random() * 3000;  // Random cooldown between 2-5 seconds
            enemy.setImmovable(true);
            enemy.setData('isFlashing', false);  // Track if enemy is currently flashing
        }
    }

    showWinMessage() {
        const centerX = this.game.config.width / 2;
        const centerY = this.game.config.height / 2;
        
        this.add.text(centerX, centerY, 'YOU WIN!', {
            color: '#ffff00',
            fontSize: '64px',
            fontStyle: 'bold'
        }).setOrigin(0.5);  // Center the text at its position
    }

    showGameOverMessage() {
        const centerX = this.game.config.width / 2;
        const centerY = this.game.config.height / 2;
        
        this.add.text(centerX, centerY, 'GAME OVER', {
            color: '#ff0000',
            fontSize: '64px',
            fontStyle: 'bold'
        }).setOrigin(0.5);  // Center the text at its position
    }

    create() {
        // Create player sprite at the bottom of the screen
        this.player = this.physics.add.sprite(400, 550, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setData('health', 10);
        this.player.setData('isFlashing', false);  // Track if player is currently flashing

        // Setup keyboard controls
        this.cursors = this.input.keyboard.createCursorKeys();

        // Create groups for projectiles and enemies
        this.projectiles = this.physics.add.group();
        this.enemies = this.physics.add.group();
        this.enemyProjectiles = this.physics.add.group();

        // Create initial row of enemies
        this.createEnemyRow(this.ENEMY_START_Y);

        // Initialize enemy movement times
        this.enemyTime = 0;
        this.lastVerticalMove = new Date().getTime();
        this.verticalShiftAmount = 0;

        // Add collision between projectiles and enemies
        this.physics.add.collider(this.projectiles, this.enemies, (projectile, enemy) => {
            projectile.destroy();
            enemy.health--;
            
            if (enemy.health > 0) {
                enemy.setTexture(`enemy${enemy.health}`);
                this.flashSprite(enemy);  // Flash the enemy when hit
            } else {
                enemy.destroy();
            }
        });

        // Add collision between enemy projectiles and player
        this.physics.add.collider(this.player, this.enemyProjectiles, (player, projectile) => {
            projectile.destroy();
            const currentHealth = player.getData('health');
            player.setData('health', currentHealth - 1);
            this.updateHealthDisplay();
            
            if (player.getData('health') <= 0) {
                this.gameOver = true;
                player.setVelocity(0, 0);
                this.showGameOverMessage();
            } else {
                this.flashSprite(player);  // Flash the player when hit
            }
        });

        // Add some instructions
        this.add.text(10, 10, 'Use left/right arrows to move\nPress SPACE to shoot\nHit enemies 4 times to destroy them', { 
            color: '#ffffff',
            fontSize: '18px'
        });

        // Add health display
        this.healthText = this.add.text(10, 560, 'Health: 10', {
            color: '#ffffff',
            fontSize: '24px'
        });

        // Add cooldown for shooting
        this.lastShot = 0;
        this.shootCooldown = 250;

        // Track if game is won or over
        this.gameWon = false;
        this.gameOver = false;
    }

    updateHealthDisplay() {
        this.healthText.setText(`Health: ${this.player.getData('health')}`);
    }

    shoot() {
        const currentTime = new Date().getTime();
        if (currentTime - this.lastShot < this.shootCooldown) return;

        // Create a projectile at player's position
        const projectile = this.projectiles.create(this.player.x, this.player.y - 16, 'projectile');
        projectile.setVelocityY(-600); // Increased projectile speed to 600

        // Remove projectile when it goes off screen
        projectile.checkWorldBounds = true;
        projectile.outOfBoundsKill = true;

        this.lastShot = currentTime;
    }

    enemyShoot(enemy) {
        const currentTime = new Date().getTime();
        if (currentTime - enemy.lastShot < enemy.shootCooldown) return;

        // Create an enemy projectile
        const projectile = this.enemyProjectiles.create(enemy.x, enemy.y + 16, 'enemyProjectile');
        projectile.setVelocityY(300); // Enemy projectiles move downward

        // Remove projectile when it goes off screen
        projectile.checkWorldBounds = true;
        projectile.outOfBoundsKill = true;

        enemy.lastShot = currentTime;
    }

    update() {
        if (this.gameWon || this.gameOver) {
            return;
        }

        // Handle keyboard movement
        const speed = 320;
        
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-speed);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(speed);
        } else {
            this.player.setVelocityX(0);
        }

        // Keep player at constant Y position
        this.player.setVelocityY(0);
        this.player.y = 550;

        // Handle shooting
        if (this.cursors.space.isDown) {
            this.shoot();
        }

        // Update enemy positions and handle enemy shooting
        const currentTime = new Date().getTime();
        this.enemyTime += 0.02;  // Control oscillation speed
        const oscillationAmount = 100;  // Control movement range

        // Check if 3 seconds have passed since last vertical move
        if (currentTime - this.lastVerticalMove >= 3000) {
            this.verticalShiftAmount += 10;
            this.enemies.getChildren().forEach(enemy => {
                enemy.startY += 10;  // Move starting Y position down by 10 pixels
            });
            this.lastVerticalMove = currentTime;
        }

        // Check if 15 seconds have passed to add new row
        if (this.verticalShiftAmount >= 50) {
            this.createEnemyRow(this.ENEMY_START_Y);  // Always create new row at top
            this.verticalShiftAmount = 0;
        }

        // Update enemy positions and handle shooting
        const enemies = this.enemies.getChildren();
        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];
            if (!enemy || !enemy.active) continue;

            // Use the enemy's phase offset in the sine calculation
            enemy.x = enemy.startX + Math.sin(this.enemyTime + enemy.phaseOffset) * oscillationAmount;
            enemy.y = enemy.startY;
            // Set velocity to 0 to prevent physics from interfering with our manual position
            enemy.setVelocity(0, 0);
            // Refresh physics body position
            enemy.body.reset(enemy.x, enemy.y);
            
            // Handle enemy shooting
            this.enemyShoot(enemy);
        }

        // Check if all enemies are destroyed
        if (!this.gameWon && this.enemies.countActive() === 0) {
            this.gameWon = true;
            // Clear all projectiles
            this.enemyProjectiles.getChildren().forEach(proj => proj.destroy());
            this.projectiles.getChildren().forEach(proj => proj.destroy());
            this.showWinMessage();
        }
    }

    flashSprite(sprite) {
        // Don't start a new flash if already flashing
        if (sprite.getData('isFlashing')) return;
        
        sprite.setData('isFlashing', true);
        sprite.setTint(0xffffff);  // White tint
        
        // Create a tween to fade out the flash
        this.tweens.add({
            targets: sprite,
            alpha: 0.5,
            duration: 100,
            yoyo: true,
            repeat: 1,
            onComplete: () => {
                sprite.clearTint();
                sprite.setAlpha(1);
                sprite.setData('isFlashing', false);
            }
        });
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#000000',
    scene: Demo,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    }
};

window.addEventListener('load', () => {
    new Phaser.Game(config);
}); 