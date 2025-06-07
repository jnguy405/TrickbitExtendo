// BasePlatformerScene.js
// Parent class containing shared platformer functionality

class BasePlatformerScene extends Phaser.Scene {
    constructor(sceneKey) {
        super(sceneKey);
    }

    init() {
        // Player Physics
        this.initPhysicsConstants();
        
        // Camera Config
        this.initCameraConfig();
        
        // Game State
        this.initGameState();
        
        // Physics World Config
        this.physics.world.TILE_BIAS = 40;
        this.physics.world.gravity.y = this.DOWN_GRAVITY;
        this.physics.world.drawDebug = false;
    }

    initPhysicsConstants() {
        this.ACCELERATION = 4 * 100;    
        this.MAX_SPEED = 2 * 100;         
        this.DECELERATION = 100 * 100;    
        this.AIR_ACCELERATION = this.ACCELERATION * 0.5; 
        this.AIR_DECELERATION = this.DECELERATION * 2; 
        this.DOWN_GRAVITY = 2 * 1000;
        this.BASE_JUMP_HEIGHT = -3 * 200; 
        this.BOOSTED_JUMP_HEIGHT = -6 * 200;
        this.BOOST_DURATION = 2500; 
        this.isJumpBoosted = false;
        this.boostTimer = null;
        this.JUMP_HEIGHT = this.BASE_JUMP_HEIGHT;
        this.PARTICLE_VELOCITY = 50;
    }

    initCameraConfig() {
        this.targetZoom = 3;
        this.targetOffsetX = 0;
        this.currentOffsetX = 0;
        this.offsetLerpSpeed = 0.01;
    }

    initGameState() {
        this.lastStepX = 0;
        this.stepDistance = 64;
        this.playerHealth = 100;
        this.coinsCollected = 0;
        this.lastGuideTrigger = 0;
        this.guideCooldown = 4000;
        this.keyCollected = false;
        // Enemy AI constants
        this.ENEMY_DETECTION_RANGE = 200;
        this.ENEMY_FOLLOW_RANGE = 150;
        this.ENEMY_SPEED = 80;
    }

    preload() {
        this.load.scenePlugin('AnimatedTiles', './lib/AnimatedTiles.js', 'animatedTiles', 'animatedTiles');
    }

    // Object Creation Helper Function
    createGameObjects(layerName, objectName, frameId) {
        const scaleSize = 2.0;
        
        const objects = this.map.createFromObjects(layerName, {
            name: objectName,
            key: "tilemap_sheet",
            frame: frameId
        });
        
        objects.forEach(obj => {
            obj.setScale(scaleSize);
            obj.x = obj.x * scaleSize;
            obj.y = obj.y * scaleSize;

            if (objectName === "key") {
                obj.body.setSize(5, 5);
                obj.body.setOffset(3, 10);
            }

            if (objectName === "chest") {
                obj.interactText = this.add.text(
                    obj.x,
                    obj.y - 30,
                    "Press E",
                    {
                        font: '12px Play',
                        fill: '#FFFFFF',
                        stroke: '#000000',
                        strokeThickness: 2
                    }
                ).setOrigin(0.5).setVisible(false);
            }
            
            // Initialize enemy AI properties
            if (objectName === "enemy") {
                obj.isTargeting = false;
                obj.originalX = obj.x;
                obj.originalY = obj.y;
                obj.lastDirection = 1; // 1 for right, -1 for left
            }
        });
        
        // Enemy Physics
        if (objectName === "enemy") {
            // Enable dynamic physics bodies for enemies from the start
            this.physics.world.enable(objects, Phaser.Physics.Arcade.DYNAMIC_BODY);
            
            objects.forEach(enemy => {
                enemy.body.setSize(enemy.width * 0.8, enemy.height * 0.8);
                enemy.body.setCollideWorldBounds(true);
                enemy.body.setBounce(0.2);
            });
        } else {
            // Enable static physics bodies for non-enemy objects
            this.physics.world.enable(objects, Phaser.Physics.Arcade.STATIC_BODY);
        }
        
        return objects;
    }
    
    // Collision Prop
    setCollision(layer) {
        layer.setCollisionByProperty({
            collides: true
        });
    }

    // Player setup
    setupPlayer() {
        my.sprite.player = this.physics.add.sprite(0, game.config.height/2, "tile_0240.png").setScale(SCALE);
        my.sprite.player.setCollideWorldBounds(true); 
        my.sprite.player.body.setSize(12, 16).setOffset(2, 0);

        // Input setup
        this.chestInteract = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.doorInteract = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
        this.coordKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C);
        cursors = this.input.keyboard.createCursorKeys();
    }

    // Particle systems setup
    setupParticles() {
        // Walking particles
        this.walking = this.add.particles(0, 0, "kenny-particles", {
            frame: ['magic_01.png', 'magic_02.png'],
            scale: {start: 0.01, end: 0.05, random: true},
            lifespan: 300, maxAliveParticles: 6,
            alpha: {start: 1, end: 0.1, gravityY: -400},
        });
        this.walking.stop();

        // Jumping particles
        this.jumping = this.add.particles(0, 0, 'kenny-particles', {
            frame: ['twirl_01.png', 'twirl_02.png'],
            scale: { start: 0.01, end: 0.1 },
            lifespan: 500,  
            maxAliveParticles: 2,
            alpha: { start: 1, end: 0 },
            gravityY: 100,  
            speed: { min: 50, max: 100 },
            angle: { min: -85, max: -95 },  
            emitZone: { source: new Phaser.Geom.Rectangle(-10, 0, 20, 10) }  
        });
        this.jumping.stop();

        // Chest burst particles
        this.chestBurst = this.add.particles(0, 0, 'kenny-particles', {
            frame: ['star_08.png'],
            lifespan: 200,
            speed: {min: 45, max: 80},
            angle: {min: 0, max: 360},
            quantity: 6,
            scale: {start: 0.05, end: 0.0},
            alpha: {start: 1, end: 0},
            rotate: {min: 0, max: 135},
        });
        this.chestBurst.stop();
    }

    // Collision Setups
    setupBaseCollisions() {
        // Base Terrain Collision
        this.physics.add.collider(my.sprite.player, this.baseLayer);
        
        // Enemy Terrain Collision
        if (this.enemies) {
            this.physics.add.collider(this.enemies, this.baseLayer);
        }
        
        // DeathCollision
        this.physics.add.collider(my.sprite.player, this.deathLayer, () => {
            this.sound.play('deaddd', {volume: 0.5});
            this.scene.restart();
        });
    }

    // Key
    setupKeyCollision() {
        this.physics.add.overlap(my.sprite.player, this.keyobj, (obj1, obj2) => {
            this.sound.play('keyyy', {volume: 0.3});
            obj2.destroy();
            this.keyCollected = true;
        });
    }


    // Enemy
    setupEnemyCollision() {
        this.physics.add.collider(my.sprite.player, this.enemies, (player, enemy) => {
            if (!enemy.hasCollided) {
                enemy.hasCollided = true;

                this.sound.play('damage', { volume: 0.2 });
                this.playerHealth -= 20;
                this.playerHealth = Math.max(0, this.playerHealth);

                const healthText = this.add.text(
                    player.x,
                    player.y - 30,
                    `${this.playerHealth}/100`,
                    {
                        font: '16px Play',
                        fill: this.playerHealth < 30 ? '#FF0000' : '#FFFFFF',
                        stroke: '#000000',
                        strokeThickness: 4,
                        fontWeight: 'bold'
                    }
                ).setOrigin(0.5).setScale(0.5);

                this.tweens.add({
                    targets: healthText,
                    scaleX: 1.2,
                    scaleY: 1.2,
                    y: player.y - 60,
                    duration: 200,
                    ease: 'Back.easeOut',
                    yoyo: true,
                    onComplete: () => {
                        this.tweens.add({
                            targets: healthText,
                            y: healthText.y - 40,
                            alpha: 0,
                            duration: 800,
                            onComplete: () => healthText.destroy()
                        });
                    }
                });

                enemy.destroy();

                if (this.playerHealth <= 0) {
                    this.sound.play('deaddd', { volume: 0.5 });
                    this.scene.restart();
                }
            }
        });
    }

    // Jump Booster
    setupJumpBoosterCollision() {
        this.physics.add.collider(my.sprite.player, this.jumpBoosters, (player, booster) => {
            if (!this.isJumpBoosted) {
                this.sound.play('boosted', {volume: 0.1});
                
                const boostText = this.add.text(
                    player.x, 
                    player.y - 40,
                    "uppies!", 
                    { 
                        font: '16px Play', 
                        fill: '#FFFFFF',
                        stroke: '#000000',
                        strokeThickness: 2
                    }
                ).setOrigin(0.5);
                
                this.tweens.add({
                    targets: boostText,
                    y: player.y - 80,  
                    alpha: 0,     
                    duration: 1000,
                    ease: 'Power1',
                    onComplete: () => {
                        boostText.destroy();
                    }
                });

                this.JUMP_HEIGHT = this.BOOSTED_JUMP_HEIGHT;
                this.isJumpBoosted = true;
                this.ACCELERATION = this.ACCELERATION * 0.5;
                this.targetZoom = 2.5;
                
                this.boostTimer = this.time.delayedCall(this.BOOST_DURATION, () => {
                    this.JUMP_HEIGHT = this.BASE_JUMP_HEIGHT;
                    this.ACCELERATION = this.ACCELERATION * 2;
                    this.targetZoom = 3;
                    this.isJumpBoosted = false;
                });
            }
        });
    }

    // Camera Setup
    setupCamera(scaleSize) {
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels * scaleSize, this.map.heightInPixels * scaleSize);
        this.cameras.main.startFollow(my.sprite.player, true, 0.1, 0.1);
        this.cameras.main.setZoom(this.targetZoom);
        this.cameras.main.setDeadzone(200, 50);
        this.cameras.main.setFollowOffset(0, 0);
    }

    // Chest Logic
    updateChestInteractions() {
        this.chests.forEach(chest => {
            if (!chest.active) return;
            
            const distance = Phaser.Math.Distance.Between(
                my.sprite.player.x, my.sprite.player.y,
                chest.x, chest.y
            );
            
            chest.isNearPlayer = distance < 60;
            chest.interactText.setVisible(chest.isNearPlayer);
            
            // Handle chest opening directly within the interaction check
            if (chest.isNearPlayer && Phaser.Input.Keyboard.JustDown(this.chestInteract)) {
                // Check if chest is already opened
                if (chest.frame.name !== 390) { 
                    const chestX = chest.x;
                    const chestY = chest.y;
                    
                    // Open the chest
                    chest.setTexture("tilemap_sheet", 390);
                    this.sound.play('chestie', {volume: 0.3});
                    this.coinsCollected += 1;

                    // Remove interact text
                    if (chest.interactText) {
                        chest.interactText.destroy();
                    }
                    
                    // Start particle effect
                    this.chestBurst.setPosition(chest.x, chest.y);
                    this.chestBurst.start();
                    
                    // Create +1 text animation
                    const plusOneText = this.add.text(
                        chestX, 
                        chestY - 40,
                        "+1", 
                        { 
                            font: '16px Play', 
                            fill: '#FFFFFF',
                            stroke: '#000000',
                            strokeThickness: 2
                        }
                    ).setOrigin(0.5);
                        
                    this.tweens.add({
                        targets: plusOneText,
                        y: chestY - 80,  
                        alpha: 0,     
                        duration: 1000,
                        ease: 'Power1',
                        onComplete: () => {
                            plusOneText.destroy();
                        }
                    });

                    // Clean up chest after delay
                    this.time.delayedCall(1000, () => {
                        chest.destroy();
                        this.chestBurst.stop();
                    });
                }
            }
        });
    }

    // Player Movement Logic
    updatePlayerMovement() {
        let onGround = my.sprite.player.body.blocked.down;
        let currentAcceleration = onGround ? this.ACCELERATION : this.AIR_ACCELERATION;
        let currentDeceleration = onGround ? this.DECELERATION : this.AIR_DECELERATION;

        // Footstep Sound logic
        if (onGround && (cursors.left.isDown || cursors.right.isDown)) {
            if (Math.abs(my.sprite.player.x - this.lastStepX) >= this.stepDistance) {
                this.sound.play('walkie', { volume: 1.5 });
                this.lastStepX = my.sprite.player.x;
            }
        }

        // Movement logic
        if (cursors.left.isDown) {
            my.sprite.player.body.setAccelerationX(-currentAcceleration);
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);
            this.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);
            this.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);
            this.walking.start();
            if (my.sprite.player.body.velocity.x < -this.MAX_SPEED) {
                my.sprite.player.body.velocity.x = -this.MAX_SPEED;
            }
        } 
        else if (cursors.right.isDown) {
            my.sprite.player.body.setAccelerationX(currentAcceleration);
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);
            this.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);
            this.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);
            this.walking.start();
            if (my.sprite.player.body.velocity.x > this.MAX_SPEED) {
                my.sprite.player.body.velocity.x = this.MAX_SPEED;
            }
        } 
        else {
            this.physics.world.collide(my.sprite.player, this.deathLayer);  
            my.sprite.player.body.setAccelerationX(0);
            my.sprite.player.body.setDragX(currentDeceleration);
            this.walking.stop();
            if (onGround) {
                my.sprite.player.anims.play('idle');
            }
        }

        // Jump handling
        if (my.sprite.player.body.blocked.down) {
            this.jumping.stop();
            if (Phaser.Input.Keyboard.JustDown(cursors.up)) {
                this.sound.play('jumpy', {volume: 0.1});
                my.sprite.player.body.setVelocityY(this.JUMP_HEIGHT);
                this.jumping.startFollow(my.sprite.player, 0, my.sprite.player.displayHeight / 2, false);
                this.jumping.start();
            }
        } else {
            my.sprite.player.anims.play('jump');
        }
    }

    // Camera Update Logic
    updateCamera() {
        if (cursors.left.isDown) {
            this.targetOffsetX = -50;
        } else if (cursors.right.isDown) {
            this.targetOffsetX = 50;
        } else {
            this.targetOffsetX = 0;
        }

        this.currentOffsetX = Phaser.Math.Linear(
            this.currentOffsetX, 
            this.targetOffsetX, 
            this.offsetLerpSpeed
        );

        this.cameras.main.setFollowOffset(this.currentOffsetX, 0);
        
        let zoomSpeed;
        if (this.isJumpBoosted) {
            zoomSpeed = 0.003;
        } else {
            const currentZoom = this.cameras.main.zoom;
            const zoomDifference = Math.abs(currentZoom - this.targetZoom);
            
            if (zoomDifference > 0.1) {
                zoomSpeed = 0.05;
            } else {
                zoomSpeed = 0.001;
            }
        }
        this.cameras.main.setZoom(Phaser.Math.Linear(this.cameras.main.zoom, this.targetZoom, zoomSpeed));
    }

    // Base Update
    update() {
        this.updatePlayerMovement();
        this.updateCamera();
        this.updateEnemyAI();
    }

    createEnemiesAtCoordinates(coordinates) {
        if (!coordinates || coordinates.length === 0) return [];
        
        const enemies = [];
        
        coordinates.forEach(coord => {
            // Create enemy sprite at specified coordinates
            const enemy = this.physics.add.sprite(coord.x, coord.y, "tile_0340.png");
            enemy.setScale(2.0);
            
            // Enemy AI properties
            enemy.isTargeting = false;
            enemy.originalX = coord.x;
            enemy.originalY = coord.y;
            enemy.lastDirection = 1; // 1 for right, -1 for left
            enemy.hasCollided = false;
            
            // Physics
            enemy.body.setSize(enemy.width * 0.8, enemy.height * 0.8);
            enemy.body.setCollideWorldBounds(true);
            enemy.body.setBounce(0.2);
            
            // Enemy Fall Speed
            enemy.body.setGravityY(this.ENEMY_GRAVITY);
            
            // Start with idle animation
            enemy.anims.play('still', true);
            
            enemies.push(enemy);
        });
        
        // Phaser Group for Enemy
        this.enemies = this.physics.add.group(enemies);
        
        return enemies;
    }

    // Enemy AI/ Pathfinding
    updateEnemyAI() {
        if (!this.enemies || !my.sprite.player) return;
        
        this.enemies.children.entries.forEach(enemy => {
            if (!enemy.active) return;
            
            const distanceToPlayer = Phaser.Math.Distance.Between(
                enemy.x, enemy.y,
                my.sprite.player.x, my.sprite.player.y
            );
            
            // Check if player is in detection range
            if (distanceToPlayer <= this.ENEMY_DETECTION_RANGE && !enemy.isTargeting) {
                enemy.isTargeting = true;
            }
            
            // Check if player is out of follow range
            if (distanceToPlayer > this.ENEMY_FOLLOW_RANGE && enemy.isTargeting) {
                enemy.isTargeting = false;
                enemy.body.setVelocityX(0);
                enemy.body.setVelocityY(0);
                enemy.anims.play('still', true);
            }
            
            // Move towards player if targeting
            if (enemy.isTargeting) {
                const directionX = my.sprite.player.x - enemy.x;
                const directionY = my.sprite.player.y - enemy.y;
                
                // Normalize direction and apply speed
                const magnitude = Math.sqrt(directionX * directionX + directionY * directionY);
                if (magnitude > 0) {
                    const normalizedX = directionX / magnitude;
                    const normalizedY = directionY / magnitude;
                    
                    // Check for edge detection
                    const edgeCheckDistance = 32; // Distance to check ahead
                    const checkX = enemy.x + (normalizedX > 0 ? edgeCheckDistance : -edgeCheckDistance);
                    const checkY = enemy.y + 32; // Check below the enemy
                    
                    // Get tile at the check position
                    const tileBelow = this.baseLayer.getTileAtWorldXY(checkX, checkY);
                    
                    // If there's no tile below the next position, don't move horizontally
                    if (!tileBelow && enemy.body.blocked.down) {
                        // Stop horizontal movement to avoid falling
                        enemy.body.setVelocityX(0);
                        // Only move vertically if needed
                        if (Math.abs(normalizedY) > 0.3) {
                            enemy.body.setVelocityY(normalizedY * this.ENEMY_SPEED * 0.5);
                        }
                    } else {
                        // Safe to move normally
                        enemy.body.setVelocityX(normalizedX * this.ENEMY_SPEED);
                        if (Math.abs(normalizedY) > 0.3) {
                            enemy.body.setVelocityY(normalizedY * this.ENEMY_SPEED * 0.5);
                        }
                    }
                    
                    // Play movement animation
                    enemy.anims.play('scurry', true);
                    
                    // Flip sprite based on movement direction
                    if (normalizedX > 0) {
                        enemy.setFlipX(false);
                        enemy.lastDirection = 1;
                    } else if (normalizedX < 0) {
                        enemy.setFlipX(true);
                        enemy.lastDirection = -1;
                    }
                }
            } else {
                // Gradually slow down when not targeting
                const currentVelX = enemy.body.velocity.x;
                const currentVelY = enemy.body.velocity.y;
                
                enemy.body.setVelocityX(currentVelX * 0.9);
                enemy.body.setVelocityY(currentVelY * 0.9);
                
                // Stop completely if velocity is very low
                if (Math.abs(enemy.body.velocity.x) < 5 && Math.abs(enemy.body.velocity.y) < 5) {
                    enemy.body.setVelocityX(0);
                    enemy.body.setVelocityY(0);
                    enemy.anims.play('still', true);
                }
            }
        });
    }
}