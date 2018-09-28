import { Mutex } from './mutex';

export class Graph {
    private nodes: { [name: string]: Node } = {};
    private outgoingEdges: { [name: string]: string[] } = {};
    private incomingEdges: { [name: string]: string[] } = {};
    public addNode(node: Node) {
        if (this.hasNode(node.name)) throw new Error(`A node with the name of "${node.name}" already exists in the graph!`);
        this.nodes[node.name] = node;
        this.outgoingEdges[node.name] = [];
        this.incomingEdges[node.name] = [];
    }

    public removeNode(name: string) {
        if (!this.hasNode(name)) throw new Error(`A node with the name of "${name}" does not exist in the graph!`);
        delete this.nodes[name];
        delete this.outgoingEdges[name];
        delete this.incomingEdges[name];
        for (const dependent in this.incomingEdges) {
            if (this.incomingEdges[dependent].includes(name))
                this.incomingEdges[dependent].splice(dependent.indexOf(name), 1);
        }
        for (const dependency in this.outgoingEdges) {
            if (this.outgoingEdges[dependency].includes(name))
                this.outgoingEdges[dependency].splice(dependency.indexOf(name), 1);
        }
    }

    public hasNode(name: string) {
        return this.nodes.hasOwnProperty(name);
    }

    get size() {
        return Object.keys(this.nodes).length;
    }

    public getNode(name: string) {
        if (this.hasNode(name))
            return this.nodes[name];
        throw new Error(`Node "${name}" not found!`);
    }
    /**
     * "from" is dependent on "to"
     */
    public addDependency(from: string, to: string) {
        if (!this.hasNode(from)) throw new Error(`Node does not exist: ${from}`);
        if (!this.hasNode(to)) throw new Error(`Node does not exist: ${to}`);
        if (from === to) throw new Error(`Cannot add self dependency: ${to}`);

        if (!this.outgoingEdges[from].includes(to)) {
            this.outgoingEdges[from].push(to);
        }
        if (!this.incomingEdges[to].includes(from)) {
            this.incomingEdges[to].push(from);
        }
    }

    public removeDependency(from: string, to: string) {

    }

    public dependenciesOf(name: string) {
        return this.outgoingEdges[name];
    }

    public dependentsOf(name: string) {
        return this.incomingEdges[name];
    }

    /**
     * Breadth first search.
     */
    public traverse() {
        // Clear all complete node mutexes.
        Object.keys(this.nodes).map(name => this.getNode(name).clearMutex());
        // Visiting a node recursively calls visit on each node's dependents.
        const visit = (node: Node): Promise<any> => {
            // First await all dependencies
            return Promise.all(this.dependenciesOf(node.name).map((dependencyName) => this.nodes[dependencyName].awaitData()))
                .then(() => {
                    node.signalDependenciesReady();
                    if (this.dependentsOf(node.name).length > 0) {
                        // Then recursively visit all dependents
                        return Promise.all(this.dependentsOf(node.name).map((dependentName) => visit(this.getNode(dependentName))));
                    } else {
                        // node has no dependents so await data
                        return node.awaitData();
                    }
                });
        };

        // Find nodes with no dependencies
        const rootNodeNames = Object.keys(this.nodes).filter((name) => this.dependenciesOf(name).length === 0);
        if (rootNodeNames.length === 0) throw new Error('Cannot traverse graph due to no root node. The graph may be circular');

        // Start recursive traversal from root nodes.
        return Promise.all(rootNodeNames.map((name) => visit(this.nodes[name])));
    }

    /**
     * Clears the value of a node and the values of dependent nodes
     */
    public clearNodeAndDependents(name: string) {
        const node = this.getNode(name);
        const visitAndClear = (node: Node): Promise<any> => {
            if (node.hasData()) {
                node.clearData();
                return Promise.all(this.dependentsOf(node.name).map(dependentName => visitAndClear(this.getNode(dependentName))));
            } else {
                return Promise.resolve();
            }

        };
        return visitAndClear(node);
    }

    public reset() {
        for (const name in this.nodes) {
            this.nodes[name].reset();
        }
    }

    public ls() {
        for (const name in this.nodes) {
            console.log(name);
            console.log(this.dependentsOf(name));
        }
    }
}

export class Node {
    private _name: string;
    private _promise: () => Promise<any>;
    private _data?: any;
    private mutex?: Mutex;
    private locked = false;
    constructor(name: string, promise: () => Promise<any>) {
        this._name = name;
        this._promise = promise;
    }

    get name() {
        return this._name;
    }

    public awaitData(): Promise<any> {
        if (!this.mutex) {
            this.mutex = new Mutex(() => this._data !== undefined);
        }
        return new Promise((resolve, reject) => {
            this.mutex!.await((error) => {
                if (error) return reject(error);
                resolve(this._data);
            });
        });
    }

    public signalDependenciesReady(): void {
        if (!this.mutex) {
            this.mutex = new Mutex(() => this._data !== undefined);
        }
        if (this._data === undefined) {
            // Only allow to _promise once
            if (this.locked === true) return;
            this.locked = true;
            const promise = this._promise();
            if (promise === undefined) throw new Error(`Node "${this._name}" has undefined promise.`);
            promise.then((data) => {
                this._data = data;
                this.locked = false;
                this.mutex!.ready();
            }).catch((error) => {
                this._data = null;
                this.locked = false;
                this.mutex!.ready(error);
            });
        } else {
            // Allow _data to be set externally from promise
            this.mutex!.ready();
        }
    }

    public setData(data: any) {
        this._data = data;
        this.signalDependenciesReady();
    }

    public reset() {
        this.clearData();
        this.clearMutex();
    }

    public clearMutex() {
        if (this.hasData())
            this.mutex = undefined;
    }

    public hasData() {
        return this._data !== undefined;
    }

    public clearData() {
        this._data = undefined;
    }
}