// CreditsScene.js
// Credits screen with developer information

class CreditsScene extends Phaser.Scene {
    constructor() {
        super("creditsScene");
    }

    create() {
        // Create background rectangle (starts from bottom)
        this.background = this.add.rectangle(
            this.cameras.main.centerX,
            this.cameras.main.height + this.cameras.main.height / 2,
            this.cameras.main.width,
            this.cameras.main.height,
            0x1A0A0A
        ).setOrigin(0.5);
        
        // Create title (initially hidden)
        this.titleText = this.add.text(
            this.cameras.main.centerX,
            80,
            'CREDITS',
            {
                fontFamily: 'Play',
                fontSize: '120px',
                color: '#ff0000',
                stroke: '#000000',
                strokeThickness: 6
            }
        ).setOrigin(0.5).setAlpha(0);
        
        // Create credits content
        const creditsContent = [
            { title: "GAME DESIGN & DEVELOPMENT", name: "Jenalee Nguyen" },
            { title: "KENNY GRAPHICS & PARTICLES", name: "https://kenney.nl/assets/1-bit-platformer-pack\nhttps://www.kenney.nl/assets/particle-pack" },
            { title: "KENNY SOUND ASSETS", name: "https://www.kenney.nl/assets/ui-audio\nhttps://www.kenney.nl/assets/digital-audio" },
            { title: "MINECRAFT SOUND ASSET", name: "https://minecraft.fandom.com/wiki/Category:Grass_sounds" },
        ];
        
        this.creditTexts = [];
        creditsContent.forEach((credit, index) => {
            const titleText = this.add.text(
                this.cameras.main.centerX,
                200 + (index * 240),
                credit.title,
                {
                    fontFamily: 'Play',
                    fontSize: '48px',
                    color: '#fe019a',
                    stroke: '#000000',
                    strokeThickness: 4
                }
            ).setOrigin(0.5).setAlpha(0);
            
            const nameText = this.add.text(
                this.cameras.main.centerX,
                260 + (index * 250),
                credit.name,
                {
                    fontFamily: 'Play',
                    fontSize: '36px',
                    color: '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 2,
                    align: 'center',
                    lineSpacing: 20
                }
            ).setOrigin(0.5).setAlpha(0);
            
            this.creditTexts.push(titleText, nameText);
        });
        
        // Create thank you message (initially hidden)
        this.thankYouText = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.height - 180,
            'Thank you for playing TRICKBIT!',
            {
                fontFamily: 'Play',
                fontSize: '60px',
                color: '#00ff00',
                stroke: '#000000',
                strokeThickness: 3
            }
        ).setOrigin(0.5).setAlpha(0);
        
        // Create back instruction (initially hidden)
        this.backText = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.height - 100,
            'Press ESC or BACKSPACE to return to menu',
            {
                fontFamily: 'Play',
                fontSize: '48px',
                color: '#ff0000'
            }
        ).setOrigin(0.5).setAlpha(0);
        
        // Slide up animation with bounce
        this.tweens.add({
            targets: this.background,
            y: this.cameras.main.centerY,
            duration: 1200,
            ease: 'Bounce.easeOut',
            onComplete: () => {
                // Fade in title
                this.tweens.add({
                    targets: this.titleText,
                    alpha: 1,
                    duration: 500,
                    onComplete: () => {
                        // Stagger fade-in of credit texts
                        this.creditTexts.forEach((text, index) => {
                            this.tweens.add({
                                targets: text,
                                alpha: 1,
                                duration: 300,
                                delay: index * 80,
                                ease: 'Power2.easeOut'
                            });
                        });
                        
                        // Fade in thank you and back text
                        this.tweens.add({
                            targets: [this.thankYouText, this.backText],
                            alpha: 1,
                            duration: 500,
                            delay: this.creditTexts.length * 80 + 300,
                            onComplete: () => {
                                this.setupInput();
                                this.startAnimations();
                            }
                        });
                    }
                });
            }
        });
    }

    startAnimations() {
        // Pulsing animation for title
        this.tweens.add({
            targets: this.titleText,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Gentle floating for thank you text
        this.tweens.add({
            targets: this.thankYouText,
            y: this.thankYouText.y - 10,
            duration: 3000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Rainbow color cycling for thank you text
        this.time.addEvent({
            delay: 500,
            callback: () => {
                const colors = ['#00ff00', '#00ffff', '#0000ff', '#ff00ff', '#ff0000', '#ffff00'];
                const randomColor = colors[Math.floor(Math.random() * colors.length)];
                this.thankYouText.setStyle({ color: randomColor });
            },
            loop: true
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
        // Slide down animation
        this.tweens.add({
            targets: this.background,
            y: this.cameras.main.height + this.cameras.main.height / 2,
            duration: 800,
            ease: 'Power2.easeIn'
        });
        
        this.tweens.add({
            targets: [
                this.titleText,
                this.thankYouText,
                this.backText,
                ...this.creditTexts
            ],
            alpha: 0,
            duration: 500,
            onComplete: () => {
                this.scene.start("titleScreen");
            }
        });
    }
}