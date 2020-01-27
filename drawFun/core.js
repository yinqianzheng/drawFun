class DrawFun {
  constructor(elementId) {
    this.canvas = document.getElementById(elementId);
    this.setup();
    this.ctx = this.canvas.getContext("2d");
  }

  setup() {
    this.canvas.classList.add("draw-fun");
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;
  }

  center() {
    this.canvas.classList.add("center");
  }

  centerOff() {
    this.canvas.classList.remove("center");
  }

  showWelcome() {
    this.ctx.font = "30px Arial";
    this.ctx.strokeText("Welcome to Z-World", 10, 30);
  }
}
