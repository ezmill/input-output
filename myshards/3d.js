var scene, camera, renderer, controls;
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
cinitScene();

function canvasAnimate(){
	window.requestAnimationFrame(canvasAnimate);
	ccamera.lookAt(cscene.position);
    ccameraCube.rotation.copy(ccamera.rotation);
    for (var i = 0; i < shards.length; i++) {
        shards[i].rotation.x = Date.now() * 0.00008; //+(mouseX/(mouseY*10.0));
        shards[i].rotation.y += (targetRotationX - shards[i].rotation.y) * 0.1;
        // shards[i].rotation.z = Date.now()*0.00003;
        shards[i].rotation.z += (targetRotationY - shards[i].rotation.z) * 0.1;
    }


    // renderer.render(sceneCube, cameraCube);
    crenderer.render(cscene, ccamera);
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

    initGlobalUniforms();
    initCanvasTex();
	document.addEventListener( 'keydown', onKeyDown, false );

    document.addEventListener('mousemove', onDocumentMouseMove, false);
    document.addEventListener('mousedown', onDocumentMouseDown, false);

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
	sliceSize = 0.0001;
	// document.body.appendChild(canvas);
	// canvas.style['z-index'] = -1;
	ctx = canvas.getContext("2d");
	image = new Image();
	image.onload = function (){
		ctx.drawImage(image, 0, 0);
	}
	// image.src = "../img/b-w2.jpg";

    tex = new THREE.Texture(crenderer.domElement);
    tex.needsUpdate = true;
    camTex = tex;
    initFrameDifferencing();


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
		fragmentShader: document.getElementById("colorFs").textContent
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
		fragmentShader: document.getElementById("blurFrag").textContent
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
		fragmentShader: document.getElementById("colorFs").textContent
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
		fragmentShader: document.getElementById("sharpenFrag").textContent
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
		fragmentShader: document.getElementById("colorFs").textContent
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

function draw(){
	time+=0.05;
	// canvasDraw();
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
	unMappedMouseX = (event.clientX );
    unMappedMouseY = (event.clientY );
    mouseX = map(unMappedMouseX, window.innerWidth, -10.0,10.0);
    mouseY = map(unMappedMouseY, window.innerHeight, -10.0,10.0);

    materialFB2.uniforms.mouseX.value = mouseX;
    material1.uniforms.mouseX.value = mouseX;
    materialFB2.uniforms.mouseY.value = mouseY;
    material1.uniforms.mouseY.value = mouseY;

    cmouseX = event.clientX - windowHalfX;
    cmouseY = event.clientY + windowHalfY;

    targetRotationY = targetRotationOnMouseDownY + (cmouseY - mouseYOnMouseDown) * 0.001;
    targetRotationX = targetRotationOnMouseDownX + (cmouseX - mouseXOnMouseDown) * 0.001;
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
