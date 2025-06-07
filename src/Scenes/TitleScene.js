// TitleScreen.js
// Title screen with WinScene-style animations

class TitleScene extends Phaser.Scene {
    constructor() {
        super("titleScreen");
    }

    init() {
        this.selectedLevel = 0;
        this.levels = [
            { name: "PLAY", scene: "trickbitScene1", unlocked: true },
            { name: "GUIDE", scene: "guideScene", unlocked: true },
            { name: "CREDITS", scene: "creditsScene", unlocked: true }
        ];
    }

    create() {
        // Create background rectangle (starts above screen)
        this.background = this.add.rectangle(
            this.cameras.main.centerX,
            -this.cameras.main.height / 2,
            this.cameras.main.width,
            this.cameras.main.height,
            0x000000
        ).setOrigin(0.5);
        
        // Create title text (initially hidden)
        this.titleText = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY - 250,
            'TRICKBIT',
            {
                fontFamily: 'Play',
                fontSize: '160px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 8
            }
        ).setOrigin(0.5).setAlpha(0);
        
        // Create subtitle (initially hidden)
        this.subtitleText = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY - 150,
            'by Jenalee Nguyen',
            {
                fontFamily: 'Play',
                fontSize: '48px',
                color: '#ffffff'
            }
        ).setOrigin(0.5).setAlpha(0);
        
        // Create menu options with double spacing (initially hidden)
        this.levelTexts = [];
        this.levels.forEach((level, index) => {
            const yPos = this.cameras.main.centerY + (index * 120);
            
            const levelText = this.add.text(
                this.cameras.main.centerX,
                yPos,
                level.name,
                {
                    fontFamily: 'Play',
                    fontSize: '72px',
                    color: '#00ffff',
                    stroke: '#000000',
                    strokeThickness: 4
                }
            ).setOrigin(0.5).setAlpha(0);
            
            this.levelTexts.push(levelText);
        });
        
        // Create selection indicator (initially hidden)
        this.selector = this.add.text(
            this.cameras.main.centerX - 200,
            this.cameras.main.centerY,
            '>',
            {
                fontFamily: 'Play',
                fontSize: '72px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5).setAlpha(0);
        
        // Create instructions (initially hidden)
        this.instructionText = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.height - 100,
            'UP/DOWN to select • ENTER/SPACE to start',
            {
                fontFamily: 'Play',
                fontSize: '36px',
                color: '#ffffff'
            }
        ).setOrigin(0.5).setAlpha(0);
        
        // Slide in animation with bounce
        this.tweens.add({
            targets: this.background,
            y: this.cameras.main.centerY,
            duration: 1000,
            ease: 'Bounce.easeOut',
            onComplete: () => {
                // Fade in all text elements
                this.tweens.add({
                    targets: [
                        this.titleText, 
                        this.subtitleText,
                        this.selector,
                        this.instructionText,
                        ...this.levelTexts
                    ],
                    alpha: 1,
                    duration: 500,
                    onComplete: () => {
                        this.setupInput();
                        this.updateSelection();
                    }
                });
            }
        });
    }

    setupInput() {
        // Keyboard input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        
        // Input handlers
        this.input.keyboard.on('keydown-UP', () => {
            this.changeSelection(-1);
        });
        
        this.input.keyboard.on('keydown-DOWN', () => {
            this.changeSelection(1);
        });
        
        this.input.keyboard.on('keydown-ENTER', () => {
            this.startSelectedLevel();
        });
        
        this.input.keyboard.on('keydown-SPACE', () => {
            this.startSelectedLevel();
        });
    }

    changeSelection(direction) {
        let newSelection = this.selectedLevel + direction;
        
        if (newSelection < 0) newSelection = this.levels.length - 1;
        if (newSelection >= this.levels.length) newSelection = 0;
        
        this.selectedLevel = newSelection;
        this.updateSelection();
    }

    updateSelection() {
        const targetY = this.cameras.main.centerY + (this.selectedLevel * 120);
        
        this.tweens.add({
            targets: this.selector,
            y: targetY,
            duration: 200,
            ease: 'Power2'
        });
        
        this.levelTexts.forEach((levelText, index) => {
            const isSelected = index === this.selectedLevel;
            
            levelText.setStyle({
                color: isSelected ? '#ffffff' : '#00ffff'
            });
            
            // Pulse animation for selected level
            if (isSelected) {
                this.tweens.add({
                    targets: levelText,
                    scaleX: 1.1,
                    scaleY: 1.1,
                    duration: 600,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            } else {
                this.tweens.killTweensOf(levelText);
                levelText.setScale(1);
            }
        });
    }

    startSelectedLevel() {
        const selectedLevelData = this.levels[this.selectedLevel];
        // Fade out animation before starting level
        this.tweens.add({
            targets: [
                this.background,
                this.titleText,
                this.subtitleText,
                this.selector,
                this.instructionText,
                ...this.levelTexts
            ],
            alpha: 0,
            duration: 500,
            onComplete: () => {
                this.scene.start(selectedLevelData.scene);
            }
        });
    }
}