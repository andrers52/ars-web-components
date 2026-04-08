// Instanced filled rectangle (and circle) rendering for chart components.
//
// Each instance is a rectangle (or circle) defined by position, size, color,
// and a shape flag.  The vertex shader reads instance data from a storage
// buffer and expands each instance into a 6-vertex quad (2 triangles).
//
// Circles are anti-aliased via smoothstep on the distance from quad center.
//
// Reference: instanced rendering with storage buffers — same pattern used by
// brainiac-engine's SpriteRenderer for textured quads.

struct Uniforms {
    ortho: mat4x4<f32>,
}

struct RectInstance {
    posX: f32, posY: f32,
    sizeW: f32, sizeH: f32,
    colorR: f32, colorG: f32, colorB: f32, colorA: f32,
    shape: f32,  // 0.0 = rectangle, 1.0 = circle
}

@group(0) @binding(0) var<storage, read> rects: array<RectInstance>;
@group(0) @binding(1) var<uniform> uniforms: Uniforms;

struct VertexOut {
    @builtin(position) pos: vec4<f32>,
    @location(0) color: vec4<f32>,
    @location(1) localUV: vec2<f32>,
    @location(2) shape: f32,
}

// 6 vertices forming 2 triangles for a unit quad [0,0]–[1,1].
const QUAD = array<vec2<f32>, 6>(
    vec2(0.0, 0.0), vec2(1.0, 0.0), vec2(0.0, 1.0),
    vec2(1.0, 0.0), vec2(1.0, 1.0), vec2(0.0, 1.0),
);

@vertex
fn vs(@builtin(vertex_index) vid: u32, @builtin(instance_index) iid: u32) -> VertexOut {
    let r = rects[iid];
    let q = QUAD[vid];
    let pixelPos = vec2(r.posX + q.x * r.sizeW, r.posY + q.y * r.sizeH);

    var out: VertexOut;
    out.pos = uniforms.ortho * vec4(pixelPos, 0.0, 1.0);
    out.color = vec4(r.colorR, r.colorG, r.colorB, r.colorA);
    out.localUV = q;
    out.shape = r.shape;
    return out;
}

@fragment
fn fs(in: VertexOut) -> @location(0) vec4<f32> {
    if (in.shape > 0.5) {
        // Circle: distance from quad center, anti-aliased edge.
        let d = distance(in.localUV, vec2(0.5, 0.5));
        if (d > 0.5) { discard; }
        let alpha = 1.0 - smoothstep(0.45, 0.5, d);
        return vec4(in.color.rgb, in.color.a * alpha);
    }
    return in.color;
}
