// Uso: node preparar-torre.mjs <glb-do-designer> <saida.glb>
// Prepara a Torre de Continuidade (designer, v3) para o celular:
//  - texturas em WebP (EXT_texture_webp), no máximo 1024 px
//  - geometria quantizada e comprimida (EXT_meshopt_compression)
//  - o lote (rua, jardim, estacionamento…) juntado por material
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS, EXTTextureWebP} from '@gltf-transform/extensions';
import {dedup, prune, weld, quantize, meshopt, textureCompress, flatten, join} from '@gltf-transform/functions';
import {MeshoptEncoder, MeshoptDecoder} from 'meshoptimizer';
import sharp from 'sharp';
const [,, SRC, OUT] = process.argv;
await MeshoptEncoder.ready; await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder});
const doc = await io.read(SRC);
await doc.transform(
  dedup(), weld(),
  textureCompress({encoder: sharp, targetFormat: 'webp', resize: [1024, 1024], quality: 82}),
  prune(),
  quantize({quantizePosition: 14, quantizeNormal: 10, quantizeTexcoord: 12}),
  meshopt({encoder: MeshoptEncoder, level: 'medium'})
);
await io.write(OUT, doc);
