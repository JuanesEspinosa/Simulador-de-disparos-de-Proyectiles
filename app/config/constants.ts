export const PHYSICS_CONSTANTS = {
  GRAVITY: -9.81,
  AIR_DENSITY: 1.225,
  DRAG_COEFFICIENT: 0.47,
  PROJECTILE_RADIUS: 0.1,
  get CROSS_SECTIONAL_AREA() {
    return Math.PI * this.PROJECTILE_RADIUS ** 2;
  },
};

export const VISUAL_CONSTANTS = {
  COLORS: {
    SKY: 0x87ceeb,
    GROUND: 0x3a8f3a,
    GRID_1: 0x2d6b2d,
    GRID_2: 0x4a9f4a,
    CLOUD: 0xffffff,
    POLE: 0x8b4513,
    FLAG: 0xff0000,
    FLAG_TOP: 0xffd700,
    PLATFORM: 0x666666,
    ROCKET_BODY: 0xef4444,
    ROCKET_NOSE: 0xfbbf24,
    ROCKET_FIN: 0x1f2937,
    ROCKET_FLAME: 0xff6b00,
    TRAJECTORY_LINE: 0xff00ff,
    IMPACT_MARKER: 0xff0000,
  },
  DIMENSIONS: {
    GROUND_SIZE: 200,
    GRID_SIZE: 150,
  },
};
