class TrickbitL2 extends BasePlatformerScene {
    constructor() {
        super("trickbitScene2");
    }

    init() {
        super.init(); // Call parent init 
    }

    preload() {
        super.preload();
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
        this.physics.add.collider(my.sprite.player, this.fallingBrid);
        this.physics.add.collider(my.sprite.player, this.fallingPlat);
        
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
    }

    setupCollisions() {
        // Setup collisions from parent class
        this.setupBaseCollisions();
        this.setupJumpBoosterCollision();
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
                            this.scene.start('winScene');
                        });
                }
            }
        });
    }

    update() {
        // Call parent update
        super.update();
        
        // Update Logic (because update is finicky)
        this.openDoor();

        if (Phaser.Input.Keyboard.JustDown(this.coordKey)){
            console.log(my.sprite.player.x, my.sprite.player.y);
        };
    }
}