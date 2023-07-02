window.addEventListener('load', function() {
  const canvas = document.getElementById('game');
  /** @type {CanvasRenderingContext2D} */
  const ctx = canvas.getContext('2d');

  canvas.width = 700;
  canvas.height = 500;

  const bg1 = new Image();
  const bg2 = new Image();
  const bg3 = new Image();
  const bg4 = new Image();
  const plr = new Image();
  const en1 = new Image();
  const en2 = new Image();
  const en3 = new Image();
  const en4 = new Image();
  const prj = new Image();
  const grs = new Image();

  bg1.src = 'img/layer1.png';
  bg2.src = 'img/layer2.png';
  bg3.src = 'img/layer3.png';
  bg4.src = 'img/layer4.png';
  plr.src = 'img/player.png';
  en1.src = 'img/angler1.png';
  en2.src = 'img/angler2.png';
  en3.src = 'img/lucky.png';
  en4.src = 'img/hivewhale.png';
  prj.src = 'img/projectile.png';
  grs.src = 'img/gears.png';

  class InputHandler {
    constructor(game){
      this.game = game;
      window.addEventListener('keydown', e => {
        if ((
          (e.key === 'ArrowUp') ||
          (e.key === 'ArrowDown')
         ) && (this.game.keys.indexOf(e.key) === -1)){
          this.game.keys.push(e.key);
        } else if (e.key === ' '){
          this.game.player.shooting = true;
        } else if (e.key === 'd'){
          this.game.debug = !this.game.debug;
        }
      });
      window.addEventListener('keyup', e => {
        if (this.game.keys.indexOf(e.key) > -1){
          this.game.keys.splice(this.game.keys.indexOf(e.key), 1);
        } else if (e.key === ' '){
          this.game.player.shooting = false;
        }
      });
    }

  }
  class Projectile {
    constructor(game, x, y){
      this.game              = game;
      this.x                 = x;
      this.y                 = y;
      this.width             = 10;
      this.height            = 3;
      this.speed             = 3;
      this.markedForDeletion = false;
      this.image             = prj;
    }
    update(){
      this.x += this.speed;
      if (this.x > this.game.width*0.8 ) this.markedForDeletion = true;
    }
    draw(context){
      context.drawImage(this.image, this.x, this.y);
    }
  }

  class Particle {
    constructor(game, x, y){
      this.game                = game;
      this.x                   = x;
      this.y                   = y;
      this.image               = grs;
      this.frameX              = Math.floor(Math.random() * 3);
      this.frameY              = Math.floor(Math.random() * 3);
      this.spriteSize          = 50;
      this.sizeModifier        = (Math.random() * 0.5 + 0.5).toFixed(1);
      this.size                = this.spriteSize * this.sizeModifier;
      this.speedX              = Math.random() * 8 - 4;
      this.speedY              = Math.random() * -15 - 3;
      this.gravity             = 0.5;
      this.markedForDeletion   = false;
      this.angle               = 0;
      this.angleSpeed          = Math.random() * 0.2 - 0.1;
      this.bounced             = false;
      this.bottomBounceBoundry = Math.random() * 55 + 85;
    }
    update(){
      this.angle  += this.angleSpeed;
      this.speedY += this.gravity;
      this.x      -= this.speedX + this.game.speed;
      this.y      += this.speedY;
      if (this.y > this.game.height + this.size || this.x < 0 - this.size) this.markedForDeletion = true;
      if (this.y > this.game.height - this.bottomBounceBoundry && !this.bounced){
        if ( Math.round(Math.random())){
          this.bounced = true;
        }
        this.angleSpeed  = -this.angleSpeed;
        this.angle       = -this.angle;
        this.speedY     *= -0.6;
      }
    }
    draw(context){
      context.save();
      context.translate(this.x, this.y);
      context.rotate(this.angle);
      context.drawImage(
        this.image,
        this.spriteSize * this.frameX,
        this.spriteSize * this.frameY,
        this.spriteSize,
        this.spriteSize,
        this.size * -0.5,
        this.size * -0.5,
        this.size,
        this.size
      );
      context.restore();
      if ( this.y < this.game.height - this.bottomBounceBoundry + this.size * 0.5 ){
        context.save();
        context.filter    = 'blur(3px)';
        context.fillStyle = '#000000';
        context.fillRect(this.x, this.game.height - this.bottomBounceBoundry + this.size, this.size , 1);
        context.restore();
      }
    }
  }
  class Player {
    constructor(game){
      this.game             = game;
      this.width            = 120;
      this.height           = 190;
      this.x                = 20;
      this.y                = 100;
      this.frameX           = 0;
      this.frameY           = 0;
      this.maxFrame         = 37;
      this.speedY           = 0;
      this.maxspeed         = 3;
      this.projetiles       = [];
      this.image            = plr;
      this.powerUp          = false;
      this.powerUpTimer     = 0;
      this.powerUpLimit     = 10000;
      this.shooting         = false;
      this.shootingTimer    = 0;
      this.shootingInterval = 125;
    }
    update(deltaTime){
      if (this.game.keys.includes('ArrowUp')) this.speedY = -this.maxspeed;
      else if (this.game.keys.includes('ArrowDown')) this.speedY = this.maxspeed;
      else this.speedY = 0;
      this.y += this.speedY;

      // vertical bounderies
      if (this.y < -(this.height*0.5) ){
        this.y = -(this.height*0.5);
      } else if (this.y > this.game.height - (this.height*0.5) ){
        this.y = this.game.height - (this.height*0.5);
      }

      // handle projectiles
      if (this.shootingTimer>this.shootingInterval){
        if (this.shooting) this.shootTop();
        this.shootingTimer = 0;
      } else this.shootingTimer += deltaTime;
      this.projetiles.forEach( projectile => {
        projectile.update();
      });
      this.projetiles = this.projetiles.filter(projectile => !projectile.markedForDeletion);

      // sprite animation
      if (this.frameX < this.maxFrame){
        this.frameX++;
      } else {
        this.frameX = 0;
      }

      // power up
      if (this.powerUp){
        if (this.powerUpTimer > this.powerUpLimit){
          this.powerUp      = false;
          this.powerUpTimer = 0;
          this.frameY       = 0;
        } else {
          this.powerUpTimer += deltaTime;
          this.frameY = 1;
          if (this.game.ammo<this.game.maxAmmo) this.game.ammo += 0.1;
        }
      }
    }
    draw(context){
      if (this.game.debug) context.strokeRect(this.x, this.y, this.width, this.height);
      this.projetiles.forEach( projectile => {
        projectile.draw(context);
      });
      context.drawImage(
        this.image,
        this.frameX * this.width,  // source x
        this.frameY * this.height, // source y
        this.width,                // source width
        this.height,               // source height
        this.x,                    // dest x
        this.y,                    // dest y
        this.width,                // dest width
        this.height                // dest height
        );
    }
    shootTop(){
      if (this.game.ammo > 0){
        this.projetiles.push(new Projectile(this.game, this.x + 80, this.y + 30));
        this.game.ammo--;
      }
      if (this.powerUp) this.shootBottom();
    }
    shootBottom(){
      if (this.game.ammo > 0){
        this.projetiles.push(new Projectile(this.game, this.x + 80, this.y + 175));
      }
    }
    enterPowerUp(){
      this.powerUpTimer = 0;
      this.powerUp = true;
      this.game.ammo = this.game.maxAmmo;
    }
  }

  class Enemy {
    constructor(game){
      this.game              = game;
      this.x                 = this.game.width;
      this.speedX            = Math.random() * -1.5 - 0.5;
      this.markedForDeletion = false;
      this.frameX            = 0;
      this.frameY            = 0;
      this.maxFrame          = 37;
    }
    update(){
      this.x += this.speedX - this.game.speed;
      if (this.x + this.width < 0) this.markedForDeletion = true;

      // sprite animation
      if ( this.frameX < this.maxFrame ){
        this.frameX++;
      } else {
        this.frameX = 0;
      }
    }
    draw(context){
      if (this.game.debug){
        context.strokeRect(this.x, this.y, this.width, this.height);
        context.font = '20px Helvetica';
        context.fillText(this.lives, this.x, this.y);
      }
      context.drawImage(
        this.image,
        this.width * this.frameX,
        this.height * this.frameY,
        this.width,
        this.height,
        this.x,
        this.y,
        this.width,
        this.height
        );
    }
  }

  class Angler1 extends Enemy {
    constructor(game){
      super(game);
      this.width  = 228;
      this.height = 169;
      this.y      = Math.random() * (this.game.height * 0.95 - this.height);
      this.image  = en1;
      this.frameY = Math.floor(Math.random() * 3);
      this.lives  = 2;
      this.score  = this.lives;
    }
  }

  class Angler2 extends Enemy {
    constructor(game){
      super(game);
      this.width  = 213;
      this.height = 165;
      this.y      = Math.random() * (this.game.height * 0.95 - this.height);
      this.image  = en2;
      this.frameY = Math.floor(Math.random() * 2);
      this.lives  = 3;
      this.score  = this.lives;
    }
  }

  class LuckyFish extends Enemy {
    constructor(game){
      super(game);
      this.width  = 99;
      this.height = 95;
      this.y      = Math.random() * (this.game.height * 0.95 - this.height);
      this.image  = en3;
      this.frameY = Math.floor(Math.random() * 2);
      this.lives  = 3;
      this.score  = 15;
      this.type   = 'lucky';
    }
  }

  class HiveWhale extends Enemy {
    constructor(game){
      super(game);
      this.width  = 400;
      this.height = 227;
      this.y      = Math.random() * (this.game.height * 0.95 - this.height);
      this.image  = en4;
      this.frameY = 0;
      this.lives  = 15;
      this.score  = this.lives;
      this.type   = 'hive';
      this.speedX = Math.random() * -1.2 - 0.2;
    }
  }

  class Layer {
    constructor(game, image, speedModifier){
      this.game          = game;
      this.image         = image;
      this.speedModifier = speedModifier;
      this.width         = 1768;
      this.height        = 500;
      this.x             = 0;
      this.y             = 0;
    }
    update(){
      if (this.x <= -this.width) this.x = 0;
      this.x -= this.game.speed * this.speedModifier;
    }
    draw(context){
      context.drawImage(this.image, this.x, this.y);
      context.drawImage(this.image, this.x+this.width, this.y);
    }
  }

  class Background {
    constructor(game){
      this.game = game;
      this.image1 = bg1;
      this.image2 = bg2;
      this.image3 = bg3;
      this.image4 = bg4;
      this.layer1 = new Layer(this.game, this.image1, 0.2);
      this.layer2 = new Layer(this.game, this.image2, 0.25);
      this.layer3 = new Layer(this.game, this.image3, 1);
      this.layer4 = new Layer(this.game, this.image4, 2.5);
      this.layers = [this.layer1, this.layer2, this.layer3];
    }
    update(){
      this.layers.forEach( layer => layer.update());
    }
    draw(context){
      this.layers.forEach( layer => layer.draw(context));
    }
  }
  class UI {
    constructor(game){
      this.game = game;
      this.fontSize = 25;
      this.fontFamily = 'Bangers';
      this.color = 'white';
    }
    draw(context){
      context.save();
      context.fillStyle     = this.color;
      context.shadowOffsetX = 2;
      context.shadowOffsetY = 2;
      context.shadowColor   = 'black';
      context.shadowBlur    = 10;
      context.font          = this.fontSize+'px '+this.fontFamily;
      // score
      context.fillText('Score: '+this.game.score, 20, 40);
      // timer
      const formattedTime = ((this.game.timeLimit-this.game.gameTime) * 0.001).toFixed(1);
      context.fillText('Timer: '+formattedTime, 20, 100);
      // game over message
      if (this.game.gameOver){
        context.textAlign = 'center';
        let message1;
        let message2;
        if (this.game.score > this.game.winningScore){
          message1 = 'You Win!';
          message2 = 'Well done!';
        } else {
          message1 = 'You Lose!';
          message2 = 'Try again!';
        }
        context.font = '70px ' + this.fontFamily;
        context.fillText(message1, this.game.width * 0.5, this.game.height * 0.5 - 20);
        context.font = '25px ' + this.fontFamily;
        context.fillText(message2, this.game.width * 0.5, this.game.height * 0.5 + 20);
      }

      // ammo
      if (this.game.player.powerUp) context.fillStyle = '#ffffbd';
      for (let i = 0; i < this.game.ammo; i++) {
        context.fillRect(20+5*i, 50, 3, 20);
      }

      context.restore();
    }
  }

  class Game {
    constructor(width, height){
      this.width         = width;
      this.height        = height;
      this.player        = new Player(this);
      this.input         = new InputHandler(this);
      this.ui            = new UI(this);
      this.background    = new Background(this);
      this.keys          = [];
      this.ammo          = 20;
      this.maxAmmo       = 50;
      this.ammoTimer     = 0;
      this.ammoInterval  = 1000;
      this.enemies       = [];
      this.enemyTimer    = 0;
      this.enemyInterval = 3000;
      this.gameOver      = false;
      this.score         = 0;
      this.winningScore  = 10;
      this.gameTime      = 0;
      this.timeLimit     = 200000;
      this.speed         = 1;
      this.debug         = false;
      this.particles     = [];
    }
    update(deltaTime){
      if (!this.gameOver) this.gameTime += deltaTime;
      if (this.gameTime>this.timeLimit) this.gameOver = true;
      this.background.update();
      this.background.layer4.update();
      this.player.update(deltaTime);
      if (this.ammoTimer > this.ammoInterval){
        if (this.ammo < this.maxAmmo){
          this.ammo++;
        }
        this.ammoTimer = 0;
      } else {
        this.ammoTimer += deltaTime;
      }
      this.particles.forEach(particle => particle.update());
      this.particles = this.particles.filter(particle => !particle.markedForDeletion);
      this.enemies.forEach( enemy => {
        enemy.update();
        if (this.checkCollision(this.player, enemy)) {
          enemy.markedForDeletion = true;
          for (let i = 0; i < 10; i++) {
            this.particles.push(new Particle(this, enemy.x, enemy.y + enemy.height*0.5));
          }
          if (enemy.type === 'lucky') this.player.enterPowerUp();
          else this.score--;
        }
        this.player.projetiles.forEach( projectile => {
          if (this.checkCollision(projectile, enemy)) {
            enemy.lives--;
            projectile.markedForDeletion = true;
            this.particles.push(new Particle(this, enemy.x + enemy.width*0.5, enemy.y + enemy.height*0.5));
            if ( enemy.lives <= 0) {
              enemy.markedForDeletion = true;
              for (let i = 0; i < 5; i++) {
                this.particles.push(new Particle(this, enemy.x + enemy.width*0.5, enemy.y + enemy.height*0.5));
              }
              if (!this.gameOver) this.score += enemy.score;
              if (this.score > this.winningScore) this.gameOver = true;
            }
          }
        });
      });
      this.enemies = this.enemies.filter(enemy => !enemy.markedForDeletion);
      if (this.enemyTimer > this.enemyInterval && !this.gameOver){
        this.addEnemy();
        this.enemyTimer = 0;
      } else {
        this.enemyTimer += deltaTime;
      }
    }
    draw(context){
      this.background.draw(context);
      this.player.draw(context);
      this.enemies.forEach(enemy => enemy.draw(context));
      this.particles.forEach(particle => particle.draw(context));
      this.background.layer4.draw(context);
      this.ui.draw(context);
    }
    addEnemy(){
      const randomize = Math.random();
      if (randomize < 0.4) this.enemies.push(new Angler1(this));
      else if (randomize < 0.8) this.enemies.push(new Angler2(this));
      else if (randomize < 0.9) this.enemies.push(new HiveWhale(this));
      else this.enemies.push(new LuckyFish(this));
    }
    checkCollision(rect1, rect2){
      return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
      )
    }
  }

  const game = new Game(canvas.width, canvas.height);

  let lastTime = 0;
  function animate(timeStamp){
    const deltaTime = timeStamp - lastTime;
    lastTime = timeStamp;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    game.update(deltaTime);
    game.draw(ctx);

    requestAnimationFrame(animate);
  }
  animate(0);
});
