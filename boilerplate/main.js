//lots o' globals - input scene and output scene should be easy to differentiate between
var inputCamera, inputControls, inputRenderer, inputScene, inputGeometry, inputMaterial, inputMesh;
var outputCamera, outputControls, outputRenderer, outputScene, outputGeometry, outputMaterial, outputMesh;
var container;
var w = window.innerWidth;
var h = window.innerHeight;
var globalUniforms;
var planeGeometry;
var mouseX, mouseY;
var time = 0.0;

//kick things off 
initInputScene();

function initInputScene() {
    //input scene - basic three.js setup and loop functionality
    inputCamera = new THREE.PerspectiveCamera(50, w / h, 1, 100000);
    inputCamera.position.set(0, 0, 400);

    //orbit controls for input scene - make sure only input or output scene has controls, not both
    inputControls = new THREE.OrbitControls(inputCamera);

    inputRenderer = new THREE.WebGLRenderer({preserveDrawingBuffer: true});
    inputRenderer.setSize(w, h);
    inputRenderer.setClearColor(0xffffff, 1);

    inputScene = new THREE.Scene();

    inputGeometry = new THREE.CubeGeometry(50, 50, 50);
    inputMaterial = new THREE.MeshBasicMaterial({color: 0xffffff});
    inputMesh = new THREE.Mesh(inputGeometry, inputMaterial);
    inputScene.add(inputMesh);

    inputAnimate();

    //takes input scene and makes it a texture, as well as starting feedback loop
    initOutputScene();
}

function inputAnimate() {
    window.requestAnimationFrame(inputAnimate);
    inputDraw();
}

function inputDraw() {
    //main loop function for input scene
    inputMaterial.color.setHSL((Math.cos(Date.now() * 0.00005) * 0.5 + 0.5), 1.0, 0.5);

    inputMesh.rotation.x = Date.now() * 0.006;
    inputMesh.rotation.y = Date.now() * 0.006;
    inputMesh.rotation.z = Date.now() * 0.006;

    inputRenderer.render(inputScene, inputCamera);
}

function initOutputScene() {

    outputCamera = new THREE.PerspectiveCamera(50, w / h, 1, 100000);
    outputCamera.position.set(0, 0, 750);
    //different camera for render targets - interesting results when outputCameraRTT is substituted with outputCamera in the outputDraw function
    outputCameraRTT = new THREE.OrthographicCamera( w / - 2, w / 2, h / 2, h / - 2, -10000, 10000 );
    outputCameraRTT.position.z = 100;

    outputRenderer = new THREE.WebGLRenderer({preserveDrawingBuffer: true});
    outputRenderer.setSize(w, h);
    outputRenderer.setClearColor(0xffffff, 1);

    container = document.createElement('div');
    document.body.appendChild(container);
    container.appendChild(outputRenderer.domElement);

    outputScene = new THREE.Scene();

    //global object for common uniforms b/c lots of fragment shaders 
    globalUniforms = {
        time: { type: 'f', value: time },
        resolution: { type: 'v2', value: new THREE.Vector2(w, h) },
        mouseX: { type: 'f', value: 0.0 },
        mouseY: { type: 'f', value: 0.0 }
    }

    //takes input scene and makes it into a texture for frame differencing
    initInputTexture();

    //feedback loop setup
    initFrameDifferencing();

    //if you press space bar it'll take a screenshot - useful for being crazy prolific
    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('mousemove', onDocumentMouseMove, false);

    outputAnimate();
}

function initInputTexture() {
    inputTexture = new THREE.Texture(inputRenderer.domElement);;
    inputTexture.needsUpdate = true;
}

function feedbackObject(uniforms, vertexShader, fragmentShader) {
    this.scene = new THREE.Scene();
    this.renderTarget = new THREE.WebGLRenderTarget(w, h, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBFormat});
    this.material = new THREE.ShaderMaterial({
        uniforms: uniforms, //uniforms object from constructor
        vertexShader: document.getElementById(vertexShader).textContent,
        fragmentShader: document.getElementById(fragmentShader).textContent
    });
    this.mesh = new THREE.Mesh(planeGeometry, this.material);
    this.mesh.position.set(0, 0, 0);
    this.scene.add(this.mesh);
}

function initFrameDifferencing() {
    planeGeometry = new THREE.PlaneBufferGeometry(w, h);

    feedbackObject1 = new feedbackObject({
        time: globalUniforms.time,
        resolution: globalUniforms.resolution,
        texture: { type: 't', value: inputTexture },
        mouseX: globalUniforms.mouseX,
        mouseY: globalUniforms.mouseY
    }, "vs", 
    "fs"); //string for fragment shader id - the only lines that really matter in this function, or the only lines you'll wanna change

    feedbackObject2 = new feedbackObject({
        time: globalUniforms.time,
        resolution: globalUniforms.resolution,
        texture: { type: 't', value: feedbackObject1.renderTarget }, //use previous feedback object's texture
        texture2: { type: 't', value: inputTexture }, // p sure this line doesnt do anything lol
        mouseX: globalUniforms.mouseX,
        mouseY: globalUniforms.mouseY
    }, "vs", 
    "blurFrag"); //these first three/four fragment shader object things are where most of the feedback loop is happening

    frameDifferencer = new feedbackObject({
        time: globalUniforms.time,
        resolution: globalUniforms.resolution,
        texture: { type: 't', value: feedbackObject1.renderTarget },
        texture2: { type: 't', value: feedbackObject2.renderTarget },
        texture3: { type: 't', value: inputTexture },
        mouseX: globalUniforms.mouseX,
        mouseY: globalUniforms.mouseY
    }, "vs", 
    "diffFs"); //differencing fs - leave this one alone

    feedbackObject3 = new feedbackObject({
        time: globalUniforms.time,
        resolution: globalUniforms.resolution,
        texture: { type: 't', value: frameDifferencer.renderTarget },
        mouseX: globalUniforms.mouseX,
        mouseY: globalUniforms.mouseY
    }, "vs", 
    "colorFs"); //this fs also contributes to feedback loop

    feedbackObject4 = new feedbackObject({
        time: globalUniforms.time,
        resolution: globalUniforms.resolution,
        texture: { type: 't', value: feedbackObject3.renderTarget },
        mouseX: globalUniforms.mouseX,
        mouseY: globalUniforms.mouseY
    }, "vs", 
    "sharpenFrag"); //this fs is basically post-processing

    outputMaterial = new THREE.MeshBasicMaterial({
        map: feedbackObject4.renderTarget
    });
    outputMesh = new THREE.Mesh(planeGeometry, outputMaterial);
    outputScene.add(outputMesh);

}

function outputAnimate() {
    window.requestAnimationFrame(outputAnimate);
    outputDraw();
}

function outputDraw() {

    time += 0.05;
    inputDraw();
    inputTexture.needsUpdate = true;

    // expand(1.01); - similar to translateVs

    feedbackObject1.material.uniforms.texture.value = frameDifferencer.renderTarget; //previous frame as input

    //render all the render targets to their respective scenes
    outputRenderer.render(feedbackObject2.scene, outputCameraRTT, feedbackObject2.renderTarget, true);
    outputRenderer.render(frameDifferencer.scene, outputCameraRTT, frameDifferencer.renderTarget, true);
    outputRenderer.render(feedbackObject3.scene, outputCameraRTT, feedbackObject3.renderTarget, true);
    outputRenderer.render(feedbackObject4.scene, outputCameraRTT, feedbackObject4.renderTarget, true);

    outputRenderer.render(outputScene, outputCamera);

    //get new frame
    outputRenderer.render(feedbackObject1.scene, outputCameraRTT, feedbackObject1.renderTarget, true);

    // swap buffers - this is why feedbackObject3's fragment shader contributes to feedback loop but feedbackObject3 is just post-processing i think
    var a = feedbackObject3.renderTarget;
    feedbackObject3.renderTarget = feedbackObject1.renderTarget;
    feedbackObject1.renderTarget = a;

}

//utility functions and event listeners
function expand(expand) {
    frameDifferencer.mesh.scale.set(expand, expand, expand);
}

function map(value, max, minrange, maxrange) {
    return ((max - value) / (max)) * (maxrange - minrange) + minrange;
}

function onDocumentMouseMove(event) {
    unMappedMouseX = (event.clientX);
    unMappedMouseY = (event.clientY);
    mouseX = map(unMappedMouseX, window.innerWidth, -1.0, 1.0);
    mouseY = map(unMappedMouseY, window.innerHeight, -1.0, 1.0);
    globalUniforms.mouseX.value = mouseX;
    globalUniforms.mouseY.value = mouseY;
}

function onKeyDown(event) {
    if (event.keyCode == "32") {
        screenshot();

        function screenshot() {
            // var i = renderer.domElement.toDataURL('image/png');
            var blob = dataURItoBlob(outputRenderer.domElement.toDataURL('image/png'));
            var file = window.URL.createObjectURL(blob);
            var img = new Image();
            img.src = file;
            img.onload = function(e) {
                // window.URL.revokeObjectURL(this.src);
                window.open(this.src);

            }
            // window.open(i)
            // insertAfter(img, );
        }
        //
        function dataURItoBlob(dataURI) {
            // convert base64/URLEncoded data component to raw binary data held in a string
            var byteString;
            if (dataURI.split(',')[0].indexOf('base64') >= 0)
                byteString = atob(dataURI.split(',')[1]);
            else
                byteString = unescape(dataURI.split(',')[1]);

            // separate out the mime component
            var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

            // write the bytes of the string to a typed array
            var ia = new Uint8Array(byteString.length);
            for (var i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }

            return new Blob([ia], {
                type: mimeString
            });
        }

        function insertAfter(newNode, referenceNode) {
            referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
        }
    }
}