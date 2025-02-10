import * as THREE from 'three';
import {Vector3} from 'three';

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
   

    const startingRand = 0//spreadPointsEvenly ? Math.random()*2*Math.PI : 0;
    const spreadAmount = spreadPointsEvenly ? Math.PI*2 / amount : 0
    const getOrthoAngle = (i) => {
        if(spreadPointsEvenly) {
            return startingRand + spreadAmount * i + Math.random() * randomizeSpreadBy;
        }
        return Math.random() * Math.PI*2 - Math.PI;
    }

    for (let i = 0; i < amount; i++ ) {
        const orthoAngle = getOrthoAngle(i) 
        // console.log(orthoAngle);
    
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

    // console.log({points})
    return points;

}


export class TreeNode {
    constructor(objParent, nodeParent, treeNodeParams, tree) {
        
        this.objParent = objParent;
        this.params = treeNodeParams;
        this.tree = tree;
        this.parent = nodeParent;
        this.children = [];
        this.terminated = false;

        this.radius = treeNodeParams.radius ?? 1;

        const detail = 1/2;
        const nodeGeometry = new THREE.SphereGeometry( this.radius, 32/2, 16/2 );
        this.mesh = new THREE.Mesh( nodeGeometry, new THREE.MeshStandardMaterial() );

        this.mesh.position.copy(treeNodeParams.parentOffset);
        objParent.add(this.mesh)
        if(nodeParent) {
            nodeParent.assignChild(this);
        }

        // if (parent && treeNodeParams.grandparent) {

        //     const direction = parent.worldPosition.clone().sub(treeNodeParams.grandparent.worldPosition)
           
        //     const desiredMag = parent ? parent.radius + this.radius : this.radius;
        //     direction.setLength(desiredMag);
        //     this.mesh.position.copy(direction);

        // } else {
        //     const delta = parent ? parent.radius + this.radius : this.radius;
        //     this.mesh.position.copy(new Vector3(0,delta,0));
            
        // }

        // if(parent) {
        //     this.parent.get().add(this.mesh);
        // }
        // else {
        //     this.tree.get().add(this.mesh);
        // }
       

        // if(!treeNodeParams.isRoot) {
        this.worldPosition = new THREE.Vector3(); // create once an reuse it

        this.mesh.getWorldPosition( this.worldPosition );
        // this.worldPosition = this.mesh.getWorldPosition();
        // }
        

        
    }

    constructChildren(childParams) {
        
        if(!this.parent) {
            // Simple vertical shift
            console.log("a")
            const delta = this.radius + childParams.radius;
            console.log(delta);
            return [new TreeNode(this.get(), this, {
                        radius: childParams.radius,
                        parentOffset: new Vector3(0,delta,0)
                    }, this)]

        }
        else {
            console.log("b")

            if(childParams.didTerminate(childParams)) {
                this.terminated = true;
                return [];
            }

            if(childParams.didSplit(childParams)) {
                console.log("split")
                return this.constructChildSplits(childParams);
            }
            else if(childParams.didBranch(childParams)) {
                console.log("branch")
                return this.constructChildBranches(childParams);
            }
            const direction = this.worldPosition.clone().sub(this.parent.worldPosition)
            // console.log(direction)
            const desiredMag = this.radius + childParams.radius;
            direction.setLength(desiredMag);
            return [new TreeNode(this.get(), this, {
                radius: childParams.radius,
                parentOffset: direction
            }, this)]
            
            
        }

        return newLeaves;
    }

    constructChildBranches(childParams) {
        const minBranches = 2;
        const maxBranches = 3;
        const direction = this.worldPosition.clone().sub(this.parent.worldPosition)
        direction.normalize();

        const splitDirectionAxisAngle = Math.PI/4;

        // const dir = direction.clone();
        // console.log(dir);
        // dir.normalize()

        const numBranches = minBranches + Math.floor(Math.random() * (maxBranches-minBranches))
        const branches = getRandomPertubations(direction, splitDirectionAxisAngle, numBranches, true, Math.PI/4);
        // const perturbs = getRandomPertubations(dir,angle, pertubations, true, Math.PI/8);
        const leaves = [];

        for(let n = 0; n < branches.length; n++) {

            const desiredMag = this.radius + childParams.radius;

            const perturbArrow = new THREE.ArrowHelper( branches[n], this.worldPosition, 1, 0xff00ff );
            window.scene.add( perturbArrow );

            branches[n].setLength(desiredMag);
            

            leaves.push (new TreeNode(this.get(), this, {
                radius: childParams.radius,
                parentOffset: branches[n]
            }, this));
           
            
        }
        return leaves;

    }

    constructChildSplits(childParams) {
        const minSplits = 1;
        const maxSplits = 1;
        const direction = this.worldPosition.clone().sub(this.parent.worldPosition)
        
        const leaves = [];

        const original = direction.clone();
        const desiredMag = this.radius + childParams.radius;
        original.setLength(desiredMag);


         // Also add the original angle
        leaves.push(new TreeNode(this.get(), this, {
            radius: childParams.radius,
            parentOffset: original
        }, this))
        

        const splitDirectionAxisAngle = Math.PI/4;



        const numSplits = minSplits + Math.floor(Math.random() * (maxSplits-minSplits))
        direction.normalize();
        const splits = getRandomPertubations(direction, splitDirectionAxisAngle, numSplits, true, Math.PI/4);
        // const perturbs = getRandomPertubations(dir,angle, pertubations, true, Math.PI/8);

        for(let n = 0; n < splits.length; n++) {

            const desiredMag = this.radius + childParams.radius;

            const perturbArrow = new THREE.ArrowHelper( splits[n], this.worldPosition, 1, 0xff00ff );
            window.scene.add( perturbArrow );

            splits[n].setLength(desiredMag);
            

            leaves.push (new TreeNode(this.get(), this, {
                radius: childParams.radius,
                parentOffset: splits[n]
            }, this));
           
            
        }

       


        return leaves;

    }

    assignChild(childNode) {
        this.children.push(childNode);
    }

    get() {
        return this.mesh;
    }
}