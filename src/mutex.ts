export class Mutex {

    private readyTest: () => boolean;
    private waiting?: ((error?: Error) => void)[];

    public constructor(readyTest: () => boolean) {
        this.readyTest = readyTest;
    }

    public await(callback: (error?: Error) => any): void {
        if (this.readyTest() === true) {
            callback();
        } else {
            this.waiting = this.waiting || [];
            this.waiting.push(callback);
        }
    }

    // called when we know what we are waiting for is ready
    public ready(error?: Error): void {
        if (this.waiting)
            this.waiting.forEach((callback) => callback(error));
        delete this.waiting;
    }
}