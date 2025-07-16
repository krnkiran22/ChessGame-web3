import Phaser from 'phaser';

const TILE_SIZE = 48;
const MAP_WIDTH = 13;
const MAP_HEIGHT = 11;

const TILE_TYPES = {
  EMPTY: 0,
  INDESTRUCTIBLE: 1,
  DESTRUCTIBLE: 2,
  BOMB: 3,
  EXPLOSION: 4,
};

function createMap() {
  // Classic Bomberman: indestructible walls in a grid, destructibles in between
  const map = [];
  for (let y = 0; y < MAP_HEIGHT; y++) {
    const row = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      if (
        x === 0 || x === MAP_WIDTH - 1 ||
        y === 0 || y === MAP_HEIGHT - 1 ||
        (x % 2 === 0 && y % 2 === 0)
      ) {
        row.push(TILE_TYPES.INDESTRUCTIBLE);
      } else if (
        (x <= 2 && y <= 2) || (x >= MAP_WIDTH - 3 && y >= MAP_HEIGHT - 3)
      ) {
        // Player spawn corners: leave empty
        row.push(TILE_TYPES.EMPTY);
      } else {
        // 70% chance for destructible, else empty
        row.push(Math.random() < 0.7 ? TILE_TYPES.DESTRUCTIBLE : TILE_TYPES.EMPTY);
      }
    }
    map.push(row);
  }
  return map;
}

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.map = [];
    this.tileSprites = [];
    this.bombs = [];
  }

  preload() {
    this.load.image('indestructible', 'https://labs.phaser.io/assets/sprites/block.png');
    this.load.image('destructible', 'https://labs.phaser.io/assets/sprites/brownBlock.png');
    this.load.image('player', 'https://labs.phaser.io/assets/sprites/phaser-dude.png');
    this.load.image('bomb', 'https://labs.phaser.io/assets/sprites/bomb.png');
    this.load.image('explosion', 'https://labs.phaser.io/assets/particles/yellow.png');
  }

  create() {
    this.map = createMap();
    this.tileSprites = [];
    for (let y = 0; y < MAP_HEIGHT; y++) {
      this.tileSprites[y] = [];
      for (let x = 0; x < MAP_WIDTH; x++) {
        let sprite = null;
        if (this.map[y][x] === TILE_TYPES.INDESTRUCTIBLE) {
          sprite = this.add.image(x * TILE_SIZE, y * TILE_SIZE, 'indestructible').setOrigin(0);
        } else if (this.map[y][x] === TILE_TYPES.DESTRUCTIBLE) {
          sprite = this.add.image(x * TILE_SIZE, y * TILE_SIZE, 'destructible').setOrigin(0);
        }
        this.tileSprites[y][x] = sprite;
      }
    }
    // Add player
    this.player = this.physics.add.sprite(TILE_SIZE + TILE_SIZE / 2, TILE_SIZE + TILE_SIZE / 2, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(1);
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyX = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.bombs = [];
    this.explosions = [];
    this.player.gridPos = { x: 1, y: 1 };
    this.player.setPosition(
      this.player.gridPos.x * TILE_SIZE + TILE_SIZE / 2,
      this.player.gridPos.y * TILE_SIZE + TILE_SIZE / 2
    );
    this.moveCooldown = 0;
  }

  canMoveTo(x, y) {
    if (
      x < 0 || x >= MAP_WIDTH ||
      y < 0 || y >= MAP_HEIGHT
    ) return false;
    const tile = this.map[y][x];
    return tile === TILE_TYPES.EMPTY;
  }

  update(time, delta) {
    // Player movement (grid-based)
    this.moveCooldown -= delta;
    if (this.moveCooldown <= 0) {
      let moved = false;
      let { x, y } = this.player.gridPos;
      if (this.cursors.left.isDown && this.canMoveTo(x - 1, y)) {
        x -= 1; moved = true;
      } else if (this.cursors.right.isDown && this.canMoveTo(x + 1, y)) {
        x += 1; moved = true;
      } else if (this.cursors.up.isDown && this.canMoveTo(x, y - 1)) {
        y -= 1; moved = true;
      } else if (this.cursors.down.isDown && this.canMoveTo(x, y + 1)) {
        y += 1; moved = true;
      }
      if (moved) {
        this.player.gridPos = { x, y };
        this.player.setPosition(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2);
        this.moveCooldown = 120; // ms
      }
    }
    // Bomb placement
    if (Phaser.Input.Keyboard.JustDown(this.keyX)) {
      const { x, y } = this.player.gridPos;
      if (this.map[y][x] === TILE_TYPES.EMPTY && !this.bombs.some(b => b.x === x && b.y === y)) {
        this.placeBomb(x, y);
      }
    }
    // Bomb update
    this.bombs.forEach(bomb => {
      bomb.timer -= delta;
      if (bomb.timer <= 0 && !bomb.exploded) {
        this.explodeBomb(bomb);
        bomb.exploded = true;
      }
    });
    // Remove exploded bombs
    this.bombs = this.bombs.filter(bomb => !bomb.exploded || bomb.timer > -500);
    // Explosion update
    this.explosions = this.explosions.filter(ex => {
      ex.timer -= delta;
      if (ex.timer <= 0) {
        ex.sprite.destroy();
        return false;
      }
      return true;
    });
  }

  placeBomb(x, y) {
    const bombSprite = this.add.image(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, 'bomb').setDepth(1);
    this.bombs.push({ x, y, timer: 4000, sprite: bombSprite, exploded: false });
    this.map[y][x] = TILE_TYPES.BOMB;
  }

  explodeBomb(bomb) {
    const { x, y } = bomb;
    bomb.sprite.destroy();
    this.map[y][x] = TILE_TYPES.EMPTY;
    this.createExplosion(x, y);
    // Explode in 4 directions, stop at indestructible, destroy destructible
    const range = 2;
    for (const [dx, dy] of [ [1,0], [-1,0], [0,1], [0,-1] ]) {
      for (let i = 1; i <= range; i++) {
        const nx = x + dx * i;
        const ny = y + dy * i;
        if (nx < 0 || nx >= MAP_WIDTH || ny < 0 || ny >= MAP_HEIGHT) break;
        if (this.map[ny][nx] === TILE_TYPES.INDESTRUCTIBLE) break;
        this.createExplosion(nx, ny);
        if (this.map[ny][nx] === TILE_TYPES.DESTRUCTIBLE) {
          this.map[ny][nx] = TILE_TYPES.EMPTY;
          if (this.tileSprites[ny][nx]) {
            this.tileSprites[ny][nx].destroy();
            this.tileSprites[ny][nx] = null;
          }
          break;
        }
      }
    }
  }

  createExplosion(x, y) {
    const ex = this.add.image(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, 'explosion').setScale(2).setDepth(0.5);
    this.explosions.push({ x, y, sprite: ex, timer: 400 });
  }
} 