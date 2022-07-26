import "babel-polyfill";

import {
	DebugTilesRenderer as TilesRenderer,
} from '../src/index.js';


import {
	Scene,
	Color,
	DirectionalLight,
	AmbientLight,
	WebGLRenderer,
	PerspectiveCamera,
	Group,
	sRGBEncoding,
	FogExp2,
	Vector3,
	Raycaster,
	Vector2,
	Mesh,
	MeshPhysicalMaterial,
	DoubleSide
} from 'three';

import URDFLoader from '../src/three/URDFLoader';
import { FlyControls } from './FlyControls.js';

import { FlyOrbitControls } from './FlyOrbitControls.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

let camera, controls, scene, renderer;
let iss, issFixed;
let groundTiles, skyTiles;
let rayCaster;

const params = {
	errorTarget: 5000,
	displayBoxBounds: false
};

window.addEventListener( 'load', init );

function traverse(x) {
	if (x instanceof Mesh && x.material && x.material.length > 0) {

		x.renderOrder = -999;

		x.material.map((material) => {
			material.polygonOffset = true;
			material.polygonOffsetFactor = -1.0;
			material.polygonOffsetUnits = -4.0;
			material.depthTest = false;
  			material.depthWrite = false;
		})

		issFixed = true;
	}

	if (x.children && x.children.length > 0) {
		x.children.map(element => traverse(element));
	}
}

function init() {

	rayCaster = new Raycaster();

	scene = new Scene();

	// primary camera view
	renderer = new WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.outputEncoding = sRGBEncoding;

	document.body.appendChild( renderer.domElement );
	renderer.domElement.tabIndex = 1;

	camera = new PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);

	const cameraPosition = new Vector3()
	camera.position.set(9.8,-9.8,4.3);
	// camera.rotation.x = 0.5;

	const cameraCenter = new Vector3(15,-9.8,4.3);
	camera.lookAt(cameraCenter);

	const loader = new URDFLoader();
    loader.load('jpm/jpm.urdf', result => {
		iss = result;
        scene.add(result);
		issFixed = false;
    });

	// controls
	controls = new FlyControls( camera, renderer.domElement );
	controls.movementSpeed = 1;
	controls.rollSpeed = Math.PI / 6;
	controls.autoForward = false;
	controls.dragToLook = true;

	camera.rotateZ(1.570796);

	// lights
	const ambLight = new AmbientLight( 0xffffff, 1 );
	scene.add( ambLight );

	const tilesParent = new Group();
	scene.add( tilesParent );

	groundTiles = new TilesRenderer('octtiles/tileset.json');
	groundTiles.optimizeRaycast = true;
	groundTiles.fetchOptions.mode = 'cors';
	groundTiles.lruCache.minSize = 4000;
	groundTiles.lruCache.maxSize = 100000;
	groundTiles.errorTarget = params.errorTarget;
	groundTiles.loadSiblings = false;

	tilesParent.add( groundTiles.group );

	onWindowResize();
	window.addEventListener( 'resize', onWindowResize, false );

	const gui = new GUI();
	gui.title("Debug");

	gui.add( params, 'displayBoxBounds' );
	gui.add( params, 'errorTarget', 0, 10000 );
	gui.close();

	renderer.setAnimationLoop( render );

}

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth , window.innerHeight);
	renderer.setPixelRatio( window.devicePixelRatio);

}

function render() {

	camera.updateMatrixWorld();

	groundTiles.errorTarget = params.errorTarget;
	groundTiles.displayBoxBounds = params.displayBoxBounds;

	groundTiles.setCamera(camera);
	groundTiles.setResolutionFromRenderer(camera, renderer);
	groundTiles.update();

	renderer.render(scene, camera);

	controls.update(0.01);

	if (iss && !issFixed) {
		traverse(iss);
	}

}
