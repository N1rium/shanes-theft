import * as Phaser from "phaser";
import GameScene from "./scenes/game-scene";
import NameSelectionScene from "./scenes/name-selection-scene";
import "./style/main.sass";

const gameWidth = 512;
const gameHeight = 288;

var config = {
  type: Phaser.AUTO,
  parent: "game-container",
  width: gameWidth,
  height: gameHeight,
  roundPixels: true,
  pixelArt: true,
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
      gravity: { y: 0 }
    }
  },
  zoom: 4,
  scene: [NameSelectionScene, GameScene]
};

const game = new Phaser.Game(config);
//game.add.plugin(PhaserInput.Plugin);
