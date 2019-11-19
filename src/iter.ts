export const EOF = Symbol('eof');
export const NOTHING = Symbol('nothing');

export type option_t = any

export class Iterable {
    getIter(): Iterator {
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
        if (r == null) return null;
        let iterab = new class extends Iterable {
            getIter(): Iterator {
                let r = that.getIter().uncons();
                if (r == null) return new class extends Iterator {
                    next(): option_t {
                        return EOF;
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
    static EOF: Symbol = EOF;
    static gen(first: any, next: (pre: any) => option_t): Iterator {
        let c = class extends Iterator {
            _cur: number = first;
            next() {
                let r = this._cur;
                this._cur = next(this._cur);
                return r;
            }

            clone(): Iterator {
                let o = new c();
                o._cur = this._cur;
                return o;
            }
        }
        return new c();
    }

    static fromN(n: number): Iterator {
        let c = class extends Iterator {
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

    static fromArray(ns: any[]): Iterator {
        let c = class extends Iterator {
            cur = 0;
            next(): option_t {
                if (this.cur == ns.length) {
                    return null;
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

    flatten(): Iterator {
        let that = this;
        return new class extends Iterator {
            _iterStk: Iterator[] = [];
            _curIter: Iterator = that;
            next(): option_t {
                while (true) {
                    let r = this._curIter.next();
                    if (r == EOF) {
                        if (this._iterStk.length == 0) return EOF;
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
            if (item == EOF) return r;
            r.push(item);
        }
    }

    nth(n: number): option_t {
        let r = null;
        for (let i = -1; i < n; ++i) {
            r = this.next();
            if (r == EOF) return EOF;
        }
        return r;
    }

    filter(filterF: (item: any) => boolean): Iterator {
        let it = this;
        return new class extends Iterator {
            next() {
                while (true) {
                    let item = it.next();
                    if (item == EOF) return EOF;
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
                if (item == EOF) return EOF;
                return trans(item);
            }
        }
    }

    fold(init: any, acc: (pre: any, item: any) => any): any {
        let r = init;
        let it = this;
        while (true) {
            let item = it.next();
            if (item == EOF) return r;
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
        if (item == EOF) return null;
        return [item, that];
    }

    take(n: number): Iterator {
        let that = this;
        let count = 0;
        return new class extends Iterator {
            next() {
                if (count == n) return EOF;
                let r = that.next();
                if (r == EOF) return EOF;
                count++;
                return r;
            }
        }
    }

    skip(n: number): Iterator | null {
        let it = this;
        for (let i = 0; i < n; ++i) {
            let r = it.next();
            if (r == EOF) return it;
        }
        return it;
    }

    length(): number {
        let it = this;
        let c = 0;
        while (true) {
            let item = it.next();
            if (item == EOF) return c;
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


