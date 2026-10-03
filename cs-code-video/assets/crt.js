// CRT 质感后期层：把一块画好内容的 Canvas，经 WebGL2 着色器加上
// 弧面、扫描线、荧光点、暗角、色散、光晕，画到显示画布上。
// 用法（在 render(t) 最后调用）：
//   const crt = createCRT(sourceCanvas, displayCanvas, { curve: .12, scan: .35 });
//   crt.draw(t);
// 注意：源画布只当纹理用，可以 display:none；显示画布才是截图对象。
function createCRT(src, dst, o = {}) {
  const opt = Object.assign({ curve: .12, scan: .35, mask: .18, vignette: .45, aberration: 1.2, glow: .35, noise: .04, flicker: .02 }, o);
  const gl = dst.getContext('webgl2', { preserveDrawingBuffer: true, antialias: false });
  if (!gl) throw new Error('WebGL2 不可用');
  const vs = `#version 300 es
  in vec2 p; out vec2 uv; void main(){ uv = p*.5+.5; uv.y = 1.-uv.y; gl_Position = vec4(p,0,1); }`;
  const fs = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o;
  uniform sampler2D tex; uniform vec2 res; uniform float t;
  uniform float curve, scan, mask, vignette, aberration, glow, noise, flicker;
  float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
  vec2 bend(vec2 u){ u = u*2.-1.; u *= 1. + curve*dot(u.yx,u.yx)*.5; return u*.5+.5; }
  vec3 samp(vec2 u){ return texture(tex, u).rgb; }
  void main(){
    vec2 u = bend(uv);
    if (u.x<0.||u.x>1.||u.y<0.||u.y>1.) { o = vec4(0,0,0,1); return; }
    vec2 px = aberration / res;
    vec3 c = vec3(samp(u+px).r, samp(u).g, samp(u-px).b);
    vec3 b = vec3(0.);                                    // 简易光晕：周围 8 点取亮部
    for (int i=0;i<8;i++){ float a = float(i)*.785; b += max(samp(u+vec2(cos(a),sin(a))*6./res)-.55,0.); }
    c += b/8.*glow*3.;
    float line = .5+.5*sin(u.y*res.y*3.14159);            // 扫描线
    c *= 1.-scan*(1.-line);
    float m = mod(floor(uv.x*res.x),3.);                  // RGB 荧光点
    c *= 1.-mask + mask*vec3(m==0.?1.4:.8, m==1.?1.4:.8, m==2.?1.4:.8);
    vec2 v = u*(1.-u); c *= mix(1., pow(v.x*v.y*16., .35), vignette);
    c += (h(uv*res+floor(t*24.))-.5)*noise;              // 颗粒按 24fps 变
    c *= 1.-flicker*(.5+.5*sin(t*110.));
    o = vec4(c,1);
  }`;
  const sh = (type, s) => { const x = gl.createShader(type); gl.shaderSource(x, s); gl.compileShader(x);
    if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const pg = gl.createProgram(); gl.attachShader(pg, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pg, sh(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(pg); gl.useProgram(pg);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pg, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
  const U = n => gl.getUniformLocation(pg, n);
  return {
    draw(t) {
      gl.viewport(0, 0, dst.width, dst.height);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
      gl.uniform2f(U('res'), dst.width, dst.height); gl.uniform1f(U('t'), t);
      for (const k of ['curve', 'scan', 'mask', 'vignette', 'aberration', 'glow', 'noise', 'flicker']) gl.uniform1f(U(k), opt[k]);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); gl.finish();
    },
  };
}
