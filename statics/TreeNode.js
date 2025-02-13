import * as THREE from 'three';
import {Vector3} from 'three';
import { SimulationNode } from './SimulationNode.js';

import { getRandomPertubations } from './utils.js';


const inverseDetail = 4; // Lower is better detail
const sphereDetail = [32 / inverseDetail, 16/inverseDetail]


export class TreeNode {
    constructor(objParent, nodeParent, treeNodeParams, tree) {
        
        this.objParent = objParent;
        this.params = treeNodeParams;
        this.tree = tree;
        this.parent = nodeParent;
        this.children = [];
        this.terminated = false;

        this.radius = treeNodeParams.radius ?? 1;

        
        const nodeGeometry = new THREE.SphereGeometry( this.radius, sphereDetail[0], sphereDetail[1] );
        this.mesh = new THREE.Mesh( nodeGeometry, new THREE.MeshStandardMaterial({wireframe:true, color: tree.color, emissive: tree.color}) );

        this.mesh.position.copy(treeNodeParams.parentOffset);
        // console.log("this.mesh.position", this.mesh.position, "parentOffset:", treeNodeParams.parentOffset)
        if(this.parent) {
            this.mesh.position.add(this.parent.mesh.position.clone());
        }
        else {
            // this.mesh.position.add(this.tree.worldPosition);
        }
        //objParent.add(this.mesh)
        this.tree.get().add(this.mesh);
        // globals.scene.add(this.mesh);
        if (nodeParent) {
            nodeParent.assignChild(this);
        }

        this.worldPosition = new THREE.Vector3(); // create once an reuse it

        tree.obj.updateMatrixWorld(true);
        this.mesh.updateMatrixWorld(true);
        this.mesh.updateWorldMatrix(true,true);
        this.worldPosition = new THREE.Vector3();
        // this.obj.getWorldPosition( this.worldPosition );
        this.mesh.getWorldPosition( this.worldPosition );

        this.initialWorldPosition = this.worldPosition.clone();

        // console.log(this.worldPosition);

        let transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin( new Ammo.btVector3( this.worldPosition.x, this.worldPosition.y, this.worldPosition.z ) );
        // console.log(this.worldPosition.y)
        
        let quat = {x: 0, y: 0, z: 0, w: 1};
        transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
        let motionState = new Ammo.btDefaultMotionState( transform );

        let colShape = new Ammo.btSphereShape( this.radius );
        colShape.setMargin( 0.05 );

        let localInertia = new Ammo.btVector3( 0, 0, 0 );
        let mass = 1;
        colShape.calculateLocalInertia( mass, localInertia );

        let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
        this.physicsBody = new Ammo.btRigidBody( rbInfo );

        const damp = 0.9
        this.physicsBody.setDamping(damp,damp)

        globals.simulation.physicsWorld.addRigidBody( this.physicsBody );
        
        //ball.userData.physicsBody = body;
        this.simulationNode = new SimulationNode(this, this.mesh, this.physicsBody)
        globals.simulation.rigidBodies.push(this.simulationNode);

        
    }

    constructChildren(childParams) {
        
        if (!this.parent) {
            // Simple vertical shift
            const delta = this.radius + childParams.radius;
            return [new TreeNode(this.get(), this, {
                        radius: childParams.radius,
                        parentOffset: new Vector3(0,delta,0),
                    }, this.tree)]

        }
        else {
            if (childParams.didTerminate(childParams)) {
                this.terminated = true;
                return [];
            }
            else if (childParams.didSplit(childParams)) {
                console.log("split")
                return this.constructChildSplits(childParams);
            }
            else if (childParams.didBranch(childParams)) {
                console.log("branch")
                return this.constructChildBranches(childParams);
            }

            // Slightly shift the direction of the branch
            return [this.getSmallOffset(childParams)];
            
        }

    }

    constructChildBranches(childParams) {
        const minBranches = 2;
        const maxBranches = 3;
        const direction = this.worldPosition.clone().sub(this.parent.worldPosition)
        // console.log({direction});
        direction.normalize();

        const splitDirectionAxisAngle = Math.PI/4;

        const numBranches = minBranches + Math.floor(Math.random() * (maxBranches-minBranches))
        const branches = getRandomPertubations(direction, splitDirectionAxisAngle, numBranches, true, Math.PI/4);
        const leaves = [];

        for (let n = 0; n < branches.length; n++) {

            const desiredMag = this.radius + childParams.radius;

            // const perturbArrow = new THREE.ArrowHelper( branches[n], this.worldPosition, 1, 0xff00ff );
            // window.scene.add( perturbArrow );

            branches[n].setLength(desiredMag);
            
            leaves.push (new TreeNode(this.get(), this, {
                radius: childParams.radius,
                parentOffset: branches[n]
            }, this.tree));
           
            
        }
        return leaves;

    }

    getSmallOffset(childParams) {
        const smallOffset = Math.PI/16;
        const direction = this.worldPosition.clone().sub(this.parent.worldPosition)
        // console.log({direction})
        direction.normalize();

        const pertubation = getRandomPertubations(direction, smallOffset, 1)[0];
        
        const desiredMag = this.radius + childParams.radius;
        pertubation.setLength(desiredMag);
        return new TreeNode(this.get(), this, {
            radius: childParams.radius,
            parentOffset: pertubation
        }, this.tree)
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
        }, this.tree))
        
        const splitDirectionAxisAngle = Math.PI/4;

        const numSplits = minSplits + Math.floor(Math.random() * (maxSplits-minSplits))
        direction.normalize();
        const splits = getRandomPertubations(direction, splitDirectionAxisAngle, numSplits, true, Math.PI/4);
        for (let n = 0; n < splits.length; n++) {

            const desiredMag = this.radius + childParams.radius;

            // const perturbArrow = new THREE.ArrowHelper( splits[n], this.worldPosition, 1, 0xff00ff );
            // window.scene.add( perturbArrow );

            splits[n].setLength(desiredMag);
            

            leaves.push (new TreeNode(this.get(), this, {
                radius: childParams.radius,
                parentOffset: splits[n]
            }, this.tree));
            
        }

        return leaves;
    }

    assignChild(childNode) {
        this.children.push(childNode);
    }

    get() {
        return this.mesh;
    }

    computeNewWorldPosition() {
        this.mesh.getWorldPosition( this.worldPosition );
        // console.log(this.worldPosition.y)
    }

    setWorldPosition(newWorldPosition) {
        newWorldPosition.sub(this.worldPosition);
        // this.initialWorldPosition.copy(this.worldPosition);
        this.mesh.position.add(newWorldPosition)
        this.mesh.getWorldPosition( this.worldPosition );
        // this.worldPosition.copy(newWorldPosition);
    }

    getPhysicsBody() {
        return this.physicsBody;
    }
}