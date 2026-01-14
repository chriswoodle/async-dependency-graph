import { Node } from './node';

/**
 * Base dependency graph class.
 */
export class Graph {
    private nodes: Set<Node> = new Set();
    private outgoingEdges: Map<Node, Node[]> = new Map();
    private incomingEdges: Map<Node, Node[]> = new Map();

    /**
     * Add a node to the graph.
     * @param node Node object.
     */
    private ensureNode(node: Node) {
        if (!this.nodes.has(node)) {
            this.nodes.add(node);
            this.outgoingEdges.set(node, []);
            this.incomingEdges.set(node, []);
        }
    }

    /**
     * Remove a node from the graph.
     * @param node Node instance.
     */
    public removeNode(node: Node) {
        if (!this.nodes.has(node)) throw new Error(`Node does not exist in the graph!`);
        this.nodes.delete(node);
        this.outgoingEdges.delete(node);
        this.incomingEdges.delete(node);
        for (const dependent of Array.from(this.incomingEdges.keys())) {
            const edges = this.incomingEdges.get(dependent)!;
            const index = edges.indexOf(node);
            if (index !== -1) {
                edges.splice(index, 1);
            }
        }
        for (const dependency of Array.from(this.outgoingEdges.keys())) {
            const edges = this.outgoingEdges.get(dependency)!;
            const index = edges.indexOf(node);
            if (index !== -1) {
                edges.splice(index, 1);
            }
        }
    }

    /**
     * Checks to see if the graph contains a Node.
     * @param node Node instance.
     */
    public hasNode(node: Node) {
        return this.nodes.has(node);
    }

    /**
     * Returns the number of nodes in a graph.
     */
    get size() {
        return this.nodes.size;
    }

    /**
     *  Adds a node dependence. "from" is dependent on "to"
     *  @param from Node instance.
     *  @param to  Node instance.
     */
    public addDependency(from: Node, to: Node) {
        if (from === to) throw new Error(`Cannot add self dependency`);

        this.ensureNode(from);
        this.ensureNode(to);

        const outgoing = this.outgoingEdges.get(from)!;
        if (!outgoing.includes(to)) {
            outgoing.push(to);
        }
        const incoming = this.incomingEdges.get(to)!;
        if (!incoming.includes(from)) {
            incoming.push(from);
        }
    }

    /**
     * Removes a node dependence. "from" is no longer dependent on "to".
     * @param from Node instance.
     * @param to  Node instance.
     * @todo Test this function.
     */
    public removeDependency(from: Node, to: Node) {
        if (!this.hasNode(from)) throw new Error(`Node does not exist: ${from.name}`);
        if (!this.hasNode(to)) {
            // Dependency is not in the graph, so do nothing
            return;
        };
        if (from === to) throw new Error(`Cannot remove self dependency`);

        const outgoing = this.outgoingEdges.get(from)!;
        const outgoingIndex = outgoing.indexOf(to);
        if (outgoingIndex !== -1) {
            outgoing.splice(outgoingIndex, 1);
        }
        const incoming = this.incomingEdges.get(to)!;
        const incomingIndex = incoming.indexOf(from);
        if (incomingIndex !== -1) {
            incoming.splice(incomingIndex, 1);
        }
    }

    /**
     * Get dependency nodes for a Node. (Required nodes for this node to execute).
     * @param node Node instance.
     */
    public dependenciesOf(node: Node) {
        return this.outgoingEdges.get(node) || [];
    }

    /**
     * Get dependents nodes for a Node. (Nodes that require this node to complete).
     * @param node Node instance.
     */
    public dependentsOf(node: Node) {
        return this.incomingEdges.get(node) || [];
    }

    /**
     * Breadth first search.
     */
    public async traverse(): Promise<void> {
        // Clear all complete node mutexes.
        Array.from(this.nodes).forEach(node => node.clearMutex());
        // Visiting a node recursively calls visit on each node's dependents.
        const visit = async (node: Node): Promise<void> => {
            // First await all dependencies
            await Promise.all(this.dependenciesOf(node).map((dependency) => dependency.data()));
            node.signalDependenciesReady();
            if (this.dependentsOf(node).length > 0) {
                // Then recursively visit all dependents
                await Promise.all(this.dependentsOf(node).map((dependent) => visit(dependent)));
            } else {
                // node has no dependents so await data
                await node.data();
            }
        };

        // Find nodes with no dependencies
        const rootNodes = Array.from(this.nodes).filter((node) => this.dependenciesOf(node).length === 0);
        if (rootNodes.length === 0 && this.nodes.size > 0) {
            throw new Error('The graph is circular. Cannot traverse graph due to no root node.');
        }

        // Start recursive traversal from root nodes.
        await Promise.all(rootNodes.map((node) => visit(node)));
    }

    /**
     * Clears the value of a node and the values of dependent nodes
     * @param node Node instance.
     */
    public async clearNodeAndDependents(node: Node): Promise<void> {
        const visitAndClear = async (node: Node): Promise<void> => {
            if (node.hasData()) {
                node.clearData();
                await Promise.all(this.dependentsOf(node).map(dependent => visitAndClear(dependent)));
            }
        };
        await visitAndClear(node);
    }

    /**
     * Resets the graph by resetting each node in the graph.
     */
    public reset() {
        for (const node of Array.from(this.nodes)) {
            node.reset();
        }
    }

    /**
     * Prints graph nodes and node dependents.
     */
    public ls() {
        for (const node of Array.from(this.nodes)) {
            console.log(node.name || 'Unnamed Node');
            console.log(this.dependentsOf(node));
        }
    }
}