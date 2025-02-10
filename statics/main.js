import * as THREE from 'three';
window.THREE = THREE;
const Vector3 = THREE.Vector3;

import { OrbitControls } from 'three/addons/OrbitControls.js';
import { TextGeometry } from './addons/TextGeometry.js';
import { FontLoader } from './addons/FontLoader.js';
import {Forest} from './Forest.js';
import GUI from './lil-gui/lil-gui.esm.js';
let font;
const loader = new FontLoader();
loader.load(
	// resource URL
	'addons/helvetiker_bold.typeface.json',

	// onLoad callback
	function ( font_ ) {
        font = font_
		// do something with the font
		console.log( font );
        init();

	},

	// onProgress callback
	function ( xhr ) {
		console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
	},

	// onError callback
	function ( err ) {
		console.log( 'An error happened' );
	}
);

const gui = new GUI();
let container, camera, renderer, controls;
let scene, forest;


function init() {

    container = document.querySelector( '.container' );

    scene = new THREE.Scene();
    window.scene = scene;
    scene.background = new THREE.Color( 0x222222 );

    camera = new THREE.PerspectiveCamera( 35, window.innerWidth / window.innerHeight, 0.1, 100 );
    camera.position.z = 25;

    controls = new OrbitControls( camera, container );

    const light = new THREE.HemisphereLight( 0xffffff, 0x444444, 3 );
    light.position.set( - 2, 2, 2 );
    scene.add( light.clone() );

    initMeshes();

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setAnimationLoop( animate );
    container.appendChild( renderer.domElement );

    window.addEventListener( 'resize', onWindowResize );

}

function addAxis() {
    const axesHelper = new THREE.AxesHelper( 5 );
    scene.add( axesHelper );    
    const fontOptions = {
        font,
        depth: 0.2,
		size: 0.8,
        height: 0.2,
        curveSegments: 2,
        bevelEnabled: false,
	}

    const xText = new TextGeometry( 'X', fontOptions);
    const xMesh = new THREE.Mesh( xText, new THREE.MeshStandardMaterial() );
    xMesh.position.copy(new Vector3(5,0,0));
    scene.add(xMesh)

    const yText = new TextGeometry( 'Y', fontOptions);
    const yMesh = new THREE.Mesh( yText, new THREE.MeshStandardMaterial() );
    yMesh.position.copy(new Vector3(0,5,0));
    scene.add(yMesh)

    const zText = new TextGeometry( 'Z', fontOptions);
    const zMesh = new THREE.Mesh( zText, new THREE.MeshStandardMaterial() );
    zMesh.position.copy(new Vector3(0,0,5));
    scene.add(zMesh)
}

let dir = new THREE.Vector3( 0, 1, 0 );
let arrowHelper;


/**
 * Generates a series of random splits from a vector. 
 * The output vectors will appear within a cone defined by a min/max arcRadial
 * This will be used to generate branches and splits from a tree.
 * aboutVector: The incoming vectors direction to pertubate
 * arcTheta: the minumum "amplitude" of the pertubation from aboutVector
 * amount: the amount of pertubations
 * spreadPointsEvenly: if true, spread points evenly along the cone
 * randomizeSpreadBy: random amount to randomize spread of points
 * 
 * 
 */
function getRandomPertubations(aboutVector, arcTheta, amount=1, spreadPointsEvenly=false, randomizeSpreadBy=0) {

    const direction = aboutVector.clone();
    if(Math.abs(direction.z) < 0.001 ) {
        direction.z = 0.001
    }
    // 1 get some orthogonal vector to direction ( solve direction and orthogonal dot product = 0, assume x = 1, y = 1, then z = as below )) 
    const orthogonal = new Vector3( 1.0, 1.0, - ( direction.x + direction.y ) / direction.z );
    orthogonal.normalize();
    
    const points = [];
    // 2 get random vector from circle on flat orthogonal to direction vector. get full range to assume all cone space randomization (-180, 180 )
   

    const startingRand = spreadPointsEvenly ? Math.random()*2*Math.PI : 0;
    const spreadAmount = spreadPointsEvenly ? Math.PI*2 / amount : 0
    const getOrthoAngle = (i) => {
        if(spreadPointsEvenly) {
            return startingRand + spreadAmount * i + Math.random() * randomizeSpreadBy;
        }
        return Math.random() * Math.PI*2 - Math.PI;
    }

    for (let i = 0; i < amount; i++ ) {
        const orthoAngle = getOrthoAngle(i) 
        console.log(orthoAngle);
    
        //const angle = Math.PI/8;
        const rotateTowardsDirection = new THREE.Quaternion();//new Quaternion.AngleAxis( orthoAngle, direction );
        rotateTowardsDirection.setFromAxisAngle(direction, orthoAngle)
        
        const o = orthogonal.clone();
        o.applyQuaternion(rotateTowardsDirection);
       
        const rotateDirection = new THREE.Quaternion(); 
        rotateDirection.setFromAxisAngle(o, arcTheta );
        // console.log(rotateDirection)
        // const perturbedDirection = direction.clone()
        const perturbedDirection = direction.clone().applyQuaternion(rotateDirection);
        // perturbedDirect  ion.normalize
        points.push(perturbedDirection);
    }

    console.log({points})
    return points;

}

function quatCheck() {

    //normalize the direction vector (convert to vector of length 1)
    dir.normalize();

    const origin = new THREE.Vector3( 0, 0, 0 );
    const length = 1;
    const hex = 0xffff00;
    if(arrowHelper) {
        scene.remove(arrowHelper);
    }

    arrowHelper = new THREE.ArrowHelper( dir, origin, length, hex );
    scene.add( arrowHelper );

    const quaternion = new THREE.Quaternion();
    quaternion.setFromAxisAngle(new THREE.Vector3(0,1,0), Math.PI/4)

    const quaternion1 = new THREE.Quaternion();
    quaternion1.setFromAxisAngle(new THREE.Vector3(1,0,0), Math.PI/2)
    console.log("q1:", quaternion1);

    let vector = new THREE.Vector3( 0, 1, 0 );
    vector = vector.applyQuaternion( quaternion );
    console.log(vector);

    const arrowHelper2 = new THREE.ArrowHelper( vector, origin, length, 0xff0000 );
    scene.add( arrowHelper2 );


    // Pix 
    // Build orthagonal axis

    const pertubations = 4;

    const angle = Math.PI/8;
    const perturbs = getRandomPertubations(dir,angle, pertubations, true, Math.PI/8);
    for(let p = 0; p < perturbs.length; p++) {
        // const direction = dir.clone();
        // if(Math.abs(direction.z) < 0.001 ) {
        //     direction.z = 0.001
        // }
        // // 1 get some orthogonal vector to direction ( solve direction and orthogonal dot product = 0, assume x = 1, y = 1, then z = as below )) 
        // const orthogonal = new Vector3( 1.0, 1.0, - ( direction.x + direction.y ) / direction.z );
        // orthogonal.normalize();
       
        // // 2 get random vector from circle on flat orthogonal to direction vector. get full range to assume all cone space randomization (-180, 180 )
        // const orthoAngle = Math.random() * Math.PI*2 - Math.PI;
        

        // const rotateTowardsDirection = new THREE.Quaternion();//new Quaternion.AngleAxis( orthoAngle, direction );
        // rotateTowardsDirection.setFromAxisAngle(direction, orthoAngle)
        // //const randomOrtho = rotateTowardsDirection.multiply(orthogonal);
        // // console.log(rotateTowardsDirection, orthogonal)
        // // rotateTowardsDirection.multiply(orthogonal)
        // orthogonal.applyQuaternion(rotateTowardsDirection);
        // // console.log(orthogonal)
        // // 3 rotate direction towards random orthogonal vector by vector from our available range 
        // const perturbAngle = angle//; * Math.random();//UnityEngine.Random.Range( 0f, angle );   // range from (0, angle), full cone cover guarantees previous (-180,180) range   
        // const rotateDirection = new THREE.Quaternion(); 
        // rotateDirection.setFromAxisAngle(orthogonal, perturbAngle );
        // // console.log(rotateDirection)
        // const perturbedDirection = direction.applyQuaternion(rotateDirection);
        // // perturbedDirect  ion.normalize
        // console.log(perturbedDirection)

        
        

        const perturbArrow = new THREE.ArrowHelper( perturbs[p], origin, length, 0xff00ff );
        scene.add( perturbArrow );


    }
        
}


function initMeshes() {
    addAxis();

    const geometry = new THREE.IcosahedronGeometry( 1, 3 );

    const meshL = new THREE.Mesh( geometry, new THREE.MeshStandardMaterial() );
    //scene.add( meshL );

    
    forest = new Forest(scene, new Vector3(0,0,0), gui);
   

    // quatCheck();

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {

   
    renderer.render( scene, camera );


}