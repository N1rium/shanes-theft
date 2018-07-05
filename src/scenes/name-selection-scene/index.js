import * as io from "socket.io-client";

export default class NameSelectionScene extends Phaser.Scene {
  constructor() {
    super({ key: "game-selection-scene" });
    this.formButton = document.getElementById("name-selection-button");
    console.log(this.formButton);
  }

  preload() {}

  onNameSelect() {
    const { value } = document.getElementById("name-selection-input");
    console.log(value);
  }

  create() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.formButton.onclick = this.onNameSelect;
  }

  update(timestep, dt) {}
}
