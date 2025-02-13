import * as THREE from 'three';
import {Vector3} from 'three';
import {TreeNode} from './TreeNode.js';


export class Tree {
    constructor(forest, initPosition) {
        this.forest = forest;
        this.obj = new THREE.Object3D();
        this.position = initPosition;
       
        // console.log({initPosition});
        this.obj.position.copy(initPosition);
        
        this.nodes = [];
        this.root = undefined;

        this.branches = 1;

        this.color = Math.floor((Math.random() + 0.2)*16777211);
       
       
        this.obj.updateMatrixWorld(true);
        this.worldPosition = new THREE.Vector3();
        this.obj.getWorldPosition( this.worldPosition );
        // console.log("treePos", this.worldPosition);
        
        this.init();


        this.iteration = 0;
        
        
    }

    init() {
        // Construct a trunk base, and one node
        this.trunkGeometry = new THREE.CircleGeometry( 1, 8 );
        this.trunkMesh = new THREE.Mesh( this.trunkGeometry, new THREE.MeshStandardMaterial({wireframe: false}) );
        this.trunkMesh.setRotationFromEuler(new THREE.Euler(-Math.PI/2,0,0))
        this.obj.add(this.trunkMesh);

        const trunkRadius = 0.3;//0.5;
        this.root = new TreeNode(this.get(), undefined, {
            radius: trunkRadius,
            parentOffset:new Vector3(0,trunkRadius,0)
        }, this)
        this.nodes.push(this.root);
        this.obj.add(this.root.mesh);
        this.iteration++;
        

        this.ready = true;



    }

    async forEachLeafNode(cb) {

        for(let n = 0; n < this.nodes.length; n++) {
            const node = this.nodes[n];
            if (node.children.length == 0 && !node.terminated) {
                cb(node);
            }
        }
    }
    
    async step() {
        if(!this.ready) {
            return;
        }
        let newNodes = []

        this.forEachLeafNode((leaf) => {
            // const nextNode = new TreeNode(leaf, {
            //     radius: leaf.radius * 0.9,
            //     grandparent: leaf.parent,
                
            // }, this);
            const newLeaves = leaf.constructChildren({
                didSplit:(params) => this.didSplit(params),
                didBranch: (params) => this.didBranch(params), 
                didTerminate: (params) => this.didTerminate(params),
                radius: leaf.radius * (0.94 + Math.random() * 0.04)
            });
            
            // this.obj.add(nextNode.get());

            newNodes = newNodes.concat(newLeaves);
            // this.nodes.push(nextNode);
            // return;
        });
        this.nodes = this.nodes.concat(newNodes);
        


        this.iteration++;

    }

    didSplit(childParams) {
        const r = Math.random();
        // console.log({r}, childParams.radius)
        const did =  r > 1.02 - childParams.radius;
        if(did) {
            this.branches++;
        }
        return did;
    }

    
    
    didBranch(childParams) {
        // return false;
        const r = Math.random();
        // console.log({r})
        const did =  r > 1.02 - childParams.radius;
        if(did) {
            this.branches++;
        }
        return did;
    }

    didTerminate(childParams) {
        if(childParams.radius < 0.2 && this.branches > 2) {
            const r = Math.random();
            // console.log({didTerminate: r})
            return r > 0.85;
            // return Math.random() > 0.8;
        }
        return false;
    }

    get() {
        return this.obj;
    }
    
}