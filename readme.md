# Async Dependency Graph

A dependency graph that can traverse asynchronous nodes.

> Inspired by https://github.com/jriecken/dependency-graph

## About

Designed for requesting dependent data in web apps. Each node can contain a promise that makes some asynchronous operation, like an http request.

# Install

```
npm install async-dependency-graph 
```

# Usage

```
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