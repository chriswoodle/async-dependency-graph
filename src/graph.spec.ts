import { Graph, Node } from './library';

describe('Graph', () => {
    jest.setTimeout(10000);

    describe('Creation and basic operations', () => {
        it('Create Graph', () => {
            const graph = new Graph();
            expect(graph.size).toBe(0);
        });

        it('Empty Graph should resolve', async () => {
            const graph = new Graph();
            await graph.traverse();
        });

        it('Add node', () => {
            const graph = new Graph();
            /**
             * Graph: myNode: [otherNode]
             */
            const myNode = new Node(async () => { }, { name: 'myNode' });
            const otherNode = new Node(async () => { }, { name: 'otherNode' });
            graph.addDependency(myNode, otherNode); // myNode depends on otherNode, this will add both nodes
            expect(graph.size).toBe(2);
            graph.removeNode(myNode);
            expect(graph.size).toBe(1);
            graph.removeNode(otherNode);
            expect(graph.size).toBe(0);
        });

        it('Has node', () => {
            const graph = new Graph();
            const a = new Node(async () => 'data a', { name: 'a' });
            const b = new Node(async () => 'data b', { name: 'b' });
            
            graph.addDependency(b, a);
            expect(graph.hasNode(a)).toBe(true);
            expect(graph.hasNode(b)).toBe(true);
        });
    });

    describe('Adding dependencies', () => {
        it('Add dependency', () => {
            const graph = new Graph();
            const a = new Node(async () => 'data a', { name: 'a' });
            const b = new Node(async () => 'data b', { name: 'b' });
            
            graph.addDependency(b, a);
            expect(graph.dependenciesOf(b)).toContain(a);
            expect(graph.dependentsOf(a)).toContain(b);
        });

        it('Add dependency throws error for self dependency', () => {
            const graph = new Graph();
            const a = new Node(async () => 'data a', { name: 'a' });
            
            // Try to add self-dependency
            expect(() => graph.addDependency(a, a)).toThrow('Cannot add self dependency');
        });
    });

    describe('Removing dependencies', () => {
        it('Remove dependency', () => {
            const graph = new Graph();
            /**
             * Graph: Initially a, b: [a], c: [a]
             *        After removal: a, b: [], c: [a]
             */
            const a = new Node(async () => 'data a', { name: 'a' });
            const b = new Node(async () => 'data b', { name: 'b' });
            const c = new Node(async () => 'data c', { name: 'c' });
            
            graph.addDependency(b, a);
            graph.addDependency(c, a);
            
            // Verify dependencies exist
            expect(graph.dependenciesOf(b)).toContain(a);
            expect(graph.dependenciesOf(c)).toContain(a);
            expect(graph.dependentsOf(a)).toContain(b);
            expect(graph.dependentsOf(a)).toContain(c);
            
            // Remove dependency b -> a
            graph.removeDependency(b, a);
            
            // Verify dependency was removed
            expect(graph.dependenciesOf(b)).not.toContain(a);
            expect(graph.dependenciesOf(c)).toContain(a); // c still depends on a
            expect(graph.dependentsOf(a)).not.toContain(b);
            expect(graph.dependentsOf(a)).toContain(c); // c still depends on a
            
            // Verify nodes still exist in graph
            expect(graph.size).toBe(3);
            expect(graph.hasNode(a)).toBe(true);
            expect(graph.hasNode(b)).toBe(true);
            expect(graph.hasNode(c)).toBe(true);
        });

        it('Remove dependency and traverse', async () => {
            const graph = new Graph();
            /**
             * Graph: Initially a, b: [a], c: [a]
             *        After removal: a, b: [], c: [a]
             */
            const callOrder: string[] = [];
            const a = new Node(async () => {
                callOrder.push('a');
                return 'data a';
            }, { name: 'a' });
            const b = new Node(async () => {
                callOrder.push('b');
                return 'data b';
            }, { name: 'b' });
            const c = new Node(async () => {
                callOrder.push('c');
                return 'data c';
            }, { name: 'c' });
            
            graph.addDependency(b, a);
            graph.addDependency(c, a);
            
            // Remove dependency b -> a, so b becomes independent
            graph.removeDependency(b, a);
            
            await graph.traverse();
            
            // Verify b can execute independently (no dependency on a)
            // b and a can execute in any order relative to each other
            // but c must execute after a
            expect(callOrder.indexOf('a')).toBeLessThan(callOrder.indexOf('c'));
            expect(callOrder).toContain('a');
            expect(callOrder).toContain('b');
            expect(callOrder).toContain('c');
            
            // Verify data can be retrieved
            expect(await a.data()).toBe('data a');
            expect(await b.data()).toBe('data b');
            expect(await c.data()).toBe('data c');
        });

        it('Remove dependency throws error when from node does not exist', () => {
            const graph = new Graph();
            const a = new Node(async () => 'data a', { name: 'a' });
            const b = new Node(async () => 'data b', { name: 'b' });
            
            graph.addDependency(b, a);
            
            // Try to remove dependency with non-existent from node
            const nonExistentNode = new Node(async () => 'data', { name: 'nonExistent' });
            expect(() => graph.removeDependency(nonExistentNode, a)).toThrow(/Node does not exist/);
        });

        it('Remove dependency handles non-existent to node gracefully', () => {
            const graph = new Graph();
            const a = new Node(async () => 'data a', { name: 'a' });
            const b = new Node(async () => 'data b', { name: 'b' });
            
            graph.addDependency(b, a);
            
            // Try to remove dependency with non-existent to node
            // Should not throw, just warn and return
            const nonExistentNode = new Node(async () => 'data', { name: 'nonExistent' });
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            expect(() => graph.removeDependency(b, nonExistentNode)).not.toThrow();
            consoleSpy.mockRestore();
            
            // Verify b still depends on a (nothing changed)
            expect(graph.dependenciesOf(b)).toContain(a);
        });

        it('Remove dependency throws error for self dependency', () => {
            const graph = new Graph();
            const a = new Node(async () => 'data a', { name: 'a' });
            const b = new Node(async () => 'data b', { name: 'b' });

            graph.addDependency(a, b);
            
            // Try to remove self dependency (even if it doesn't exist, should throw)
            expect(() => graph.removeDependency(a, a)).toThrow('Cannot remove self dependency');
        });

        it('Remove non-existent dependency does not throw', () => {
            const graph = new Graph();
            const a = new Node(async () => 'data a', { name: 'a' });
            const b = new Node(async () => 'data b', { name: 'b' });
            const c = new Node(async () => 'data c', { name: 'c' });
            
            graph.addDependency(b, a);
            
            // Remove a dependency that doesn't exist (b -> c)
            // Both nodes exist, but dependency doesn't - should not throw, just do nothing
            expect(() => graph.removeDependency(b, c)).not.toThrow();
            
            // Verify b still depends on a (unchanged)
            expect(graph.dependenciesOf(b)).toContain(a);
            expect(graph.dependenciesOf(b)).not.toContain(c);
            expect(graph.dependentsOf(a)).toContain(b);
            expect(graph.dependentsOf(c)).not.toContain(b);
        });
    });

    describe('Removing nodes', () => {
        it('Remove node with outgoing edges', () => {
            const graph = new Graph();
            /**
             * Graph: a, b: [a], c: [a]
             *        After removing a: b: [], c: []
             */
            const a = new Node(async () => 'data a', { name: 'a' });
            const b = new Node(async () => 'data b', { name: 'b' });
            const c = new Node(async () => 'data c', { name: 'c' });
            
            graph.addDependency(b, a);
            graph.addDependency(c, a);
            
            // Verify dependencies exist
            expect(graph.dependenciesOf(b)).toContain(a);
            expect(graph.dependenciesOf(c)).toContain(a);
            
            // Remove node a which has outgoing edges (b and c depend on it)
            // This should remove 'a' from b's and c's outgoing edges (line 43)
            graph.removeNode(a);
            
            // Verify node a is removed
            expect(graph.hasNode(a)).toBe(false);
            expect(graph.size).toBe(2);
            
            // Verify b and c no longer have dependencies on a
            expect(graph.dependenciesOf(b)).not.toContain(a);
            expect(graph.dependenciesOf(c)).not.toContain(a);
            expect(graph.dependenciesOf(b).length).toBe(0);
            expect(graph.dependenciesOf(c).length).toBe(0);
        });

        it('Remove node that has dependencies', () => {
            const graph = new Graph();
            /**
             * Graph: a, b: [a], c: [b]
             *        After removing b: a, c: []
             */
            const a = new Node(async () => 'data a', { name: 'a' });
            const b = new Node(async () => 'data b', { name: 'b' });
            const c = new Node(async () => 'data c', { name: 'c' });
            
            graph.addDependency(b, a); // b depends on a
            graph.addDependency(c, b); // c depends on b
            
            // Verify dependencies exist
            expect(graph.dependenciesOf(b)).toContain(a);
            expect(graph.dependenciesOf(c)).toContain(b);
            
            // Remove node b which has dependencies (b depends on a)
            // This should remove 'b' from c's outgoing edges and 'b' from a's incoming edges
            graph.removeNode(b);
            
            // Verify node b is removed
            expect(graph.hasNode(b)).toBe(false);
            expect(graph.size).toBe(2);
            
            // Verify c no longer depends on b
            expect(graph.dependenciesOf(c)).not.toContain(b);
            expect(graph.dependenciesOf(c).length).toBe(0);
            
            // Verify a no longer has b as a dependent
            expect(graph.dependentsOf(a)).not.toContain(b);
        });

        it('Remove node throws error when node does not exist', () => {
            const graph = new Graph();
            const a = new Node(async () => 'data a', { name: 'a' });
            
            // Try to remove a node that doesn't exist in the graph
            expect(() => graph.removeNode(a)).toThrow('Node does not exist in the graph!');
        });
    });

    describe('Traversing graphs', () => {
        it('Create full graph and traverse sync', async () => {
            const graph = new Graph();
            /**
             * Graph: a, b: [a], c: [a]
             */
            const callOrder: string[] = [];
            const a = new Node(async () => {
                callOrder.push('a');
                return 'some data a';
            }, { name: 'a' });
            const b = new Node(async () => {
                callOrder.push('b');
                return 'some data b';
            }, { name: 'b' });
            const c = new Node(async () => {
                callOrder.push('c');
                return 'some data c';
            }, { name: 'c' });
            graph.addDependency(b, a);
            graph.addDependency(c, a);
            await graph.traverse();
            // Verify dependency order: a must be called before b and c
            expect(callOrder.indexOf('a')).toBeLessThan(callOrder.indexOf('b'));
            expect(callOrder.indexOf('a')).toBeLessThan(callOrder.indexOf('c'));
            // Verify data can be retrieved
            expect(await a.data()).toBe('some data a');
            expect(await b.data()).toBe('some data b');
            expect(await c.data()).toBe('some data c');
        });

        it('Create full graph (multiple root nodes) and traverse async', async () => {
            const graph = new Graph();
            /**
             * Graph: a, b: [a], c: [a], d: [c]
             */
            const callOrder: string[] = [];
            const a = new Node(async () => {
                callOrder.push('a');
                return 'some data a';
            }, { name: 'a' });
            const b = new Node(async () => {
                callOrder.push('b');
                return 'some data b';
            }, { name: 'b' });
            const c = new Node(async () => {
                callOrder.push('c');
                return 'some data c';
            }, { name: 'c' });
            const d = new Node(async () => {
                callOrder.push('d');
                return 'some data d';
            }, { name: 'd' });
            graph.addDependency(b, a);
            graph.addDependency(d, c);
            graph.addDependency(c, a);
            await graph.traverse();
            // Verify dependency order: a must be called before b and c, c must be called before d
            expect(callOrder.indexOf('a')).toBeLessThan(callOrder.indexOf('b'));
            expect(callOrder.indexOf('a')).toBeLessThan(callOrder.indexOf('c'));
            expect(callOrder.indexOf('c')).toBeLessThan(callOrder.indexOf('d'));
            // Verify data can be retrieved
            expect(await a.data()).toBe('some data a');
            expect(await b.data()).toBe('some data b');
            expect(await c.data()).toBe('some data c');
            expect(await d.data()).toBe('some data d');
        });

        it('Create full graph (single root node) and traverse async', async () => {
            const graph = new Graph();
            /**
             * Graph: a, b, c: [a], d: [c, b]
             */
            const callOrder: string[] = [];
            // Root
            const a = new Node(async () => {
                callOrder.push('a');
                return 'some data a';
            }, { name: 'a' });
            // Root
            const b = new Node(async () => {
                callOrder.push('b');
                return 'some data b';
            }, { name: 'b' });
            const c = new Node(async () => {
                callOrder.push('c');
                return 'some data c';
            }, { name: 'c' });
            graph.addDependency(c, a);
            const d = new Node(async () => {
                callOrder.push('d');
                return 'some data d';
            }, { name: 'd' });
            graph.addDependency(d, c);
            graph.addDependency(d, b);
            await graph.traverse();
            // Verify dependency order: a before c, c before d, b before d
            expect(callOrder.indexOf('a')).toBeLessThan(callOrder.indexOf('c'));
            expect(callOrder.indexOf('b')).toBeLessThan(callOrder.indexOf('d'));
            expect(callOrder.indexOf('c')).toBeLessThan(callOrder.indexOf('d'));
            // Verify data can be retrieved
            expect(await a.data()).toBe('some data a');
            expect(await b.data()).toBe('some data b');
            expect(await c.data()).toBe('some data c');
            expect(await d.data()).toBe('some data d');
        });

        it('Parent node accesses data from child node', async () => {
            const graph = new Graph();
            /**
             * Graph: child: [], parent: [child]
             */
            const childData = { value: 42, message: 'hello from child' };
            const child = new Node(async () => {
                return childData;
            }, { name: 'child' });
            
            let parentReceivedData: any = null;
            const parent = new Node(async () => {
                // Parent accesses child's data
                const childNodeData = await child.data();
                parentReceivedData = childNodeData;
                return { 
                    parentValue: 100, 
                    combined: `parent: ${childNodeData.message}, value: ${childNodeData.value}` 
                };
            }, { name: 'parent' });
            
            graph.addDependency(parent, child);
            await graph.traverse();
            
            // Verify parent received child's data
            expect(parentReceivedData).toEqual(childData);
            
            // Verify parent's data includes information derived from child
            const parentData = await parent.data();
            expect(parentData.combined).toBe('parent: hello from child, value: 42');
            expect(parentData.parentValue).toBe(100);
            
            // Verify child's data is still accessible
            expect(await child.data()).toEqual(childData);
        });

        it('Await data before traverse should signal', async () => {
            const graph = new Graph();
            /**
             * Graph: a, b: [a], c: [a]
             */
            const aData = 'some data a';
            const a = new Node(async () => aData, { name: 'a' });
            const b = new Node(async () => 'some data b', { name: 'b' });
            const c = new Node(async () => 'some data c', { name: 'c' });
            graph.addDependency(b, a);
            graph.addDependency(c, a);
            const dataPromise = a.data();
            await graph.traverse();
            const data = await dataPromise;
            expect(data).toBe(aData);
        });

        it('Await data after traverse should signal', async () => {
            const graph = new Graph();
            /**
             * Graph: a, b: [a], c: [a]
             */
            const aData = 'some data a';
            const a = new Node(async () => aData, { name: 'a' });
            const b = new Node(async () => 'some data b', { name: 'b' });
            const c = new Node(async () => 'some data c', { name: 'c' });
            graph.addDependency(b, a);
            graph.addDependency(c, a);
            await graph.traverse();
            const data = await a.data();
            expect(data).toBe(aData);
        });

        it('Catch circular graph', async () => {
            const graph = new Graph();
            /**
             * Graph: a: [b], b: [a] (circular)
             */
            const a = new Node(async () => { }, { name: 'a' });
            const b = new Node(async () => { }, { name: 'b' });
            graph.addDependency(a, b);
            graph.addDependency(b, a);
            await expect(graph.traverse()).rejects.toBeDefined();
        });
    });

    describe('Graph utility methods', () => {
        it('Clear node and dependents', async () => {
            const graph = new Graph();
            /**
             * Graph: a, b: [a], c: [a]
             */
            const a = new Node(async () => 'data a', { name: 'a' });
            const b = new Node(async () => 'data b', { name: 'b' });
            const c = new Node(async () => 'data c', { name: 'c' });
            
            graph.addDependency(b, a);
            graph.addDependency(c, a);
            
            await graph.traverse();
            
            // Verify all nodes have data
            expect(await a.data()).toBe('data a');
            expect(await b.data()).toBe('data b');
            expect(await c.data()).toBe('data c');
            
            // Clear node a and its dependents (b and c)
            await graph.clearNodeAndDependents(a);
            
            // Verify all nodes are cleared
            expect(a.hasData()).toBe(false);
            expect(b.hasData()).toBe(false);
            expect(c.hasData()).toBe(false);
        });

        it('Clear node and dependents when node has no data', async () => {
            const graph = new Graph();
            /**
             * Graph: a: [], b: [a]
             */
            const a = new Node(async () => 'data a', { name: 'a' });
            const b = new Node(async () => 'data b', { name: 'b' });
            
            graph.addDependency(b, a);
            
            // Don't traverse, so nodes have no data
            expect(a.hasData()).toBe(false);
            expect(b.hasData()).toBe(false);
            
            // Clear node a (which has no data) - should not clear dependents
            await graph.clearNodeAndDependents(a);
            
            // Verify nodes still have no data (nothing changed)
            expect(a.hasData()).toBe(false);
            expect(b.hasData()).toBe(false);
        });

        it('Reset graph', async () => {
            const graph = new Graph();
            /**
             * Graph: a, b: [a]
             */
            const a = new Node(async () => 'data a', { name: 'a' });
            const b = new Node(async () => 'data b', { name: 'b' });
            
            graph.addDependency(b, a);
            await graph.traverse();
            
            // Verify nodes have data
            expect(await a.data()).toBe('data a');
            expect(await b.data()).toBe('data b');
            
            // Reset graph
            graph.reset();
            
            // Verify nodes are reset (no data, mutex cleared)
            expect(a.hasData()).toBe(false);
            expect(b.hasData()).toBe(false);
        });

        it('List graph nodes', () => {
            const graph = new Graph();
            /**
             * Graph: a, b: [a], c: [a]
             */
            const a = new Node(async () => 'data a', { name: 'a' });
            const b = new Node(async () => 'data b', { name: 'b' });
            const c = new Node(async () => 'data c', { name: 'c' });
            
            graph.addDependency(b, a);
            graph.addDependency(c, a);
            
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            graph.ls();
            
            // Verify console.log was called for each node
            expect(consoleSpy).toHaveBeenCalledTimes(6); // 3 nodes * 2 calls each (name and dependents)
            expect(consoleSpy).toHaveBeenCalledWith('a');
            expect(consoleSpy).toHaveBeenCalledWith('b');
            expect(consoleSpy).toHaveBeenCalledWith('c');
            
            consoleSpy.mockRestore();
        });

        it('List graph nodes with unnamed node', () => {
            const graph = new Graph();
            const unnamedNode = new Node(async () => 'data', {});
            const namedNode = new Node(async () => 'data', { name: 'named' });
            
            graph.addDependency(namedNode, unnamedNode);
            
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            graph.ls();
            
            // Verify unnamed node shows as 'Unnamed Node'
            expect(consoleSpy).toHaveBeenCalledWith('Unnamed Node');
            expect(consoleSpy).toHaveBeenCalledWith('named');
            
            consoleSpy.mockRestore();
        });

        it('DependenciesOf returns empty array for node not in map', () => {
            const graph = new Graph();
            const a = new Node(async () => 'data a', { name: 'a' });
            
            // Get dependencies for a node that's not in the graph
            // Should return empty array, not throw
            const dependencies = graph.dependenciesOf(a);
            expect(dependencies).toEqual([]);
        });
    });

    describe('Node operations', () => {
        it('Set data on node', async () => {
            const graph = new Graph();
            /**
             * Graph: a: []
             */
            const a = new Node(async () => 'promise data', { name: 'a' });
            
            // Set data directly (this calls signalDependenciesReady internally)
            a.setData('direct data');
            
            // Verify data is set and accessible
            expect(await a.data()).toBe('direct data');
            
            // Verify signalDependenciesReady was called (mutex should be ready)
            // Data should be immediately available
            const dataPromise = a.data();
            const data = await dataPromise;
            expect(data).toBe('direct data');
        });

        it('Signal dependencies ready when data already set', async () => {
            const graph = new Graph();
            /**
             * Graph: a: []
             */
            const a = new Node(async () => 'data a', { name: 'a' });
            
            // Set data directly (bypassing promise)
            a.setData('pre-set data');
            
            // Signal dependencies ready when data is already set
            // This should call mutex.ready() directly without executing promise
            a.signalDependenciesReady();
            
            // Verify data is still accessible
            expect(await a.data()).toBe('pre-set data');
        });

        it('Reset node', async () => {
            const graph = new Graph();
            /**
             * Graph: a: [b]
             */
            const b = new Node(async () => 'data b', { name: 'b' });
            const a = new Node(async () => 'data a', { name: 'a' });
            
            graph.addDependency(a, b);
            await graph.traverse();
            
            // Verify node has data
            expect(await a.data()).toBe('data a');
            expect(a.hasData()).toBe(true);
            
            // Reset node
            a.reset();
            
            // Verify node is reset
            expect(a.hasData()).toBe(false);
        });

        it('Clear mutex when node has data', async () => {
            const graph = new Graph();
            /**
             * Graph: a: [b]
             */
            const b = new Node(async () => 'data b', { name: 'b' });
            const a = new Node(async () => 'data a', { name: 'a' });
            
            graph.addDependency(a, b);
            await graph.traverse();
            
            // Verify node has data
            expect(await a.data()).toBe('data a');
            expect(a.hasData()).toBe(true);
            
            // Clear mutex (should clear when hasData is true)
            a.clearMutex();
            
            // Verify mutex is cleared (data should still be there)
            expect(a.hasData()).toBe(true);
        });

        it('Clear data on node', async () => {
            const graph = new Graph();
            /**
             * Graph: a: []
             */
            const a = new Node(async () => 'data a', { name: 'a' });
            
            // Set data
            a.setData('test data');
            
            // Verify data exists
            expect(await a.data()).toBe('test data');
            expect(a.hasData()).toBe(true);
            
            // Clear data
            a.clearData();
            
            // Verify data is cleared
            expect(a.hasData()).toBe(false);
        });

        it('Node constructor with undefined options', () => {
            const node = new Node(async () => 'data');
            
            // Should not throw, name should be undefined
            expect(node.name).toBeUndefined();
        });

        it('Node constructor with options but undefined name', () => {
            const node = new Node(async () => 'data', {});
            
            // Should not throw, name should be undefined
            expect(node.name).toBeUndefined();
        });
    });

    describe('Error cases', () => {
        it('Node promise throws error', async () => {
            const graph = new Graph();
            /**
             * Graph: a: [], errorNode: [a]
             */
            const a = new Node(async () => 'data a', { name: 'a' });
            const errorNode = new Node(async () => {
                throw new Error('Promise error');
            }, { name: 'errorNode' });
            
            graph.addDependency(errorNode, a);
            
            // Traverse should reject when errorNode's promise throws
            // The error occurs during traversal, not when accessing node data
            await expect(graph.traverse()).rejects.toBeDefined();
        });

        it('Signal dependencies ready throws error when promise is undefined', async () => {
            const graph = new Graph();
            /**
             * Graph: a: [], b: []
             */
            const a = new Node(() => undefined as any, { name: 'a' });
            const b = new Node(async () => 'data b', { name: 'b' });
            
            graph.addDependency(a, b);
            
            // When signalDependenciesReady is called, it will call the promise function
            // which returns undefined, causing an error
            await expect(graph.traverse()).rejects.toThrow('Node has undefined promise.');
        });
    });
});
