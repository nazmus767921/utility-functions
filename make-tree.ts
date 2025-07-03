
/**
 * Defines the options for the makeTree utility function.
 * @template TKey The type of the keys used for relational properties (e.g., 'id', 'parentId').
 * @template TStoreIntoKey The string literal type for the property name where children will be stored.
 * Defaults to 'children'.
 */
type Options<
    TKey extends string | number | symbol,
    TStoreIntoKey extends string = 'children'
> = {
    /**
     * Specifies the keys in the objects that define the parent-child relationship.
     * `nodeId`: The key for the current node's unique identifier.
     * `parentId`: The key for the parent's identifier (the ID of the node's parent).
     */
    relationalKey: {
        nodeId: TKey;
        parentId: TKey;
    };
    /**
     * The property name under which child nodes will be stored in their parent.
     * Defaults to 'children'.
     */
    storeInto?: TStoreIntoKey;
};

/**
 * Represents a single node in the tree structure.
 * It's the original node type `TNode` intersected with a property
 * whose key is `TStoreIntoKey` and whose value is an array of `TreeNode`s.
 * This type is recursive.
 *
 * @template TNode The original type of the object (node) before tree transformation.
 * @template TStoreIntoKey The string literal type for the property name where children are stored.
 */
type TreeNode<
    TNode extends Record<string | number | symbol, any>,
    TStoreIntoKey extends string
> = TNode & {
    [K in TStoreIntoKey]: Array<TreeNode<TNode, TStoreIntoKey>>;
};


/**
 * Transforms a flat array of objects into a hierarchical tree structure.
 * Each object in the array is expected to have a unique ID and a parent ID
 * (or null/undefined for root nodes).
 *
 * @template TNode The type of a single object (node) in the input array.
 * It must extend a record where keys can be strings, numbers, or symbols, and values are of any type.
 * This allows for dynamic access to properties based on `relationalKey`.
 * @template TStoreIntoKey The string literal type for the property name where children will be stored.
 * Defaults to 'children'. This allows the return type to be precise.
 * @param {TNode[]} obj The flat array of objects to convert into a tree.
 * @param {Options<keyof TNode, TStoreIntoKey>} options Configuration for building the tree,
 * including relational keys and the children property name.
 * @returns {Array<TreeNode<TNode, TStoreIntoKey>>} An array of top-level (root) nodes,
 * with their children nested under the `storeInto` property.
 */
export default function makeTree<
    TNode extends Record<string | number | symbol, any>,
    TStoreIntoKey extends string = 'children' // Default generic for storeIntoKey
>(
    obj: TNode[],
    {
        relationalKey,
        // Cast storeInto to TStoreIntoKey to maintain the literal type.
        // If storeInto is not provided, it defaults to 'children', which matches the generic default.
        storeInto = 'children' as TStoreIntoKey
    }: Options<keyof TNode, TStoreIntoKey>
): Array<TreeNode<TNode, TStoreIntoKey>> {
    // A Map to store all nodes by their ID for efficient lookup.
    // This allows us to link children to parents even if parents appear later in the array.
    const nodeMap = new Map<any, TreeNode<TNode, TStoreIntoKey>>();

    // Initialize all nodes in the map and add an empty 'children' array.
    // This ensures every node is available for lookup and has a place for children.
    obj.forEach(data => {
        const nodeId = data[relationalKey.nodeId];
        if (nodeId === undefined || nodeId === null) {
            console.warn(`Node missing '${String(relationalKey.nodeId)}' key:`, data);
            return; // Skip nodes without a valid ID
        }
        // Create a copy to avoid modifying the original input objects directly
        // and add the children array using the dynamic 'storeInto' key.
        nodeMap.set(nodeId, { ...data, [storeInto]: [] });
    });

    // Iterate through the objects again to build the relationships.
    // This two-pass approach handles cases where parents might appear after their children
    // in the original flat array.
    const rootNodes: Array<TreeNode<TNode, TStoreIntoKey>> = [];

    obj.forEach(data => {
        const nodeId = data[relationalKey.nodeId];
        const parentId = data[relationalKey.parentId];

        // Get the current node from the map (it must exist from the first pass)
        const currentNode = nodeMap.get(nodeId);

        if (!currentNode) {
            // This should ideally not happen if all nodes have valid IDs and were added in the first pass.
            console.error(`Error: Node with ID '${String(nodeId)}' not found in map during second pass.`);
            return;
        }

        // If the node has a parentId and that parent exists in our map,
        // add the current node to its parent's children array.
        if (parentId !== undefined && parentId !== null && nodeMap.has(parentId)) {
            const parentNode = nodeMap.get(parentId);
            if (parentNode) { // Ensure parentNode is not undefined (though nodeMap.has check should prevent this)
                // Push the current node into the parent's children array using the dynamic 'storeInto' key.
                parentNode[storeInto].push(currentNode);
            }
        } else {
            // If there's no parentId, or the parentId doesn't correspond to an existing node,
            // this node is considered a root node.
            rootNodes.push(currentNode);
        }
    });

    return rootNodes;
}
