class BoundPoint {
  constructor(x, y) {
    this.anchor = createVector(x, y);
    this.pos    = createVector(x, y);
    this.vel    = createVector(0, 0);
  }

  // Mouse drag: push in drag direction
  applyPush(ix, iy, radius, dx, dy, strength) {
    const d = dist(this.pos.x, this.pos.y, ix, iy);
    if (d > radius) return;
    const mouseMag = sqrt(dx * dx + dy * dy);
    if (mouseMag < 0.5) return;
    const falloff = 1 - d / radius;
    const f = createVector(dx, dy).normalize().mult(falloff * strength * min(mouseMag, 20));
    this.vel.add(f);
  }

  // Floating hand: spring-style restore (proportional to displacement, no overshoot)
  applyRestore(hx, hy, handRadius, strength) {
    const displacement = p5.Vector.dist(this.pos, this.anchor);
    if (displacement < 0.5) return;
    const dToHand = dist(this.pos.x, this.pos.y, hx, hy);
    if (dToHand > handRadius) return;
    const t = 1 - dToHand / handRadius;
    // Force proportional to remaining displacement — naturally decelerates, no overshoot
    const f = p5.Vector.sub(this.anchor, this.pos).mult(t * strength);
    this.vel.add(f);
    this.vel.mult(0.65);  // extra damping during contact prevents oscillation
  }

  update(maxDisplace) {
    this.vel.mult(0.82);
    this.pos.add(this.vel);
    // Hard clamp
    const d = p5.Vector.dist(this.pos, this.anchor);
    if (d > maxDisplace) {
      const clamped = p5.Vector.sub(this.pos, this.anchor).setMag(maxDisplace).add(this.anchor);
      this.pos.set(clamped);
      this.vel.mult(0.2);
    }
  }
}
