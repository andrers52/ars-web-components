// Instanced line segment rendering with optional dashing.
//
// Each line is rendered as an oriented quad (2 triangles) with controllable
// width.  This avoids WebGPU's line-list topology which is limited to 1px
// width on most implementations.
//
// The vertex shader computes tangent and normal vectors from the two
// endpoints, then expands each instance into a 6-vertex quad aligned
// along the line direction.
//
// Dashing is handled in the fragment shader: a lineProgress varying
// tracks position along the segment, and fragments in the "gap" region
// are discarded.  When dashLen == 0, the line is solid (no discard).

struct Uniforms {
    ortho: mat4x4<f32>,
}

struct LineInstance {
    x0: f32, y0: f32,
    x1: f32, y1: f32,
    colorR: f32, colorG: f32, colorB: f32, colorA: f32,
    width: f32,
    dashLen: f32,
    gapLen: f32,
    totalLen: f32,    // precomputed: length(p1 - p0)
}

@group(0) @binding(0) var<storage, read> lines: array<LineInstance>;
@group(0) @binding(1) var<uniform> uniforms: Uniforms;

struct VertexOut {
    @builtin(position) pos: vec4<f32>,
    @location(0) color: vec4<f32>,
    @location(1) lineProgress: f32,   // 0 at start, totalLen at end
    @location(2) dashLen: f32,
    @location(3) gapLen: f32,
}

// 6 vertices: x = 0|1 (along line), y = -0.5|+0.5 (perpendicular).
const QUAD = array<vec2<f32>, 6>(
    vec2(0.0, -0.5), vec2(1.0, -0.5), vec2(0.0, 0.5),
    vec2(1.0, -0.5), vec2(1.0,  0.5), vec2(0.0, 0.5),
);

@vertex
fn vs(@builtin(vertex_index) vid: u32, @builtin(instance_index) iid: u32) -> VertexOut {
    let l = lines[iid];
    let q = QUAD[vid];

    let dir = vec2(l.x1 - l.x0, l.y1 - l.y0);
    let len = length(dir);
    // Degenerate line (zero length) — default to horizontal orientation.
    let tangent = select(vec2(1.0, 0.0), dir / len, len > 0.001);
    let normal = vec2(-tangent.y, tangent.x);

    let pixelPos = vec2(l.x0, l.y0) + tangent * q.x * len + normal * q.y * l.width;

    var out: VertexOut;
    out.pos = uniforms.ortho * vec4(pixelPos, 0.0, 1.0);
    out.color = vec4(l.colorR, l.colorG, l.colorB, l.colorA);
    out.lineProgress = q.x * l.totalLen;
    out.dashLen = l.dashLen;
    out.gapLen = l.gapLen;
    return out;
}

@fragment
fn fs(in: VertexOut) -> @location(0) vec4<f32> {
    // Dashed line: discard fragments in the gap portion of the cycle.
    if (in.dashLen > 0.0) {
        let cycle = in.dashLen + in.gapLen;
        let t = in.lineProgress % cycle;
        if (t > in.dashLen) { discard; }
    }
    return in.color;
}
