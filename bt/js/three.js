import * as THREE from 'https://esm.run/three';
import Matrix from './matrix.js';

const SIZE = 252;

const matrix = new Matrix;
matrix.render([
  0, 100, 0, 100, 0,
  100, 100, 100, 100, 100,
  100, 100, 100, 100, 100,
  0, 100, 100, 100, 0,
  0, 0, 100, 0, 0,
]);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera( 75, 1, 0.1, 1000 );

const devicePixelRatio = globalThis.devicePixelRatio || 1;
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(SIZE / devicePixelRatio, SIZE / devicePixelRatio);
renderer.setAnimationLoop( animate );
document.querySelector('#canvas').appendChild( renderer.domElement );

const texture = new THREE.CanvasTexture(matrix.canvas);

const cube = new THREE.Mesh(
  new THREE.BoxGeometry( .56, .88, .32 ),
  [
    new THREE.MeshLambertMaterial({ color: 0x00ff00 }),
    new THREE.MeshLambertMaterial({ color: 0x00ff00 }),
    new THREE.MeshLambertMaterial({ color: 0x00ff00 }),
    new THREE.MeshLambertMaterial({ color: 0x00ff00 }),
    new THREE.MeshLambertMaterial({ map: texture }),
    new THREE.MeshLambertMaterial({ color: 0x00ff00 }),
  ]
);
scene.add( cube );

camera.position.z = 1;
camera.lookAt( scene.position );

const ambientLight = new THREE.AmbientLight( 'white', 0.7 );
scene.add( ambientLight );

const light = new THREE.DirectionalLight( 'white', 0.7 );
light.position.set( 1, 1, 1 );
scene.add( light );

function animate() {

  if (!globalThis.prime) return;

  const { yaw: z, pitch: x, roll: y, matrix: values } = prime;
  const { rotation } = cube;

  rotation.x += (THREE.MathUtils.degToRad(-x) - rotation.x) * .1;
  rotation.y += (THREE.MathUtils.degToRad(y) - rotation.y) * .1;
  rotation.z += (THREE.MathUtils.degToRad(z) - rotation.z) * .1;

  const show = [...values];
  if (show.length && matrix.render(show))
    texture.needsUpdate = true;

  renderer.render( scene, camera );
}
