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
        });
        
        this.physics.world.enable(objects, Phaser.Physics.Arcade.STATIC_BODY);
        return objects;
    }

    setCollision(layer) {
        layer.setCollisionByProperty({
            collides: true
        });
    }

    // Player setup - common across all levels
    setupPlayer() {
        my.sprite.player = this.physics.add.sprite(0, game.config.height/2, "tile_0240.png").setScale(SCALE);
        my.sprite.player.setCollideWorldBounds(true); 
        my.sprite.player.body.setSize(12, 16).setOffset(2, 0);

        // Input setup
        this.chestInteract = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.doorInteract = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
        cursors = this.input.keyboard.createCursorKeys();

        // Debug key
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
            this.physics.world.debugGraphic.clear()
        }, this);
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

    // Common collision setups
    setupBaseCollisions() {
        // Base terrain collision
        this.physics.add.collider(my.sprite.player, this.baseLayer);
        
        // Death collision
        this.physics.add.collider(my.sprite.player, this.deathLayer, () => {
            this.sound.play('deaddd', {volume: 0.5});
            this.scene.restart();
        });
    }

    // Camera setup
    setupCamera(scaleSize) {
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels * scaleSize, this.map.heightInPixels * scaleSize);
        this.cameras.main.startFollow(my.sprite.player, true, 0.1, 0.1);
        this.cameras.main.setZoom(this.targetZoom);
        this.cameras.main.setDeadzone(200, 50);
        this.cameras.main.setFollowOffset(0, 0);
    }

    // Common interaction methods
    openChest(chest) {
        const chestX = chest.x;
        const chestY = chest.y;
        if (chest.frame.name !== 390) { 
            chest.setTexture("tilemap_sheet", 390);
            this.sound.play('chestie', {volume: 0.3});
            this.coinsCollected += 1;

            if (chest.interactText) {
                chest.interactText.destroy();
            }
            
            this.chestBurst.setPosition(chest.x, chest.y);
            this.chestBurst.start();
            
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

            this.time.delayedCall(1000, () => {
                chest.destroy();
                this.chestBurst.stop();
            });
        }
    }

    // Common player movement update logic
    updatePlayerMovement() {
        let onGround = my.sprite.player.body.blocked.down;
        let currentAcceleration = onGround ? this.ACCELERATION : this.AIR_ACCELERATION;
        let currentDeceleration = onGround ? this.DECELERATION : this.AIR_DECELERATION;

        // Footstep sound logic
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

    // Camera update logic
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

    update() {
        this.updatePlayerMovement();
        this.updateCamera();
    }
}