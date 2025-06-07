// TrickbitL1.js
// Child scene class extending BasePlatformerScene with level-specific functionality

class TrickbitL1 extends BasePlatformerScene {
    constructor() {
        super("trickbitScene1");
    }

    init() {
        super.init(); // Call parent init 
    }

    preload() {
        super.preload(); // Call parent preload 
    }

    create() {
        // Create the tilemap and layers
        this.createTilemap();
        
        // Create game objects
        this.createLevelObjects();
        
        // Setup player and particles
        this.setupPlayer();
        this.setupParticles();
        
        // Setup collisions and interactions
        this.setupCollisions();
        
        // Setup camera
        this.setupCamera(2.0);
        
        // Initialize animated tiles
        this.animatedTiles.init(this.map);
    }

    createTilemap() {
        // 16x16 tiles 160W 32H map (for scale = 2: 5120W 1024H px canvas)
        this.map = this.add.tilemap("Trickbit-level-1", 16, 16, 160, 32);
        this.tileset = this.map.addTilesetImage("kenny_tilemap_packed", "tilemap_tiles");

        const scaleSize = 2.0;
        
        // Create layers
        this.baseLayer = this.map.createLayer("Base", this.tileset, 0, 0).setScale(scaleSize);
        this.pipesLayer = this.map.createLayer("Pipes", this.tileset, 0, 0).setScale(scaleSize);
        this.miscLayer = this.map.createLayer("Misc", this.tileset, 0, 0).setScale(scaleSize);
        this.deathLayer = this.map.createLayer("Death", this.tileset, 0, 0).setScale(scaleSize);
        this.jumpBoosters = this.map.createLayer("Booster", this.tileset, 0, 0).setScale(scaleSize);

        // Set collision properties
        this.setCollision(this.baseLayer);
        this.setCollision(this.deathLayer);
        this.setCollision(this.jumpBoosters);
    }

    createLevelObjects() {
        // Create game objects using the helper function from parent class
        this.guideblock = this.createGameObjects("Guide", "guide", 27);
        this.keyobj = this.createGameObjects("Keys", "Key", 96);
        this.door = this.createGameObjects("Doors", "door", 56);
        this.chests = this.createGameObjects("Chests", "chest", 389);
        this.enemies = this.createGameObjects("Enemy", "enemy", 343);
    }

    setupCollisions() {
        // Setup base collisions from parent class
        this.setupBaseCollisions();
        
        // Level-specific collisions
        this.setupGuideCollision();
        this.setupKeyCollision();
        this.setupDoorCollision();
        this.setupEnemyCollision();
        this.setupJumpBoosterCollision();
    }

    setupGuideCollision() {
        this.physics.add.collider(my.sprite.player, this.guideblock, (player, block) => {
            const now = Date.now();
            
            if (now - this.lastGuideTrigger >= this.guideCooldown) {
                this.lastGuideTrigger = now;
                
                if (block.frame && block.frame.name === 27) {
                    block.setTexture("tilemap_sheet", 7);
                }
                
                this.sound.play('switch');
                const guideText = this.add.text(
                    block.x, 
                    block.y - 50, 
                    'Find the key to unlock the door!', 
                    { 
                        font: '16px Play', 
                        fill: '#FFFFFF',
                        stroke: '#000000',
                        strokeThickness: 2,
                        fontWeight: 'bold',
                        alpha: 0
                    }
                ).setOrigin(0.5).setScale(0.5);
                
                this.tweens.add({
                    targets: guideText,
                    alpha: 1,
                    scaleX: 1,
                    scaleY: 1,
                    x: block.x + 50,
                    y: block.y - 40,
                    duration: 500,
                    ease: 'Back.easeOut',
                    onComplete: () => {
                        this.time.delayedCall(3000, () => {
                            block.setTexture("tilemap_sheet", 27);
                            this.tweens.add({
                                targets: guideText,
                                alpha: 0,
                                y: guideText.y - 40,
                                duration: 1000,
                                onComplete: () => guideText.destroy()
                            });
                        });
                    }
                });
            }
        });
    }

    setupKeyCollision() {
        this.physics.add.overlap(my.sprite.player, this.keyobj, (obj1, obj2) => {
            this.sound.play('keyyy', {volume: 0.3});
            obj2.destroy();
            this.keyCollected = true;
        });
    }

    setupDoorCollision() {
        this.physics.add.collider(my.sprite.player, this.door, (player, door) => {
            if (!door.interactText) {
                door.interactText = this.add.text(
                    door.x, 
                    door.y - 40, 
                    "Press F", 
                    { 
                        font: '12px Play', 
                        fill: '#FFFFFF',
                        stroke: '#000000',
                        strokeThickness: 2
                    }
                ).setOrigin(0.5).setVisible(false);
            }
            
            const distance = Phaser.Math.Distance.Between(
                player.x, player.y,
                door.x, door.y
            );
            door.isNearPlayer = distance < 80;
            door.interactText.setVisible(door.isNearPlayer);
            
            if (door.isNearPlayer && Phaser.Input.Keyboard.JustDown(this.doorInteract)) {
                if (this.keyCollected) {
                    if (door.frame && door.frame.name !== 58) { 
                        door.setTexture("tilemap_sheet", 58);
                        this.sound.play("doorOpen");
                        door.interactText.destroy();
                        
                        this.time.delayedCall(500, () => {
                            this.scene.start('winScene');
                        });
                    }
                } else {
                    if (!this.keyNeededText) {
                        this.keyNeededText = this.add.text(
                            player.x, 
                            player.y - 30, 
                            "Key needed!", 
                            { font: '16px Play', fill: '#ffffff' }
                        ).setOrigin(0.5);
                        
                        this.time.addEvent({
                            delay: 1500,
                            callback: () => {
                                if (this.keyNeededText) {
                                    this.keyNeededText.destroy();
                                    this.keyNeededText = null;
                                }
                            },
                            callbackScope: this
                        });
                    }
                }
            }
        });
    }

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

    update() {
        super.update();
        
        // Level-specific update logic
        this.updateDoorInteractions();
        this.updateChestInteractions();
    }

    updateDoorInteractions() {
        this.door.forEach(door => {
            if (!door.active) return;
            
            const distance = Phaser.Math.Distance.Between(
                my.sprite.player.x, my.sprite.player.y,
                door.x, door.y
            );
            
            door.isNearPlayer = distance < 80;
            if (door.interactText) {
                door.interactText.setVisible(door.isNearPlayer);
            }
        });
    }

    updateChestInteractions() {
        this.chests.forEach(chest => {
            if (!chest.active) return;
            
            const distance = Phaser.Math.Distance.Between(
                my.sprite.player.x, my.sprite.player.y,
                chest.x, chest.y
            );
            
            chest.isNearPlayer = distance < 60;
            chest.interactText.setVisible(chest.isNearPlayer);
            
            if (chest.isNearPlayer && Phaser.Input.Keyboard.JustDown(this.chestInteract)) {
                this.openChest(chest);
            }
        });
    }
}