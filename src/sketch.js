// Three vertical characters, each with 10 repair hands
// Touch-compatible (p5 maps touch → mouseX/Y automatically)

let DISPLAY_CHARS  = ['不', '知', '道'];
const HANDS_PER_CHAR = 6;
const PUSH_RADIUS    = 50;
const PUSH_STRENGTH  = 6;

let slots = [];   // Array of CharSlot

// ─── CharSlot ─────────────────────────────────────────────────────────────────
class CharSlot {
  constructor(ch, idx) {
    this.ch  = ch;
    this.idx = idx;         // 0 = top, 1 = middle, 2 = bottom
    this.strokes = [];
    this.hands   = [];
    this._rebuild();
  }

  // Derived geometry (recalculated each call so resize works)
  get cx() { return width / 2; }
  get cy() { return (this.idx + 0.5) * height / DISPLAY_CHARS.length; }
  get sz() { return min(width * 0.78, height / DISPLAY_CHARS.length * 0.82); }

  _rebuild() {
    this.strokes = [];
    this.hands   = Array.from({ length: HANDS_PER_CHAR },
                               (_, i) => new FloatHand(i, this.cx, this.cy, this.sz));
    this._fetchChar();
  }

  _fetchChar() {
    const char = this.ch;
    const base = 'https://cdn.jsdelivr.net/npm/hanzi-writer-data@2';
    const url  = `${base}/${encodeURIComponent(char)}.json`;
    const { cx, cy, sz } = this;
    fetch(url)
      .then(r => {
        if (!r.ok) throw new Error(r.status);
        return r.json();
      })
      .then(data => {
        this.strokes = data.medians.map(m => new Stroke(m, cx, cy, sz));
        this.loadError = false;
      })
      .catch(() => {
        console.warn('字符不在数据集中:', char);
        this.loadError = true;
      });
  }

  applyPush(mx, my, dx, dy) {
    for (const s of this.strokes)
      for (const p of s.points)
        p.applyPush(mx, my, PUSH_RADIUS, dx, dy, PUSH_STRENGTH);
  }

  update() {
    const maxD = this.sz * 0.25;
    for (const s of this.strokes) s.update(maxD);
    for (const h of this.hands)   h.update(this.strokes);
  }

  draw() {
    noFill();
    stroke(255);
    strokeWeight(2.5);
    for (const s of this.strokes) s.draw();
    for (const h of this.hands)   h.draw();
  }
}

// ─── p5 lifecycle ─────────────────────────────────────────────────────────────
function setup() {
  createCanvas(windowWidth, windowHeight);
  slots = DISPLAY_CHARS.map((ch, i) => new CharSlot(ch, i));
}

function draw() {
  background(0);

  if (mouseIsPressed) {
    const dx = mouseX - pmouseX, dy = mouseY - pmouseY;
    for (const slot of slots)
      slot.applyPush(mouseX, mouseY, dx, dy);
  }

  for (const slot of slots) {
    slot.update();
    slot.draw();
  }

  // Cursor hand
  if (!('ontouchstart' in window) || mouseIsPressed) {
    drawHand(mouseX, mouseY, 7, 255);
  }
}


function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  slots = DISPLAY_CHARS.map((ch, i) => new CharSlot(ch, i));
}

// Called from HTML modal
function updateChars(c1, c2, c3) {
  DISPLAY_CHARS[0] = c1;
  DISPLAY_CHARS[1] = c2;
  DISPLAY_CHARS[2] = c3;
  slots = DISPLAY_CHARS.map((ch, i) => new CharSlot(ch, i));
}

// Prevent scroll/zoom only when touching the canvas, not UI buttons
function touchStarted(e) { if (e.target.tagName === 'CANVAS') return false; }
function touchMoved(e)   { if (e.target.tagName === 'CANVAS') return false; }
function touchEnded(e)   { if (e.target.tagName === 'CANVAS') return false; }
