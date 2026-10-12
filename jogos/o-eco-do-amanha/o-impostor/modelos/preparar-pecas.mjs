// Prepara as peças de RA do VestChip (GLB do designer, 10–11/10/2026) para o celular:
//  - sem quantização (o three r128 não faz raycast em malha quantizada; o toque é por malha);
//  - dedup + weld; nós vazios mantidos (são pivôs);
//  - texturas: JPEG onde não há transparência, PNG onde há; no máximo 1024 px.
// Uso: node preparar-pecas.mjs <entrada.glb> <saida.glb>
import {NodeIO} from '@gltf-transform/core';import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {prune,dedup,weld} from '@gltf-transform/functions';
const [,,SRC,OUT]=process.argv;const io=new NodeIO().registerExtensions(ALL_EXTENSIONS);const doc=await io.read(SRC);const R=doc.getRoot();
/* a mesa da recepção veio com as duas gavetas no curso todo (36 cm para fora): fecha, com a frente rente ao gaveteiro */
for(const n of R.listNodes())if(/^gaveta_(recepcao|material)$/.test(n.getName())&&/obj-mesa-recepcao/.test(SRC)){const t=n.getTranslation();n.setTranslation([t[0],t[1],t[2]-0.36]);}
await doc.transform(prune({keepLeaves:true,keepAttributes:true}),dedup(),weld());
const sharp=(await import('sharp')).default;
for(const t of R.listTextures()){const img=Buffer.from(t.getImage()),meta=await sharp(img).metadata(),st=await sharp(img).stats();
  const alfa=meta.hasAlpha&&st.channels[3].min<255;
  let s=sharp(img);if(meta.width>1024||meta.height>1024)s=s.resize(1024,1024,{fit:'inside'});
  const out=alfa?await s.png({compressionLevel:9}).toBuffer():await s.flatten({background:'#000'}).jpeg({quality:84,mozjpeg:true}).toBuffer();
  if(out.length<img.length){t.setImage(new Uint8Array(out));if(!alfa)t.setMimeType('image/jpeg')}}
await io.write(OUT,doc);
