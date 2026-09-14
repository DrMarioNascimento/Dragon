(function(global){
  'use strict';
  function groundedPose(root,matrix,scale,minY){
    root.position.setFromMatrixPosition(matrix);
    root.quaternion.setFromRotationMatrix(matrix);
    root.scale.setScalar(scale);
    root.position.add(new THREE.Vector3(0,-minY*scale,0).applyQuaternion(root.quaternion));
    root.updateMatrixWorld(true);
  }
  function exportModel(model){
    const root=model.root.clone(true);
    root.position.set(0,0,0);root.quaternion.identity();root.scale.setScalar(1);
    const remove=[],instances=[];
    root.traverse(o=>{
      o.visible=true;
      if(o.userData.restY!==undefined)o.position.y=o.userData.restY;
      if(o.userData.object||o.userData.exportExclude)remove.push(o);
      if(o.isInstancedMesh)instances.push(o);
    });
    remove.forEach(o=>o.parent?.remove(o));
    // r128 does not export InstancedMesh transforms: expand only the export copy.
    for(const source of instances){
      const group=new THREE.Group();group.name=source.name;group.position.copy(source.position);group.quaternion.copy(source.quaternion);group.scale.copy(source.scale);
      for(let i=0;i<source.count;i++){const mesh=new THREE.Mesh(source.geometry,source.material);source.getMatrixAt(i,mesh.matrix);mesh.matrix.decompose(mesh.position,mesh.quaternion,mesh.scale);group.add(mesh);}
      source.parent?.add(group);source.parent?.remove(source);
    }
    root.updateMatrixWorld(true);return root;
  }
  function keyFits(model){
    const tip=model.keyTip.getWorldPosition(new THREE.Vector3()),socket=model.keySocket.getWorldPosition(new THREE.Vector3());
    const scale=model.root.getWorldScale(new THREE.Vector3()).x;
    return tip.distanceTo(socket)<.025*scale;
  }
  global.ACMaquetteSpatial={groundedPose,exportModel,keyFits};
})(window);

