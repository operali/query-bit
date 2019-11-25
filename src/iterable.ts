// iterator values
const RET = Symbol('RET');
const CONTINUE = Symbol('IGNORE');
const BREAK = Symbol('BREAK');


//RET | CONTINUE | BREAK | any
type option_t = any
type context_t = any
export class Iterable {
    static RET: Symbol = RET;

    static CUT: Iterable = new class extends Iterable {
        getIter() {
            return new class extends Iterator {
                isPass = 0;
                next() {
                    if (this.isPass === 1) return BREAK;
                    this.isPass++;
                    return CONTINUE;
                }
            }
        }
    };

    static fromPred(fun: () => boolean): Iterable {
        return new class extends Iterable {
            getIter() {
                return new class extends Iterator {
                    _server: boolean = false;
                    next() {
                        if (!this._server) {
                            this._server = true;
                            let r = fun();
                            if (r) {
                                return CONTINUE;
                            }
                            return RET;
                        }
                        return RET;
                    }
                }
            }
        };
    };

    static fromAction(fun: () => any): Iterable {
        return new class extends Iterable {
            getIter() {
                return new class extends Iterator {
                    _server: boolean = false;
                    next() {
                        if (!this._server) {
                            this._server = true;
                            fun();
                            return CONTINUE;
                        }
                        return RET;
                    }
                }
            }
        };
    };

    transform(trans: (val: any) => any): Iterable {
        let that = this;
        return new class extends Iterable {
            getIter() {
                let iter = that.getIter();
                if (iter instanceof Stepper) {
                    return new class extends Stepper {
                        step() {
                            let v = (iter as Stepper).step()
                            if (v === RET) return RET;
                            if (v === CONTINUE) return CONTINUE;
                            if (v === BREAK) return BREAK;
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
                            if (v === RET) return RET;
                            if (v === CONTINUE) return CONTINUE;
                            if (v === BREAK) return BREAK;
                            return trans(v);
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


    public static fromRange(from: number, to: number, step: number) {
        const c = class extends Iterator {
            cur = from;
            next() {
                if (this.cur > to) return RET;
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
                    return RET;
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

    getIter(_ctx?: context_t): Iterator {
        throw "no implement"
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
                        return RET;
                    }
                };
                else return r[1];
            }
        }
        return [r[0], iterab]
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
                    if (r === RET) {
                        if (this._iterStk.length === 0) return RET;
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
        throw "no implement"
    }

    toArray(): any[] {
        let r = [];
        while (true) {
            let item = this.next();
            if (item === RET) return r;
            r.push(item);
        }
    }

    nth(n: number): option_t {
        let r = null;
        for (let i = -1; i < n; ++i) {
            r = this.next();
            if (r === RET) return RET;
        }
        return r;
    }

    filter(filterF: (item: any) => boolean): Iterator {
        let it = this;
        return new class extends Iterator {
            next() {
                while (true) {
                    let item = it.next();
                    if (item === RET) return RET;
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
                if (item === RET) return RET;
                return trans(item);
            }
        }
    }

    fold(init: any, acc: (pre: any, item: any) => any): any {
        let r = init;
        let it = this;
        while (true) {
            let item = it.next();
            if (item === RET) return r;
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
        if (item === RET) return null;
        return [item, that];
    }

    take(n: number): Iterator {
        let that = this;
        let count = 0;
        return new class extends Iterator {
            next() {
                if (count === n) return RET;
                let r = that.next();
                if (r === RET) return RET;
                count++;
                return r;
            }
        }
    }

    skip(n: number): Iterator | null {
        let it = this;
        for (let i = 0; i < n; ++i) {
            let r = it.next();
            if (r === RET) return it;
        }
        return it;
    }

    length(): number {
        let it = this;
        let c = 0;
        while (true) {
            let item = it.next();
            if (item === RET) return c;
            c++;
        }
    }

    clone(): Iterator {
        throw "no implement";
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
class Stepper extends Iterator {
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
                            if (idx === len) return RET;
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
                            if (item === RET) {
                                state = stIter;
                                idx++;
                                realIdx++;
                                continue;
                            } else if (item == CONTINUE || item == BREAK) {
                                state = stIter;
                                idx++;
                                // realIdx++;
                                continue;
                            }
                            state = stNext;
                            return [realIdx, item];
                        default: ;
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
                            if (item === RET) {
                                state = stBT;
                                continue;
                            }
                        case stValue:
                            if (item === BREAK) {
                                return RET;
                            }
                            valStk.push(item);
                            idx++;
                            if (idx === len) {
                                idx--;
                                let r = valStk.filter(val => val !== CONTINUE);
                                valStk.pop();
                                state = stNext;
                                return r;
                            }
                            state = stIter;
                            continue;
                        case stBT:
                            if (idx === 0) return RET;
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
