import * as THREE from 'three';
import {Vector3} from 'three';
import { convertBulletVectorToThree } from './utils.js';

const springParams = {
    restingLength: 0.5,
    springForce: 120,
    springMax: 400,
}

function springForce(springCenter, objectPosition) {
    const springDirection = springCenter.clone().sub(objectPosition);
    // console.log(springDirection);
    const len = springDirection.length();
    if(len < springParams.restingLength) {
        // return springDirection.setLength(0);
    }
    springDirection.setLength(Math.min(springParams.springForce * len, springParams.springMax));
    return springDirection;
}

export class Simulation {
    constructor(simulationParams) {
        if(Simulation.instance) {
            console.error("Simulation class is intended to be a singleton");
        }
        
        this.collisionConfiguration = new Ammo.btDefaultCollisionConfiguration(),
        this.dispatcher = new Ammo.btCollisionDispatcher(this.collisionConfiguration),
        this.overlappingPairCache = new Ammo.btDbvtBroadphase(),
        this.solver = new Ammo.btSequentialImpulseConstraintSolver();

        this.physicsWorld = new Ammo.btDiscreteDynamicsWorld(this.dispatcher, this.overlappingPairCache, this.solver, this.collisionConfiguration);
        this.physicsWorld.setGravity(new Ammo.btVector3(0, 10, 0));
        
        this.tempTransform = new Ammo.btTransform();

        // SimulationNodes
        this.rigidBodies = [];
       
        Simulation.instance = this;

    }

    updatePhysics(deltaMillis) {
        // Apply forces to rigid bodies
        for ( let i = 0; i < this.rigidBodies.length; i++ ) {
            let {obj, physicsBody, node} = this.rigidBodies[i];
            
            if(physicsBody === undefined || obj === undefined) {
                continue;
            }
            const force = springForce(node.initialWorldPosition, node.worldPosition);
            
            physicsBody.clearForces();
            physicsBody.applyCentralForce(new Ammo.btVector3(force.x, force.y, force.z))
    
        }
        
        // Step world
        this.physicsWorld.stepSimulation( /** seconds*/deltaMillis / 1000, /**subSteps */ 10 );
    
        // Update rigid bodies
        for ( let i = 0; i < this.rigidBodies.length; i++ ) {
            let {obj, physicsBody, node} = this.rigidBodies[i];
            if(physicsBody === undefined || obj === undefined) {
                continue;
            }
            let ms = physicsBody.getMotionState();
            if (ms) {
            //    console.log(ms)
                ms.getWorldTransform( this.tempTransform );
               
                let p = this.tempTransform.getOrigin();
                let q = this.tempTransform.getRotation();
                node.setWorldPosition( convertBulletVectorToThree(p));
                obj.quaternion.set( q.x(), q.y(), q.z(), q.w() );
    
            }
        }

        // Update worldPosition
        for ( let i = 0; i < this.rigidBodies.length; i++ ) {
            let {obj, physicsBody, node} = this.rigidBodies[i];
            node.computeNewWorldPosition();
            
        }
    }
}