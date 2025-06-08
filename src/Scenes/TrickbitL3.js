class TrickbitL3 extends BasePlatformerScene {
    constructor() {
        super("trickbitScene3");
    }

    init() {
        super.init(); // Call parent init 
        
        // Level 3 specific key system
        this.keysCollected = 0;
        this.keysRequired = 3;
        this.collectedKeyIds = [];

        this.enemySpawnPoints = [
            { x: 1648, y: 720 },      
            { x: 2299, y: 336 }, 
            { x: 2732, y: 112 },
            { x: 2545, y: 976 }, 
            { x: 3312, y: 816 },
            { x: 3640, y: 720 },
            { x: 2794, y: 624 }, 
            { x: 2309, y: 752 },
            { x: 1970, y: 656 },
            { x: 4231, y: 272 },
            { x: 3546, y: 336 },
            { x: 4755, y: 784 },
        ];
    }

    preload() {
        super.preload();
    }

    create() {
        // Create the tilemap and layers
        this.createTilemap();
        
        // Create game objects
        this.createLevelObjects();

        // Create enemies
        this.createEnemiesAtCoordinates(this.enemySpawnPoints);
        
        // Level Title
        this.showLevelNameTypewriter("Admin Authorization");

        // Setup player and particles
        this.setupPlayer();
        this.setupParticles();
        
        // Setup collisions and interactions
        this.setupCollisions();
        
        // Setup camera
        this.setupCamera(2.0);
        
        // Create key progress UI
        this.createKeyProgressUI();
        
        // Initialize animated tiles
        this.animatedTiles.init(this.map);
    }

    createTilemap() {
        // 16x16 tiles 160W 32H map (for scale = 2: 5120W 1024H px canvas)
        this.map = this.add.tilemap("Trickbit-level-3", 16, 16, 160, 32);
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
        // Create game objects using the helper function from parent class createGameObjects()
        this.keyobj = this.createGameObjects("Keys", "key", 96);
        this.door = this.createGameObjects("Doors", "door", 56);
        this.chests = this.createGameObjects("Chests", "chest", 389);
        this.enemies = this.createGameObjects("Enemy", "enemy", 343);
        
        // Assign unique IDs to keys for Level 3
        if (this.keyobj && this.keyobj.length > 0) {
            this.keyobj.forEach((key, index) => {
                key.keyId = `level3_key_${index}`;
            });
        }
    }

    setupCollisions() {
        // Setup collisions from parent class
        this.setupBaseCollisions();
        this.setupLevel3KeyCollision(); // Use Level 3 specific key collision
        this.setupEnemyCollision();
        this.setupJumpBoosterCollision();
    }

    // Level 3 specific key collision system
    setupLevel3KeyCollision() {
        this.physics.add.overlap(my.sprite.player, this.keyobj, (obj1, obj2) => {
            // Check if this specific key hasn't been collected yet
            if (!this.collectedKeyIds.includes(obj2.keyId)) {
                this.sound.play('keyyy', {volume: 0.3});
                
                // Add key to collected list
                this.collectedKeyIds.push(obj2.keyId);
                this.keysCollected++;
                
                // Update legacy keyCollected for backwards compatibility
                this.keyCollected = this.keysCollected >= this.keysRequired;
                
                // Show collection feedback
                this.showKeyCollectionFeedback(obj2);
                
                // Update UI
                this.updateKeyProgressUI();
                
                obj2.destroy();
            }
        });
    }

    // Show key collection feedback
    showKeyCollectionFeedback(keyObject) {
        const keyText = this.add.text(
            keyObject.x,
            keyObject.y - 40,
            `Key ${this.keysCollected}/${this.keysRequired}`,
            {
                font: '16px Play',
                fill: '#FFD700',
                stroke: '#000000',
                strokeThickness: 2,
                fontWeight: 'bold'
            }
        ).setOrigin(0.5);

        this.tweens.add({
            targets: keyText,
            y: keyObject.y - 80,
            alpha: 0,
            scale: 1.2,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => keyText.destroy()
        });
    }

    // Level 3 specific door interaction (requires 3 keys)
    updateLevel3DoorInteractions() {
        this.door.forEach(door => {
            if (!door.active) return;
            
            const distance = Phaser.Math.Distance.Between(
                my.sprite.player.x, my.sprite.player.y,
                door.x, door.y
            );
            
            door.isNearPlayer = distance < 80;
            
            // Create interact text if it doesn't exist
            if (!door.interactText) {
                door.interactText = this.add.text(
                    door.x - 20, 
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
            
            // Show/hide interact text based on distance
            door.interactText.setVisible(door.isNearPlayer);
            
            // Handle door interaction
            if (door.isNearPlayer && Phaser.Input.Keyboard.JustDown(this.doorInteract)) {
                if (this.keysCollected >= this.keysRequired) {
                    // Player has enough keys - open the door
                    if (door.frame && door.frame.name !== 58) { 
                        door.setTexture("tilemap_sheet", 58);
                        this.sound.play("doorOpen");
                        door.interactText.destroy();
                        
                        // Success message
                        const successText = this.add.text(
                            my.sprite.player.x, 
                            my.sprite.player.y - 50, 
                            "Door Unlocked!", 
                            { 
                                font: '18px Play', 
                                fill: '#00FF00',
                                stroke: '#000000',
                                strokeThickness: 2,
                                fontWeight: 'bold'
                            }
                        ).setOrigin(0.5);
                        
                        this.tweens.add({
                            targets: successText,
                            y: my.sprite.player.y - 80,
                            alpha: 0,
                            scale: 1.3,
                            duration: 1000,
                            onComplete: () => successText.destroy()
                        });
                        
                        this.time.delayedCall(500, () => {
                            this.scene.start('winScene');
                        });
                    }
                } else {
                    // Player doesn't have enough keys - show message
                    if (!this.keyNeededText) {
                        const keysNeeded = this.keysRequired - this.keysCollected;
                        this.keyNeededText = this.add.text(
                            my.sprite.player.x, 
                            my.sprite.player.y - 30, 
                            `Need ${keysNeeded} more key${keysNeeded > 1 ? 's' : ''}!\n(${this.keysCollected}/${this.keysRequired})`, 
                            { 
                                font: '16px Play', 
                                fill: '#FF6666',
                                stroke: '#000000',
                                strokeThickness: 2,
                                align: 'center'
                            }
                        ).setOrigin(0.5);
                        
                        this.time.addEvent({
                            delay: 2000,
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

    // Create UI display for key progress
    createKeyProgressUI() {
        this.keyProgressText = this.add.text(
            20, 20, 
            `Keys: ${this.keysCollected}/${this.keysRequired}`, 
            {
                font: '16px Play',
                fill: '#FFFFFF',
                stroke: '#000000',
                strokeThickness: 2,
                backgroundColor: '#000044',
                padding: { x: 10, y: 5 }
            }
        ).setScrollFactor(0).setDepth(1000);
    }

    // Update the key progress UI
    updateKeyProgressUI() {
        if (this.keyProgressText) {
            const color = this.keysCollected >= this.keysRequired ? '#00FF00' : '#FFFFFF';
            this.keyProgressText.setText(`Keys: ${this.keysCollected}/${this.keysRequired}`);
            this.keyProgressText.setFill(color);
        }
    }

    update() {
        // Call parent update
        super.update();
        
        // Update Level 3 specific interactions
        this.updateChestInteractions();
        this.updateLevel3DoorInteractions(); // Use Level 3 specific door interactions
        
        if (Phaser.Input.Keyboard.JustDown(this.coordKey)){
            console.log(my.sprite.player.x, my.sprite.player.y);
        };
    }
}