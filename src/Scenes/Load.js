class Load extends Phaser.Scene {
    constructor() {
        super("loadScene");
    }

    preload() {
        this.load.setPath("./assets/");

        // Load character tiles
        this.load.setPath("./assets/");
        this.load.image("tile_0240.png", "tile_0240.png");
        this.load.image("tile_0241.png", "tile_0241.png");
        this.load.image("tile_0242.png", "tile_0242.png");
        this.load.image("tile_0243.png", "tile_0243.png");
        this.load.image("tile_0244.png", "tile_0244.png");
        this.load.image("tile_0245.png", "tile_0245.png");
        this.load.image("tile_0246.png", "tile_0246.png");
        this.load.audio("walkie", "audio/Grass_hit4.ogg");
        this.load.audio("jumpy", "audio/phaseJump3.ogg");
        this.load.audio("chestie", "audio/powerUp2.ogg");
        this.load.audio("keyyy", "audio/powerUp9.ogg");
        this.load.audio("damage", "audio/zap2.ogg");
        this.load.audio("deaddd", "audio/phaserDown1.ogg");
        this.load.audio("switch", "audio/switch3.ogg");
        this.load.audio("boosted", "audio/threeTone1.ogg");
        this.load.audio("doorOpen", "audio/switch9.ogg");

        // Load tilemap information
        this.load.image("tilemap_tiles", "monochrome_tilemap_packed.png");          // Packed tilemap
        this.load.tilemapTiledJSON("Trickbit-level-1", "Trickbit-level-1.tmj");     // Tilemap in JSON
        this.load.spritesheet("tilemap_sheet", "monochrome_tilemap_packed.png", {
            frameWidth: 16,
            frameHeight: 16
        });
        this.load.multiatlas("kenny-particles", "kenny-particles.json");
    }

    create() {
        this.anims.create({
            key: 'walk',
            frames: [
                { key: "tile_0241.png" },
                { key: "tile_0242.png" },
                { key: "tile_0243.png" },
            ],
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'idle',
            frames: [
                { key: "tile_0240.png" }
            ],
            repeat: -1
        });

        this.anims.create({
            key: 'jump',
            frames: [
                { key: "tile_0244.png" }
            ]
        });
         // ...and pass to the next Scene
         this.scene.start("trickbitScene");
    }

    update() {
    }
}