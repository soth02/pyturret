class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: "MainScene" });
  }

  preload() {
    // Load your game assets here
  }

  create() {
    // Create the sky (blue rectangle)
    const sky = this.add.graphics();
    sky.fillStyle(0x87ceeb, 1); // Sky blue color
    sky.fillRect(
      0,
      0,
      this.cameras.main.width,
      this.cameras.main.height * 0.75
    );

    // Create the ground (green rectangle)
    const ground = this.add.graphics();
    ground.fillStyle(0x228b22, 1); // Forest green color
    ground.fillRect(
      0,
      this.cameras.main.height * 0.75,
      this.cameras.main.width,
      this.cameras.main.height * 0.25
    );

    // Create the turret (a simple triangle)
    const turret = this.add.graphics();
    turret.fillStyle(0x808080, 1); // Gray color
    turret.beginPath();
    turret.moveTo(this.cameras.main.width / 2, this.cameras.main.height * 0.75);
    turret.lineTo(this.cameras.main.width / 2 - 20, this.cameras.main.height);
    turret.lineTo(this.cameras.main.width / 2 + 20, this.cameras.main.height);
    turret.closePath();
    turret.fillPath();

    // Set the mouse cursor to a crosshair
    this.input.setDefaultCursor("crosshair");

    // Projectiles group
    this.projectiles = this.physics.add.group({
      classType: Phaser.GameObjects.Graphics,
    });

    // Set up the mouse click event
    this.input.on("pointerdown", (pointer) => {
      if (pointer.leftButtonDown()) {
        this.fireProjectile(pointer.x, pointer.y);
      }
    });

    // Wave number display
    this.waveNumber = 1;
    this.waveNumberText = this.add.text(16, 16, "Wave: 1", {
      fontSize: "32px",
      fill: "#ffffff",
    });

    // Score display
    this.score = 0;
    this.scoreText = this.add.text(
      this.cameras.main.width - 16,
      16,
      "Score: 0",
      {
        fontSize: "32px",
        fill: "#ffffff",
        align: "right",
      }
    );
    this.scoreText.setOrigin(1, 0);

    // Enemies group
    this.enemies = this.physics.add.group({
      classType: Phaser.GameObjects.Graphics,
    });

    // Start spawning the first wave
    this.spawnWave();

    // Add physics to the scene
    this.physics.world.enable([this.projectiles, this.enemies]);

    // Detect collision between projectiles and enemies
    this.physics.add.collider(
      this.projectiles,
      this.enemies,
      (projectile, enemy) => {
        projectile.destroy();
        enemy.hitPoints -= 1;

        if (enemy.hitPoints <= 0) {
          enemy.destroy();
          this.score += 1; // Increment score
          this.scoreText.setText("Score: " + this.score);
        }
      }
    );
  }

  fireProjectile(targetX, targetY) {
    // Create a new projectile (a simple circle)
    const projectile = this.add.circle(0, 0, 5, 0xff0000); // Red color
    projectile.x = this.cameras.main.width / 2;
    projectile.y = this.cameras.main.height * 0.75;

    // Add the projectile to the projectiles group
    this.projectiles.add(projectile);
    this.physics.world.enable(projectile);
    projectile.body.setCircle(5); // Set circular hitbox

    // Calculate the velocity for the projectile to move towards the target
    const angle = Phaser.Math.Angle.Between(
      projectile.x,
      projectile.y,
      targetX,
      targetY
    );
    const velocity = this.physics.velocityFromAngle(
      Phaser.Math.RadToDeg(angle),
      500
    );

    // Set up the projectile's movement
    this.tweens.add({
      targets: projectile,
      x: projectile.x + velocity.x,
      y: projectile.y + velocity.y,
      duration: 1000,
      onComplete: () => {
        projectile.destroy();
      },
    });
  }

  spawnWave() {
    let spawnDelay = 500;
    let enemyCount = this.waveNumber * 3;

    let movementType;
    if (this.waveNumber % 9 <= 3) {
      // Waves 1-3, 10-12, 19-21, etc. are straight down
      movementType = 1;
    } else if (this.waveNumber % 9 <= 6) {
      // Waves 4-6, 13-15, 22-24, etc. are zigzag
      movementType = 2;
    } else {
      // Waves 7-9, 16-18, 25-27, etc. are spiral
      movementType = 3;
    }
    for (let i = 0; i < enemyCount; i++) {
      this.time.delayedCall(spawnDelay * i, () => {
        const enemy = this.createEnemy();

        if (movementType === 1) {
          this.moveEnemyDown(enemy);
        } else if (movementType === 2) {
          this.moveEnemyZigZag(enemy);
        } else {
          this.moveEnemySpiral(enemy);
        }
      });
    }

    this.time.delayedCall(spawnDelay * enemyCount, () => {
      this.waveNumber++;
      this.waveNumberText.setText("Wave: " + this.waveNumber);
      this.spawnWave();
    });
  }

  createEnemy() {
    const enemy = this.add.circle(0, 0, 15, 0x555555); // gray color
    enemy.x = Phaser.Math.Between(50, this.cameras.main.width - 50);
    enemy.y = 50;
    this.physics.world.enable(enemy);
    enemy.body.setCircle(15); // Set circular hitbox
    enemy.body.allowGravity = false;

    // Add hit points to the enemy
    // enemy.hitPoints = Math.floor(this.waveNumber / 3) + 1;
    enemy.hitPoints = 1;

    this.enemies.add(enemy);
    return enemy;
  }

  moveEnemyDown(enemy) {
    this.tweens.add({
      targets: enemy,
      y: this.cameras.main.height,
      duration: Phaser.Math.Between(2000, 4000),
      onComplete: () => {
        enemy.destroy();
      },
    });
  }

  moveEnemyZigZag(enemy) {
    const zigZagPoints = [];
    const amplitude = 100;
    const yOffset = 50;
    const segmentCount = 10;

    for (let i = 0; i < segmentCount; i++) {
      const x = enemy.x + (i % 2 === 0 ? -amplitude : amplitude);
      const y = enemy.y + yOffset * (i + 1);
      zigZagPoints.push({ x, y });
    }

    const zigZagTimeline = this.tweens.createTimeline();

    for (const point of zigZagPoints) {
      zigZagTimeline.add({
        targets: enemy,
        x: point.x,
        y: point.y,
        duration: 1000,
        ease: "Linear",
      });
    }

    zigZagTimeline.play();

    zigZagTimeline.setCallback("onComplete", () => {
      enemy.destroy();
    });
  }

  moveEnemySpiral(enemy) {
    const spiralPoints = [];
    const radius = 50;
    const rotations = 2;
    const segmentsPerRotation = 20;
    const verticalOffset = 5; // Adjust this value to change the downward speed of the spiral

    for (let i = 0; i < rotations * segmentsPerRotation; i++) {
      const angle = (i * 2 * Math.PI) / segmentsPerRotation;
      const distance = (radius * i) / (rotations * segmentsPerRotation);
      const x = enemy.x + distance * Math.cos(angle);
      const y = enemy.y + distance * Math.sin(angle) + i * verticalOffset;
      spiralPoints.push({ x, y });
    }

    const spiralTimeline = this.tweens.createTimeline();

    // Adjust the duration based on the wave number
    const duration =
      (4000 * (1 - this.waveNumber * 0.05)) / (rotations * segmentsPerRotation);

    for (const point of spiralPoints) {
      spiralTimeline.add({
        targets: enemy,
        x: point.x,
        y: point.y,
        duration: duration,
        ease: "Linear",
      });
    }

    spiralTimeline.play();

    spiralTimeline.setCallback("onComplete", () => {
      enemy.destroy();
    });
  }

  checkEnemyHealth() {
    this.enemies.getChildren().forEach((enemy) => {
      if (enemy.hitPoints <= 0) {
        enemy.destroy();
      }
    });
  }

  update() {
    // Update your game logic here
    this.checkEnemyHealth();
  }
}
