class FloatHand {
  constructor(id, cx, cy, sz) {
    this.id   = id;
    this.cx   = cx; this.cy = cy; this.sz = sz;
    this.side = id < Math.ceil(HANDS_PER_CHAR / 2) ? 'left' : 'right';
    this.pos  = this._idleSpawn();
    this.vel  = createVector(0, 0);
    this.no   = random(10000);
    this.no2  = random(10000);
  }

  // Allowed X range for this hand's side (stops before character zone)
  _xBounds() {
    const charLeft  = this.cx - this.sz * 0.52;
    const charRight = this.cx + this.sz * 0.52;
    if (this.side === 'left') return { lo: 5,           hi: charLeft  - 10 };
    else                      return { lo: charRight + 10, hi: width - 5   };
  }

  _idleSpawn() {
    const { lo, hi } = this._xBounds();
    const x = random(lo, hi);
    const y = random(this.cy - this.sz * 0.45, this.cy + this.sz * 0.45);
    return createVector(x, y);
  }

  update(strokes) {
    const target = this._pickTarget(strokes);

    if (target) {
      // Active: fly toward displaced point
      const toTarget = p5.Vector.sub(target.pos, this.pos);
      if (toTarget.mag() > 1) this.vel.add(toTarget.normalize().mult(0.9));
      this.vel.limit(4.5);
    } else {
      // Idle: 2-D Perlin wander within side zone
      const angleX = (noise(this.no)  - 0.5) * 2;  // -1 to 1
      const angleY = (noise(this.no2) - 0.5) * 2;
      this.vel.add(createVector(angleX, angleY).mult(0.3));
      this.no  += 0.008;
      this.no2 += 0.007;
      this.vel.limit(1.2);

      // Constrain to allowed zone
      const { lo, hi } = this._xBounds();
      this.pos.x = constrain(this.pos.x, lo, hi);
      this.pos.y = constrain(this.pos.y,
        this.cy - this.sz * 0.48, this.cy + this.sz * 0.48);
    }

    this.vel.mult(0.88);
    this.pos.add(this.vel);

    // Restoration: fingertip contact only
    const tipX = this.pos.x;
    const tipY = this.pos.y - 7;   // offset for size-7 hand
    for (const s of strokes) {
      for (const p of s.points) {
        p.applyRestore(tipX, tipY, 12, 0.18);
      }
    }
  }

  _pickTarget(strokes) {
    const displaced = [];
    for (const s of strokes)
      for (const p of s.points) {
        const d = p5.Vector.dist(p.pos, p.anchor);
        if (d > 3) displaced.push({ p, d });
      }
    if (!displaced.length) return null;
    displaced.sort((a, b) => b.d - a.d);
    return displaced[this.id % displaced.length].p;
  }

  draw() {
    drawHand(this.pos.x, this.pos.y, 7, 180);
  }
}

// ─── shared hand shape ────────────────────────────────────────────────────────
function drawHand(x, y, size, alpha) {
  push();
  translate(x, y);
  fill(255, alpha);
  noStroke();
  const s = size / 14;
  rect(-5*s, -14*s,  5*s, 12*s, 2*s);
  rect( 1*s, -12*s,  5*s, 10*s, 2*s);
  rect( 7*s,  -9*s,  5*s,  9*s, 2*s);
  rect(13*s,  -6*s,  4*s,  8*s, 2*s);
  rect(-12*s,  -2*s,  7*s,  6*s, 2*s);
  rect( -5*s,  -2*s, 22*s, 12*s, 3*s);
  pop();
}
