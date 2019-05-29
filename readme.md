# Async Dependency Graph

[![NPM](https://nodei.co/npm/async-dependency-graph.png)](https://www.npmjs.com/package/async-dependency-graph)

![node](https://img.shields.io/npm/l/async-dependency-graph.svg)
![travis](https://travis-ci.org/chriswoodle/async-dependency-graph.svg?branch=master)

A dependency graph that can traverse asynchronous nodes.

## About

Designed for requesting dependent data in web apps (https://portal.droplit.io/). Each node can contain a promise that makes some asynchronous operation, like an http request. Angular and Vue friendly.

> Inspired by https://github.com/jriecken/dependency-graph

# Install

```
npm install async-dependency-graph 
```

# Typedoc

http://woodle.io/async-dependency-graph/

# Usage

```js
const graph = new Graph();

graph.addNode(new Node('a', () => new Promise(...)));
graph.addNode(new Node('b', () => new Promise(...)));
graph.addNode(new Node('c', () => new Promise(...)));
graph.addNode(new Node('d', () => new Promise(...)));

graph.addDependency('b', 'a'); // b needs the data from a
graph.addDependency('d', 'c'); // d needs the data from c
graph.addDependency('c', 'a'); // c needs the data from a

graph.traverse().then(() => {
   // all nodes completed in order of dependence, in parallel when possible.
});

graph.getNode('a').awaitData().then((data)=> {
    console.log(data);
});
graph.getNode('b').awaitData().then((data)=> {
    console.log(data);
});
graph.getNode('c').awaitData().then((data)=> {
    console.log(data);
});
graph.getNode('d').awaitData().then((data)=> {
    console.log(data);
});
```
# Example 

Run the example
```
node -r ts-node/register example/example.ts
```

# Contributing

PR's welcome.

## Building

```
npm run build
```

## Testing

```
npm test
```

# License

MIT
