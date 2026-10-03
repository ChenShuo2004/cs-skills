/* =====================================================================
 * KAI 猫 · 3D 版（WebGL2 SDF 光线步进，零依赖）
 *
 *   const cat = KaiCat3D(width, height);
 *   cat.render({ t, yaw, mode, pose, expr, bg, ... });   // 画面只由参数决定
 *   ctx.drawImage(cat.canvas, x, y);                     // 叠进任何 2D 画面
 *
 *   mode  'clay' 白模（只看形体比例）| 'color' 上色
 *   pose  'stand' | 'build' | 'wave' | 'point'
 *   expr  'smile' | 'happy' | 'focus'
 *   bg    'studio' 浅灰影棚 | 'transparent' 透明底（只留接触阴影）
 *   yaw   相机绕角色水平旋转（弧度），0 = 正面
 * 坐标：角色站在 y=0，身高约 2.0，正面朝 +z
 * ===================================================================== */
(function () {
  const VS = `#version 300 es
in vec2 aP; out vec2 vUv; void main(){ vUv=aP*.5+.5; gl_Position=vec4(aP,0.,1.); }`;

  const FS = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform vec2 uRes; uniform float uT, uYaw, uClay, uBgMode, uBlink, uTail, uBreath, uTilt, uExpr, uZoom, uCamY;
uniform vec3 uAL0, uAL1, uAR0, uAR1;

// 颜色用线性空间（输出时再做 gamma），对应 sRGB：炭灰 #54545A、耳机黄 #FCC23C、闪电红 #E5262B、KAI 蓝 #2F80F5
const vec3 C_FUR=vec3(.085,.085,.095), C_CREAM=vec3(.86,.78,.64), C_YEL=vec3(.97,.53,.045), C_CUSH=vec3(.045,.045,.058),
           C_WHITE=vec3(.88), C_BLUE=vec3(.025,.2,.9), C_RED=vec3(.78,.018,.022), C_INK=vec3(.006), C_BLUSH=vec3(.85,.24,.24);

float smin(float a,float b,float k){ float h=clamp(.5+.5*(b-a)/k,0.,1.); return mix(b,a,h)-k*h*(1.-h); }
float sdEll(vec3 p,vec3 r){ float k0=length(p/r), k1=length(p/(r*r)); return k0*(k0-1.)/k1; }
float sdCap(vec3 p,vec3 a,vec3 b,float r){ vec3 pa=p-a, ba=b-a; float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.); return length(pa-ba*h)-r; }
float sdRoundCone(vec3 p,vec3 a,vec3 b,float r1,float r2){
  vec3 ba=b-a; float l2=dot(ba,ba), rr=r1-r2, a2=l2-rr*rr, il2=1./l2;
  vec3 pa=p-a; float y=dot(pa,ba), z=y-l2; vec3 xv=pa*l2-ba*y; float x2=dot(xv,xv), y2=y*y*l2, z2=z*z*l2, k=sign(rr)*rr*rr*x2;
  if(sign(z)*a2*z2>k) return sqrt(x2+z2)*il2-r2;
  if(sign(y)*a2*y2<k) return sqrt(x2+y2)*il2-r1;
  return (sqrt(x2*a2*il2)+y*rr)*il2-r1; }
float sdCapTorus(vec3 p,vec2 sc,float ra,float rb){ p.x=abs(p.x); float k=(sc.y*p.x>sc.x*p.y)?dot(p.xy,sc):length(p.xy); return sqrt(max(dot(p,p)+ra*ra-2.*ra*k,0.))-rb; }
float sdCylX(vec3 q,float r,float h,float rb){ vec2 d=vec2(length(q.yz)-r+rb,abs(q.x)-h+rb); return min(max(d.x,d.y),0.)+length(max(d,0.))-rb; }
float sdSeg(vec2 p,vec2 a,vec2 b){ vec2 pa=p-a, ba=b-a; float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.); return length(pa-ba*h); }
mat2 rot(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }

// 闪电（2D 多边形，高 1）
float sdBolt(vec2 p){
  vec2 v[7]=vec2[7](vec2(.08,.5),vec2(-.3,-.08),vec2(-.02,-.08),vec2(-.2,-.5),vec2(.32,.1),vec2(.04,.1),vec2(.32,.5));
  float d=dot(p-v[0],p-v[0]), s=1.;
  for(int i=0,j=6;i<7;j=i,i++){ vec2 e=v[j]-v[i], w=p-v[i], b=w-e*clamp(dot(w,e)/dot(e,e),0.,1.); d=min(d,dot(b,b));
    bvec3 c=bvec3(p.y>=v[i].y,p.y<v[j].y,e.x*w.y>e.y*w.x); if(all(c)||all(not(c))) s*=-1.; }
  return s*sqrt(d); }
// KAI 字（2D，字高 1，左下为原点）
float sdKAI(vec2 p){
  float d=sdSeg(p,vec2(0,0),vec2(0,1));
  d=min(d,sdSeg(p,vec2(.05,.42),vec2(.58,1.))); d=min(d,sdSeg(p,vec2(.24,.62),vec2(.62,0)));
  vec2 q=p-vec2(.86,0.);
  d=min(d,sdSeg(q,vec2(0,0),vec2(.32,1))); d=min(d,sdSeg(q,vec2(.32,1),vec2(.64,0))); d=min(d,sdSeg(q,vec2(.15,.34),vec2(.49,.34)));
  d=min(d,sdSeg(p-vec2(1.76,0),vec2(0,0),vec2(0,1)));
  return d; }

const vec3 HEAD=vec3(0.,1.27,0.);
const float EY=1.19;   // 眼睛中心高度
const vec3 PIVOT=vec3(0.,.95,0.);
vec3 headSpace(vec3 p){ vec3 q=p-PIVOT; q.xy=rot(-uTilt)*q.xy; return q+PIVOT; }
float eyeE(vec3 hp,float s){ vec2 c=vec2(s*.27,EY); float ry=.16*max(1.-uBlink,.05); return length((hp.xy-c)/vec2(.138,ry))-1.; }

vec2 map(vec3 p){
  vec3 hp=headSpace(p);
  // ---- 绒毛主体 ----
  float head=sdEll(hp-HEAD,vec3(.5,.41,.44));
  head=smin(head,sdEll(hp-(HEAD+vec3(0.,-.11,.08)),vec3(.47,.3,.38)),.14);              // 下半张脸更圆润
  float eyes=min(eyeE(hp,-1.),eyeE(hp,1.));
  head+=.007*(1.-smoothstep(-.1,.05,eyes))*step(.2,hp.z);                              // 眼睛微微内凹
  vec3 ex=vec3(abs(hp.x),hp.yz);
  vec3 ez=vec3(ex.x,ex.y,(ex.z-.02)*1.5); float ear=sdRoundCone(ez,vec3(.27,1.5,0.),vec3(.39,1.82,0.),.19,.075)/1.5;
  float fur=smin(head,ear,.06);
  vec3 bp=p; bp.y=(bp.y-.08)/(1.+uBreath)+.08;
  float body=sdEll(bp-vec3(0.,.56,0.),vec3(.35,.38,.33));
  body=smin(body,sdEll(bp-vec3(0.,.34,.04),vec3(.39,.28,.36)),.14);
  fur=smin(fur,body,.1);
  vec3 fp=vec3(abs(p.x),p.yz);
  fur=smin(fur,sdEll(fp-vec3(.17,.075,.07),vec3(.15,.085,.19)),.05);
  fur=smin(fur,sdCap(p,uAL0,uAL1,.088),.05);
  fur=smin(fur,sdCap(p,uAR0,uAR1,.088),.05);
  // 尾巴
  vec3 tp=p-vec3(.22,.28,-.2); tp.xy=rot(uTail)*tp.xy;
  float tail=1e3; vec3 pa=vec3(0.);
  for(int i=1;i<=10;i++){ float s=float(i)/10.;
    vec3 pb=vec3(.3*sin(s*2.1)+.02*s, .55*s*s+.06*s - .1*s*s*s*s, -.22*sin(s*2.4));   // 向侧后方伸出再向上卷
    pb.x-= .16*smoothstep(.75,1.,s);
    tail=smin(tail,sdCap(tp,pa,pb,.082-.014*s),.03); pa=pb; }
  fur=smin(fur,tail,.05);
  vec2 r=vec2(fur,1.);
  // ---- 内耳 ----
  float tri=sdRoundCone(vec3(ex.xy,0.),vec3(.3,1.6,0.),vec3(.37,1.76,0.),.08,.03);      // 内耳：耳朵正面的一块区域
  float inner=max(max(ear-.006,tri),-(ex.z-.03)); if(inner<r.x) r=vec2(inner,2.);
  // ---- 耳机 ----
  vec3 q=hp-HEAD;
  vec3 qb=vec3(q.x,q.y+.06,q.z+.05); float band=sdCapTorus(qb,vec2(sin(1.54),cos(1.54)),.62,.068);
  if(band<r.x) r=vec2(band,3.);
  float pad=sdCapTorus(qb,vec2(sin(.6),cos(.6)),.57,.058);
  if(pad<r.x) r=vec2(pad,4.);
  vec3 cq=vec3(abs(q.x),q.yz);
  float cush=sdCylX(cq-vec3(.49,-.06,0.),.23,.06,.05); if(cush<r.x) r=vec2(cush,4.);
  float cup=sdCylX(cq-vec3(.6,-.06,0.),.27,.09,.08); if(cup<r.x) r=vec2(cup,3.);
  vec2 b2=vec2(q.z*sign(q.x),q.y+.06)/.26; float bolt=max(sdBolt(b2)*.26,abs(cq.x-.69)-.012)-.004; if(bolt<r.x) r=vec2(bolt,5.);
  // ---- 胸前 KAI ----
  float H=.15; vec2 tp2=(p.xy-vec2(-.19,.53))/H; tp2.x/=1.4;
  float txt=max(sdKAI(tp2)*H-.024,abs(p.z-.33)-.035)-.008;
  if(txt<r.x) r=vec2(txt,6.);
  // ---- 地面 ----
  if(p.y<r.x) r=vec2(p.y,0.);
  return r; }

vec3 calcN(vec3 p){ const vec2 k=vec2(1,-1)*.0007; return normalize(k.xyy*map(p+k.xyy).x+k.yyx*map(p+k.yyx).x+k.yxy*map(p+k.yxy).x+k.xxx*map(p+k.xxx).x); }
float shadow(vec3 ro,vec3 rd){ float res=1., t=.02; for(int i=0;i<40;i++){ float h=map(ro+rd*t).x; res=min(res,9.*h/t); t+=clamp(h,.02,.2); if(res<.002||t>4.) break; } return clamp(res,0.,1.); }
float ao(vec3 p,vec3 n){ float o=0., s=1.; for(int i=1;i<=5;i++){ float h=.025*float(i); o+=(h-map(p+n*h).x)*s; s*=.75; } return clamp(1.-2.2*o,0.,1.); }

// 脸部贴花：眼睛、眉毛、鼻子、嘴、腮红
vec3 face(vec3 hp,vec3 col,inout float spec){
  if(hp.z<.12) return col;
  for(int k=0;k<2;k++){ float s=k==0?-1.:1.; vec2 c=vec2(s*.27,EY);
    float e=eyeE(hp,s);
    if(uBlink>.85||uExpr==1.){ // 闭眼 / 开心眯眼
      vec2 d=hp.xy-c-vec2(0.,uExpr==1.?-.06:.04); float r=.09;
      float arc=abs(length(d)-r)-.011; bool half_=uExpr==1.?d.y>0.:d.y<0.;
      if(arc<0.&&half_&&abs(d.x)<.085) col=C_INK; continue; }
    if(e<0.){ col=C_WHITE; spec=.6;
      vec2 b=(hp.xy-c-vec2(-.005,-.008))/.3; b.x/=1.1;
      float bo=sdBolt(b);
      vec3 rc=uExpr==2.?C_RED*1.25:C_RED;
      if(bo<0.) col=rc;
      if(length(hp.xy-c-vec2(.04,.068))<.026) col=C_WHITE;
      if(e>-.08) col*=.55; }
    // 眉毛
    vec2 bq=hp.xy-vec2(s*.25,EY+.2); float bw=sdSeg(vec2(bq.x*s,bq.y),vec2(-.07,-.005),vec2(0.,.012)); bw=min(bw,sdSeg(vec2(bq.x*s,bq.y),vec2(0.,.012),vec2(.07,-.002)));
    if(bw<.0125) col=C_INK;
    // 腮红
    float bl=length((hp.xy-vec2(s*.36,EY-.13))/vec2(.08,.045)); col=mix(col,C_BLUSH,.55*(1.-smoothstep(.5,1.,bl)));
  }
  // 鼻子
  vec2 n=hp.xy-vec2(0.,EY-.075); if(length(n/vec2(.03,.019))<1.&&n.y>-.019) col=C_INK;
  // 嘴 ω
  for(int k=0;k<2;k++){ float s=k==0?-1.:1.; vec2 m=hp.xy-vec2(s*.036,EY-.1); if(abs(length(m)-.036)<.008&&m.y<.004) col=C_INK; }
  return col; }

vec3 bgCol(vec2 uv){ return mix(vec3(.42,.42,.44),vec3(.55,.55,.57),uv.y); }  // 线性空间，映射后约 #c8c8cb

void main(){
  vec2 uv=(gl_FragCoord.xy*2.-uRes)/uRes.y;
  float dist=5.6/uZoom; vec3 ta=vec3(0.,uCamY,0.);
  vec3 ro=ta+vec3(sin(uYaw)*dist,.2,cos(uYaw)*dist);
  vec3 ww=normalize(ta-ro), uu=normalize(cross(ww,vec3(0,1,0))), vv=cross(uu,ww);
  vec3 rd=normalize(uv.x*uu+uv.y*vv+3.6*ww);
  float t=0., m=-1.; bool hit=false;
  // 包围体：只在角色附近步进
  for(int i=0;i<150;i++){ vec3 p=ro+rd*t; vec2 h=map(p); if(h.x<.0006*t){ m=h.y; hit=true; break; } t+=h.x*.9; if(t>14.) break; }
  vec3 bg=bgCol(vUv); vec3 col=bg; float alpha=1.;
  vec3 L=normalize(vec3(-.25,1.,.45));
  if(hit){
    vec3 p=ro+rd*t, n=calcN(p), v=-rd, hp=headSpace(p);
    float sh=shadow(p+n*.004,L), a=ao(p,n);
    if(m<.5){ // 地面
      float s2=mix(.55,1.,sh)*mix(.35,1.,a);
      if(uBgMode>.5){ col=vec3(0.); alpha=(1.-s2)*.85*smoothstep(1.3,.5,length(p.xz)); }   // 透明底：只留角色脚下的阴影
      else col=bg*s2;
    } else {
      vec3 base=C_FUR; float spec=.06, sheen=1.1, rough=10.;
      if(m==2.) base=C_CREAM;
      else if(m==3.){ base=C_YEL; spec=.55; sheen=.1; rough=40.; }
      else if(m==4.){ base=C_CUSH; spec=.25; sheen=.2; rough=20.; }
      else if(m==5.){ base=C_WHITE; spec=.4; sheen=0.; }
      else if(m==6.){ base=C_BLUE; spec=.7; sheen=.1; rough=60.; }
      if(m==1.) base=face(hp,base,spec);
      if(uClay>.5){ base=vec3(.45); spec=.1; sheen=.25; rough=16.; }
      float dif=clamp((dot(n,L)+.25)/1.25,0.,1.)*mix(.25,1.,sh);
      float fill=clamp(dot(n,normalize(vec3(.8,.25,.5))),0.,1.)*.22;
      float back=clamp(dot(n,normalize(vec3(.2,.4,-.9))),0.,1.)*.22;
      float sky=(.55+.45*n.y)*.3;
      float fr=pow(1.-clamp(dot(n,v),0.,1.),2.5);
      vec3 h=normalize(L+v); float sp=pow(clamp(dot(n,h),0.,1.),rough)*spec*sh;
      col=base*(.85*dif+fill+sky*a+back)+vec3(1.,.98,.95)*sp*1.6+base*fr*sheen*.9*a+vec3(.9)*fr*sheen*.12;
      col*=mix(.55,1.,a);
    }
  } else if(uBgMode>.5){ col=vec3(0.); alpha=0.; }
  col=col*1.35; col=col/(1.+col*.25); col=pow(col,vec3(.4545));   // 色调映射 + gamma
  o=vec4(clamp(col,0.,1.),alpha); }`;

  const POSES = {   // [左肩, 左爪, 右肩, 右爪]
    stand: [[-.28, .8, .06], [-.39, .57, .17], [.28, .8, .06], [.39, .57, .17]],
    build: [[-.24, .76, .16], [-.18, .95, .32], [.24, .76, .16], [.18, .95, .32]],
    wave:  [[-.28, .8, .06], [-.39, .57, .17], [.27, .84, .04], [.46, 1.08, .12]],
    point: [[-.28, .8, .06], [-.39, .57, .17], [.26, .82, .1], [.44, .86, .36]],
  };
  const EXPR = { smile: 0, happy: 1, focus: 2 };
  const rnd = s => { s = Math.sin(s * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

  window.KaiCat3D = function (w = 800, h = 800) {
    const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
    const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true, premultipliedAlpha: false, alpha: true });
    if (!gl) throw new Error('KaiCat3D: 需要 WebGL2');
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog); if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    gl.useProgram(prog);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'aP'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = n => gl.getUniformLocation(prog, n);
    const lerp3 = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);

    function render(o = {}) {
      const { t = 0, yaw = 0, mode = 'color', pose = 'stand', pose2 = null, poseMix = 0, expr = 'smile', bg = 'studio',
        zoom = 1.18, camY = .98, tilt = null, seed = 1, blink = null } = o;
      let P = POSES[pose] || POSES.stand;
      if (pose2 && POSES[pose2]) P = P.map((v, i) => lerp3(v, POSES[pose2][i], poseMix));   // 姿势之间平滑过渡
      if (pose === 'wave' || pose2 === 'wave') { const k = pose === 'wave' ? 1 - poseMix : poseMix; P = P.slice(); P[3] = [P[3][0] + Math.sin(t * 8) * .05 * k, P[3][1], P[3][2]]; }
      if (pose === 'build') { const k = Math.sin(t * 5) * .02; P = P.slice(); P[1] = [P[1][0], P[1][1] + k, P[1][2]]; P[3] = [P[3][0], P[3][1] - k, P[3][2]]; }
      const cyc = 3.2 + rnd(seed) * .8, ph = (t + rnd(seed + 1) * 3) % cyc;
      const bl = blink ?? (ph < .16 ? Math.sin(ph / .16 * Math.PI) : 0);
      gl.viewport(0, 0, w, h);
      gl.uniform2f(U('uRes'), w, h); gl.uniform1f(U('uT'), t); gl.uniform1f(U('uYaw'), yaw);
      gl.uniform1f(U('uClay'), mode === 'clay' ? 1 : 0); gl.uniform1f(U('uBgMode'), bg === 'transparent' ? 1 : 0);
      gl.uniform1f(U('uBlink'), bl); gl.uniform1f(U('uTail'), Math.sin(t * 1.9 + seed) * .14);
      gl.uniform1f(U('uBreath'), Math.sin(t * 2.4) * .012); gl.uniform1f(U('uTilt'), tilt ?? Math.sin(t * 1.3 + seed) * .035);
      gl.uniform1f(U('uExpr'), EXPR[expr] ?? 0); gl.uniform1f(U('uZoom'), zoom); gl.uniform1f(U('uCamY'), camY);
      gl.uniform3fv(U('uAL0'), P[0]); gl.uniform3fv(U('uAL1'), P[1]); gl.uniform3fv(U('uAR0'), P[2]); gl.uniform3fv(U('uAR1'), P[3]);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); gl.finish();
      return canvas;
    }
    return { canvas, render };
  };
})();
