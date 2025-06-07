// TrickbitL1.js
// Child scene class extending BasePlatformerScene with level-specific functionality

class TrickbitL1 extends BasePlatformerScene {
    constructor() {
        super("trickbitScene1");
    }

    init() {
        super.init(); // Call parent init 
        this.enemySpawnPoints = [
            { x: 370, y: 850 },      
            { x: 2570, y: 304 }, 
            { x: 2999, y: 144 },
            { x: 3374, y: 816 }, 
            { x: 4655, y: 624 }, 
        ];
    }

    preload() {
        super.preload(); // Call parent preload
    }

    create() {
        // Create the tilemap and layers
        this.createTilemap();
        
        // Create game objects
        this.createLevelObjects();

        // Create enemies
        this.createEnemiesAtCoordinates(this.enemySpawnPoints);
        
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
        // Create game objects using the helper function from parent class createGameObjects()
        this.guideblock = this.createGameObjects("Guide", "guide", 27);
        this.keyobj = this.createGameObjects("Keys", "Key", 96);
        this.door = this.createGameObjects("Doors", "door", 56);
        this.chests = this.createGameObjects("Chests", "chest", 389);
        this.enemies = this.createGameObjects("Enemy", "enemy", 343);
    }

    setupCollisions() {
        // Setup collisions from parent class
        this.setupBaseCollisions();
        this.setupKeyCollision();
        this.setupEnemyCollision();
        this.setupJumpBoosterCollision();
        
        // Level-specific collisions -> Functions below
        this.setupGuideCollision();
    }

    // Guide Block 
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

    update() {
        // Call parent update
        super.update();
        
        // Update Logic (because update is finicky)
        this.updateDoorInteractions();
        this.updateChestInteractions();

        if (Phaser.Input.Keyboard.JustDown(this.coordKey)){
            console.log(my.sprite.player.x, my.sprite.player.y);
        };
    }
}