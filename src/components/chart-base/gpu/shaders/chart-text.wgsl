// SDF text rendering for chart axis labels and annotations.
//
// Each glyph is an instanced textured quad sampling from an SDF glyph atlas.
// The fragment shader uses smoothstep around the 0.5 edge threshold to
// reconstruct crisp, anti-aliased text at any scale.
//
// SDF rendering reference:
//   Green, C. "Improved Alpha-Tested Magnification for Vector Textures and
//   Special Effects." Valve, SIGGRAPH 2007.
//
// The glyph atlas is generated using the Felzenszwalb & Huttenlocher 2012
// exact Euclidean distance transform (see text-pipeline.ts).

struct Uniforms {
    ortho: mat4x4<f32>,
}

struct GlyphInstance {
    posX: f32, posY: f32,
    sizeW: f32, sizeH: f32,
    u0: f32, v0: f32,
    u1: f32, v1: f32,
    colorR: f32, colorG: f32, colorB: f32, colorA: f32,
}

@group(0) @binding(0) var<storage, read> glyphs: array<GlyphInstance>;
@group(0) @binding(1) var<uniform> uniforms: Uniforms;
@group(0) @binding(2) var sdfAtlas: texture_2d<f32>;
@group(0) @binding(3) var sdfSampler: sampler;

struct VertexOut {
    @builtin(position) pos: vec4<f32>,
    @location(0) uv: vec2<f32>,
    @location(1) color: vec4<f32>,
}

const QUAD = array<vec2<f32>, 6>(
    vec2(0.0, 0.0), vec2(1.0, 0.0), vec2(0.0, 1.0),
    vec2(1.0, 0.0), vec2(1.0, 1.0), vec2(0.0, 1.0),
);

@vertex
fn vs(@builtin(vertex_index) vid: u32, @builtin(instance_index) iid: u32) -> VertexOut {
    let g = glyphs[iid];
    let q = QUAD[vid];
    let pixelPos = vec2(g.posX + q.x * g.sizeW, g.posY + q.y * g.sizeH);

    var out: VertexOut;
    out.pos = uniforms.ortho * vec4(pixelPos, 0.0, 1.0);
    // Interpolate atlas UV from glyph entry bounds.
    out.uv = vec2(mix(g.u0, g.u1, q.x), mix(g.v0, g.v1, q.y));
    out.color = vec4(g.colorR, g.colorG, g.colorB, g.colorA);
    return out;
}

@fragment
fn fs(in: VertexOut) -> @location(0) vec4<f32> {
    let dist = textureSample(sdfAtlas, sdfSampler, in.uv).r;
    // fwidth gives screen-space derivative for scale-adaptive anti-aliasing.
    let edgeWidth = fwidth(dist) * 0.75;
    let alpha = smoothstep(0.5 - edgeWidth, 0.5 + edgeWidth, dist);
    let finalAlpha = alpha * in.color.a;
    if (finalAlpha < 0.01) { discard; }
    return vec4(in.color.rgb, finalAlpha);
}
