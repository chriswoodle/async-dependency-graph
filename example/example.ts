import { Graph, Node } from '../';

console.log(new Date().toLocaleTimeString(), 'Starting...');

const graph = new Graph();
const fetchA = () => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            console.log(new Date().toLocaleTimeString(), 'got some data "A"');
            resolve('some data a');
        }, 2000);
    });
};
graph.addNode(new Node('a', fetchA));

const fetchB = () => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            console.log(new Date().toLocaleTimeString(), 'got some data "B"');
            resolve('some data b');
        }, 4000);
    });
};
graph.addNode(new Node('b', fetchB));

const fetchC = () => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            console.log(new Date().toLocaleTimeString(), 'got some data "C"');
            resolve('some data c');
        }, 1000);
    });
};
graph.addNode(new Node('c', fetchC));

const fetchD = () => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            console.log(new Date().toLocaleTimeString(), 'got some data "D"');
            resolve('some data D');
        }, 1000);
    });
};
graph.addNode(new Node('d', fetchD));

graph.addDependency('b', 'a'); // fetchB needs the data from fetchA
graph.addDependency('d', 'c'); // fetchD needs the data from fetchC
graph.addDependency('c', 'a'); // fetchC needs the data from fetchA

graph.traverse().then(() => {
    console.log(new Date().toLocaleTimeString(), 'Traversal complete, all data ready');
}).catch((error) => {
    console.log('Error in traversal.');
    console.log(error)
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
