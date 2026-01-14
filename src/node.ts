import { Mutex } from './mutex';

export interface NodeOptions {
    name?: string;
}

export class Node {
    private _name?: string;
    private _promise: () => Promise<any>;
    private _data?: any;
    private mutex?: Mutex;
    private locked = false;
    constructor(promise: () => Promise<any>, options?: NodeOptions) {
        this._promise = promise;
        this._name = options?.name;
    }

    get name() {
        return this._name;
    }
    /**
     * Await data.
     * @returns A `Promise<T | null>` that resolves when the node's data is ready.
     */
    public data(): Promise<any> {
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
            if (promise === undefined) throw new Error(`Node has undefined promise.`);
            (async () => {
                try {
                    const data = await promise;
                    this._data = data;
                    this.locked = false;
                    this.mutex!.ready();
                } catch (error) {
                    this._data = null;
                    this.locked = false;
                    this.mutex!.ready(error as Error);
                }
            })();
        } else {
            // Allow _data to be set externally from promise
            this.mutex!.ready();
        }
    }

    public setData(data: any) {
        this._data = data;
        this.signalDependenciesReady();
    }

    /**
     * Resets node. Clears all node data and resets its mutex.
     */
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
