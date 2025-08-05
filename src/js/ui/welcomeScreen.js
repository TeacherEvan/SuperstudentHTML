export class WelcomeScreen {
  constructor() {
    // Initialization for the welcome screen
  }

  update(deltaTime) {
    // Update logic for the welcome screen
  }

  render(ctx) {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Super Student', ctx.canvas.width / 2, ctx.canvas.height / 2);
  }
}
