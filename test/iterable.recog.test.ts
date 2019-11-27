import { Iterable } from '../src/iterable';

test('maybe', () => {
    {
        let itab = Iterable.fromArray([0]).toIterable();
        let itab1 = itab.maybe();
        let it = itab1.getIter();
        expect(it.next()).toStrictEqual(0);
        expect(it.next()).toStrictEqual(Iterable.EPSILON);
        expect(it.next()).toStrictEqual(Iterable.EOF);
    }
    {
        let itab = Iterable.fromArray([0, 1]).toIterable();
        let itab1 = itab.maybe();
        let it = itab1.getIter();
        expect(it.next()).toStrictEqual(0);
        expect(it.next()).toStrictEqual(1);
        expect(it.next()).toStrictEqual(Iterable.EPSILON);
        expect(it.next()).toStrictEqual(Iterable.EOF);
    }
});

test('repeat', () => {
    {
        let itab = Iterable.fromArray([1]).toIterable();
        let itab1 = itab.repeat(1);
        let it = itab1.getIter();
        expect(it.next()).toStrictEqual([1]);
        expect(it.next()).toStrictEqual(Iterable.EOF);
    }
    {
        let itab = Iterable.fromArray([1]).toIterable();
        let itab1 = itab.repeat(3);
        let it = itab1.getIter();
        expect(it.next()).toStrictEqual([1, 1, 1]);
        expect(it.next()).toStrictEqual(Iterable.EOF);
    }
    {
        let itab = Iterable.fromArray([1, 2]).toIterable();
        let itab1 = itab.repeat(3);
        let it = itab1.getIter();
        expect(it.next()).toStrictEqual([1, 1, 1]);
        expect(it.next()).toStrictEqual([1, 1, 2]);
        expect(it.next()).toStrictEqual([1, 2, 1]);
        expect(it.next()).toStrictEqual([1, 2, 2]);
        expect(it.next()).toStrictEqual([2, 1, 1]);
        expect(it.next()).toStrictEqual([2, 1, 2]);
        expect(it.next()).toStrictEqual([2, 2, 1]);
        expect(it.next()).toStrictEqual([2, 2, 2]);
        expect(it.next()).toStrictEqual(Iterable.EOF);
    }
});
const isBlank = (str: string) => {
    return str.trim() == "";
}

class ParserBase {
    _src: string;
    _pos: number;
    constructor(src: string) {
        this._src = src;
        this._pos = 0;
    };

    stringP(str: string): Iterable {
        let ret = str;
        let start = 0;
        let len = str.length;
        return Iterable.fromFunction(() => {
            if (this._src.startsWith(str, start)) {
                return ret;
            } else {
                return Iterable.EOF;
            }
        }).hook(() => start = this._pos, () => this._pos = start, () => this._pos = start + len);
    };

    blanksP(): Iterable {
        let start = 0;
        let idx = 0;
        return Iterable.fromFunction(() => {
            for (idx = start; idx < this._src.length; ++idx) {
                if (!isBlank(this._src[idx])) {
                    break;
                }
            }
            return Iterable.CONTINUE;
        }).hook(() => start = this._pos, () => this._pos = start, () => this._pos = idx);
    }

    noblanksP(): Iterable {
        let idx = this._pos;
        return Iterable.fromFunction(() => {
            for (; idx < this._src.length; ++idx) {
                if (isBlank(this._src[idx])) {
                    let r = this._src.substring(this._pos, idx);
                    this._pos = idx;
                    return r;
                }
            }
            return Iterable.EOF;
        })
    }
}


test('not', () => {
    {
        let p = new ParserBase('asdfasdf');
        let itab = p.noblanksP();
        let r = itab.getIter().next();
        expect(r).toStrictEqual('asdfasdf');
        expect(p._pos).toStrictEqual(8);
    }

    {
        let p = new ParserBase('  asdfasdf');
        let itab = Iterable.product(p.noblanksP().not(), Iterable.EPSILON);
        let r = itab.getIter().next();
        expect(r).toStrictEqual([Iterable.EPSILON]);
        expect(p._pos).toStrictEqual(0);
    }

    {
        let p = new ParserBase('    ');
        let itab = Iterable.product(p.blanksP().not(), Iterable.EPSILON);
        let r = itab.getIter().next();
        expect(r).toStrictEqual(Iterable.EOF);
        expect(p._pos).toStrictEqual(0);
    }
});
