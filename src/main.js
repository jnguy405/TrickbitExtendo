"use strict";

let config = {
    type: Phaser.AUTO,
    parent: 'phaser-game',
    width: 5120,
    height: 1280,
    physics: {
        default: 'arcade',
        arcade: {
            debug: true,
        }
    },
    render: {
        pixelArt: true,
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [Load, TrickbitL1, WinScene]
};

const SCALE = 2.0;  
var cursors;
var my = { sprite: {}, text: {} };

const game = new Phaser.Game(config);