import 'mocha';
import { expect } from 'chai';

import { Graph, Node } from './graph';

describe('Graph tests', function () {
    this.timeout(10000);
    it('Create Graph', (done) => {
        const graph = new Graph();
        expect(graph.size, `New graph has empty size`).to.equal(0);
        done();
    });
    it('Add node', (done) => {
        const graph = new Graph();
        graph.addNode(new Node('myNode', () => Promise.resolve()));
        expect(graph.size, `New graph with 1 node has size of 1`).to.equal(1);
        graph.removeNode('myNode');
        expect(graph.size, `New graph has empty size`).to.equal(0);
        done();
    });
    it('Create full graph and traverse sync', (done) => {
        const graph = new Graph();
        let output = '';
        graph.addNode(new Node('a', () => new Promise((resolve, reject) => {
            output += 'a';
            resolve('some data a');
        })));
        graph.addNode(new Node('b', () => new Promise((resolve, reject) => {
            output += 'b';
            resolve('some data b');
        })));
        graph.addNode(new Node('c', () => new Promise((resolve, reject) => {
            output += 'c';
            resolve('some data c');
        })));
        graph.addDependency('b', 'a');
        graph.addDependency('c', 'a');
        graph.traverse().then(() => {
            // It actually should be "abc" since everything is synchronous.
            expect(output, `Output order should be "acb" or "abc"`).satisfy((output: string) => {
                return output === 'abc' || output === 'acb';
            });
            done();
        }).catch(done);
    });
    it('Create full graph (single root node) and traverse async', function (done) {
        this.slow(Infinity);
        const graph = new Graph();
        let output = '';
        graph.addNode(new Node('a', () => new Promise((resolve, reject) => {
            setTimeout(() => {
                output += 'a';
                resolve('some data a');
            }, 1000);
        })));
        graph.addNode(new Node('b', () => new Promise((resolve, reject) => {
            setTimeout(() => {
                output += 'b';
                resolve('some data b');
            }, 4000);
        })));
        graph.addNode(new Node('c', () => new Promise((resolve, reject) => {
            setTimeout(() => {
                output += 'c';
                resolve('some data c');
            }, 500);
        })));
        graph.addNode(new Node('d', () => new Promise((resolve, reject) => {
            setTimeout(() => {
                output += 'd';
                resolve('some data d');
            }, 1000);
        })));
        graph.addDependency('b', 'a');
        graph.addDependency('d', 'c');
        graph.addDependency('c', 'a');
        graph.traverse().then(() => {
            expect(output, `Output order`).to.equal('acdb');
            done();
        }).catch(done);
    });

    it('Create full graph (multiple root nodes) and traverse async', function (done) {
        this.slow(Infinity);
        const graph = new Graph();
        let output = '';
        // Root
        graph.addNode(new Node('a', () => new Promise((resolve, reject) => {
            setTimeout(() => {
                output += 'a';
                resolve('some data a');
            }, 1000);
        })));
        // Root
        graph.addNode(new Node('b', () => new Promise((resolve, reject) => {
            setTimeout(() => {
                output += 'b';
                resolve('some data b');
            }, 4000);
        })));

        graph.addNode(new Node('c', () => new Promise((resolve, reject) => {
            setTimeout(() => {
                output += 'c';
                resolve('some data c');
            }, 500);
        })));
        graph.addDependency('c', 'a');

        graph.addNode(new Node('d', () => new Promise((resolve, reject) => {
            setTimeout(() => {
                output += 'd';
                resolve('some data d');
            }, 1000);
        })));
        graph.addDependency('d', 'c');
        graph.addDependency('d', 'b');
        graph.traverse().then(() => {
            expect(output, `Output order`).to.equal('acbd');
            done();
        }).catch(done);
    });
    it('Create full graph and traverse async with external data set', function (done) {
        this.slow(Infinity);
        const graph = new Graph();
        let output = '';
        // Root
        graph.addNode(new Node('a', () => new Promise((resolve, reject) => {
            setTimeout(() => {
                output += 'a';
                resolve('some data a');
            }, 1000);
        })));

        graph.addNode(new Node('b', () => new Promise((resolve, reject) => {
            setTimeout(() => {
                output += 'b';
                resolve('some data b');
            }, 4000);
        })));

        graph.addNode(new Node('c', () => new Promise((resolve, reject) => {
            setTimeout(() => {
                output += 'c';
                resolve('some data c');
            }, 1000);
        })));

        setTimeout(() => {
            graph.getNode('b').setData('some data b from external');
        }, 2000);

        graph.addDependency('b', 'c');
        graph.addDependency('b', 'a');
        graph.traverse().then(() => {
            graph.getNode('b').awaitData().then((data) => {
                expect(output, `Output order incorrect.`).to.equal('ac');
                expect(data, `Data set with timeout.`).to.equal('some data b from external');
                done();
            });
        }).catch(done);
    });

    it('Create full graph (single root node), traverse async, reset node', function (done) {
        this.slow(Infinity);
        const graph = new Graph();
        let output = '';
        graph.addNode(new Node('a', () => new Promise((resolve, reject) => {
            setTimeout(() => {
                output += 'a';
                resolve('some data a');
            }, 1000);
        })));
        graph.addNode(new Node('b', () => new Promise((resolve, reject) => {
            setTimeout(() => {
                output += 'b';
                resolve('some data b');
            }, 4000);
        })));
        graph.addNode(new Node('c', () => new Promise((resolve, reject) => {
            setTimeout(() => {
                output += 'c';
                resolve('some data c');
            }, 500);
        })));
        graph.addNode(new Node('d', () => new Promise((resolve, reject) => {
            setTimeout(() => {
                output += 'd';
                resolve('some data d');
            }, 1000);
        })));
        graph.addDependency('b', 'a');
        graph.addDependency('d', 'c');
        graph.addDependency('c', 'a');
        graph.traverse().then(() => {
            expect(output, `Output order`).to.equal('acdb');
            const data = graph.getNode('c')['_data'];
            expect(data, 'Node is cleared').to.not.be.undefined;
            return graph.clearNodeAndDependents('c');
        }).then(() => {
            const data = graph.getNode('c')['_data'];
            expect(data, 'Node is not cleared').to.be.undefined;
            return graph.traverse();
        }).then(() => {
            const data = graph.getNode('c')['_data'];
            expect(data, 'Node is cleared').to.not.be.undefined;
            done();
        }).catch(done);
    });
});