/* Texturas procedurais adaptadas do exemplo mosaico-casa-3d(1).html fornecido pelo usuario.
   Three r128; mapas de cor sRGB, relevo linear e escala da miniatura. */
(function(global){
 global.createACMaterials=function(){
    function makeCanvas(size) {
      const c = document.createElement("canvas");
      c.width = c.height = size;
      const ctx = c.getContext("2d");
      return { c, ctx, size };
    }
    function nrand(seed) {
      let s = seed | 0;
      return () => {
        s = (s * 16807 + 0) % 2147483647;
        return (s - 1) / 2147483646;
      };
    }
    function texFrom(canvas, repeatX = 1, repeatY = 1) {
      const t = new THREE.CanvasTexture(canvas);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(repeatX, repeatY);
      t.anisotropy = 4;
      t.encoding = THREE.sRGBEncoding;
      return t;
    }
    function bumpFrom(canvas, repeatX = 1, repeatY = 1) {
      const t = new THREE.CanvasTexture(canvas);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(repeatX, repeatY);
      t.anisotropy = 4;
      return t;
    }

    function stoneTexture() {
      const { c, ctx, size } = makeCanvas(1024);
      ctx.fillStyle = "#3d4652";
      ctx.fillRect(0, 0, size, size);
      const rnd = nrand(42);
      // variation wash
      for (let i = 0; i < 80; i++) {
        const x = rnd() * size, y = rnd() * size, r = 40 + rnd() * 180;
        const g = 48 + rnd() * 30, b = 55 + rnd() * 28, a = 0.08 + rnd() * 0.12;
        ctx.fillStyle = `rgba(${g + 10},${g},${b},${a})`;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
      const rows = 14, cols = 8;
      const bh = size / rows, bw = size / cols;
      for (let r = 0; r < rows; r++) {
        const offset = (r % 2) * (bw * 0.5);
        for (let col = -1; col <= cols; col++) {
          const x = col * bw + offset + (rnd() - 0.5) * 6;
          const y = r * bh + (rnd() - 0.5) * 4;
          const w = bw - 5 - rnd() * 6;
          const h = bh - 5 - rnd() * 5;
          const shade = 70 + rnd() * 38;
          const blue = shade + 8 + rnd() * 10;
          ctx.fillStyle = `rgb(${shade - 8},${shade},${blue})`;
          ctx.fillRect(x, y, w, h);
          // inner noise
          ctx.fillStyle = `rgba(0,0,0,${0.08 + rnd() * 0.12})`;
          ctx.fillRect(x + 2, y + h * 0.55, w - 4, h * 0.4);
          // highlight edge
          ctx.fillStyle = `rgba(200,210,220,${0.05 + rnd() * 0.07})`;
          ctx.fillRect(x, y, w, 2);
          // moss
          if (rnd() > 0.62) {
            ctx.fillStyle = `rgba(40,70,48,${0.12 + rnd() * 0.2})`;
            ctx.fillRect(x + rnd() * w * 0.4, y + h * 0.6, w * 0.5, h * 0.35);
          }
        }
      }
      // mortar cracks / wet streaks
      ctx.globalAlpha = 0.18;
      for (let i = 0; i < 30; i++) {
        ctx.strokeStyle = rnd() > 0.5 ? "#1a2028" : "#6a7888";
        ctx.lineWidth = 1 + rnd() * 1.5;
        ctx.beginPath();
        ctx.moveTo(rnd() * size, 0);
        ctx.lineTo(rnd() * size, size);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      return c;
    }

    function plasterTexture() {
      const { c, ctx, size } = makeCanvas(1024);
      ctx.fillStyle = "#7d8278";
      ctx.fillRect(0, 0, size, size);
      const rnd = nrand(99);
      for (let i = 0; i < 1800; i++) {
        const x = rnd() * size, y = rnd() * size;
        const v = 110 + rnd() * 40;
        ctx.fillStyle = `rgba(${v - 8},${v},${v - 12},${0.15 + rnd() * 0.25})`;
        ctx.fillRect(x, y, 2 + rnd() * 6, 2 + rnd() * 5);
      }
      // rain stains
      for (let i = 0; i < 40; i++) {
        const x = rnd() * size;
        const grd = ctx.createLinearGradient(x, 0, x, size);
        grd.addColorStop(0, "rgba(30,40,45,0)");
        grd.addColorStop(0.3, `rgba(25,35,40,${0.08 + rnd() * 0.12})`);
        grd.addColorStop(1, "rgba(20,28,32,0.18)");
        ctx.fillStyle = grd;
        ctx.fillRect(x, 0, 6 + rnd() * 18, size);
      }
      // patches / discoloration
      for (let i = 0; i < 25; i++) {
        ctx.fillStyle = `rgba(50,58,52,${0.08 + rnd() * 0.12})`;
        ctx.beginPath();
        ctx.ellipse(rnd() * size, rnd() * size, 30 + rnd() * 80, 18 + rnd() * 40, rnd() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      return c;
    }

    function timberTexture() {
      const { c, ctx, size } = makeCanvas(512);
      const rnd = nrand(7);
      ctx.fillStyle = "#241910";
      ctx.fillRect(0, 0, size, size);
      for (let y = 0; y < size; y++) {
        const wave = Math.sin(y * 0.08) * 8;
        const shade = 28 + Math.sin(y * 0.3) * 6 + rnd() * 10;
        ctx.fillStyle = `rgb(${shade + 8},${shade},${shade - 6})`;
        ctx.fillRect(0, y, size, 1);
        if (rnd() > 0.97) {
          ctx.fillStyle = "rgba(10,8,6,0.4)";
          ctx.fillRect(wave + rnd() * size, y, 40 + rnd() * 80, 1);
        }
      }
      // grain lines
      ctx.globalAlpha = 0.25;
      for (let i = 0; i < 18; i++) {
        ctx.strokeStyle = rnd() > 0.5 ? "#3a2a1c" : "#120e0a";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(rnd() * size, 0);
        ctx.bezierCurveTo(rnd() * size, size * 0.3, rnd() * size, size * 0.6, rnd() * size, size);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      return c;
    }

    function roofTexture() {
      const { c, ctx, size } = makeCanvas(1024);
      ctx.fillStyle = "#2a3038";
      ctx.fillRect(0, 0, size, size);
      const rnd = nrand(21);
      const rows = 22, cols = 16;
      const th = size / rows, tw = size / cols;
      for (let r = 0; r < rows; r++) {
        const off = (r % 2) * tw * 0.5;
        for (let col = -1; col <= cols; col++) {
          const x = col * tw + off, y = r * th;
          const shade = 38 + rnd() * 22;
          ctx.fillStyle = `rgb(${shade - 4},${shade},${shade + 6})`;
          ctx.beginPath();
          ctx.moveTo(x + 2, y);
          ctx.lineTo(x + tw - 2, y);
          ctx.lineTo(x + tw * 0.5, y + th - 2);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = "rgba(10,12,16,0.45)";
          ctx.lineWidth = 1;
          ctx.stroke();
          // wet sheen
          ctx.fillStyle = `rgba(180,200,220,${0.04 + rnd() * 0.06})`;
          ctx.fillRect(x + tw * 0.2, y + 2, tw * 0.25, 3);
        }
      }
      return c;
    }

    function rockTexture() {
      const { c, ctx, size } = makeCanvas(1024);
      ctx.fillStyle = "#2f3640";
      ctx.fillRect(0, 0, size, size);
      const rnd = nrand(55);
      for (let i = 0; i < 220; i++) {
        const x = rnd() * size, y = rnd() * size;
        const rw = 20 + rnd() * 90, rh = 16 + rnd() * 70;
        const s = 40 + rnd() * 35;
        ctx.fillStyle = `rgba(${s - 6},${s},${s + 8},${0.25 + rnd() * 0.4})`;
        ctx.beginPath();
        ctx.ellipse(x, y, rw, rh, rnd() * 2, 0, Math.PI * 2);
        ctx.fill();
      }
      for (let i = 0; i < 80; i++) {
        ctx.strokeStyle = `rgba(10,12,16,${0.15 + rnd() * 0.3})`;
        ctx.lineWidth = 1 + rnd() * 2;
        ctx.beginPath();
        ctx.moveTo(rnd() * size, rnd() * size);
        ctx.lineTo(rnd() * size, rnd() * size);
        ctx.stroke();
      }
      return c;
    }

    function goldTexture() {
      const { c, ctx, size } = makeCanvas(256);
      const rnd = nrand(3);
      const g = ctx.createLinearGradient(0, 0, size, size);
      g.addColorStop(0, "#8a6a28");
      g.addColorStop(0.4, "#e8d080");
      g.addColorStop(0.7, "#b89440");
      g.addColorStop(1, "#f4e2a0");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
      for (let i = 0; i < 80; i++) {
        ctx.fillStyle = `rgba(255,240,180,${rnd() * 0.2})`;
        ctx.fillRect(rnd() * size, rnd() * size, 8, 8);
      }
      return c;
    }


 const result={};
 function material(name,canvas,bump,roughness=.86){const map=texFrom(canvas);const relief=bumpFrom(canvas);result[name]=new THREE.MeshStandardMaterial({map,bumpMap:relief,bumpScale:bump,roughness});}
 material('stone',stoneTexture(),.004);material('plaster',plasterTexture(),.0012);
 material('wood',timberTexture(),.002,.78);material('floor',timberTexture(),.001,.8);
 material('slate',roofTexture(),.0025,.78);material('rock',rockTexture(),.009,.98);
 const water=makeCanvas(512);water.ctx.fillStyle='#152e3c';water.ctx.fillRect(0,0,512,512);
 for(let row=0;row<38;row++){water.ctx.strokeStyle=row%3?'#27495a':'#486673';water.ctx.lineWidth=1.2;water.ctx.beginPath();for(let x=0;x<=512;x+=4){const y=row*14+Math.sin(x*.025+row)*3.5; if(x===0)water.ctx.moveTo(x,y);else water.ctx.lineTo(x,y);}water.ctx.stroke();}
 material('water',water.c,.0015,.28);
 return result;
 };
})(window);
