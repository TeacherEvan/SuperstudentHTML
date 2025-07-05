export default class Bubble {
  constructor(x, y, radius, letter, speed) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.letter = letter;
    this.speed = speed; // pixels per second upward
    this.markedForRemoval = false;
  }

  update(deltaTime) {
    const dt = deltaTime / 1000; // convert to seconds
    this.y -= this.speed * dt;
    if (this.y + this.radius < 0) {
      this.markedForRemoval = true;
    }
  }

  containsPoint(px, py) {
    const dx = px - this.x;
    const dy = py - this.y;
    return Math.sqrt(dx * dx + dy * dy) <= this.radius;
  }

  draw(ctx) {
    ctx.save();
    // Bubble body with simple radial gradient
    const gradient = ctx.createRadialGradient(
      this.x - this.radius * 0.4,
      this.y - this.radius * 0.4,
      this.radius * 0.2,
      this.x,
      this.y,
      this.radius
    );
    gradient.addColorStop(0, 'rgba(173, 216, 230, 0.9)'); // light blue center
    gradient.addColorStop(1, 'rgba(173, 216, 230, 0.2)'); // fade edge
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Bubble highlight
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.stroke();

    // Draw letter label
    ctx.fillStyle = '#ffffff';
    ctx.font = `${this.radius * 0.8}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.letter.toUpperCase(), this.x, this.y);

    ctx.restore();
  }
}