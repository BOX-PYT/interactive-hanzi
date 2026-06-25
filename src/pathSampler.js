// Parse and sample points from SVG path strings (M, L, C commands)
// HanziWriter data uses a 1000x1000 coordinate space

function sampleStrokePath(pathStr, numSamples, targetW, targetH) {
  const commands = parsePath(pathStr);
  const points = [];
  let cx = 0, cy = 0;

  // Collect raw curve segments
  const segments = [];
  for (const cmd of commands) {
    if (cmd.type === 'M') {
      cx = cmd.x; cy = cmd.y;
    } else if (cmd.type === 'L') {
      segments.push({ type: 'L', x0: cx, y0: cy, x1: cmd.x, y1: cmd.y });
      cx = cmd.x; cy = cmd.y;
    } else if (cmd.type === 'C') {
      segments.push({
        type: 'C',
        x0: cx, y0: cy,
        x1: cmd.x1, y1: cmd.y1,
        x2: cmd.x2, y2: cmd.y2,
        x3: cmd.x, y3: cmd.y
      });
      cx = cmd.x; cy = cmd.y;
    }
  }

  if (segments.length === 0) return points;

  // Sample evenly across all segments
  const totalLen = segments.reduce((s, seg) => s + segmentLength(seg), 0);
  const step = totalLen / (numSamples - 1);
  let accumulated = 0;
  let segIdx = 0;
  let segStart = 0;

  for (let i = 0; i < numSamples; i++) {
    const target = i * step;
    while (segIdx < segments.length - 1) {
      const segLen = segmentLength(segments[segIdx]);
      if (segStart + segLen >= target) break;
      segStart += segLen;
      segIdx++;
    }
    const seg = segments[segIdx];
    const segLen = segmentLength(seg);
    const t = segLen > 0 ? Math.min((target - segStart) / segLen, 1) : 0;
    const pt = evalSegment(seg, t);

    // Map from HanziWriter 1000x1000 space to canvas, flip Y axis
    points.push({
      x: map(pt.x, 0, 1000, (width - targetW) / 2, (width + targetW) / 2),
      y: map(1000 - pt.y, 0, 1000, (height - targetH) / 2, (height + targetH) / 2)
    });
  }

  return points;
}

function parsePath(d) {
  const commands = [];
  const re = /([MLCZmlcz])([\s,0-9.\-e]+)*/g;
  let m;
  while ((m = re.exec(d)) !== null) {
    const type = m[1].toUpperCase();
    const nums = (m[2] || '').trim().split(/[\s,]+/).filter(Boolean).map(Number);
    if (type === 'M') {
      commands.push({ type: 'M', x: nums[0], y: nums[1] });
    } else if (type === 'L') {
      commands.push({ type: 'L', x: nums[0], y: nums[1] });
    } else if (type === 'C') {
      // May contain multiple sets of 6 numbers
      for (let i = 0; i + 5 < nums.length; i += 6) {
        commands.push({
          type: 'C',
          x1: nums[i], y1: nums[i+1],
          x2: nums[i+2], y2: nums[i+3],
          x: nums[i+4], y: nums[i+5]
        });
      }
    }
  }
  return commands;
}

function evalSegment(seg, t) {
  if (seg.type === 'L') {
    return {
      x: lerp(seg.x0, seg.x1, t),
      y: lerp(seg.y0, seg.y1, t)
    };
  }
  // Cubic bezier
  const mt = 1 - t;
  return {
    x: mt*mt*mt*seg.x0 + 3*mt*mt*t*seg.x1 + 3*mt*t*t*seg.x2 + t*t*t*seg.x3,
    y: mt*mt*mt*seg.y0 + 3*mt*mt*t*seg.y1 + 3*mt*t*t*seg.y2 + t*t*t*seg.y3
  };
}

function segmentLength(seg, steps = 20) {
  let len = 0;
  let prev = evalSegment(seg, 0);
  for (let i = 1; i <= steps; i++) {
    const cur = evalSegment(seg, i / steps);
    len += Math.hypot(cur.x - prev.x, cur.y - prev.y);
    prev = cur;
  }
  return len;
}

function lerp(a, b, t) { return a + (b - a) * t; }
function map(v, a, b, c, d) { return c + (v - a) / (b - a) * (d - c); }
