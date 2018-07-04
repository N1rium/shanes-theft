import * as io from "socket.io-client";
import animationSetup from "./animation-setup";
const Analytics = require("analytics-node");
const analytics = new Analytics("UA-121643992-1");
var player;
var tagAnimation;
var tagId;
var otherPlayers;
var map;
var collisionLayer;
var clouds, clouds1;
var oldPosition = {};
var lastDir = "down";

const velocity = 3.5;

var canSend = true;
setInterval(function() {
  canSend = true;
}, 100);

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "game-scene" });
    this.cloudVelocity = 0.025;
    analytics.page({
      category: "Game",
      name: "Game View",
      userId: "anonymous"
    });
  }

  preload() {
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

  create() {
    this.socket = io({ transports: ["websocket"], upgrade: false });
    //this.socket = io();
    var self = this;

    animationSetup(self);

    otherPlayers = this.physics.add.group();

    clouds = self.add.image(512, 144, "cloud");
    clouds.setDepth(40000);
    clouds1 = self.add.image(1536, 144, "cloud");
    clouds1.setDepth(40000);

    map = self.make.tilemap({ key: "tilemap" });
    var tileset = map.addTilesetImage("overworld");

    map.createStaticLayer("Bkg", tileset);
    map.createDynamicLayer("Objects", tileset);
    map.createDynamicLayer("Top", tileset).setDepth(20000);
    collisionLayer = map.createStaticLayer("Collision", tileset);

    self.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    tagAnimation = self.add.sprite(40, 40, "playersheet");
    tagAnimation.setDepth(30000);
    tagAnimation.anims.play("tag", true);

    this.socket.on("connect_error", function() {
      //Handle server down
    });

    function addPlayer(playerInfo) {
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
    }

    this.socket.on("currentPlayers", function(players) {
      Object.keys(players).forEach(function(id) {
        if (players[id].playerId === self.socket.id) {
          player = self.physics.add.sprite(
            players[id].x,
            players[id].y,
            "playersheet"
          );

          player.playerId = players[id].playerId;
          player.color = players[id].color;
          player.body.friction.x = 0;
          player.body.friction.y = 0;
          player.body
            .setSize(player.width / 2, player.height / 2)
            .setOffset(4, 8);
          collisionLayer.setCollisionByExclusion([-1], true);
          self.physics.add.collider(collisionLayer, player);
        } else {
          addPlayer(players[id]);
        }
      });
      self.physics.add.overlap(player, otherPlayers, function(player, other) {
        if (tagId == player.playerId || tagId == other.playerId) {
          self.socket.emit(
            "tag",
            tagId == player.playerId ? other.playerId : player.playerId
          );
        }
      });
    });

    this.socket.on("newPlayer", addPlayer);

    this.socket.on("disconnect", function(playerId) {
      otherPlayers.getChildren().forEach(function(otherPlayer) {
        if (playerId === otherPlayer.playerId) {
          otherPlayer.destroy();
        }
      });
    });

    this.socket.on("newTag", function(id) {
      analytics.track({
        userId: "anonymous",
        event: "NewTag"
      });
      tagId = id;
    });

    this.socket.on("playerMoved", function(playerInfo) {
      otherPlayers.getChildren().forEach(function(otherPlayer) {
        if (playerInfo.playerId === otherPlayer.playerId) {
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
          otherPlayer.anims.play(`${playerInfo.color}_${playerInfo.dir}`, true);
        }
      });
    });

    this.cursors = this.input.keyboard.createCursorKeys();
  }

  update(timestep, dt) {
    const self = this;
    clouds.x -= this.cloudVelocity * dt;
    clouds1.x -= this.cloudVelocity * dt;
    const delta = Math.min(dt, 16.6);

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
        player.setVelocityX(-velocity * delta);
        lastDir = "left";
      }
      if (right.isDown) {
        player.setVelocityX(velocity * delta);
        lastDir = "right";
      }
      if (up.isDown) {
        player.setVelocityY(-velocity * delta);
        lastDir = "up";
      }
      if (down.isDown) {
        player.setVelocityY(velocity * delta);
        lastDir = "down";
      }

      if (!down.isDown && !left.isDown && !right.isDown && !up.isDown) {
        player.anims.play(`${player.color}_${lastDir}_idle`, true);
      } else {
        player.anims.play(`${player.color}_${lastDir}`, true);
      }

      player.setDepth(player.y);
      if (
        canSend &&
        (oldPosition.x !== player.x || oldPosition.y !== player.y)
      ) {
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
  }
}
