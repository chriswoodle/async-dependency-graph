# Async Dependency Graph

[![NPM](https://nodei.co/npm/async-dependency-graph.png)](https://www.npmjs.com/package/async-dependency-graph)

![node](https://img.shields.io/npm/l/async-dependency-graph.svg)

A dependency graph that can traverse asynchronous nodes.

## About

Designed for requesting dependent data in web apps. Each node can contain an async function or promise that makes some asynchronous operation, like an http request.

> Inspired by https://github.com/jriecken/dependency-graph

# Install

```shell
yarn add async-dependency-graph 
```

# Typedoc

http://woodle.io/async-dependency-graph/

# Usage

```ts
import { Graph, Node } from 'async-dependency-graph';

// Define async functions for each node
const fetchDataA = async () => {
    // Some async operation, e.g., http request
    return 'some data a';
};

const fetchDataB = async () => {
    // ...
    return 'some data b';
};

const fetchDataC = async () => {
    // ...
    return 'some data c';
};

const fetchDataD = async () => {
    // ...
    return 'some data d';
};

const graph = new Graph();

// Create nodes with their async functions
const a = new Node(fetchDataA, { name: 'a' });
const b = new Node(fetchDataB, { name: 'b' });
const c = new Node(fetchDataC, { name: 'c' });
const d = new Node(fetchDataD, { name: 'd' });

// Define dependencies: b depends on a, d depends on c, c depends on a
/**
 * Graph structure: a, b: [a], c: [a], d: [c]
 * (b and c depend on a, d depends on c)
 */
graph.addDependency(b, a); // b depends on a
graph.addDependency(d, c); // d depends on c
graph.addDependency(c, a); // c depends on a

// Traverse the graph - nodes complete in order of dependence, in parallel when possible
await graph.traverse();
        
// Get the resolved data
const dataA = await a.data();
const dataB = await b.data();
const dataC = await c.data();
const dataD = await d.data();
        
console.log(dataA, dataB, dataC, dataD);
```

### Accessing Child Node Data

Parent nodes can access their dependency (child) node data:

```ts
const child = new Node(async () => {
    return { value: 42 };
}, { name: 'child' });

const parent = new Node(async () => {
    // Access child's data
    const childData = await child.data();
    return {
        parentValue: 100,
        childValue: childData.value
    };
}, { name: 'parent' });

graph.addDependency(parent, child);
await graph.traverse();

const parentData = await parent.data();
console.log(parentData); // { parentValue: 100, childValue: 42 }
```

## API Overview

### Graph

- `addDependency(from: Node, to: Node)` - Adds a dependency where `from` depends on `to`.
- `removeDependency(from: Node, to: Node)` - Removes a dependency relationship.
- `removeNode(node: Node)` - Removes a node and all its dependencies from the graph.
- `traverse()` - Traverses the graph, executing nodes in dependency order.
- `dependenciesOf(node: Node)` - Returns an array of nodes that the given node depends on.
- `dependentsOf(node: Node)` - Returns an array of nodes that depend on the given node.
- `hasNode(node: Node)` - Checks if a node exists in the graph.
- `size` - Returns the number of nodes in the graph.
- `reset()` - Resets all nodes in the graph.
- `clearNodeAndDependents(node: Node)` - Clears a node and all its dependents.

### Node

- `new Node(promise: () => Promise<any>, options?: NodeOptions)` - Creates a new node with an async function.
- `data()` - Returns a Promise that resolves when the node's data is ready.
- `setData(data: any)` - Sets data directly on the node.
- `reset()` - Resets the node, clearing its data and mutex.
- `hasData()` - Returns true if the node has data.
- `clearData()` - Clears the node's data.
- `clearMutex()` - Clears the node's mutex.

# Contributing

PR's welcome.

## Setup
```shell
yarn install
# for vscode
yarn dlx @yarnpkg/sdks vscode
```

## Building

```shell
yarn build
```

## Testing

```shell
yarn test
```

# License

MIT
