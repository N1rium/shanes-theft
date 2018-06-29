import * as Phaser from "phaser";
import * as io from "socket.io-client";
import animationSetup from "./animation-setup";

const gameWidth = 512;
const gameHeight = 288;

var config = {
  type: Phaser.AUTO,
  parent: "phaser-example",
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
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

var game = new Phaser.Game(config);
var player;
var tagAnimation;
var tagId;
var otherPlayers;
var map;
var backgroundLayer, collisionLayer, objectsLayer, topLayer;
var clouds, clouds1;

const velocity = 3.5;
const cloudVelocity = 0.025;

function preload() {
  this.load.spritesheet("playersheet", "assets/soulsplayer.png", {
    frameWidth: 16,
    frameHeight: 16,
    endFrame: 80
  });
  this.load.spritesheet("overworld", "assets/newmap1_tiles.png", {
    frameWidth: 16,
    frameHeight: 16
  });
  this.load.tilemapTiledJSON("tilemap", "assets/overworld.json");
  this.load.image("cloud", "assets/cloud.png");
}

function create() {
  this.socket = io();
  var self = this;

  animationSetup(self);

  otherPlayers = this.physics.add.group();

  clouds = self.add.image(512, 144, "cloud");
  clouds.setDepth(40000);
  clouds1 = self.add.image(1536, 144, "cloud");
  clouds1.setDepth(40000);

  map = self.make.tilemap({ key: "tilemap" });
  var tileset = map.addTilesetImage("overworld");

  backgroundLayer = map.createStaticLayer("Bkg", tileset);
  objectsLayer = map.createDynamicLayer("Objects", tileset);
  topLayer = map.createDynamicLayer("Top", tileset);
  collisionLayer = map.createStaticLayer("Collision", tileset);

  self.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

  tagAnimation = self.add.sprite(40, 40, "playersheet");
  tagAnimation.setDepth(30000);
  tagAnimation.anims.play("tag", true);

  this.socket.on("connect_error", function() {
    //Handle server down
  });

  this.socket.on("currentPlayers", function(players) {
    Object.keys(players).forEach(function(id) {
      if (players[id].playerId === self.socket.id) {
        player = self.physics.add.sprite(
          players[id].x,
          players[id].y,
          "playersheet"
        );
        //player.setCollideWorldBounds(true);
        player.playerId = players[id].playerId;
        player.color = players[id].color;
        //player.isTag = players[id].isTag;
        player.body.friction.x = 0;
        player.body.friction.y = 0;
        player.body
          .setSize(player.width / 2, player.height / 2)
          .setOffset(4, 8);
        //self.cameras.main.startFollow(player, true, 0.1, 0.1);
        collisionLayer.setCollisionByExclusion([-1], true);
        topLayer.setDepth(20000);
        self.physics.add.collider(collisionLayer, player);
      } else {
        let sprite = self.physics.add.sprite(
          players[id].x,
          players[id].y,
          "playersheet"
        );
        sprite.body.friction.x = 0;
        sprite.body.friction.y = 0;
        sprite.color = players[id].color;
        sprite.body
          .setSize(sprite.width / 2, sprite.height / 2)
          .setOffset(4, 8);
        //sprite.isTag = players[id].isTag;
        sprite.playerId = players[id].playerId;
        otherPlayers.add(sprite);
      }
    });
    self.physics.add.overlap(player, otherPlayers, function(player, other) {
      //console.warn("PLAYER: ", player);
      //console.warn("OTHER: ", other);
      if (tagId == player.playerId || tagId == other.playerId) {
        self.socket.emit(
          "tag",
          tagId == player.playerId ? other.playerId : player.playerId
        );
      }
    });
  });

  this.socket.on("newPlayer", function(playerInfo) {
    let sprite = self.physics.add.sprite(
      playerInfo.x,
      playerInfo.y,
      "playersheet"
    );
    sprite.playerId = playerInfo.playerId;
    sprite.body.friction.x = 0;
    sprite.body.friction.y = 0;
    sprite.color = playerInfo.color;
    sprite.body.setSize(sprite.width / 2, sprite.height / 2).setOffset(4, 8);
    sprite.playerId = playerInfo.playerId;
    otherPlayers.add(sprite);
  });

  this.socket.on("disconnect", function(playerId) {
    otherPlayers.getChildren().forEach(function(otherPlayer) {
      if (playerId === otherPlayer.playerId) {
        otherPlayer.destroy();
      }
    });
  });

  this.socket.on("newTag", function(id) {
    if (tagId != id) {
      console.log("new tag", id);
    }
    tagId = id;
  });

  this.socket.on("playerMoved", function(playerInfo) {
    otherPlayers.getChildren().forEach(function(otherPlayer) {
      if (playerInfo.playerId === otherPlayer.playerId) {
        //otherPlayer.setPosition(playerInfo.x, playerInfo.y);
        if (
          Math.abs(playerInfo.x - otherPlayer.x) > 100 ||
          Math.abs(playerInfo.y - otherPlayer.y) > 100
        ) {
          otherPlayer.x = playerInfo.x;
          otherPlayer.y = playerInfo.y;
        } else {
          self.tweens.add({
            targets: otherPlayer,
            x: playerInfo.x,
            y: playerInfo.y,
            duration: 100,
            ease: "Linear",
            delay: 0
          });
        }
        otherPlayer.setDepth(playerInfo.y);
        otherPlayer.anims.play(`${playerInfo.color}_${playerInfo.dir}`);
      }
    });
  });

  this.cursors = this.input.keyboard.createCursorKeys();
}

var oldPosition = {};
var lastDir = "down";
function update(timestep, dt) {
  const self = this;
  clouds.x -= cloudVelocity * dt;
  clouds1.x -= cloudVelocity * dt;
  if (clouds.x <= -512) {
    clouds.x = 1536;
  }
  if (clouds1.x <= -512) {
    clouds1.x = 1536;
  }
  const { left, right, up, down } = this.cursors;
  if (player) {
    player.setVelocity(0);
    if (left.isDown) {
      player.setVelocityX(-velocity * dt);
      lastDir = "left";
    }
    if (right.isDown) {
      player.setVelocityX(velocity * dt);
      lastDir = "right";
    }
    if (up.isDown) {
      player.setVelocityY(-velocity * dt);
      lastDir = "up";
    }
    if (down.isDown) {
      player.setVelocityY(velocity * dt);
      lastDir = "down";
    }

    if (!down.isDown && !left.isDown && !right.isDown && !up.isDown) {
      player.anims.play(`${player.color}_${lastDir}_idle`, true);
    } else {
      player.anims.play(`${player.color}_${lastDir}`, true);
    }

    player.setDepth(player.y);
    if (canSend && (oldPosition.x !== player.x || oldPosition.y !== player.y)) {
      canSend = false;
      const { currentAnim } = player.anims;
      this.socket.emit("playerMovement", {
        x: player.x,
        y: player.y,
        dir: currentAnim ? currentAnim.key.split("_")[1] : null
      });
      oldPosition = {
        x: player.x,
        y: player.y
      };
    }

    if (tagId == player.playerId) {
      tagAnimation.setPosition(player.x, player.y - 12);
    }

    self.physics.world.wrap(player, 0);
  }

  otherPlayers.getChildren().forEach(function(otherPlayer) {
    if (tagId == otherPlayer.playerId) {
      tagAnimation.setPosition(otherPlayer.x, otherPlayer.y - 12);
    }
  });

  //console.log(tagId);
}

var canSend = true;
setInterval(function() {
  canSend = true;
}, 100);
