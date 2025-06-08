// GuideScene.js
// Game guide/instructions screen

class GuideScene extends Phaser.Scene {
    constructor() {
        super("guideScene");
    }

    create() {
        // Create background rectangle (starts from left)
        this.background = this.add.rectangle(
            -this.cameras.main.width / 2,
            this.cameras.main.centerY,
            this.cameras.main.width,
            this.cameras.main.height,
            0x1A0A0A
        ).setOrigin(0.5);
        
        // Create title (initially hidden)
        this.titleText = this.add.text(
            this.cameras.main.centerX,
            100,
            'HOW TO PLAY',
            {
                fontFamily: 'Play',
                fontSize: '120px',
                color: '#ff0000',
                stroke: '#000000',
                strokeThickness: 6
            }
        ).setOrigin(0.5).setAlpha(0);
        
        // Create guide content (initially hidden)
        const guideContent = [
            "• Use ARROW KEYS to move your character",
            "• Collect all BITS to unlock the exit",
            "• Avoid obstacles and enemies",
            "• Some platforms may move or disappear",
            "• Die to restart current level",
            "• Reach the EXIT to complete the level",
            "• There are NO checkpoints, do NOT refresh",
        ];
        
        this.guideTexts = [];
        guideContent.forEach((text, index) => {
            const guideText = this.add.text(
                this.cameras.main.centerX,
                250 + (index * 120),
                text,
                {
                    fontFamily: 'Play',
                    fontSize: '56px',
                    color: '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 2
                }
            ).setOrigin(0.5).setAlpha(0);
            
            this.guideTexts.push(guideText);
        });
        
        // Create back instruction (initially hidden)
        this.backText = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.height - 80,
            'Press ESC or BACKSPACE to return to menu',
            {
                fontFamily: 'Play',
                fontSize: '48px',
                color: '#ff0000'
            }
        ).setOrigin(0.5).setAlpha(0);
        
        // Slide in animation
        this.tweens.add({
            targets: this.background,
            x: this.cameras.main.centerX,
            duration: 800,
            ease: 'Power2.easeOut',
            onComplete: () => {
                // Fade in title first
                this.tweens.add({
                    targets: this.titleText,
                    alpha: 1,
                    duration: 400,
                    onComplete: () => {
                        // Stagger fade-in of guide texts
                        this.guideTexts.forEach((text, index) => {
                            this.tweens.add({
                                targets: text,
                                alpha: 1,
                                duration: 300,
                                delay: index * 100
                            });
                        });
                        
                        // Fade in back instruction last
                        this.tweens.add({
                            targets: this.backText,
                            alpha: 1,
                            duration: 400,
                            delay: this.guideTexts.length * 100 + 200,
                            onComplete: () => {
                                this.setupInput();
                            }
                        });
                    }
                });
            }
        });
    }

    setupInput() {
        this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.backspaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.BACKSPACE);
        
        this.input.keyboard.on('keydown-ESC', () => {
            this.returnToMenu();
        });
        
        this.input.keyboard.on('keydown-BACKSPACE', () => {
            this.returnToMenu();
        });
    }

    returnToMenu() {
        // Slide out animation
        this.tweens.add({
            targets: this.background,
            x: this.cameras.main.width + this.cameras.main.width / 2,
            duration: 600,
            ease: 'Power2.easeIn'
        });
        
        this.tweens.add({
            targets: [
                this.titleText,
                this.backText,
                ...this.guideTexts
            ],
            alpha: 0,
            duration: 400,
            onComplete: () => {
                this.scene.start("titleScreen");
            }
        });
    }
}