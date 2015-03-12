var container;
var cscene, ccamera, crenderer;
var csceneCube, ccameraCube;
var loader;
var shards = [];
var shardTextures = [];
var textureCubes = [];
var materials = [];
var uiComponents;
var w = window.innerWidth;
var h = window.innerHeight;
var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;
var targetRotationX = 0;
var targetRotationOnMouseDownX = 0;
var targetRotationY = 0;
var targetRotationOnMouseDownY = 0;
var cmouseX = 0;
var mouseXOnMouseDown = 0;
var cmouseY = 0;
var mouseYOnMouseDown = 0;
var clickCount = 0;
var index = 0;
var ctexture;
var images = new Array();
function cinitScene() {
    // container = document.createElement('div');
    // document.body.appendChild(container);
    ccamera = new THREE.OrthographicCamera(w / -2, w / 2, h / 2, h / -2, 1, 100000);
    ccameraCube = new THREE.PerspectiveCamera(50, w / h, 1, 100000);
    // camera = new THREE.PerspectiveCamera(50, w / h, 1, 100000);

    // camera.position.z = 500;
    cscene = new THREE.Scene();

    canvasControls = new THREE.OrbitControls(ccamera);

    csceneCube = new THREE.Scene();
    crenderer = new THREE.WebGLRenderer();
    crenderer.setSize(w, h);
    crenderer.setClearColor(0xffffff, 1);
    // crenderer.autoClear = false;
    // renderer.domElement.style.width = "100%";
    // renderer.domElement.style.height = "100%";
    // container.appendChild(renderer.domElement);
    //event listeners
    document.addEventListener('mousemove', onDocumentMouseMove, false);
    // document.addEventListener( 'touchstart', onDocumentTouchStart, false );
    // document.addEventListener('touchmove', onDocumentTouchMove, false);
    crenderer.domElement.addEventListener('mousedown', onDocumentMouseDown, false);
    // window.addEventListener('resize', onWindowResize, false);
    ctexture = cinitTexture(index);
    // animate();
    canvasAnimate();
    initScene();

}

function shardTexs() {
    for (var j = 0; j < 15; j++) {
        var urls = [];
        for (var i = 0; i < 6; i++) {
            var url = "textures/textureCube/" + (j + 1) + ".jpg";
            urls.push(url);
        }
        var texture = THREE.ImageUtils.loadTextureCube(urls, THREE.CubeRefractionMapping, function() {});
        shardTextures.push(texture);
    }
}
// var texture = initTexture(index);

function SHARD_ME(texture) {
    // var texture = initTexture(index);
    for (var index = 0; index < 55; index++) {
        initMaterial(index, texture);
    }
    cycleEnvMaps();

    // var material = initMaterial(index, shardTextures[index]);
}

function cinitTexture(index) {
    var urls = [];
    for (var i = 0; i < 6; i++) {
        // var url = "textures/diamonds/diamond" + (index+1) + ".jpg";
        var url = "textures/textureCube/" + (index + 1) + ".jpg";
        // var url = "textures/textureCube/2.jpg";
        urls.push(url)
    }
    var texture = THREE.ImageUtils.loadTextureCube(urls, THREE.CubeRefractionMapping, function(t) {
        shardTexs();
        SHARD_ME(t);
        // createSkyBox(t);
    });
    // return texture;
}
var skymesh, shader;

function createSkyBox(texture) {

    shader = THREE.ShaderLib["cube"];
    shader.uniforms["tCube"].value = texture;

    var material = new THREE.ShaderMaterial({
        fragmentShader: shader.fragmentShader,
        vertexShader: shader.vertexShader,
        uniforms: shader.uniforms,
        side: THREE.BackSide
    });

    skymesh = new THREE.Mesh(new THREE.BoxGeometry(100000, 100000, 100000), material);
    csceneCube.add(skymesh)
}

function initMaterial(index, texture) {
    var params = {
        color: 0xffffff,
        envMap: texture,
        refractionRatio: 0.3,
        reflectivity: 0.95
    }
    var material = new THREE.MeshBasicMaterial(params)
        // return material;
    loadShard(index, material);

}

function loadShard(index, material) {
    loader = new THREE.BinaryLoader(true);
    if (material) {
        loader.load("models/shards/" + (index + 1) + ".js", function(geometry) {
            createShard(index, geometry, material);
        });
    }

}

function createShard(index, geometry, material) {
    var shard = new THREE.Mesh(geometry, material);
    // var shard = new THREE.Mesh(boxGeom, material);
    // shard.position.set(0,0,-1000);
    // shard.position.set(Math.random()*1500.0 -1000.0,Math.random()*1500.0 -1000.0,-1000);
    // shard.position.set(200*(index%8)-600,90*(index/7)-340,-1000);
    shard.position.set((w / 8) * (index % 8) - (w / 2.25), (h / 7) * (index % 7) - (h / 2.4), -1000);
    // var scale = (1+(w/h))*2000.0;
    var scale = 4000.0;
    shard.scale.set(scale, scale, scale);
    cscene.add(shard);
    shards.push(shard);
}

function cycleEnvMaps() {
    for (var index = 0; index < shardTextures.length; index++) {
        var newTex = shardTextures[index];

        for (var i = 0; i < shards.length; i++) {
            shards[i].material.envMap = newTex;
        }

        if (index == shardTextures.length - 1) {
            animate();
        }
    }
}

function map(value, max, minrange, maxrange) {
    return ((max - value) / (max)) * (maxrange - minrange) + minrange;
}

function onDocumentMouseDown() {

    if (index == shardTextures.length - 1) {
        index = 0;
    } else {
        index++;
    }

    var newTex = shardTextures[index];
    for (var i = 0; i < shards.length; i++) {
        shards[i].material.envMap = newTex;
    }
    // shader.uniforms[ "tCube" ].value = newTex;

    // texture.envMap = initTexture(index);
}