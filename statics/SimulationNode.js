
/**
 * 
 * SimulationNode
 *  {
 *      obj: threeJSObject
 *      physicsBody: ammojsObject
 *      node: userData obj (ex: TreeNode, Tree),
 * 
 *      position: world position
 *      lastPosition: world position at last physics step
 *      initPosition: initial position object was intended to be spawned at 
 *      firstPosition: initial position object was actually spawned at
 *  }
 * 
 * 
 */


export class SimulationNode {
    constructor(node, obj, physicsBody) {
       
        this.obj = obj;
        this.node = node;
        this.physicsBody = physicsBody;

        // this.worldPosition =  () => this.obj.worldPosition;
        // this.initialWorldPosition = () => this.obj.initialWorldPosition;

       
    }

   

    apply() {
        // if (this.simulationParams.setSpringBackForceToLastStepPos) {
        //     this.initialPos.copy(this.tempPosition);
        // }
        // this.treeNode.get().position.copy(this.tempPosition);
    }

    
}
