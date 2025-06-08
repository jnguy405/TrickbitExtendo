class TrickbitL2 extends BasePlatformerScene {
    constructor() {
        super("trickbitScene2");
    }

    init() {
        super.init(); // Call parent init 
        this.enemySpawnPoints = [
            { x: 620, y: 752 },      
            { x: 1770, y: 720 }, 
            { x: 2898, y: 304 },
            { x: 3034, y: 880 }, 
            { x: 4015, y: 592 },
            { x: 4387, y: 944 },
            { x: 4965, y: 656 }, 
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
        this.showLevelNameTypewriter("Error 404");

        // Setup player and particles
        this.setupPlayer();
        this.setupParticles();
        
        // Setup collisions and interactions
        this.setupCollisions();
        
        // Setup falling bridge collision with player
        this.physics.add.collider(my.sprite.player, this.fallingBrid, (player, bridge) => {
            // Only trigger once per bridge block
            if (bridge.hasTriggered || bridge.isFalling) {
                return;
            }
            
            bridge.hasTriggered = true;
            bridge.isFalling = true;
            
            // Store the original position and calculate target Y
            bridge.originalY = bridge.y;
            bridge.targetY = bridge.y + 800; // Adjust fall distance as needed
            
            // Add a small delay before the bridge starts falling for dramatic effect
            this.time.delayedCall(100, () => {
                this.tweens.add({
                    targets: bridge,
                    x: bridge.x + Phaser.Math.Between(-2, 2),
                    duration: 50,
                    yoyo: true,
                    repeat: 3,
                    ease: 'Power2'
                });
                
                // Start the falling tween
                this.tweens.add({
                    targets: bridge,
                    y: bridge.targetY,
                    duration: 2000, // 2 seconds to fall - adjust as needed
                    ease: 'Quad.easeIn', // Accelerating fall for realism
                    onUpdate: () => {
                        // Update the physics body position to match the visual position
                        if (bridge.body) {
                            bridge.body.updateFromGameObject();
                        }
                    },
                    onComplete: () => {
                        // Destroy the bridge when it reaches the target
                        if (bridge.active) {
                            bridge.destroy();
                        }
                    }
                });
            });
        });
        
        this.physics.add.collider(my.sprite.player, this.fallingPlat, (player, platform) => {
            // Only trigger once per platform block
            if (platform.hasTriggered || platform.isFalling) {
                return;
            }
            
            platform.hasTriggered = true;
            platform.isFalling = true;
            
            // Store the original position and calculate target Y
            platform.originalY = platform.y;
            platform.targetY = platform.y + 1000; // fall distance
            
            // Small Delay
            this.time.delayedCall(800, () => {
                // Shaking
                this.tweens.add({
                    targets: platform,
                    x: platform.x + Phaser.Math.Between(-2, 2),
                    duration: 50,
                    yoyo: true,
                    repeat: 3,
                    ease: 'Power2'
                });
                
                // Falling Animation
                this.tweens.add({
                    targets: platform,
                    y: platform.targetY,
                    duration: 2000, // 2 seconds to fall
                    ease: 'Quad.easeIn',
                    onUpdate: () => {
                        // Update the hitbox to match the platform tile while falling
                        if (platform.body) {
                            platform.body.updateFromGameObject();
                        }
                    },
                    onComplete: () => {
                        // Destroy the platform when it reaches the target
                        if (platform.active) {
                            platform.destroy();
                        }
                    }
                });
            });
        });
        
        // Setup camera
        this.setupCamera(2.0);
        
        // Initialize animated tiles
        this.animatedTiles.init(this.map);
    }

    createTilemap() {
        // 16x16 tiles 160W 32H map (for scale = 2: 5120W 1024H px canvas)
        this.map = this.add.tilemap("Trickbit-level-2", 16, 16, 160, 32);
        this.tileset = this.map.addTilesetImage("kenny_tilemap_packed", "tilemap_tiles");

        const scaleSize = 2.0;
        
        // Create layers
        this.baseLayer = this.map.createLayer("Base", this.tileset, 0, 0).setScale(scaleSize);
        this.miscLayer = this.map.createLayer("Misc", this.tileset, 0, 0).setScale(scaleSize);
        this.deathLayer = this.map.createLayer("Death", this.tileset, 0, 0).setScale(scaleSize);
        this.jumpBoosters = this.map.createLayer("Booster", this.tileset, 0, 0).setScale(scaleSize);
        this.pipesLayer = this.map.createLayer("Pipes", this.tileset, 0, 0).setScale(scaleSize);

        // Set collision properties
        this.setCollision(this.baseLayer);
        this.setCollision(this.deathLayer);
        this.setCollision(this.jumpBoosters);
    }

    createLevelObjects() {
        // Create game objects using the helper function from parent class createGameObjects()
        this.door = this.createGameObjects("Doors", "door", 56);
        this.fallingBrid = this.createGameObjects("FallingBridge", "bridge", 161);
        this.fallingPlat = this.createGameObjects("FallingPlatforms", "plat", 333);
        this.chests = this.createGameObjects("Chests", "chest", 389);
        this.enemies = this.createGameObjects("Enemy", "enemy", 343);

        // Initialize falling bridge properties
        if (this.fallingBrid && this.fallingBrid.length > 0) {
            this.fallingBrid.forEach(bridge => {
                bridge.hasTriggered = false; // Track if this bridge has been triggered
                bridge.isFalling = false;    // Track if this bridge is currently falling
                bridge.originalY = bridge.y; // Store original position
            });
        } 
        
        // Initialize falling platform properties
        if (this.fallingPlat && this.fallingPlat.length > 0) {
            this.fallingPlat.forEach(platform => {
                platform.hasTriggered = false; // Track if this platform has been triggered
                platform.isFalling = false;    // Track if this platform is currently falling
                platform.originalY = platform.y; // Store original position
            });
        }
    }

    setupCollisions() {
        // Setup collisions from parent class
        this.setupBaseCollisions();
        this.setupJumpBoosterCollision();
        this.setupEnemyCollision();
    }

    openDoor() {
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
                    door.x -20, 
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
                if (door.frame && door.frame.name !== 58) { 
                        door.setTexture("tilemap_sheet", 58);
                        this.sound.play("doorOpen");
                        door.interactText.destroy();
                        
                        this.time.delayedCall(500, () => {
                            this.scene.start('trickbitScene3');
                        });
                }
            }
        });
    }

    update() {
        // Call parent update
        super.update();
        
        // Update Logic (because update is finicky)
        this.updateChestInteractions();
        this.openDoor(); // no key required
    }
}