const i =
  "https://images.unsplash.com/photo-1547001810-be486b02f55e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9";
let container;
let camera, scene, renderer;
let uniforms;
let video, video_canvas;
let texture;
let videoImage = document.createElement("canvas");
let videoImageContext = videoImage.getContext("2d");
let previous;
let params = {};
init();
video.onloadedmetadata = function(e) {
  videoImage.width = this.videoWidth;
  videoImage.height = this.videoHeight;
  video.play();

  animate();
};

if (THREE.WEBGL.isWebGL2Available() === false) {
  document.body.appendChild(THREE.WEBGL.getWebGL2ErrorMessage());
}

function init() {
  container = document.getElementById("container");

  camera = new THREE.Camera();
  camera.position.z = 1;

  scene = new THREE.Scene();

  var geometry = new THREE.PlaneBufferGeometry(2, 2);
  uniforms = {
    time: { type: "f", value: 1.0 },
    resolution: { type: "v2", value: new THREE.Vector2() },
    minVel: { value: 0.01 },
    maxVel: { value: 0.5 },
    offsetInc: { value: 0.1 },
    lambda: { value: 1.0 },
    offsetRGB: { value: 0.025 },
    scale: { type: "v2", value: new THREE.Vector2(1.0, 1.0) },
    threshold: { value: 0.15 },
    intensity: { value: 5 },
    offset: { type: "v2", value: new THREE.Vector2(1.0, 1.0) }
  };

  params = {
    intensity: 5,
    maxVel: 0.5,
    minVel: 0.1,
    lambda: 1,
    offsetRGB: 0.025,
    delay: 5,
    threshold: 0.15
  };

  let gui = new window.GUI();

  let material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: document.getElementById("vertexShader").textContent,
    fragmentShader: document.getElementById("fragmentShader2").textContent
  });
  const onChange = () => {
    for (let [key, value] of Object.entries(params)) {
      if (key !== "delay") {
        uniforms[key].value = value;
      }
    }
  };
  gui.add(params, "lambda", 0, 10).onChange(onChange);
  gui.add(params, "delay", 0, 10);
  gui
    .add(params, "threshold", 0, 1)
    .step(0.01)
    .onChange(onChange);
  gui
    .add(params, "minVel", 0, 1)
    .step(0.01)
    .onChange(onChange);
  gui
    .add(params, "maxVel", 0, 1)
    .step(0.01)
    .onChange(onChange);

  gui
    .add(params, "offsetRGB", 0, 0.1)
    .step(0.001)
    .onChange(onChange);
  gui.add(params, "intensity", 0, 50).onChange(onChange);

  video = document.getElementById("video");
  video.width = window.innerWidth;
  video.height = window.innerHeight;
  console.log(video);
  navigator.mediaDevices
    .getUserMedia({ video: true, audio: false })
    .then(function(stream) {
      video.srcObject = stream;
      video.play();

      videoImage.width = video.width;
      videoImage.height = video.height;
      videoImageContext.fillStyle = "#ff0000";
      videoImageContext.fillRect(0, 0, videoImage.width, videoImage.height);
      texture = new THREE.Texture(videoImage);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;

      previous = new THREE.Texture(videoImage);
      previous.minFilter = THREE.LinearFilter;
      previous.magFilter = THREE.LinearFilter;

      uniforms.text = { type: "t", value: texture };
      uniforms.previous = { type: "t", value: previous };
    })
    .catch(function(err) {
      console.log("An error occured! " + err);
    });

  let mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
  let canvas = document.createElement("canvas");

  renderer = new THREE.WebGLRenderer({
    canvas,
    context: canvas.getContext("webgl2", { alpha: false })
  });
  renderer.setPixelRatio(window.devicePixelRatio);

  container.appendChild(renderer.domElement);

  onWindowResize();
  window.addEventListener("resize", onWindowResize, false);
}

function onWindowResize(event) {
  renderer.setSize(window.innerWidth, window.innerHeight);
  uniforms.resolution.value.x = renderer.domElement.width;
  uniforms.resolution.value.y = renderer.domElement.height;
}

function animate() {
  requestAnimationFrame(animate);
  render();
}
let counter = 0;
function render() {
  counter += 1;
  if (counter > params.delay && previous) {
    counter = 0;
    previous.needsUpdate = true;
  }
  if (videoImageContext) videoImageContext.drawImage(video, 0, 0);
  if (texture) {
    texture.needsUpdate = true;
  }
  uniforms.time.value += 0.05;
  renderer.render(scene, camera);
}
