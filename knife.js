var scene, camera, renderer, controls;
var canvasControls;
var container;
var loader;
var w = window.innerWidth;
var h = window.innerHeight;
var mouseX, mouseY;
var globalUniforms;
var time = 0;
var video, videoLoaded = false, camTex;
var scene1, scene2;
var rt1, rt2;
var material1, material2;
var planeGeometry;
var mesh1, mesh2;
var mouseX, mouseY;
var time = 0.0;
var modelMesh;
initCanvasScene();
var clothGeometry;
// initScene();
function initCanvasScene(){
    canvasCamera = new THREE.PerspectiveCamera(50, w / h, 1, 100000);
    canvasCamera.position.set(0,0, 800);
    canvasCameraRTT = new THREE.OrthographicCamera( w / - 2, w / 2, h / 2, h / - 2, -10000, 10000 );
	canvasCameraRTT.position.z = 100;
	canvasControls = new THREE.OrbitControls(canvasCamera);

	canvasRenderer = new THREE.WebGLRenderer();
    canvasRenderer.setSize(w, h);
    canvasRenderer.setClearColor(0xffffff, 1);

    canvasScene = new THREE.Scene();

    globalUniforms = {
		time: { type: "f", value: 0.0 } ,
		resolution: {type: "v2", value: new THREE.Vector2(w,h)},
		step_w: {type: "f", value: 1/w},
		step_h: {type: "f", value: 1/h},
		mouseX: {type: "f", value: 1.0},
		mouseY: {type: "f", value: 1.0}
	}

	FBObject1 = new FBObject({
		w: w,
    	h: h, 
    	x: 0,
    	texture: "img/rb-strip.jpg",
    	// useVideo:true,
    	vertexShader: "vs",
    	fragmentShader1: "fs",
    	fragmentShader2: "fs",
    	mainScene: canvasScene
	});
	FBObject1.uniforms = globalUniforms;
	FBObject1.init(w,h);
	FBObject2 = new FBObject({
		w: w,
    	h: h, 
    	x: 0,
    	texture: "textures/me.jpg",
    	vertexShader: "vs",
    	fragmentShader1: "flow2",
    	fragmentShader2: "flow2",
    	mainScene: canvasScene,
    	extraTex: FBObject1.renderTargets[1]
	});
	FBObject2.uniforms = globalUniforms;
	FBObject2.init(w,h);
	FBObject1.extraTex = FBObject2.renderTargets[1];
	FBObject1.addObject(FBObject1.x)
	// FBObject2.addObject(FBObject2.x)
	// canvasMaterial = new THREE.MeshBasicMaterial({color:0xffffff, map: THREE.ImageUtils.loadTexture("img/rbcheck.jpg")});
	// canvasScene.add(new THREE.Mesh(new THREE.BoxGeometry(50,50,50), canvasMaterial))
    document.addEventListener('mousemove', onDocumentMouseMove, false);
    document.addEventListener('mousedown', onDocumentMouseDown, false);
    window.addEventListener('resize', onWindowResize, false);
	canvasAnimate();
	initScene();

}
var inc = 0;
var addFrames = true;
var translate = false;
var time = 0;
function canvasAnimate(){
	window.requestAnimationFrame(canvasAnimate);

	// canvasMaterial.color.setHSL((Math.cos(Date.now()*0.0005)*0.5 + 0.5), 1.0, 0.5 );

	time +=0.01;

	globalUniforms.time.value = time;

    FBObject1.passTex();
    FBObject2.passTex();



    inc++
	if(inc >= 10){
		addFrames = false;
	}
	if(addFrames){
		FBObject1.getFrame(canvasCameraRTT);
		FBObject2.getFrame(canvasCameraRTT);
		translate = true;
	}
	if(translate = true){
		// FBObject1.scale(1.01);
		// FBObject2.scale(0.999);

	}
		    // FBObject1.material1.uniforms.texture.value = FBObject2.renderTargets[0];


	FBObject1.render(canvasCameraRTT);
	FBObject2.render(canvasCameraRTT);
	canvasRenderer.render(canvasScene, canvasCamera);

	FBObject1.cycle();
	FBObject2.cycle();


}
function initScene(){
	container = document.createElement('div');
    document.body.appendChild(container);

    camera = new THREE.PerspectiveCamera(50, w / h, 1, 100000);
    camera.position.set(0,0, 750);//test
    cameraRTT = new THREE.OrthographicCamera( w / - 2, w / 2, h / 2, h / - 2, -10000, 10000 );
	cameraRTT.position.z = 100;

	// controls = new THREE.OrbitControls(camera);


    renderer = new THREE.WebGLRenderer({preserveDrawingBuffer:true});
    renderer.setSize(w, h);
    renderer.setClearColor(0xffffff, 1);
    container.appendChild(renderer.domElement);

    scene = new THREE.Scene();

    // initGlobalUniforms();
    initCanvasTex();
	document.addEventListener( 'keydown', onKeyDown, false );

    // document.addEventListener('mousemove', onDocumentMouseMove, false);
    // document.addEventListener('mousedown', onDocumentMouseDown, false);

    animate();
}
function initGlobalUniforms(){
	globalUniforms = {
		time: {type: 'f', value: time},
		resolution: {type: 'v2', value: new THREE.Vector2(w,h)},
		mouseX: {type: 'f', value: 0.0},
		mouseY: {type: 'f', value: 0.0}
	}
}
function initCanvasTex(){
	canvas = document.createElement("canvas");
	canvas.width = w;
	canvas.height = h;
	sliceSize = 50.0;
	// document.body.appendChild(canvas);
	// canvas.style['z-index'] = -1;
	ctx = canvas.getContext("2d");
	image = new Image();
	image.onload = function (){
		ctx.drawImage(image, 0, 0);
	}
	image.src = "../img/clouds.jpg";

    tex = new THREE.Texture(canvasRenderer.domElement);
    // tex = new THREE.Texture(canvas);
    tex.needsUpdate = true;
    camTex = tex;
    initFrameDifferencing();


}
function initCameraTex(){
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia || navigator.oGetUserMedia;
    if (navigator.getUserMedia) {       
        navigator.getUserMedia({video: true, audio: false}, function(stream){
        	var url = window.URL || window.webkitURL;
			video = document.createElement("video");
	        video.src = url ? url.createObjectURL(stream) : stream;
	        // video.src = "satin.mp4";
	        // video.loop = true;
	        // video.playbackRate = 0.25;
	        video.play();
	        videoLoaded = true;
	        tex = new THREE.Texture(video);
	        tex.needsUpdate = true;
	        camTex = tex;
	        initFrameDifferencing();
        }, function(error){
		   console.log("Failed to get a stream due to", error);
	    });
	}
}

function initFrameDifferencing(){
	planeGeometry = new THREE.PlaneBufferGeometry(w,h);

	scene1 = new THREE.Scene();
	rt1 = new THREE.WebGLRenderTarget(w, h, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBFormat });
	material1 = new THREE.ShaderMaterial({
		uniforms: {
			time: { type: 'f' , value: time},
			resolution: {type: 'v2', value: new THREE.Vector2(w,h)},
			texture: {type: 't', value: camTex},
			mouseX: {type: 'f', value: mouseX},
			mouseY: {type: 'f', value: mouseY}
		},
		vertexShader: document.getElementById("vs").textContent,
		fragmentShader: document.getElementById("blurFrag").textContent
	});
	mesh1 = new THREE.Mesh(planeGeometry, material1);
	mesh1.position.set(0, 0, 0);
	scene1.add(mesh1);

	scene2 = new THREE.Scene();
	rt2 = new THREE.WebGLRenderTarget(w, h, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBFormat });
	material2 = new THREE.ShaderMaterial({
		uniforms: {
			time: { type: 'f' , value: time},
			resolution: {type: 'v2', value: new THREE.Vector2(w,h)},
			texture: {type: 't', value: rt1},
			texture2: {type: 't', value: camTex}
		},
		vertexShader: document.getElementById("vs").textContent,
		fragmentShader: document.getElementById("flow2").textContent
	});
	mesh2 = new THREE.Mesh(planeGeometry, material2);
	mesh2.position.set(0, 0, 0);
	scene2.add(mesh2);

	sceneDiff = new THREE.Scene();
	rtDiff = new THREE.WebGLRenderTarget(w, h, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBFormat });
	materialDiff = new THREE.ShaderMaterial({
		uniforms: {
			time: { type: 'f' , value: time},
			resolution: {type: 'v2', value: new THREE.Vector2(w,h)},
			texture: {type: 't', value: rt1},
			texture2: {type: 't', value: rt2},
			texture3: {type: 't', value: camTex} 
		},
		vertexShader: document.getElementById("vs").textContent,
		fragmentShader: document.getElementById("diffFs").textContent
	});
	meshDiff = new THREE.Mesh(planeGeometry, materialDiff);
	sceneDiff.add(meshDiff);

	sceneFB = new THREE.Scene();
	rtFB = new THREE.WebGLRenderTarget(w, h, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBFormat });
	materialFB = new THREE.ShaderMaterial({
		uniforms: {
			time: { type: 'f' , value: time},
			resolution: {type: 'v2', value: new THREE.Vector2(w,h)},
			texture: {type: 't', value: rtDiff},
			mouseX: {type: 'f', value: mouseX},
			mouseY: {type: 'f', value: mouseY}
		},
		vertexShader: document.getElementById("vs").textContent,
		fragmentShader: document.getElementById("fbFs").textContent
	});
	meshFB = new THREE.Mesh(planeGeometry, materialFB);
	sceneFB.add(meshFB);

	sceneFB2 = new THREE.Scene();
	rtFB2 = new THREE.WebGLRenderTarget(w, h, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBFormat });
	materialFB2 = new THREE.ShaderMaterial({
		uniforms: {
			time: { type: 'f' , value: time},
			resolution: {type: 'v2', value: new THREE.Vector2(w,h)},
			texture: {type: 't', value: rtFB},
			mouseX: {type: 'f', value: mouseX},
			mouseY: {type: 'f', value: mouseY}
		},
		vertexShader: document.getElementById("vs").textContent,
		fragmentShader: document.getElementById("fs").textContent
	});
	meshFB2 = new THREE.Mesh(planeGeometry, materialFB2);
	sceneFB2.add(meshFB2);

	sceneFB3 = new THREE.Scene();
	rtFB3 = new THREE.WebGLRenderTarget(w, h, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBFormat });
	materialFB3 = new THREE.ShaderMaterial({
		uniforms: {
			time: { type: 'f' , value: time},
			resolution: {type: 'v2', value: new THREE.Vector2(w,h)},
			texture: {type: 't', value: rtFB2},
			mouseX: {type: 'f', value: mouseX},
			mouseY: {type: 'f', value: mouseY}
		},
		vertexShader: document.getElementById("vs").textContent,
		fragmentShader: document.getElementById("sharpenFrag").textContent
	});
	meshFB3 = new THREE.Mesh(planeGeometry, materialFB3);
	sceneFB3.add(meshFB3);

	material = new THREE.MeshBasicMaterial({map: rtFB3});
	mesh = new THREE.Mesh(planeGeometry, material);
	scene.add(mesh);

}
function animate(){
	window.requestAnimationFrame(animate);
	draw();
}
function canvasDraw(){
	var randW = Math.random()*(w-sliceSize);
	var randH = Math.random()*(h-sliceSize);
	var randPart = ctx.getImageData(randW, randH, sliceSize, sliceSize);
	var randData = randPart.data;
	var newRandW = Math.random()*w;
	var newRandH = Math.random()*h;
	// if(newRandW > w + 10){
	// 	newRandW = w/2;
	// }
	// if(newRandH > h + 10){
	// 	newRandH = h/2;
	// }

	ctx.putImageData(randPart, newRandW, newRandH );
}
function draw(){
	time+=0.05;
	canvasDraw();
    camTex.needsUpdate = true;

    // expand(1.01);
    // materialDiff.uniforms.texture.value = rtFB;
    material1.uniforms.texture.value = rtDiff;
    // material2.uniforms.texture.value = rtFB;

	renderer.render(scene2, cameraRTT, rt2, true);

	renderer.render(sceneDiff, cameraRTT, rtDiff, true);

	renderer.render(sceneFB, cameraRTT, rtFB, true);
	renderer.render(sceneFB2, cameraRTT, rtFB2, true);
	renderer.render(sceneFB3, cameraRTT, rtFB3, true);

	renderer.render(scene, camera);

    renderer.render(scene1, cameraRTT, rt1, true);


    var a = rtFB;
    rtFB = rt1;
    rt1 = a;

}

function expand(expand){
		meshDiff.scale.set(expand,expand,expand);
}
function map(value,max,minrange,maxrange) {
    return ((max-value)/(max))*(maxrange-minrange)+minrange;
}

function onDocumentMouseMove(event){
	mouseX = (event.clientX );
    mouseY = (event.clientY );
    mapMouseX = map(mouseX, window.innerWidth, -1.0,1.0);
    mapMouseY = map(mouseY, window.innerHeight, -1.0,1.0);
    resX = map(mouseX, window.innerWidth, 4000.0,2000.0);
    resY = map(mouseX, window.innerWidth, 10000.0,1600.0);
	globalUniforms.mouseX.value = mapMouseX;
	globalUniforms.mouseY.value = mapMouseY;
	// globalUniforms.tv_resolution.value = resX;
	// globalUniforms.tv_resolution_y.value = resY;

}
function onDocumentMouseDown(event){
		FBObject1.getFrame(canvasCameraRTT);
	FBObject2.getFrame(canvasCameraRTT);

}
function onWindowResize( event ) {
	globalUniforms.resolution.value.x = window.innerWidth;
	globalUniforms.resolution.value.y = window.innerHeight;
	w = window.innerWidth;
	h = window.innerHeight;
	canvasRenderer.setSize( window.innerWidth, window.innerHeight );
}

function onKeyDown( event ){
	if( event.keyCode == "32"){
		screenshot();
		
	function screenshot(){
	// var i = renderer.domElement.toDataURL('image/png');
	var blob = dataURItoBlob(renderer.domElement.toDataURL('image/png'));
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

		    return new Blob([ia], {type:mimeString});
		}
		function insertAfter(newNode, referenceNode) {
		    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
		}
	}
}

function createModel(geometry, x, y, z, scale, rotX, rotY, rotZ, customMaterial){
		var material = customMaterial
		modelMesh = new THREE.Mesh(geometry, material);
		var scale = scale;
		modelMesh.position.set(x,y,z);
		modelMesh.scale.set(scale,scale,scale);
		modelMesh.rotation.set(rotX, rotY, rotZ);
		canvasScene.add(modelMesh);
		console.log(modelMesh);
	}

function loadModel(model, x, y, z, scale, rotX, rotY, rotZ, customMaterial){
	var loader = new THREE.BinaryLoader(true);
	loader.load(model, function(geometry){
		createModel(geometry, x, y, z, scale, rotX, rotY, rotZ, customMaterial);
	})
}