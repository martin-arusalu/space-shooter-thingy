var stage,
  queue,
  player,
  enemies = [],
  lifeTokens = [],
  bosses = [],
  bullets = [],
  livesDisplay = [],
  stuffSprites,
  explosionSprite,
  levelBoss = false,
  loading,
  stats,
  keys = {
    up: false,
    down: false,
    left: false,
    right: false
  },
  game = {
    flyingSpeed: 2,
    bulletSpeed: 5,
    lives: 3,
    level: 0,
    enemiesKilled: 0,
    score: 0,
    highScore: 0,
    started: false
  }

function preload() {
    stage = new createjs.Stage("myCanvas");
    queue = new createjs.LoadQueue(true);
    queue.installPlugin(createjs.Sound);
    queue.loadManifest([
      { id: "interstellar", src: "sound/background.min.mp3" },
      { id: 'stuffSprites', src: 'sprites/stuff.json' },
      { id: 'explosionSprite', src: 'sprites/hh.json' },
      { id: "shot", src: "sound/shot.mp3" },
      { id: "explosion", src: "sound/explosion.mp3" }
    ]);
  
    loading = new createjs.Text("Loading", "20px pixelFont", "#fff");
    loading.textBaseline = "middle";
    loading.textAlign = "center";
    loading.x = stage.canvas.width / 2;
    loading.y = stage.canvas.height / 2;
    stage.addChild(loading)
  
    queue.addEventListener('progress', progress);
    queue.addEventListener('complete', setup);
}

function progress(e) {
  let percent = Math.round(e.progress * 100);
  loading.text = "Loading: " + percent + "%";
  stage.update();
}

function setup() {
    stage.removeChild(loading);
    createjs.Ticker.setFPS(60);
    createjs.Ticker.addEventListener('tick', tickHappened);
    createjs.Sound.play('interstellar');
    stuffSprites = new createjs.SpriteSheet(queue.getResult('stuffSprites'));
    explosionSprite = new createjs.SpriteSheet(queue.getResult('explosionSprite'));
    showStartScreen();
}

function showStartScreen() {
  stage.removeAllChildren();
  let welcome = new createjs.Text("Some Space Shooter Thingy!", "20px pixelFont", "#fff");
  welcome.y = 150;
  let highScore = new createjs.Text("Your high score is: " + game.highScore, "13px pixelFont", "#fff");
  highScore.y = 200;
  let instructions = new createjs.Text("Press arrow keys to move.\nPress spacebar to shoot enemies.\nCollect lives\nPress M to mute / unmute sounds", "10px pixelFont", "#fff");
  instructions.y = 230;
  let startBtnTxt = new createjs.Text("New game", "15px pixelFont", "#111");
  startBtnTxt.y = 350;
  let startBtnShape = new createjs.Shape();
  startBtnShape.graphics.beginFill('#fff').drawRect(0, 0, 140, 40);
  startBtnShape.y = 330;
  startBtnShape.x = stage.canvas.width / 2 - 70;
  startBtnShape.addEventListener('click', startGame);
    
  welcome.textBaseline = highScore.textBaseline = instructions.textBaseline = startBtnTxt.textBaseline = "middle";
  welcome.textAlign = highScore.textAlign = instructions.textAlign = startBtnTxt.textAlign = "center";
  welcome.x = highScore.x = instructions.x = startBtnTxt.x = stage.canvas.width / 2;

  stage.addChild(welcome, highScore, instructions, startBtnShape, startBtnTxt);
}

function startGame() {
  stage.removeAllChildren();
  reset();
  createPlayer();
  createEnemy();
  nextLevel();
  createStats();
}

function createStats() {
  let text = "Score: " + game.score + " Level: " + game.level;
  stats = new createjs.Text(text, "13px pixelFont", "#fff");
  stats.y = 30;
  stats.x = 10;
  for (let i = 0; i < game.lives; i++) {
    let life = new createjs.Sprite(stuffSprites, "life");
    life.x = 10 + i * 17;
    life.y = 70;
    life.scaleX = life.scaleY = 0.05;
    life.width = life.height = 11;
    livesDisplay.push(life);
    stage.addChild(life);
  }
  stage.addChild(stats);
}

function updateStats() {
  for (life of livesDisplay) stage.removeChild(life);
  livesDisplay = [];
  for (let i = 0; i < game.lives; i++) {
    let life = new createjs.Sprite(stuffSprites, "life");
    life.x = 10 + i * 17;
    life.y = 70;
    life.scaleX = life.scaleY = 0.05;
    life.width = life.height = 11;
    livesDisplay.push(life);
    stage.addChild(life);
  }
  stats.text = "Score: " + game.score + " Level: " + game.level;
}

function createPlayer() {
  player = new createjs.Sprite(stuffSprites, "player");
  player.width = 63
  player.height = 40.5;
  player.x = 10;
  player.y = stage.canvas.height / 2 - player.height / 2;
  player.scaleX = player.scaleY = 0.06;
  stage.addChild(player);
}

function createEnemy() {
  var enemy = new createjs.Sprite(stuffSprites, "enemy");
  enemy.width = 57;
  enemy.height = 33;
  enemy.y = Math.floor(Math.random() * 550);
  enemy.x = 600;
  enemy.scaleX = 0.04;
  enemy.scaleY = 0.04;
  stage.addChild(enemy);
  enemies.push(enemy);
}

function reset() {
  game.lives = 3;
  game.level = 0;
  game.enemiesKilled = 0;
  game.started = true;
  game.score = 0;
  enemies = [];
  bosses = [];
  bullets = [];
  levelBoss = false;
}

function nextLevel() {
  game.level++;
  levelBoss = false;
  let levelTxt = new createjs.Text("Level " + game.level, "25px pixelFont", "#fff");
  levelTxt.y = stage.canvas.height / 2;
  levelTxt.x = stage.canvas.width / 2;
  levelTxt.textBaseline = "middle";
  levelTxt.textAlign = "center";
  stage.addChild(levelTxt);
  createjs.Tween
    .get(levelTxt)
    .wait(500)
    .to({ alpha: 0, visible: false }, 1000)
    .call(() => stage.removeChild(levelTxt));
}

function tickHappened(e) {
  if (game.started) {
    moveToLeft(enemies);
    moveToLeft(lifeTokens);
    moveBullets();
    moveBoss();
    movePlayer();
    doCollisionChecking();
    spawnEnemy();
    spawnBoss();
    spawnLife();
    updateStats();
  }
  stage.update(e);
}

function moveToLeft(elements) {
    for(var i = elements.length - 1; i >= 0; i--){
        elements[i].x -= game.flyingSpeed;

        if(elements[i].x <= -1*elements[i].width){
            stage.removeChild(elements[i]);
            elements.splice(i, 1);
        }
    }
}

function moveBullets() {
  for (var i = bullets.length - 1; i >= 0; i--){
    if (bullets[i].dir == "left") bullets[i].x -= game.bulletSpeed;
    else bullets[i].x += game.bulletSpeed;
        if(bullets[i].x > 601 || bullets[i].x < 0){
            stage.removeChild(bullets[i]);
            bullets.splice(i, 1);
        }
    }
}

function moveBoss() {
  for (boss of bosses) {
    if (boss.y > player.y) boss.y--;
    else boss.y++;
  }
}

function movePlayer() {
  if (keys.up == true && player.y > 0) player.y -= 3;
  if (keys.down == true && player.y < stage.canvas.height - player.width) player.y += 3;
  if (keys.left == true && player.x > 3) player.x -= 3;
  if (keys.right == true && player.x < stage.canvas.width - player.width) player.x += 3;
}

function lifeChanger(arr, add) {
  for (var i = arr.length - 1; i >= 0; i--) {
    if (hitTest(player, arr[i])) {
      if (add) game.lives++;
      else {
        game.lives--;
        explode(arr[i]);
      };
      stage.removeChild(arr[i]);
      arr.splice(i, 1);
    }
  }
}

function explode(o) {
  let explosion = new createjs.Sprite(explosionSprite, 'explode');
  createjs.Sound.play("explosion", {volume: 0.3});
  explosion.x = o.x + o.width / 2;
  explosion.y = o.y;
  explosion.rotation = 90;
  stage.addChild(explosion);
  createjs.Tween.get(explosion)
    .wait(200)
    .to({ alpha: 0, visible: false }, 10)
    .call(() => { 
      stage.removeChild(explosion);
    });
}

function doCollisionChecking() {
  lifeChanger(lifeTokens, true);
  lifeChanger(enemies, false);

    //bullets vs enemies
    for(var b = bullets.length - 1; b >= 0; b--){
        for(var e = enemies.length - 1; e >= 0; e--){
            if(bullets[b].dir == "right" && hitTest(enemies[e], bullets[b])){
                stage.removeChild(enemies[e]);
                stage.removeChild(bullets[b]);
                explode(enemies[e]);
                enemies.splice(e,1);
                bullets.splice(b,1);
                game.enemiesKilled++;
                game.score++;
                break;
            }
        }
        for (let i = bosses.length - 1; i >= 0; i--) {
          if (bullets[b] && bullets[b].dir == "right" && hitTest(bosses[i], bullets[b])) {
            if (bosses[i].lives == 1) {
              stage.removeChild(bosses[i]);
              window.clearInterval(bosses[i].shooter);
              explode(bosses[i]);
              bosses.splice(i, 1);
              game.enemiesKilled++;
            } else {
              bosses[i].lives--;
            }
            game.score++;
            stage.removeChild(bullets[b]);
            bullets.splice(b, 1);
            break;
          }
        };
        if (bullets[b] && bullets[b].dir == "left" && hitTest(player, bullets[b])) {
          game.lives--;
          stage.removeChild(bullets[b]);
          bullets.splice(b, 1);
          break;
        }
    }
  
    if (game.lives <= 0) endGame();
  
    if (game.enemiesKilled >= Math.pow(game.level, 1.8)){
      nextLevel();
    }
}

function endGame() {
  stage.removeAllChildren();

  for (boss of bosses) window.clearInterval(boss.shooter);
  if (game.score > game.highScore) game.highScore = game.score;
  game.started = false;
  let dead = new createjs.Text("You are dead!", "25px pixelFont", "#fff");
  dead.y = 150;
  let score = new createjs.Text("Score was: " + game.score, "13px pixelFont", "#fff");
  score.y = 180;
  let homeBtnTxt = new createjs.Text("Home", "15px pixelFont", "#111");
  homeBtnTxt.y = 250;
  let homeBtnShape = new createjs.Shape();
  homeBtnShape.graphics.beginFill('#fff').drawRect(0, 0, 140, 40);
  homeBtnShape.y = 230;
  homeBtnShape.x = stage.canvas.width / 2 - 70;
  homeBtnShape.addEventListener('click', showStartScreen);
    
  dead.x = score.x = homeBtnTxt.x = stage.canvas.width / 2;
  dead.textBaseline = score.textBaseline = homeBtnTxt.textBaseline = "middle";
  dead.textAlign = score.textAlign = homeBtnTxt.textAlign = "center";

  stage.addChild(dead, score, homeBtnShape, homeBtnTxt);
}

function spawnEnemy() {
    let rand = Math.random() * 100;
    if (rand < game.level / 4) createEnemy();
}

function spawnLife() {
  if (Math.random() < 0.0003 && game.lives < 5) {
    let life = new createjs.Sprite(stuffSprites, "life");
    life.scaleX = life.scaleY = 0.04;
    life.width = life.height = 11;
    life.x = 600;
    life.y = Math.random() * 600 - life.height;
    stage.addChild(life);
    lifeTokens.push(life);
  }
}

function spawnBoss() {
  if (game.level % 4 == 0 && !levelBoss) {
    let boss = new createjs.Sprite(stuffSprites, "boss");
    boss.scaleX = boss.scaleY = 0.03;
    boss.width = 60.75;
    boss.height = 47.25;
    boss.x = stage.canvas.width - boss.width;
    boss.y = Math.random() * (stage.canvas.height - boss.height);
    boss.lives = game.level;
    bosses.push(boss);
    stage.addChild(boss);
    boss.shooter = window.setInterval(() => {
      shoot(boss, true);
    }, 1000);
    levelBoss = true;
  }
}

function hitTest(rect1, rect2) {
    if(rect1.x >= rect2.x + rect2.width
        || rect1.x + rect1.width <= rect2.x
        || rect1.y >= rect2.y + rect2.height
        || rect1.y + rect1.height <= rect2.y){
        return false;
    }
    return true;
}

function shoot(shooter, left) {
    createjs.Sound.play("shot", {volume: 0.1});
    let bullet = new createjs.Shape();
    bullet.graphics.beginFill("#FFF").drawCircle(0, 0, 4);
    bullet.x = left ? shooter.x : shooter.x + shooter.width;
    bullet.y = shooter.y + shooter.height / 2;
    bullet.width = bullet.height = 4;
    bullet.dir = left ? "left" : "right";
    stage.addChild(bullet);
    bullets.push(bullet);
}

// KEYS
function onKeyDown(e) {
  if (game.started) {
    switch (e.keyCode) {
        case 38:
            keys.up = true;
            break;
        case 40:
            keys.down = true;
            break;
        case 37:
            keys.left = true;
            break;
        case 39:
            keys.right = true;
            break;
        case 77:
          createjs.Sound.muted = !createjs.Sound.muted;
    }
  }
}

function onKeyUp(e) {
  if (game.started) {
    switch (e.keyCode) {
        case 32:
            shoot(player, false);
            break;
        case 38:
            keys.up = false;
            break;
        case 40:
            keys.down = false;
            break;
        case 37:
            keys.left = false;
            break;
        case 39:
            keys.right = false;
            break;
    }
  }
}

// EVENTS
window.addEventListener('load', preload);
window.onkeydown = onKeyDown;
window.onkeyup = onKeyUp;