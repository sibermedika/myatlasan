import * as THREE from 'three';
import type { Pin } from '../types';

export function normalizeModel(object: THREE.Object3D, targetSize = 4.2) {
  object.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const extent = Math.max(size.x, size.y, size.z);
  if (!Number.isFinite(extent) || extent <= 0) throw new Error('Model tidak memiliki geometri yang dapat ditampilkan.');
  const scale = targetSize / extent;
  object.position.sub(center).multiplyScalar(scale);
  object.scale.multiplyScalar(scale);
  object.updateMatrixWorld(true);
}

export function anchorWorld(model: THREE.Object3D, pin: Pin) {
  const point = new THREE.Vector3(pin.x, pin.y, pin.z || 0);
  return pin.coordinateSpace === 'model' ? model.localToWorld(point) : point;
}

export function meshVisible(object: THREE.Object3D): boolean {
  for (let current: THREE.Object3D | null = object; current; current = current.parent) if (!current.visible) return false;
  return true;
}

export function modelSurfaces(model: THREE.Object3D): THREE.Mesh[] {
  const surfaces: THREE.Mesh[] = [];
  model.traverse(object => { if ((object as THREE.Mesh).isMesh && !object.userData.pinData) surfaces.push(object as THREE.Mesh); });
  return surfaces;
}

export function surfacePosition(model: THREE.Object3D, hit: THREE.Intersection, direction: THREE.Vector3) {
  const normal = (hit.face?.normal.clone() || new THREE.Vector3(0,0,1)).applyMatrix3(new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld)).normalize();
  if (normal.dot(direction) > 0) normal.negate();
  normal.applyMatrix3(new THREE.Matrix3().getNormalMatrix(model.matrixWorld).invert()).normalize();
  const point = model.worldToLocal(hit.point.clone());
  return {x:point.x,y:point.y,z:point.z,coordinateSpace:'model' as const,normal:{x:normal.x,y:normal.y,z:normal.z}};
}
