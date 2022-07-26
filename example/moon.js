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

import ThreeMeshUI from 'three-mesh-ui';

import { FlyOrbitControls } from './FlyOrbitControls.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader';
// import { FlyControls } from 'three/examples/jsm/controls/FlyControls';

import * as dat from 'dat.gui';

import URDFLoader from '../src/three/URDFLoader.js';

let camera, controls, scene, renderer;
let iss, issFixed;
let groundTiles, skyTiles;
let rayCaster, mousePosition;
let selectState = false;
const objsToTest = [];

const mouse = new Vector2();
mouse.x = mouse.y = null;

window.addEventListener( 'pointermove', ( event ) => {
	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = -( event.clientY / window.innerHeight ) * 2 + 1;
} );

window.addEventListener( 'pointerdown', () => {
	selectState = true;
} );

window.addEventListener( 'pointerup', () => {
	selectState = false;
} );

const params = {

	errorTarget: 4500,
	displayBoxBounds: false

};

window.addEventListener( 'load', init );
// render();

function traverse(x) {
	if (x instanceof Mesh && x.material && x.material.length > 0) {

		x.renderOrder = -999;

		x.material.map((material) => {
			material.polygonOffset = true;
			material.polygonOffsetFactor = -1.0;
			material.polygonOffsetUnits = -4.0;
			material.depthTest = false;
  			material.depthWrite = false;

			// console.log({material})
		})

		issFixed = true;
	}

	if (x.children && x.children.length > 0) {
		x.children.map(element => traverse(element));
	}
}


function makeTextPanel(scene) {
	const container = new ThreeMeshUI.Block({
	  width: 1.2,
	  height: 0.5,
	  padding: 0.05,
	  justifyContent: "center",
	  textAlign: "center",
	  fontFamily: "./assets/Roboto-msdf.json",
	  fontTexture: "./assets/Roboto-msdf.png"
	});

	const hoveredStateAttributes = {
		state: 'hovered',
		attributes: {
			offset: 0.035,
			backgroundColor: new Color( 0x999999 ),
			backgroundOpacity: 1,
			fontColor: new Color( 0xffffff )
		},
	};

	const idleStateAttributes = {
		state: 'idle',
		attributes: {
			offset: 0.035,
			backgroundColor: new Color( 0x666666 ),
			backgroundOpacity: 0.3,
			fontColor: new Color( 0xffffff )
		},
	};

	const selectedAttributes = {
		offset: 0.02,
		backgroundColor: new Color( 0x777777 ),
		fontColor: new Color( 0x222222 )
	};

	container.position.set(10.896,-9.5, 3);
	container.rotation.x = -0.55;
	scene.add(container);

	container.setupState( {
		state: 'selected',
		attributes: selectedAttributes,
		onSet: () => {

			console.log("set!")
			camera.position.set(11.5,-9.8,2);
			camera.rotation.x = -0.5;
			const center = new Vector3(10.896,-8.1, 5.95);

			camera.lookAt(center);

			controls.target.set(10.896,-8.1, 5.95);

		}
	} );
	container.setupState( hoveredStateAttributes );
	container.setupState( idleStateAttributes );

	let newText = new ThreeMeshUI.Text({
		content: "Hatch 1",
		fontSize: 0.125
	  });

	container.add(
	  newText
	);

	objsToTest.push(
		container
	);

	ThreeMeshUI.update()
  }

function init() {

	console.log("init")

	rayCaster = new Raycaster();
    mousePosition = new Vector2();

	// const fog = new FogExp2( 0xd8cec0, .0075, 250 );
	scene = new Scene();

	// primary camera view
	renderer = new WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	// renderer.setClearColor( 0xd8cec0 );
	renderer.outputEncoding = sRGBEncoding;

	document.body.appendChild( renderer.domElement );
	renderer.domElement.tabIndex = 1;

	camera = new PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.0001, 200);
	camera.position.set(11.5,-9.8,2);
	camera.rotation.x = -0.5;

	// const center = new Vector3(10.896,-8.1, 5.95);
	const center = new Vector3(10.896,-8.1, 5.95);

	camera.lookAt(center);


	const loader = new URDFLoader();
    loader.load('jpm/jpm.urdf', result => {
		iss = result;
        scene.add(result);
		issFixed = false;
    });

	// controls
	controls = new FlyOrbitControls( camera, renderer.domElement );
	controls.target.set(10.896,-8.1, 5.95);

	// controls = new FlyControls( camera, renderer.domElement );
	// controls.movementSpeed = 1;
	// controls.rollSpeed = Math.PI / 24;
	// controls.autoForward = false;
	// controls.dragToLook = true;


	// lights
	const ambLight = new AmbientLight( 0xffffff, 1 );
	scene.add( ambLight );

	const tilesParent = new Group();
	// tilesParent.rotation.set( Math.PI / 2, 0, 0 );
	scene.add( tilesParent );

	groundTiles = new TilesRenderer( 'octtiles/tileset.json' );
	groundTiles.fetchOptions.mode = 'cors';
	groundTiles.lruCache.minSize = 900;
	groundTiles.lruCache.maxSize = 1300;
	groundTiles.errorTarget = 12;

	// skyTiles = new TilesRenderer( 'octtiles/tileset.json' );
	// skyTiles.fetchOptions.mode = 'cors';
	// skyTiles.lruCache = groundTiles.lruCache;
	// skyTiles.errorTarget = 12;


	// tilesParent.add( groundTiles.group, skyTiles.group );
	tilesParent.add( groundTiles.group );


	onWindowResize();
	window.addEventListener( 'resize', onWindowResize, false );

	makeTextPanel(scene);



	const gui = new dat.GUI();

	gui.add( params, 'displayBoxBounds' );
	gui.add( params, 'errorTarget', 0, 5000 );
	gui.open();

	renderer.setAnimationLoop( render );

}

function onWindowResize() {

	console.log("window resized")

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setPixelRatio( window.devicePixelRatio );

}

function render() {

	// requestAnimationFrame( render );

	camera.updateMatrixWorld();

	groundTiles.errorTarget = params.errorTarget;
	// skyTiles.errorTarget = params.errorTarget;

	groundTiles.displayBoxBounds = params.displayBoxBounds;
	// skyTiles.displayBoxBounds = params.displayBoxBounds;

	groundTiles.setCamera( camera );
	groundTiles.setResolutionFromRenderer( camera, renderer );
	groundTiles.update();

	// skyTiles.setCamera( camera );
	// skyTiles.setResolutionFromRenderer( camera, renderer );
	// skyTiles.update();

	renderer.render( scene, camera );

	controls.update(0.01);

	if (iss && !issFixed) {
		traverse(iss);
	}

	ThreeMeshUI.update();

	updateButtons();

}

function updateButtons() {

	// Find closest intersecting object

	let intersect;

	if ( renderer.xr.isPresenting ) {

		vrControl.setFromController( 0, rayCaster.ray );

		intersect = raycast();

		// Position the little white dot at the end of the controller pointing ray
		if ( intersect ) vrControl.setPointerAt( 0, intersect.point );

	} else if ( mouse.x !== null && mouse.y !== null ) {

		rayCaster.setFromCamera( mouse, camera );

		intersect = raycast();

	}

	// Update targeted button state (if any)

	if ( intersect && intersect.object.isUI ) {

		if ( selectState ) {

			// Component.setState internally call component.set with the options you defined in component.setupState
			intersect.object.setState( 'selected' );

		} else {

			// Component.setState internally call component.set with the options you defined in component.setupState
			intersect.object.setState( 'hovered' );

		}

	}

	// Update non-targeted buttons state

	objsToTest.forEach( ( obj ) => {

		if ( ( !intersect || obj !== intersect.object ) && obj.isUI ) {

			// Component.setState internally call component.set with the options you defined in component.setupState
			obj.setState( 'idle' );

		}

	} );

}

function raycast() {

	return objsToTest.reduce( ( closestIntersection, obj ) => {

		const intersection = rayCaster.intersectObject( obj, true );

		if ( !intersection[ 0 ] ) return closestIntersection;

		if ( !closestIntersection || intersection[ 0 ].distance < closestIntersection.distance ) {

			intersection[ 0 ].object = obj;

			return intersection[ 0 ];

		}

		return closestIntersection;

	}, null );

}
