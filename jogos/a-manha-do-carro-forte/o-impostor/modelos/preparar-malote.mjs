// Prepara o malote de perto do Cap. 1 (modelo do designer, 07/10/2026):
//  - tira as etiquetas térmicas ML-8842 e ML-8847 (a ML-8847 não pode estar no Arquivo;
//    'Sala da Gerência' é do Cap. 3; o verso trazia o 96.000);
//  - tira a cinta de papel do envio extra (lia como maço de dinheiro) e o deixa rente, sob a borda;
//  - sem quantização (o three r128 não faz raycast em malha quantizada); texturas em JPEG.
// Uso: node preparar-malote.mjs <entrada.glb> malote-perto.glb
import {NodeIO} from '@gltf-transform/core';import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {prune,dedup,weld,quantize} from '@gltf-transform/functions';
const [,,SRC,OUT]=process.argv;const io=new NodeIO().registerExtensions(ALL_EXTENSIONS);const doc=await io.read(SRC);const R=doc.getRoot();
const desc=n=>[n,...n.listChildren().flatMap(desc)];
/* 1. fora: as duas etiquetas térmicas (ML-8847 não pode estar no Arquivo; "Sala da Gerência" é do Cap. 3; o verso traz o 96.000) */
for(const n of R.listNodes())if(/^etiqueta-ML-88(42|47)$/.test(n.getName()))desc(n).forEach(d=>d.dispose());
/* 2. o envio extra: sem a cinta de papel (lia como maço de dinheiro) e rente ao chão, sob a borda */
for(const n of R.listNodes()){if(n.getName()==='envio_cinta')n.dispose();if(n.getName()==='envio-extra'){n.setScale([0.92,0.45,0.92])}}
await doc.transform(prune(),dedup(),weld());
/* 3. texturas: JPEG onde não há transparência; a lona a 1024 */
const sharp=(await import('sharp')).default;
for(const t of R.listTextures()){const img=Buffer.from(t.getImage()),meta=await sharp(img).metadata(),st=await sharp(img).stats();
  const alfa=meta.hasAlpha&&st.channels[3].min<255;
  let s=sharp(img);if(meta.width>1024)s=s.resize(1024);
  const out=alfa?await s.png({compressionLevel:9,palette:false}).toBuffer():await s.flatten({background:'#000'}).jpeg({quality:84,mozjpeg:true}).toBuffer();
  if(out.length<img.length){t.setImage(new Uint8Array(out));if(!alfa)t.setMimeType('image/jpeg')}
  console.log(meta.width+'x'+meta.height,alfa?'png':'jpg',img.length,'->',Math.min(out.length,img.length))}
await io.write(OUT,doc);
