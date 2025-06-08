// WinScene.js
// Win screen with winner message

class WinScene extends Phaser.Scene {
    constructor() {
        super("winScene");
    }

    create() {
        // Create a black and white win screen
        this.winScreen = this.add.rectangle(
            this.cameras.main.centerX,
            -this.cameras.main.height / 2,
            this.cameras.main.width,
            this.cameras.main.height,
            0x000000
        ).setOrigin(0.5);
        
        // Add win text
        this.winText = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            'TRICKSTER FOR THE WIN!',
            {
                fontFamily: 'Play',
                fontSize: '128px',
                color: '#ff0000',
                stroke: '#000000',
                strokeThickness: 8
            }
        ).setOrigin(0.5).setAlpha(0);
        
        // Add instruction text
        this.instructionText = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY + 80,
            'Press R to return to Main Menu',
            {
                fontFamily: 'Play',
                fontSize: '64px',
                color: '#ffffff'
            }
        ).setOrigin(0.5).setAlpha(0);
        
        // Slide in animation
        this.tweens.add({
            targets: this.winScreen,
            y: this.cameras.main.centerY,
            duration: 1000,
            ease: 'Bounce.easeOut',
            onComplete: () => {
                // Fade in text after screen slides in
                this.tweens.add({
                    targets: [this.winText, this.instructionText],
                    alpha: 1,
                    duration: 500
                });
            }
        });
        
        // Set up restart input
        this.input.keyboard.on('keydown-R', () => {
            this.scene.start('titleScreen');
        });
    }
}