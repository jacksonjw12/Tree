import * as THREE from 'three';
import {Vector3} from 'three';
import { TextGeometry } from './addons/TextGeometry.js';


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
export function getRandomPertubations(aboutVector, arcTheta, amount=1, spreadPointsEvenly=false, randomizeSpreadBy=0) {

    const direction = aboutVector.clone();
    if (Math.abs(direction.z) < 0.001 ) {
        // Solve cases where z = 0 leads to div by 0
        direction.z = 0.001
    }
    // Get an orthogonal vector to direction ( direction and orthogonal dot product = 0, assume x = 1, y = 1, then z as below )) 
    const orthogonal = new Vector3( 1.0, 1.0, - ( direction.x + direction.y ) / direction.z );
    orthogonal.normalize();
    
    const points = [];
    // Get random vector from circle on flat orthogonal to direction vector. get full range to assume all cone space randomization (-180, 180 )
   
    const startingRand = spreadPointsEvenly ? Math.random()*2*Math.PI : 0;
    const spreadAmount = spreadPointsEvenly ? Math.PI*2 / amount : 0
    const getOrthoAngle = (i) => {
        if (spreadPointsEvenly) {
            return startingRand + spreadAmount * i + Math.random() * randomizeSpreadBy;
        }
        return Math.random() * Math.PI*2 - Math.PI;
    }

    for (let i = 0; i < amount; i++ ) {
        const orthoAngle = getOrthoAngle(i) 
        
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

    // console.log({points})
    return points;

}



// export function isColliding(position, radius) {

// }

// export function safeObjectPosition(position, axisToSearch, radius, maxDist){


// }


export function addAxis(scene, font) {
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

export function convertThreeVectorToBullet(threeVector) {
    return new Ammo.btVector3(threeVector.x, threeVector.y, threeVector.z)
}


export function convertBulletVectorToThree(bulletVector) {
    return new THREE.Vector3(bulletVector.x(), bulletVector.y(), bulletVector.z())
}
