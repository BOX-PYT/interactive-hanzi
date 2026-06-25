const INTERP_STEPS = 5;
const CONSTRAINT_ITERATIONS = 4;

class Stroke {
  // cx, cy = character centre; sz = display size
  constructor(medianPoints, cx, cy, sz) {
    this.points = [];
    const mapped = medianPoints.map(([mx, my]) => ({
      x: cx - sz / 2 + (mx / 900) * sz,
      y: cy - sz / 2 + (1 - my / 900) * sz
    }));

    for (let i = 0; i < mapped.length - 1; i++) {
      const a = mapped[i], b = mapped[i + 1];
      for (let s = 0; s <= INTERP_STEPS; s++) {
        if (i > 0 && s === 0) continue;
        const t = s / INTERP_STEPS;
        this.points.push(new BoundPoint(
          a.x + (b.x - a.x) * t,
          a.y + (b.y - a.y) * t
        ));
      }
    }
    if (this.points.length === 0 && mapped.length >= 1) {
      this.points.push(new BoundPoint(mapped[0].x, mapped[0].y));
    }

    this.restLengths = [];
    for (let i = 0; i < this.points.length - 1; i++) {
      this.restLengths.push(p5.Vector.dist(this.points[i].pos, this.points[i + 1].pos));
    }
  }

  update(maxDisplace) {
    for (const p of this.points) p.update(maxDisplace);
    this._enforceConstraints();
  }

  _enforceConstraints() {
    for (let iter = 0; iter < CONSTRAINT_ITERATIONS; iter++) {
      for (let i = 0; i < this.points.length - 1; i++) {
        const a = this.points[i], b = this.points[i + 1];
        const dx = b.pos.x - a.pos.x, dy = b.pos.y - a.pos.y;
        const cur = sqrt(dx * dx + dy * dy);
        if (cur < 0.001) continue;
        const corr = (cur - this.restLengths[i]) / cur * 0.5;
        a.pos.x += dx * corr; a.pos.y += dy * corr;
        b.pos.x -= dx * corr; b.pos.y -= dy * corr;
      }
    }
  }

  draw() {
    if (this.points.length < 2) return;
    beginShape();
    curveVertex(this.points[0].pos.x, this.points[0].pos.y);
    for (const p of this.points) curveVertex(p.pos.x, p.pos.y);
    const last = this.points[this.points.length - 1];
    curveVertex(last.pos.x, last.pos.y);
    endShape();
  }
}
