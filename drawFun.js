const sketch = function(p) {
  let model, rnn_state;
  let temperature = 0.1;
  let modelLoaded = false;
  let isAIMode = false;

  let x, y, dx, dy, startX, startY;
  let pen = [0, 0, 0];
  let prev_pen = [1, 0, 0];
  let isUserDrawing = false;
  let hasUnshownLines = 0;

  let userHasDrawn = false;
  let userDrawnLines;
  let currentRawLine = [];
  let strokes;
  let line_color = "black";

  p.setup = function() {
    p.createCanvas(900, 700);
    p.frameRate(60);

    restart();
    setModel(0);
    setupToolListener();
  };

  p.draw = function() {
    if (!modelLoaded || !isAIMode || rnn_state === undefined) {
      return;
    }
    pen = prev_pen;
    rnn_state = model.update([dx, dy, ...pen], rnn_state);
    const pdf = model.getPDF(rnn_state, temperature);
    [dx, dy, ...pen] = model.sample(pdf);

    if (pen[2] === 1) {
      isAIMode = false;
    } else {
      if (prev_pen[0] === 1) {
        p.line(x, y, x + dx, y + dy);
      }
      x += dx;
      y += dy;
      prev_pen = pen;
    }
  };

  p.isInBounds = function() {
    return (
      p.mouseX >= 0 &&
      p.mouseX < p.width &&
      p.mouseY >= 0 &&
      p.mouseY < p.height
    );
  };

  p.mousePressed = function() {
    if (p.isInBounds()) {
      if (!userHasDrawn) {
        userHasDrawn = true;
        startX = p.mouseX;
        startY = p.mouseY;
        x = startX;
        y = startY;
        isUserDrawing = true;
      }

      hasUnshownLines = isUserDrawing;
      isAIMode = false;
      p.stroke(line_color);
    }
  };

  p.mouseDragged = function() {
    if (!p.isInBounds() || isAIMode) return;
    dx = p.mouseX - x;
    dy = p.mouseY - y;
    isUserDrawing = true;
    if (hasUnshownLines) {
      p.line(x, y, x + dx, y + dy);
    }
    x += dx;
    y += dy;
    currentRawLine.push([x, y]);
    hasUnshownLines = isUserDrawing;
  };

  p.mouseReleased = function() {
    if (p.isInBounds()) {
      isUserDrawing = false;
      const simplifiedLines = model.simplifyLine(currentRawLine);

      if (simplifiedLines.length > 1) {
        const lastPos = getLastDrawPos(userDrawnLines);
        const stroke = model.lineToStroke(simplifiedLines, lastPos);
        userDrawnLines.push(simplifiedLines);
        strokes = strokes.concat(stroke);
        showUserDrawing(strokes);
      }

      currentRawLine = [];
    }

    isAIMode = true;
    hasUnshownLines = isUserDrawing;
  };

  function getLastDrawPos(lines) {
    let lastX, lastY;
    if (lines.length === 0) {
      lastX = startX;
      lastY = startY;
    } else {
      const idx = lines.length - 1;
      const lastPoint = lines[idx][lines[idx].length - 1];
      lastX = lastPoint[0];
      lastY = lastPoint[1];
    }
    return [lastX, lastY];
  }

  function restart() {
    p.background(255, 255, 255, 255);
    p.strokeWeight(5.0);

    userHasDrawn = false;
    isUserDrawing = true;
    hasUnshownLines = false;
    userDrawnLines = [];
    currentRawLine = [];
    strokes = [];

    isAIMode = false;
    prev_pen = [0, 1, 0];
  }

  function showUserDrawing(sequence) {
    let newState = model.zeroState();
    newState = model.update(model.zeroInput(), newState);
    newState = model.updateStrokes(sequence, newState, sequence.length - 1);
    rnn_state = model.copyState(newState);

    const idx = userDrawnLines.length - 1;
    const lastPoint = userDrawnLines[idx][userDrawnLines[idx].length - 1];
    x = lastPoint[0];
    y = lastPoint[1];

    const s = sequence[sequence.length - 1];
    dx = s[0];
    dy = s[1];
    prev_pen = [s[2], s[3], s[4]];

    isAIMode = true;

    p.background(255, 255, 255, 255);
    drawStrokes(sequence, startX, startY);
  }

  function drawStrokes(lines, startX, startY) {
    let x = startX;
    let y = startY;
    let dx, dy;
    let pen = [0, 0, 0];
    let prev_pen = [1, 0, 0];
    for (let i = 0; i < lines.length; i++) {
      [dx, dy, ...pen] = lines[i];

      if (prev_pen[2] === 1) {
        break;
      }

      if (prev_pen[0] === 1) {
        p.line(x, y, x + dx, y + dy);
      }
      x += dx;
      y += dy;
      prev_pen = pen;
    }
    p.stroke("#cbcbcb");
  }

  function setModel(index) {
    modelLoaded = false;
    p.fill("black");
    p.stroke("white");
    p.textSize(20);
    p.text("Loading model...", 20, 50);
    if (model) {
      model.dispose();
    }
    model = new ms.SketchRNN(`${modelURL}${allModels[index]}.gen.json`);

    Promise.all([model.initialize()]).then(function() {
      modelLoaded = true;
      p.fill("white");
      p.stroke("white");
      p.text("Loading model...", 20, 50);
      p.stroke(line_color);

      model.setPixelFactor(5.0);
      if (strokes.length > 0) {
        showUserDrawing(strokes);
      }
    });
  }

  function setupToolListener() {
    models.innerHTML = allModels.map(m => `<option>${m}</option>`).join("");

    models.addEventListener("change", () => setModel(models.selectedIndex));

    clearBtn.addEventListener("click", restart);

    colorPicker.addEventListener("change", e => {
      line_color = e.target.value;
    });
  }
};

const modelURL =
  "https://storage.googleapis.com/quickdraw-models/sketchRNN/models/";
const allModels = [
  "garden",
  "face",
  "cat",
  "pig",
  "bird",
  "ant",
  "ambulance",
  "angel",
  "alarm_clock",
  "antyoga",
  "backpack",
  "barn",
  "basket",
  "bear",
  "bee",
  "beeflower",
  "bicycle",
  "book",
  "brain",
  "bridge",
  "bulldozer",
  "bus",
  "butterfly",
  "cactus",
  "calendar",
  "castle",
  "catbus",
  "catpig",
  "chair",
  "couch",
  "crab",
  "crabchair",
  "crabrabbitfacepig",
  "cruise_ship",
  "diving_board",
  "dog",
  "dogbunny",
  "dolphin",
  "duck",
  "elephant",
  "elephantpig",
  "eye",
  "fan",
  "fire_hydrant",
  "firetruck",
  "flamingo",
  "flower",
  "floweryoga",
  "frog",
  "frogsofa",
  "hand",
  "hedgeberry",
  "hedgehog",
  "helicopter",
  "kangaroo",
  "key",
  "lantern",
  "lighthouse",
  "lion",
  "lionsheep",
  "lobster",
  "map",
  "mermaid",
  "monapassport",
  "monkey",
  "mosquito",
  "octopus",
  "owl",
  "paintbrush",
  "palm_tree",
  "parrot",
  "passport",
  "peas",
  "penguin",
  "pigsheep",
  "pineapple",
  "pool",
  "postcard",
  "power_outlet",
  "rabbit",
  "rabbitturtle",
  "radio",
  "radioface",
  "rain",
  "rhinoceros",
  "rifle",
  "roller_coaster",
  "sandwich",
  "scorpion",
  "sea_turtle",
  "sheep",
  "skull",
  "snail",
  "snowflake",
  "speedboat",
  "spider",
  "squirrel",
  "steak",
  "stove",
  "strawberry",
  "swan",
  "swing_set",
  "the_mona_lisa",
  "tiger",
  "toothbrush",
  "toothpaste",
  "tractor",
  "trombone",
  "truck",
  "whale",
  "windmill",
  "yoga",
  "yogabicycle",
  "everything"
];

new p5(sketch, "sketch");
