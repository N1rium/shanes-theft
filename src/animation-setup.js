function getAnim(game, key, sheet, start, count) {
  return {
    key,
    frames: game.anims.generateFrameNumbers(sheet, {
      start,
      end: start + count
    }),
    frameRate: 10,
    repeat: -1
  };
}

export default function(game) {
  game.anims.create(getAnim(game, "red_down_idle", "playersheet", 0, 0));
  game.anims.create(getAnim(game, "red_down", "playersheet", 0, 3));
  game.anims.create(getAnim(game, "red_left_idle", "playersheet", 4, 0));
  game.anims.create(getAnim(game, "red_left", "playersheet", 4, 3));
  game.anims.create(getAnim(game, "red_up_idle", "playersheet", 8, 0));
  game.anims.create(getAnim(game, "red_up", "playersheet", 8, 3));
  game.anims.create(getAnim(game, "red_right_idle", "playersheet", 12, 0));
  game.anims.create(getAnim(game, "red_right", "playersheet", 12, 3));

  game.anims.create(getAnim(game, "blue_down_idle", "playersheet", 16, 0));
  game.anims.create(getAnim(game, "blue_down", "playersheet", 16, 3));
  game.anims.create(getAnim(game, "blue_left", "playersheet", 20, 3));
  game.anims.create(getAnim(game, "blue_up", "playersheet", 24, 3));
  game.anims.create(getAnim(game, "blue_right", "playersheet", 28, 3));

  game.anims.create(getAnim(game, "green_down_idle", "playersheet", 32, 0));
  game.anims.create(getAnim(game, "green_down", "playersheet", 32, 3));
  game.anims.create(getAnim(game, "green_left", "playersheet", 36, 3));
  game.anims.create(getAnim(game, "green_up", "playersheet", 40, 3));
  game.anims.create(getAnim(game, "green_right", "playersheet", 44, 3));

  game.anims.create(getAnim(game, "purple_down_idle", "playersheet", 48, 0));
  game.anims.create(getAnim(game, "purple_down", "playersheet", 48, 3));
  game.anims.create(getAnim(game, "purple_left", "playersheet", 52, 3));
  game.anims.create(getAnim(game, "purple_up", "playersheet", 56, 3));
  game.anims.create(getAnim(game, "purple_right", "playersheet", 60, 3));

  game.anims.create(getAnim(game, "tag", "playersheet", 64, 2));
}
