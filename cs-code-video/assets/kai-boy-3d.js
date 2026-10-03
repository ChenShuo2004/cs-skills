/* =====================================================================
 * KAI 男孩 · 3D 版（主角）· WebGL2 SDF 光线步进，零依赖
 *
 *   const kai = KaiBoy3D(width, height);
 *   kai.render({ t, yaw, mode, pose, expr, bg });
 *   ctx.drawImage(kai.canvas, x, y);
 *
 *   mode  'clay' 白模 | 'color' 上色
 *   pose  'pocket' 手插口袋（默认）| 'wave' 挥手 | 'build' 双手向前（动手做）| 'point' 指向
 *   expr  'calm' 淡定（默认，半睁眼）| 'happy' 开心 | 'wow' 惊讶 | 'think' 思考 | 'sleepy' 发呆
 *   bg    'studio' | 'transparent'
 * 配色（品牌色）：KAI 蓝 #0059C0、亮蓝 #3270D6、卫衣白 #F5EFF5、黑 #111111、浅蓝 #8AC7F5、信号橙 #FF8A1F
 * ===================================================================== */
(function () {
  const VS = `#version 300 es
in vec2 aP; out vec2 vUv; void main(){ vUv=aP*.5+.5; gl_Position=vec4(aP,0.,1.); }`;

  const FS = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform vec2 uRes; uniform float uT, uYaw, uClay, uBgMode, uBlink, uBreath, uTilt, uExpr, uZoom, uCamY;
uniform vec3 uAL0, uAL1, uAR0, uAR1; uniform vec2 uHands;   // 手是否露出来（0 = 插在口袋里）

// 线性空间颜色
const vec3 C_SKIN=vec3(1.,.84,.74), C_HAIR=vec3(.012,.012,.016), C_HOOD=vec3(.84,.8,.84), C_BLUE=vec3(0.,.1,.53),
           C_BLUE2=vec3(.03,.16,.67), C_LBLUE=vec3(.25,.57,.91), C_ORANGE=vec3(1.,.25,.014), C_BLACK=vec3(.013),
           C_SHOE=vec3(.86), C_INK=vec3(.005), C_BLUSH=vec3(.95,.45,.42), C_STRAP=vec3(.0,.05,.25);

float smin(float a,float b,float k){ float h=clamp(.5+.5*(b-a)/k,0.,1.); return mix(b,a,h)-k*h*(1.-h); }
float sdEll(vec3 p,vec3 r){ float k0=length(p/r), k1=length(p/(r*r)); return k0*(k0-1.)/k1; }
float sdCap(vec3 p,vec3 a,vec3 b,float r){ vec3 pa=p-a, ba=b-a; float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.); return length(pa-ba*h)-r; }
float sdRoundCone(vec3 p,vec3 a,vec3 b,float r1,float r2){
  vec3 ba=b-a; float l2=dot(ba,ba), rr=r1-r2, a2=l2-rr*rr, il2=1./l2;
  vec3 pa=p-a; float y=dot(pa,ba), z=y-l2; vec3 xv=pa*l2-ba*y; float x2=dot(xv,xv), y2=y*y*l2, z2=z*z*l2, k=sign(rr)*rr*rr*x2;
  if(sign(z)*a2*z2>k) return sqrt(x2+z2)*il2-r2;
  if(sign(y)*a2*y2<k) return sqrt(x2+y2)*il2-r1;
  return (sqrt(x2*a2*il2)+y*rr)*il2-r1; }
float sdSeg(vec2 p,vec2 a,vec2 b){ vec2 pa=p-a, ba=b-a; float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.); return length(pa-ba*h); }
float sdTorusY(vec3 p,float R,float r){ return length(vec2(length(p.xz)-R,p.y))-r; }
mat2 rot(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }

// 胸前 "KAi"：返回 x=字母距离，y=i 上的橙点距离（字高 1）
vec2 sdLogo(vec2 p){
  float d=sdSeg(p,vec2(0,0),vec2(0,1));
  d=min(d,sdSeg(p,vec2(.05,.42),vec2(.58,1.))); d=min(d,sdSeg(p,vec2(.24,.62),vec2(.62,0)));
  vec2 q=p-vec2(.86,0.);
  d=min(d,sdSeg(q,vec2(0,0),vec2(.32,1))); d=min(d,sdSeg(q,vec2(.32,1),vec2(.64,0))); d=min(d,sdSeg(q,vec2(.15,.34),vec2(.49,.34)));
  d=min(d,sdSeg(p-vec2(1.76,0),vec2(0,0),vec2(0,.62)));
  return vec2(d,length(p-vec2(1.76,.9))); }

const vec3 HEAD=vec3(0.,1.34,0.);
const vec3 PIVOT=vec3(0.,1.0,0.);
vec3 headSpace(vec3 p){ vec3 q=p-PIVOT; q.xy=rot(-uTilt)*q.xy; return q+PIVOT; }

// 材质：1 皮肤 2 头发 3 帽子 4 卫衣 5 裤子 6 鞋 7 帽扣
vec2 map(vec3 p){
  vec3 hp=headSpace(p);
  // ---- 头 ----
  float head=sdEll(hp-HEAD,vec3(.5,.46,.46));
  head=smin(head,sdEll(hp-(HEAD+vec3(0.,-.13,.05)),vec3(.48,.33,.4)),.12);   // 圆圆的脸颊
  vec2 r=vec2(head,1.);
  // ---- 头发：一层外壳，前脸挖空，再加刘海和翘起的发丝 ----
  float shell=sdEll(hp-vec3(0.,1.42,-.03),vec3(.56,.5,.53));
  float faceWin=sdEll(hp-vec3(0.,1.18,.26),vec3(.44,.36,.44));
  float hair=max(shell,-faceWin);
  for(int i=0;i<5;i++){ float x=-.3+.15*float(i), s=sign(x+.001), v=fract(sin(float(i)*12.9)*437.5);   // 刘海：几大撮
    hair=smin(hair,sdRoundCone(hp,vec3(x*.85,1.62,.36),vec3(x+.05*s,1.43+.05*v,.49),.13,.045),.05); }
  vec3 ah=vec3(abs(hp.x),hp.yz);
  hair=smin(hair,sdRoundCone(ah,vec3(.47,1.32,.06),vec3(.58,1.16,.1),.09,.035),.04);          // 两侧翘起
  hair=smin(hair,sdRoundCone(ah,vec3(.45,1.2,-.1),vec3(.54,1.04,-.06),.09,.035),.04);
  hair=smin(hair,max(sdEll(hp-vec3(0.,1.13,-.2),vec3(.43,.2,.3)),hp.z+.02),.06);              // 后脑勺下沿
  hair=smin(hair,sdRoundCone(hp,vec3(.0,1.7,.4),vec3(.1,1.76,.52),.06,.025),.03);       // 帽扣里翘出的一撮
  if(hair<r.x) r=vec2(hair,2.);
  // ---- 反戴的棒球帽 ----
  vec3 cq=hp-vec3(0.,1.56,-.08);
  float dome=sdEll(cq,vec3(.6,.47,.6));
  dome=max(dome,-(hp.y-(1.5+.12*hp.z)));                                                 // 前高后低：前面露出调节带，后面压得低
  vec3 bq=hp-vec3(0.,1.4,-.72); bq.yz=rot(-.3)*bq.yz;
  float brim=sdEll(bq,vec3(.36,.024,.32));                                                // 帽檐朝后、往下斜
  float cap=min(dome,brim);
  if(cap<r.x) r=vec2(cap,3.);
  float btn=length(hp-vec3(0.,2.02,-.1))-.045; if(btn<r.x) r=vec2(btn,7.);
  // ---- 身体：卫衣 ----
  vec3 bp=p; bp.y=(bp.y-.45)/(1.+uBreath)+.45;
  float body=sdEll(bp-vec3(0.,.7,0.),vec3(.35,.31,.28));
  body=smin(body,sdEll(bp-vec3(0.,.55,0.),vec3(.39,.15,.3)),.1);                          // 卫衣下摆
  body=smin(body,sdTorusY(bp-vec3(0.,.99,-.02),.17,.075),.06);                            // 领口
  body=smin(body,sdEll(bp-vec3(0.,1.02,-.24),vec3(.28,.16,.12)),.08);                     // 背后的帽子
  body=smin(body,sdEll(bp-vec3(0.,.6,.25),vec3(.25,.1,.07)),.06);                         // 口袋
  body=smin(body,sdCap(p,uAL0,uAL1,.1),.06);
  body=smin(body,sdCap(p,uAR0,uAR1,.1),.06);
  if(body<r.x) r=vec2(body,4.);
  // 手
  if(uHands.x>.5){ float h=length(p-uAL1-normalize(uAL1-uAL0)*.07)-.075; if(h<r.x) r=vec2(h,1.); }
  if(uHands.y>.5){ float h=length(p-uAR1-normalize(uAR1-uAR0)*.07)-.075; if(h<r.x) r=vec2(h,1.); }
  // ---- 裤子 ----
  vec3 lp=vec3(abs(p.x),p.yz);
  float pants=sdEll(p-vec3(0.,.44,0.),vec3(.33,.12,.26));
  pants=smin(pants,sdCap(lp,vec3(.14,.4,0.),vec3(.15,.16,.01),.125),.06);
  if(pants<r.x) r=vec2(pants,5.);
  // ---- 鞋 ----
  float shoe=sdEll(lp-vec3(.16,.08,.07),vec3(.16,.085,.23));
  if(shoe<r.x) r=vec2(shoe,6.);
  // ---- 地面 ----
  if(p.y<r.x) r=vec2(p.y,0.);
  return r; }

vec3 calcN(vec3 p){ const vec2 k=vec2(1,-1)*.0007; return normalize(k.xyy*map(p+k.xyy).x+k.yyx*map(p+k.yyx).x+k.yxy*map(p+k.yxy).x+k.xxx*map(p+k.xxx).x); }
float shadow(vec3 ro,vec3 rd){ float res=1., t=.02; for(int i=0;i<40;i++){ float h=map(ro+rd*t).x; res=min(res,9.*h/t); t+=clamp(h,.02,.2); if(res<.002||t>4.) break; } return clamp(res,0.,1.); }
float ao(vec3 p,vec3 n){ float o=0., s=1.; for(int i=1;i<=5;i++){ float h=.025*float(i); o+=(h-map(p+n*h).x)*s; s*=.75; } return clamp(1.-2.2*o,0.,1.); }

// 脸：淡定的半睁眼、眉毛、小嘴、脸颊上的三个浅蓝点
vec3 face(vec3 hp,vec3 col,inout float spec){
  if(hp.z<.2||hp.y>1.5) return col;
  float ex=uExpr; // 0 淡定 1 开心 2 惊讶 3 思考 4 发呆
  for(int k=0;k<2;k++){ float s=k==0?-1.:1.; vec2 c=vec2(s*.21,1.27), d=hp.xy-c;
    if(ex==1.){ // ^ ^
      float arc=abs(length(d+vec2(0.,.05))-.075)-.013; if(arc<0.&&d.y>-.02) col=C_INK; continue; }
    float lid=ex==2.?.2:ex==4.?-.025:.022;                     // 上眼皮位置
    lid=mix(lid,-.06,uBlink);
    vec2 rr=ex==2.?vec2(.09,.11):vec2(.084,.104);
    vec2 look=ex==3.?vec2(s*.0+.02,.03):vec2(0.);
    float e=length((d-look*.5)/rr)-1.;
    if(e<0.&&d.y<lid){ col=C_INK; spec=.5;
      if(length(d-look-vec2(.022,.01))<.02) col=vec3(.9);
      if(length(d-look-vec2(-.025,-.035))<.009) col=vec3(.7); }
    if(abs(d.y-lid)<.013&&abs(d.x)<.095&&ex!=2.) col=C_INK;   // 眼皮线
    // 眉毛
    float tilt=ex==3.?s*.03:ex==2.?0.:-.012*s;
    float bw=sdSeg(d,vec2(-.07,.13+tilt),vec2(.07,.13-tilt)); if(ex==2.) bw=sdSeg(d,vec2(-.06,.17),vec2(.06,.17));
    if(bw<.014) col=C_INK;
    // 腮红 + 三个浅蓝点
    float bl=length((hp.xy-vec2(s*.3,1.18))/vec2(.08,.04)); col=mix(col,C_BLUSH,.35*(1.-smoothstep(.4,1.,bl)));
    for(int j=0;j<3;j++){ if(length(hp.xy-vec2(s*(.27+.03*float(j)),1.195+.012*float(j-1)))<.011) col=C_LBLUE; }
  }
  // 嘴
  vec2 m=hp.xy-vec2(0.,1.14);
  if(ex==1.){ if(abs(length(m-vec2(0.,.03))-.035)<.009&&m.y<.03) col=C_INK; }
  else if(ex==2.){ if(length(m/vec2(.022,.028))<1.) col=vec3(.25,.05,.05); }
  else if(sdSeg(m,vec2(-.012,0.),vec2(.012,0.))<.007) col=C_INK;
  return col; }

vec3 bgCol(vec2 uv){ return mix(vec3(.42,.42,.44),vec3(.55,.55,.57),uv.y); }

void main(){
  vec2 uv=(gl_FragCoord.xy*2.-uRes)/uRes.y;
  float dist=5.6/uZoom; vec3 ta=vec3(0.,uCamY,0.);
  vec3 ro=ta+vec3(sin(uYaw)*dist,.2,cos(uYaw)*dist);
  vec3 ww=normalize(ta-ro), uu=normalize(cross(ww,vec3(0,1,0))), vv=cross(uu,ww);
  vec3 rd=normalize(uv.x*uu+uv.y*vv+3.6*ww);
  float t=0., m=-1.; bool hit=false;
  for(int i=0;i<150;i++){ vec3 p=ro+rd*t; vec2 h=map(p); if(h.x<.0006*t){ m=h.y; hit=true; break; } t+=h.x*.9; if(t>14.) break; }
  vec3 bg=bgCol(vUv); vec3 col=bg; float alpha=1.;
  vec3 L=normalize(vec3(-.25,1.,.45));
  if(hit){
    vec3 p=ro+rd*t, n=calcN(p), v=-rd, hp=headSpace(p);
    float sh=shadow(p+n*.004,L), a=ao(p,n);
    if(m<.5){
      float s2=mix(.55,1.,sh)*mix(.35,1.,a);
      if(uBgMode>.5){ col=vec3(0.); alpha=(1.-s2)*.85*smoothstep(1.3,.5,length(p.xz)); }
      else col=bg*s2;
    } else {
      vec3 base=C_SKIN; float spec=.08, sheen=.2, rough=14.;
      if(m==1.){ base=face(hp,C_SKIN*1.12,spec); sheen=.35; a=mix(a,1.,.6); sh=mix(sh,1.,.45); }
      else if(m==2.){ base=C_HAIR; spec=.18; rough=18.; sheen=.6; }
      else if(m==3.){ base=C_BLUE; spec=.3; rough=20.; sheen=.4;
        // 反戴帽子正面：调节带 + 露出的头发
        if(hp.z>.25){ vec2 q=hp.xy-vec2(0.,1.585);
          if(length(q/vec2(.17,.14))<1.&&q.y>-.005) base=C_HAIR;
          if(abs(q.y+.012)<.028&&abs(q.x)<.25){ base=C_STRAP; for(int j=0;j<3;j++) if(length(q-vec2(-.12+.12*float(j)+.06,-.012))<.011) base=C_LBLUE; }
        }
        // 背面帽扣
        if(hp.z<-.35&&abs(hp.x-.06)<.03&&abs(hp.y-1.6)<.04) base=C_ORANGE; }
      else if(m==4.){ base=C_HOOD; sheen=.35;
        vec2 lp=(p.xy-vec2(-.105,.77))/.085; lp.x/=1.35; vec2 lg=sdLogo(lp);
        if(p.z>.18){ if(lg.x<.12) base=C_BLUE2; if(lg.y<.17) base=C_ORANGE;
          vec2 tq=p.xy-vec2(0.,.705); if(tq.y<0.&&tq.y>-.04&&abs(tq.x)<(tq.y+.04)*.7) base=C_ORANGE;   // 橙色小三角
          if(abs(p.y-.6)<.006&&abs(p.x)<.2) base*=.8; } }                                            // 口袋缝线
      else if(m==5.){ base=C_BLACK; spec=.1; sheen=.6; }
      else if(m==6.){ base=C_SHOE; spec=.4; rough=30.; if(p.y<.045) base=C_BLUE2; }
      else if(m==7.){ base=C_BLUE; spec=.5; }
      if(uClay>.5){ base=vec3(.45); spec=.1; sheen=.25; rough=16.; }
      float dif=clamp((dot(n,L)+.25)/1.25,0.,1.)*mix(.25,1.,sh);
      float fill=clamp(dot(n,normalize(vec3(.8,.25,.5))),0.,1.)*.22;
      float back=clamp(dot(n,normalize(vec3(.2,.4,-.9))),0.,1.)*.22;
      float sky=(.55+.45*n.y)*.3;
      float fr=pow(1.-clamp(dot(n,v),0.,1.),2.5);
      vec3 h=normalize(L+v); float sp=pow(clamp(dot(n,h),0.,1.),rough)*spec*sh;
      col=base*(.85*dif+fill+sky*a+back)+vec3(1.,.98,.95)*sp*1.6+base*fr*sheen*.9*a+vec3(.9)*fr*sheen*.08;
      col*=mix(.55,1.,a);
    }
  } else if(uBgMode>.5){ col=vec3(0.); alpha=0.; }
  col=col*1.35; col=col/(1.+col*.25); col=pow(col,vec3(.4545));
  o=vec4(clamp(col,0.,1.),alpha); }`;

  // [左肩, 左手, 右肩, 右手, 左手露出, 右手露出]
  const POSES = {
    pocket: [[-.33, .9, .0], [-.24, .62, .2], [.33, .9, .0], [.24, .62, .2], 0, 0],
    wave:   [[-.33, .9, .0], [-.24, .62, .2], [.34, .92, .02], [.56, 1.24, .1], 0, 1],
    build:  [[-.32, .9, .04], [-.2, .76, .42], [.32, .9, .04], [.2, .76, .42], 1, 1],
    point:  [[-.33, .9, .0], [-.24, .62, .2], [.33, .92, .05], [.62, .96, .34], 0, 1],
  };
  const EXPR = { calm: 0, happy: 1, wow: 2, think: 3, sleepy: 4 };
  const rnd = s => { s = Math.sin(s * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

  window.KaiBoy3D = function (w = 800, h = 800) {
    const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
    const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true, premultipliedAlpha: false, alpha: true });
    if (!gl) throw new Error('KaiBoy3D: 需要 WebGL2');
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog); if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    gl.useProgram(prog);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'aP'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = n => gl.getUniformLocation(prog, n);
    const mix = (a, b, k) => Array.isArray(a) ? a.map((v, i) => v + (b[i] - v) * k) : a + (b - a) * k;

    function render(o = {}) {
      const { t = 0, yaw = 0, mode = 'color', pose = 'pocket', pose2 = null, poseMix = 0, expr = 'calm', bg = 'studio',
        zoom = 1.35, camY = 1.02, tilt = null, seed = 3, blink = null } = o;
      let P = POSES[pose] || POSES.pocket;
      if (pose2 && POSES[pose2]) P = P.map((v, i) => i < 4 ? mix(v, POSES[pose2][i], poseMix) : (poseMix > .5 ? POSES[pose2][i] : v));
      if (pose === 'wave' || pose2 === 'wave') { const k = pose === 'wave' ? 1 - poseMix : poseMix; P = P.slice(); P[3] = [P[3][0] + Math.sin(t * 8) * .06 * k, P[3][1], P[3][2]]; }
      const cyc = 3.4 + rnd(seed) * .8, ph = (t + rnd(seed + 1) * 3) % cyc;
      const bl = blink ?? (ph < .16 ? Math.sin(ph / .16 * Math.PI) : 0);
      gl.viewport(0, 0, w, h);
      gl.uniform2f(U('uRes'), w, h); gl.uniform1f(U('uT'), t); gl.uniform1f(U('uYaw'), yaw);
      gl.uniform1f(U('uClay'), mode === 'clay' ? 1 : 0); gl.uniform1f(U('uBgMode'), bg === 'transparent' ? 1 : 0);
      gl.uniform1f(U('uBlink'), bl); gl.uniform1f(U('uBreath'), Math.sin(t * 2.2) * .01);
      gl.uniform1f(U('uTilt'), tilt ?? Math.sin(t * 1.1 + seed) * .03);
      gl.uniform1f(U('uExpr'), EXPR[expr] ?? 0); gl.uniform1f(U('uZoom'), zoom); gl.uniform1f(U('uCamY'), camY);
      gl.uniform3fv(U('uAL0'), P[0]); gl.uniform3fv(U('uAL1'), P[1]); gl.uniform3fv(U('uAR0'), P[2]); gl.uniform3fv(U('uAR1'), P[3]);
      gl.uniform2f(U('uHands'), P[4], P[5]);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); gl.finish();
      return canvas;
    }
    return { canvas, render };
  };
})();
