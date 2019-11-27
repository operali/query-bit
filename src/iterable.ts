
const magic = "---QUERY-BIT";
// iterator values
const EOF = ['EOF' + magic];
const EPSILON = ['EPSILON' + magic];
const CUT = ['CUT' + magic];
//RET | CONTINUE | BREAK | any
type option_t = any
export class Iterable {
    static EOF = EOF;
    static EPSILON = EPSILON;
    static BREAK = CUT;
    static ICUT: Iterable = new class extends Iterable {
        getIter() {
            return new class extends Iterator {
                _isDone = false;
                next() {
                    if (this._isDone) return CUT;
                    this._isDone = true;
                    return EPSILON;
                }
            }
        }
    };

    static IEOF: Iterable = new class extends Iterable {
        getIter() {
            return new class extends Iterator {
                next() {
                    return EOF;
                }
            }
        }
    }

    static IEPSILON: Iterable = new class extends Iterable {
        getIter() {
            return new class extends Iterator {
                _isDone = false;
                next() {
                    if (this._isDone) return EOF;
                    this._isDone = true;
                    return EPSILON;
                }
            }
        }
    }

    static fromPred(fun: () => boolean): Iterable {
        return new class extends Iterable {
            getIter() {
                return new class extends Iterator {
                    _isDone: boolean = false;
                    next() {
                        if (!this._isDone) {
                            this._isDone = true;
                            let r = fun();
                            if (r) {
                                return EPSILON;
                            }
                            return EOF;
                        }
                        return EOF;
                    }
                }
            }
        };
    };

    static fromAction(fun: () => any): Iterable {
        return new class extends Iterable {
            getIter() {
                return new class extends Iterator {
                    _isDone: boolean = false;
                    next() {
                        if (!this._isDone) {
                            this._isDone = true;
                            fun();
                            return EPSILON;
                        }
                        return EOF;
                    }
                }
            }
        };
    };


    static fromFunction(fun: () => any): Iterable {
        return new class extends Iterable {
            getIter() {
                return new class extends Iterator {
                    _isDone: boolean = false;
                    next() {
                        if (!this._isDone) {
                            this._isDone = true;
                            return fun();
                        }
                        return EOF;
                    }
                }
            }
        };
    };

    public transform(trans: (val: any) => any): Iterable {
        let that = this;
        return new class extends Iterable {
            getIter() {
                let iter = that.getIter();
                if (iter instanceof Stepper) {
                    return new class extends Stepper {
                        step() {
                            let v = (iter as Stepper).step()
                            if (v === EOF) return EOF;
                            if (v instanceof Stepper) {
                                return v;
                            }
                            return trans(v);
                        }
                    }
                } else {
                    return new class extends Iterator {
                        next() {
                            let v = iter.next();
                            if (v === EOF) return EOF;
                            return trans(v);
                        }
                    }
                }

            }
        }
    }

    public hook(onBegin: () => void, onEnd: () => void, onItem?: (item: any) => void) {
        let that = this;
        return new class extends Iterable {
            getIter() {
                if (onBegin) onBegin();
                let iter = that.getIter();
                if (iter instanceof Stepper) {
                    return new class extends Stepper {
                        step() {
                            let item = (iter as Stepper).step();
                            if (item instanceof Stepper) {
                                return item;
                            }
                            if (item === EOF) {
                                if (onEnd) onEnd();
                                return EOF;
                            }
                            if (onItem) onItem(item);
                            return item;
                        }
                    }
                } else {
                    return new class extends Iterator {
                        next() {
                            let item = iter.next();
                            if (item === EOF) {
                                if (onEnd) onEnd();
                                return EOF;
                            }
                            if (onItem) onItem(item);
                            return item;
                        }
                    }
                }
            }
        }
    }

    public static fromGenerator(first: any, next: (pre: any) => option_t): Iterable {
        return new class extends Iterable {
            getIter() {
                return new class extends Iterator {
                    _cur: number = first;
                    next() {
                        let r = this._cur;
                        this._cur = next(this._cur);
                        return r;
                    };
                }
            }
        }
    }

    public static fromN(n: number): Iterator {
        const c = class extends Iterator {
            cur = n;
            next(): any {
                let r = this.cur++;
                return r;
            }
            clone(): Iterator {
                let o = new c();
                o.cur = this.cur;
                return o;
            }
        }

        return new c();
    }


    public static fromRange(from: number, to: number, step: number = 1) {
        const c = class extends Iterator {
            cur = from;
            next() {
                if (this.cur >= to) return EOF;
                let r = this.cur;
                this.cur += step;
                return r;
            }

            clone(): Iterator {
                let o = new c();
                o.cur = this.cur;
                return o;
            }
        }
        return new c();
    }

    public static fromArray(ns: any[]): Iterator {
        let c = class extends Iterator {
            cur = 0;
            next(): option_t {
                if (this.cur === ns.length) {
                    return EOF;
                }
                return ns[this.cur++];
            }

            clone(): Iterator {
                let o = new c();
                o.cur = this.cur;
                return o;
            }
        }
        return new c();
    }

    public static sum(...its: Iterable[]) {
        return new SUMIter(...its);
    }

    public static product(...its: Iterable[]) {
        return new ProductIter(...its);
    }

    getIter(): Iterator {
        throw "no implement getIter"
    }

    flatten(): Iterable {
        return new class extends Iterable {
            next() {
                return this.getIter().flatten();
            }
        }
    }

    cons(elem: any): Iterable {
        let that = this;
        return new class extends Iterable {
            getIter() {
                return that.getIter().cons(elem);
            }
        }
    }

    // poor performance, care to use it, use iterator directly!
    uncons(): [any, Iterable] {
        let that = this;
        let r = that.getIter().uncons();
        if (r === null) return null;
        let iterab = new class extends Iterable {
            getIter(): Iterator {
                let r = that.getIter().uncons();
                if (r === null) return new class extends Iterator {
                    next(): option_t {
                        return EOF;
                    }
                };
                else return r[1];
            }
        }
        return [r[0], iterab];
    }

    map(trans: (item: any) => any): Iterable {
        let that = this;
        return new class extends Iterable {
            getIter() {
                let it1 = that.getIter();
                return it1.map(trans);
            }
        };
    }

    filter(filterF: (item: any) => boolean): Iterable {
        let that = this;
        return new class extends Iterable {
            getIter() {
                let it1 = that.getIter();
                return it1.filter(filterF);
            }
        };
    }

    take(n: number): Iterable {
        let that = this;
        return new class extends Iterable {
            getIter() {
                let it1 = that.getIter();
                return it1.take(n);
            }
        };
    }

    skip(n: number): Iterable {
        let that = this;
        return new class extends Iterable {
            getIter() {
                let it1 = that.getIter();
                return it1.skip(n);
            }
        };
    }

    static fromValue = (val: any) => new class extends Iterable {
        getIter() {
            return new class extends Iterator {
                _isDone = false;
                next() {
                    if (this._isDone) return EOF;
                    this._isDone = true;
                    return val;
                }
            }
        }
    };

    static NOTHING: string[] = ["NOTHING" + magic];
    static INOTHING = Iterable.fromValue(Iterable.NOTHING);
    // I?
    maybe(): Iterable {
        return Iterable.sum(this, Iterable.INOTHING).transform(n => {
            let val = n[1];
            return val;
        })
    }

    // I(N)
    repeat(n: number): Iterable {
        if (n === 0) throw 'cannot repeat 0 time';
        let iters: Iterable[] = [];
        for (let i = 0; i < n; ++i) {
            iters.push(this);
        }
        return Iterable.product(...iters);
    }

    not(): Iterable {
        return Iterable.fromPred(() => {
            let iter = this.getIter();
            let r = iter.next();
            if (r === EOF) return true;
            return false;
        });
    }

    // I* = 
    // many(n) = n many(n) | ep
    many(): Iterable {
        let manyIter = new SUMIter(); // many(n)
        let manyIter1 = manyIter.transform(n => {
            let idx = n[0];
            let val = n[1];
            if (idx === 0) {
                return val;
            }
            return [];
        });

        let rightRecIter = new ProductIter(); // n many(n)
        let rightRecIter1 = rightRecIter.transform(n => { // n many(n) 
            let val = n[0];
            let otherVals = n[1];
            let r = [val, ...otherVals];
            return r;
        });

        manyIter.iterables.push(rightRecIter1);
        manyIter.iterables.push(Iterable.INOTHING);

        rightRecIter.iterables.push(this);
        rightRecIter.iterables.push(manyIter1);
        //rightRecIter.iterables.push(Iterable.ICUT);
        return manyIter1;
    }

    // I+
    more(): Iterable {
        let r = new ProductIter();
        r.iterables.push(this);
        r.iterables.push(this.many());
        return r.transform(n => {
            let first = n[0];
            let others = n[1];
            return [first, ...others];
        })
    }

    // (I, (e, I)*)
    separatedBy(separator: Iterable): Iterable {
        let r = new ProductIter();
        r.iterables.push(this); // first

        let followItem = new SUMIter();
        followItem.iterables.push(separator);
        followItem.iterables.push(this);
        followItem.transform(sItem => {
            return sItem[1];
        });
        let follows = followItem.many();
        r.iterables.push(follows);
        return r.maybe().transform(item => {
            if (item === Iterable.IEPSILON) {
                return [];
            }
            return item;
        });
    }
}

export class Iterator {
    flatten(): Iterator {
        let that = this;
        return new class extends Iterator {
            _iterStk: Iterator[] = [];
            _curIter: Iterator = that;
            next(): option_t {
                while (true) {
                    let r = this._curIter.next();
                    if (r === EOF) {
                        if (this._iterStk.length === 0) return EOF;
                        this._curIter = this._iterStk.pop();
                        continue;
                    } else if (r instanceof Iterator) {
                        this._iterStk.push(this._curIter);
                        this._curIter = r;
                        continue;
                    } else {
                        return r;
                    }
                }
            }
        }
    }

    next(): option_t {
        throw "no implement next"
    }

    toArray(): any[] {
        let r = [];
        while (true) {
            let item = this.next();
            if (item === EOF) return r;
            r.push(item);
        }
    }

    nth(n: number): option_t {
        let r = null;
        for (let i = -1; i < n; ++i) {
            r = this.next();
            if (r === EOF) return EOF;
        }
        return r;
    }

    filter(filterF: (item: any) => boolean): Iterator {
        let it = this;
        return new class extends Iterator {
            next() {
                while (true) {
                    let item = it.next();
                    if (item === EOF) return EOF;
                    else if (filterF(item)) {
                        return item;
                    }
                }
            }
        }
    }

    map(trans: (item: any) => any): Iterator {
        let it = this;
        return new class extends Iterator {
            next(): option_t {
                let item = it.next();
                if (item === EOF) return EOF;
                return trans(item);
            }
        }
    }

    fold(init: any, acc: (pre: any, item: any) => any): any {
        let r = init;
        let it = this;
        while (true) {
            let item = it.next();
            if (item === EOF) return r;
            r = acc(r, item);
        }
    }

    cons(elem: any): Iterator {
        let head = true;
        let that = this;
        return new class extends Iterator {
            next(): option_t {
                if (head) {
                    head = false;
                    return elem;
                } else {
                    return that.next();
                }
            }
        }
    }

    uncons(): [any, Iterator] {
        let that = this;
        let item = that.next();
        if (item === EOF) return null;
        return [item, that];
    }

    take(n: number): Iterator {
        let that = this;
        let count = 0;
        return new class extends Iterator {
            next() {
                if (count === n) return EOF;
                let r = that.next();
                if (r === EOF) return EOF;
                count++;
                return r;
            }
        }
    }

    skip(n: number): Iterator | null {
        let it = this;
        for (let i = 0; i < n; ++i) {
            let r = it.next();
            if (r === EOF) return it;
        }
        return it;
    }

    length(): number {
        let it = this;
        let c = 0;
        while (true) {
            let item = it.next();
            if (item === EOF) return c;
            c++;
        }
    }

    clone(): Iterator {
        throw "no implement clone";
    }

    toIterable() {
        let that = this.clone();
        return new class extends Iterable {
            getIter() {
                return that.clone();
            }
        }
    }
}

// stepper states
const SYNC = Symbol('SYN');
const ASYNC = Symbol('ASYNC');
export class Stepper extends Iterator {
    _async: any = SYNC;

    next() {
        let stepStk: Stepper[] = [];
        let curStepper: Stepper = this;
        while (true) {
            let opv = curStepper.step();
            if (opv instanceof Stepper) {
                stepStk.push(curStepper);
                curStepper = opv;
            } else {
                if (stepStk.length === 0) return opv;
                curStepper = stepStk.pop();
                curStepper.resolve(opv);
            }
        }
    }

    step(): Stepper | Iterator | option_t {
        throw "no implement";
    }

    resolve(val: any) {
        this._async = val;
    }
}


class SUMIter extends Iterable {
    iterables: Iterable[] = []
    constructor(...its: Iterable[]) {
        super();
        this.iterables = [...its];
    }

    getIter(): Iterator {
        let itabs = this.iterables;
        let cur: Iterator = null;
        const stIter = 1;
        const stNext = 2;
        const stValue = 3;
        let state = stIter;
        let idx = 0;
        let realIdx = 0;
        let len = itabs.length;
        return new class extends Stepper {
            step() {
                let item: any = null;
                while (true) {
                    switch (state) {
                        case stIter:
                            if (idx === len) return EOF;
                            let itab = itabs[idx];
                            cur = itab.getIter();
                        case stNext:
                            if (cur instanceof Stepper) {
                                item = cur.step();
                                if (item instanceof Stepper) {
                                    state = stValue;
                                    return item;
                                }
                            } else {
                                item = cur.next();
                            }
                        case stValue:
                            if (item === EOF || item === EPSILON || item == CUT) {
                                state = stIter;
                                idx++;
                                realIdx++;
                                continue;
                            }
                            state = stNext;
                            return [realIdx, item];
                        default:
                            ;
                    }
                }
            }
        }
    }
}



class ProductIter extends Iterable {
    iterables: Iterable[] = []
    constructor(...its: Iterable[]) {
        super();
        this.iterables = [...its];
    }

    getIter() {
        let itStk: Iterator[] = [];
        let valStk: any[] = [];
        let itabs = this.iterables;
        let cur: Iterator = null;
        const stBT = 0;
        const stIter = 1;
        const stNext = 2;
        const stValue = 3;
        let state = stIter;
        let idx = 0;
        const len = itabs.length;
        return new class extends Stepper {
            step(): option_t | Iterator {
                let item: any = null;
                if (this._async !== SYNC) {
                    item - this._async;
                    this._async = ASYNC;
                    state = stValue;
                }
                while (true) {
                    switch (state) {
                        case stIter:
                            if (cur !== null) {
                                itStk.push(cur);
                            }
                            cur = itabs[idx].getIter();
                        case stNext:
                            if (cur instanceof Stepper) {
                                item = cur.step();
                                if (item instanceof Stepper) {
                                    return item;
                                }
                            } else {
                                item = cur.next();
                            }
                            if (item === EOF) {
                                state = stBT;
                                continue;
                            }
                        case stValue:
                            if (item === CUT) {
                                return EOF;
                            }
                            valStk.push(item);
                            idx++;
                            if (idx === len) {
                                idx--;
                                let r = valStk.filter(val => val !== EPSILON);
                                valStk.pop();
                                state = stNext;
                                return r;
                            }
                            state = stIter;
                            continue;
                        case stBT:
                            if (idx === 0) return EOF;
                            idx--;
                            cur = itStk.pop();
                            valStk.pop();
                            state = stNext;
                        default:
                            continue;
                    }
                }
            }
        }
    }
}
