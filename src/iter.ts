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

    map(trans: (item: any) => any): Iterable {
        return this.getIter().map(trans).toIterable();
    }

    filter(filter: (item: any) => boolean): Iterable {
        let it = this.getIter();
        return it.filter(filter).toIterable();
    }

    fold(init: any, acc: (pre: any, item: any) => any): any {
        let it = this.getIter();
        return it.fold(init, acc);
    }

    elim(): [any, Iterable] {
        let it = this.getIter();
        let r = it.elim();
        if (r == null) return null;
        return [r[0], r[1].toIterable()];
    }

    take(n: number): Iterable {
        let it = this.getIter();
        return it.take(n).toIterable();
    }

    skip(n: number): Iterable {
        let it = this.getIter();
        return it.skip(n).toIterable();
    }

    length(): number {
        return this.getIter().length();
    }
}

export class Iterator {
    next(): option_t {
        throw "no implement"
    }

    toIterable() {
        let that = this;
        return new class extends Iterable {
            getIter(): Iterator {
                return that;
            }
        }
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

    filter(filter: (item: any) => boolean): Iterator {
        let it = this;
        return new class extends Iterator {
            next() {
                while (true) {
                    let item = it.next();
                    if (item == null) return null;
                    else if (filter(item[0])) {
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

    elim(): [any, Iterator] {
        let it = this;
        let h = it.next();
        if (h == null) return null;
        return [h[0], it];
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
        class _iterable extends Iterable {
            getIter(): Iterator {
                let stepper = that.getStep();
                return stepper.toIterator();
            }
        }
        return new _iterable();
    }
}

export class Stepper {
    stepIn(): Stepable | option_t {
        throw "no implement"
    }

    toIterator(): Iterator {
        const that = this;
        class _iterator extends Iterator {
            _curSt: Stepper
            _stStk: Stepper[]
            constructor(st: Stepper) {
                super();
                this._curSt = st;
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
        return new _iterator(this);
    }
}
