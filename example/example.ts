import { Graph, Node } from '../';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
    console.log(new Date().toLocaleTimeString(), 'Starting...');

    const graph = new Graph();
    const fetchA = async () => {
        await delay(2000);
        console.log(new Date().toLocaleTimeString(), 'got some data "A"');
        return 'some data a';
    };
    const a = new Node(fetchA, { name: 'a' });

    const fetchB = async () => {
        await delay(4000);
        console.log(new Date().toLocaleTimeString(), 'got some data "B"');
        return 'some data b';
    };
    const b = new Node(fetchB, { name: 'b' });

    const fetchC = async () => {
        await delay(1000);
        console.log(new Date().toLocaleTimeString(), 'got some data "C"');
        return 'some data c';
    };
    const c = new Node(fetchC, { name: 'c' });

    const fetchD = async () => {
        await delay(1000);
        console.log(new Date().toLocaleTimeString(), 'got some data "D"');
        return 'some data D';
    };
    const d = new Node(fetchD, { name: 'd' });

    graph.addDependency(b, a); // fetchB needs the data from fetchA
    graph.addDependency(d, c); // fetchD needs the data from fetchC
    graph.addDependency(c, a); // fetchC needs the data from fetchA

    try {
        await graph.traverse();
        console.log(new Date().toLocaleTimeString(), 'Traversal complete, all data ready');
    } catch (error) {
        console.log('Error in traversal.');
        console.log(error);
    }

    const dataA = await a.data();
    console.log(dataA);
    const dataB = await b.data();
    console.log(dataB);
    const dataC = await c.data();
    console.log(dataC);
    const dataD = await d.data();
    console.log(dataD);
})();
