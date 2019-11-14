export type option_t = null | [any]

export class Iterable {
    getIter(): Iterator {
        throw "no implement"
    }

    toArray(): any[] {
        let it = this.getIter();
        return it.toArray();
    }

    nth(n: number): option_t {
        return this.getIter().nth(n);
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
        if (r == null) return null;
        let iterab = new class extends Iterable {
            getIter(): Iterator {
                let r = that.getIter().uncons();
                if (r == null) return new class extends Iterator {
                    next(): option_t {
                        return null;
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

    fold(init: any, acc: (pre: any, item: any) => any): any {
        let that = this;
        return that.getIter().fold(init, acc);
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

    length(): number {
        return this.getIter().length();
    }
}

export class Iterator {
    static gen(first: any, next: (pre: any) => option_t): Iterator {
        let cur = first;
        return new class extends Iterator {
            next() {
                let r = cur;
                cur = next(cur);
                return r;
            }
        }
    }

    static fromN(n: number): Iterator {
        let cur = n;
        return new class extends Iterator {
            next(): [any] {
                let r = cur++;
                return [r];
            }
        }
    }

    static fromArray(ns: any[]): Iterator {
        let i = 0;
        return new class extends Iterator {
            next(): option_t {
                if (i == ns.length) {
                    return null;
                }
                return [ns[i++]];
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
            if (item == null) return r;
            r.push(item[0]);
        }
    }

    nth(n: number): option_t {
        let r = null;
        for (let i = -1; i < n; ++i) {
            r = this.next();
            if (r == null) return null;
        }
        return r;
    }

    filter(filterF: (item: any) => boolean): Iterator {
        let it = this;
        return new class extends Iterator {
            next() {
                while (true) {
                    let item = it.next();
                    if (item == null) return null;
                    else if (filterF(item[0])) {
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
                if (item == null) return null;
                return [trans(item[0])];
            }
        }
    }

    fold(init: any, acc: (pre: any, item: any) => any): any {
        let r = init;
        let it = this;
        while (true) {
            let item = it.next();
            if (item == null) return r;
            r = acc(r, item[0])
        }
    }

    cons(elem: any): Iterator {
        let head = true;
        let that = this;
        return new class extends Iterator {
            next(): option_t {
                if (head) {
                    head = false;
                    return [elem];
                } else {
                    return that.next();
                }
            }
        }
    }

    uncons(): [any, Iterator] {
        let that = this;
        let h = that.next();
        if (h == null) return null;
        return [h[0], that];
    }

    take(n: number): Iterator {
        let that = this;
        let count = 0;
        return new class extends Iterator {
            next() {
                if (count == n) return null;
                let r = that.next();
                if (r == null) return null;
                count++;
                return r;
            }
        }
    }

    skip(n: number): Iterator {
        let it = this;
        for (let i = 0; i < n; ++i) {
            let r = it.next();
        }
        return it;
    }

    length(): number {
        let it = this;
        let c = 0;
        while (true) {
            let item = it.next();
            if (item == null) return c;
            c++;
        }
    }
}

export class Stepable {
    getStep(): Stepper {
        throw "no implement"
    }

    toIterable(): Iterable {
        const that = this;
        return new class extends Iterable {
            getIter(): Iterator {
                let stepper = that.getStep();
                return stepper.toIterator();
            }
        };
    }
}

export class Stepper {
    static fromArray(items: (Stepable | Iterable | any)[]) {
        
    }
    /** 
     * (a, b) to ((0, a1)...(0, an)...(1, b1)...(1, bn));
     */
    static fromEnum(items: (Stepable | Iterable | any)[]) {
        return new class extends Stepable {
            getStep() {
                return new class extends Stepper {
                    _idx: number
                    _curItem: Iterator;
                    constructor() {
                        super();
                        this._idx = 0;
                        this._curItem = null;
                    }
                    stepIn(): Stepable | option_t {
                        while (true) {
                            if (this._curItem == null) {
                                let len = items.length;
                                if (this._idx == len) return null;
                                let item = items[this._idx++];
                                if (item instanceof Stepable) {
                                    return item;
                                } else if (item instanceof Iterable) {
                                    this._curItem = item.getIter();
                                } else {
                                    let val = item[0];
                                    return [[this._idx - 1, val]]
                                }
                            } else { // iterator
                                let val = this._curItem.next();
                                if (val == null) {
                                    this._curItem = null;
                                } else {
                                    return [[this._idx - 1, val[0]]]
                                }
                            }
                        }

                    }
                }
            }

        }
    }

    stepIn(): Stepable | option_t {
        throw "no implement"
    }

    toIterator(): Iterator {
        let that = this;
        return new class _iterator extends Iterator {
            _curSt: Stepper
            _stStk: Stepper[]
            constructor() {
                super();
                this._curSt = that;
                this._stStk = [];
            }

            next(): option_t {
                let opst = null;
                while (true) {
                    opst = this._curSt.stepIn();
                    if (opst == null) {
                        if (this._stStk.length == 0) return null;
                        this._curSt = this._stStk.pop();
                    } else if (opst instanceof Stepable) {
                        this._stStk.push(this._curSt);
                        this._curSt = opst.getStep();
                    } else {
                        return opst;
                    }
                };
            }
        }
    }
}
