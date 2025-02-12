import * as THREE from 'three';
window.THREE = THREE;
const Vector3 = THREE.Vector3;

import { OrbitControls } from 'three/addons/OrbitControls.js';
import { FontLoader } from './addons/FontLoader.js';
import {Forest} from './Forest.js';
import {Simulation} from './Simulation.js';
import { addAxis } from './utils.js';

import GUI from './lil-gui/lil-gui.esm.js';

const globals = {
    /** GUI controls */
    gui: new GUI(),

    /** THREE stuff */
    container: undefined,
    camera: undefined,
    renderer: undefined,
    controls: undefined,
    font: undefined,
    scene: undefined,

    /** Tree stuff */
    forest: undefined,

    simulation: undefined,
    lastRenderMillis: undefined

}
window.globals = globals;

const loader = new FontLoader();
loader.load(
	// resource URL
	'addons/helvetiker_bold.typeface.json',
	// onLoad callback
	( font_ )=>{
        globals.font = font_		
        Ammo().then(init);
	},
	// onProgress callback
	( xhr )=>{
		console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
	},
	// onError callback
	( err ) => {
		console.log( 'An error occured during font load' );
	}
);

function init() {
   
    globals.simulation = new Simulation();

    globals.container = document.querySelector( '.container' );
    globals.scene = new THREE.Scene();
    globals.scene.background = new THREE.Color( 0x222222 );
    globals.camera = new THREE.PerspectiveCamera( 35, window.innerWidth / window.innerHeight, 0.1, 100 );
    globals.camera.position.z = 25;
    globals.controls = new OrbitControls( globals.camera, globals.container );

    const light = new THREE.HemisphereLight( 0xffffff, 0x444444, 3 );
    light.position.set( - 2, 2, 2 );
    globals.scene.add( light.clone() );

    initScene();

    globals.renderer = new THREE.WebGLRenderer( { antialias: true } );
    globals.renderer.setPixelRatio( window.devicePixelRatio );
    globals.renderer.setSize( window.innerWidth, window.innerHeight );
    globals.renderer.setAnimationLoop( animate );
    globals.container.appendChild( globals.renderer.domElement );

    window.addEventListener( 'resize', onWindowResize );

}

const sceneParams = {
    showAxis: false
}
function initScene() {
    if(sceneParams.showAxis) {
        addAxis(globals.scene, globals.font);
    }

    globals.forest = new Forest(globals.scene, new Vector3(0,0,0));
}

function onWindowResize() {

    globals.camera.aspect = window.innerWidth / window.innerHeight;
    globals.camera.updateProjectionMatrix();

    globals.renderer.setSize( window.innerWidth, window.innerHeight );

}



function animate(ellapsedMillis) {
    if(globals.simulation === undefined) {
        return;
    }

    if(globals.lastRenderMillis === undefined) {
        globals.lastRenderMillis = ellapsedMillis;
    }
    const dt = ellapsedMillis - globals.lastRenderMillis;
   
    globals.simulation.updatePhysics(dt);
    globals.renderer.render( globals.scene, globals.camera );

    
    globals.lastRenderMillis = ellapsedMillis;
}