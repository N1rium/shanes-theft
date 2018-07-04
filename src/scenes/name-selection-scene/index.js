import * as io from "socket.io-client";

export default class NameSelectionScene extends Phaser.Scene {
  constructor() {
    super({ key: "game-selection-scene" });
  }

  preload() {}

  create() {
    this.cursors = this.input.keyboard.createCursorKeys();
  }

  update(timestep, dt) {}
}
