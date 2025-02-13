import * as THREE from 'three';
import {Tree} from './Tree.js';
import {Vector3} from 'three';

const forestSize = 10;
const numTrees = 3;//15;

export class Forest {
    constructor(scene, position) {
        this.scene = scene;
        
        this.obj = new THREE.Object3D();
        if (position) {
            this.obj.position.copy(position);
        }

        this.boundryGeometry = new THREE.BoxGeometry( forestSize, forestSize, forestSize );
        
        this.mesh = new THREE.Mesh( this.boundryGeometry, new THREE.MeshStandardMaterial({wireframe: true}) );

        this.obj.add(this.mesh);

        this.ready = false;

        this.trees = [];

        this.obj.updateMatrixWorld(true);
        this.worldPosition = new THREE.Vector3();
        this.obj.getWorldPosition( this.worldPosition );

        this.init();

        globals.forest = this;
        globals.gui.add(this,"step")
        globals.gui.add(this,"tenSteps")

        globals.gui.add(this, "reset")
        globals.gui.add(this, "grow")

    }

    reset() {
        this.ready = false;
        this.obj.clear();
        this.obj.add(this.mesh);
        this.trees = [];
        this.init();
    }

    grow() {
        // TODO - we will keep growing until all branches end at terminal leaves
    }
    
    getRandomTrunkPos() {

       
        const margin = 3.0;
        const size = forestSize - margin;
        const bounds = size / 2;
        const minProximity = 2.0;
        const maxAttempts = 10;
        let attempt = 0;

        if (numTrees === 1) {
            return new Vector3(0, -bounds - margin/2, 0);
        }
        while (attempt < maxAttempts) {
            attempt++;
            
            const pos = new Vector3(Math.random() * size - bounds, -bounds - margin/2, Math.random() * size - bounds);
            let invalid = false;
            for (let t = 0; t < this.trees.length; t++) {
                const dist = pos.distanceTo(this.trees[t].position);
                if ( dist < minProximity) {
                    invalid = true;
                    break;
                }
            }
            if (!invalid) {
                return pos;
            }

        }
        return undefined;
    }

    init() {
        this.scene.add(this.get())

        console.log({numTrees});
        for (let i = 0; i < numTrees; i++) {

            let pos = this.getRandomTrunkPos();
            if (pos === undefined) {
                console.log("skipped tree creation: too close");
                continue;
            }
            const tree = new Tree(this, pos);
            this.obj.add(tree.get());
            this.trees.push(tree);
        }

        this.ready = true;
    }
    
    step() {
        if (!this.ready) {
            return false;
        }
        for (let t = 0; t < this.trees.length; t++) {
            // console.log(this.trees[t])
            this.trees[t].step();
        }

    }

    tenSteps() {
        if (!this.ready) {
            return false;
        }
        let i = 0;
        const interval = window.setInterval(() => {
            i++;
            this.step();
            if (i == 10) {
                window.clearInterval(interval)
            }
        }, 150)
    }

    get() {
        return this.obj;
    }
    
}