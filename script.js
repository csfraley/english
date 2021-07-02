import * as THREE from '//cdn.skypack.dev/three@0.129.0?min'
import { OrbitControls } from '//cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls?min'
import webfontloader from '//cdn.skypack.dev/webfontloader@1.6.28?min' 

// ----
// tex
// ----

const can = document.createElement('canvas');
const tex0 = new THREE.CanvasTexture(can, THREE.UVMapping, THREE.ClampToEdgeWrapping, THREE.RepeatWrapping);
const fontSize = 128;
const fontFamily = 'Benne';
const font = `${fontSize}px "${fontFamily}"`;
const text = `Wraparound description with custom font. `.repeat(6); // giant summary text
const lineWidth = fontSize * (15); // text content maxwidth
const lineHeight = fontSize * (4 / 3);
const padding = fontSize * (1); // avail. space =linewidth(or lineheight)-padding

webfontloader.load({
  google: {
    families: [fontFamily]
  },
  active: makeTex,
  inactive: () => alert('failed to load font, bye.')
});

function makeTex() {
  f(text, font, lineWidth, lineHeight, padding);
}

// ----
// layout - multiline; centering
// ----

function f(text, font, lineWidth, lineHeight, padding) {
  const ctx = can.getContext('2d');
  ctx.font = font;
  const words = text.split(/\s+/);
  const lines = [];
  let w = 2 * padding; // accum width
  let lineAt = 0;
  lines[0] = [];
  for (const word of words) {
    const { width } = ctx.measureText(word);
    if (width + w > lineWidth) {
      lineAt += 1;
      lines.push([]);
      w = 2 * padding; // reset
    }
    const line = lines[lineAt];
    line.push(word);
    w += width;
  }
  // ----
  can.width = lineWidth;
  can.height = lineHeight * lines.length + (2 * padding);
  // ----
  ctx.font = font;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'center'; // hor. centering
  ctx.fillStyle = 'lime';
  for (const [i, line] of lines.entries()) {
    ctx.fillText(line.join(' '), can.width / 2, padding + i * lineHeight);
  }
  tex0.needsUpdate = true;
  ribbon.scale.x = 5;
  ribbon.scale.y = ribbon.scale.x * (can.height / lineWidth);
}

// ----
// main
// ----

const renderer = new THREE.WebGLRenderer();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, 2, .1, 100);
const controls = new OrbitControls(camera, renderer.domElement);

scene.background = new THREE.Color('#222');
camera.position.set(0, 1, 4);
controls.enableDamping = true;
renderer.shadowMap.enabled = true;

const light = new THREE.DirectionalLight('white', .5);
light.castShadow = true;
light.position.set(0, 1, 4);
light.shadow.camera.far = 10;
light.shadow.camera.near = 0;
light.shadow.mapSize.setScalar(1024);
scene.add(light);

scene.add(new THREE.AmbientLight('white', .5));

// ----
// prod model - stub
// ----

{
  const geom = new THREE.TorusKnotGeometry(1, 0.2, 100, 50, 3, 2);
  const mat = new THREE.MeshStandardMaterial({ roughness: 1, color: 'rosybrown' });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  scene.add(mesh);
}

// ----
// ribbon
// ----

const ribbon = (() => {
  const W = 1; // width
  const H = 1; // height // will scale on font loaded
  const geom = new THREE.ParametricGeometry((u, v, dst) => {
    const x = (u - 0.5) * (1); // quite unreadable if scale of x > 1
    const z = Math.E ** -(x ** 2) * (2); // bell
    const y = v - 0.5;
    dst.set(x, y, z);
  }, 100, 20);
  const mat = new THREE.MeshStandardMaterial({
    color: 'wheat',
    side: THREE.DoubleSide,
    alphaMap: tex0,
    alphaTest: 0.5,
    roughness: 1,
  });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.castShadow = true;
  mesh.customDepthMaterial = new THREE.MeshDepthMaterial({
    depthPacking: THREE.RGBADepthPacking,
    alphaMap: mat.alphaMap,
    alphaTest: mat.alphaTest,
  });
  return mesh;
})();
scene.add(ribbon);

// ----
// render
// ----

renderer.setAnimationLoop(() => {
  renderer.render(scene, camera);
  controls.update();
  tex0.offset.y -= 0.001;
});

// ----
// view
// ----

function resize(w, h, dpr = devicePixelRatio) {
  renderer.setPixelRatio(dpr);
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
addEventListener('resize', () => resize(innerWidth, innerHeight));
dispatchEvent(new Event('resize'));
document.body.prepend(renderer.domElement);