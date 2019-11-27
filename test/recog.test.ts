import { Iterable } from '../src/iterable';

test('maybe', () => {
    {
        let itab = Iterable.fromArray([0]).toIterable();
        let itab1 = itab.maybe();
        let it = itab1.getIter();
        expect(it.next()).toStrictEqual(0);
        expect(it.next()).toStrictEqual(Iterable.NOTHING);
        expect(it.next()).toStrictEqual(Iterable.EOF);
    }
    {
        let itab = Iterable.fromArray([0, 1]).toIterable();
        let itab1 = itab.maybe();
        let it = itab1.getIter();
        expect(it.next()).toStrictEqual(0);
        expect(it.next()).toStrictEqual(1);
        expect(it.next()).toStrictEqual(Iterable.NOTHING);
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

    reset() {
        this._pos = 0;
    }

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
            return Iterable.NOTHING;
        }).hook(() => start = this._pos, () => this._pos = start, () => this._pos = idx);
    }

    noblanksP(): Iterable {
        let start = 0;
        let idx = 0;
        return Iterable.fromFunction(() => {
            for (idx = start; idx < this._src.length; ++idx) {
                if (isBlank(this._src[idx])) {
                    break;
                }
            }
            if (idx === start) return Iterable.EOF;
            let r = this._src.substring(start, idx);
            return r;

        }).hook(() => start = this._pos, () => this._pos = start, () => this._pos = idx);
    }

    tokens(): Iterable {
        let start = 0;
        let blanksP = this.blanksP();
        let noblanksP = this.noblanksP();
        return Iterable.product(blanksP, noblanksP).transform(n => n[1]).many()
            .hook(() => start = this._pos, () => this._pos = start);
    }
}

test('parseBase1', () => {
    {
        let p = new ParserBase('asdfasdf');
        expect(p.stringP('asd').getIter().next()).toStrictEqual('asd');
        expect(p.stringP('fas').getIter().next()).toStrictEqual('fas');
        expect(p.stringP('df').getIter().next()).toStrictEqual('df');
        expect(p.stringP('df').getIter().next()).toStrictEqual(Iterable.EOF);
    }
    {
        let p = new ParserBase('asdfasdf');
        let iter = p.stringP('asd').getIter();
        expect(iter.next()).toStrictEqual('asd');
        expect(iter.next()).toStrictEqual(Iterable.EOF);
        expect(p._pos).toStrictEqual(0);
    }
    {
        let p = new ParserBase('');
        expect(p.blanksP().getIter().next()).toStrictEqual(Iterable.NOTHING);
        expect(p.blanksP().getIter().next()).toStrictEqual(Iterable.NOTHING);
        expect(p.blanksP().getIter().next()).toStrictEqual(Iterable.NOTHING);
        expect(p._pos).toStrictEqual(0);
    }
    {
        let p = new ParserBase(' ');
        expect(p.blanksP().getIter().next()).toStrictEqual(Iterable.NOTHING);
        expect(p._pos).toStrictEqual(1);
        expect(p.blanksP().getIter().next()).toStrictEqual(Iterable.NOTHING);
        expect(p.blanksP().getIter().next()).toStrictEqual(Iterable.NOTHING);
        expect(p._pos).toStrictEqual(1);
    }
});

test('parseBase2', () => {
    {
        let p = new ParserBase(' asdf asdf1');
        expect(p.blanksP().getIter().next()).toStrictEqual(Iterable.NOTHING);
        expect(p.noblanksP().getIter().next()).toStrictEqual('asdf');
        expect(p.blanksP().getIter().next()).toStrictEqual(Iterable.NOTHING);
        expect(p.noblanksP().getIter().next()).toStrictEqual('asdf1');
        expect(p.blanksP().getIter().next()).toStrictEqual(Iterable.NOTHING);
        expect(p.noblanksP().getIter().next()).toStrictEqual(Iterable.EOF);
    }
    {
        let p = new ParserBase(' asdf asdf1');
        let blanksP = p.blanksP();
        let noblanksP = p.noblanksP();
        let itab = Iterable.product(blanksP, noblanksP).transform(r => r[1]);
        expect(itab.getIter().next()).toStrictEqual('asdf');
        expect(itab.getIter().next()).toStrictEqual('asdf1');
        expect(itab.getIter().next()).toStrictEqual(Iterable.EOF);
    }
    {
        let p = new ParserBase('asdfasdf1');
        let itab = p.stringP('asdf').many();
        let it = itab.getIter();
        expect(it.next()).toStrictEqual(['asdf', 'asdf']);
        expect(it.next()).toStrictEqual(['asdf']);
        expect(it.next()).toStrictEqual([]);
        expect(it.next()).toStrictEqual(Iterable.EOF);
    }
    {
        let p = new ParserBase(' asdf asdf1');
        let toks = p.tokens();
        expect(toks.getIter().next()).toStrictEqual(['asdf', 'asdf1']);
    }
    {
        let p = new ParserBase(' asdf asdf1 fefef  asdf asdf1 fefef  asdf asdf1 fefef  asdf asdf1 fefef  asdf asdf1 fefef  asdf asdf1 fefef  asdf asdf1 fefef  asdf asdf1 fefef  asdf asdf1 fefef  asdf asdf1 fefef  asdf asdf1 fefef  asdf asdf1 fefef  asdf asdf1 fefef  asdf asdf1 fefef  asdf asdf1 fefef  asdf asdf1 fefef  asdf asdf1 fefef  asdf asdf1 fefef  asdf asdf1 fefef  asdf asdf1 fefef  asdf asdf1 fefef  asdf asdf1 fefef  asdf asdf1 fefef ');
        let toks = p.tokens();
        expect(toks.getIter().next().length).toBe(69);
    }
});


// test('not', () => {
//     {
//         let p = new ParserBase('asdfasdf');
//         let itab = p.noblanksP();
//         let r = itab.getIter().next();
//         expect(r).toStrictEqual('asdfasdf');
//         expect(p._pos).toStrictEqual(8);
//     }

//     {
//         let p = new ParserBase('  asdfasdf');
//         let itab = Iterable.product(p.noblanksP().not(), Iterable.IEPSILON);
//         let r = itab.getIter().next();
//         expect(r).toStrictEqual([Iterable.IEPSILON]);
//         expect(p._pos).toStrictEqual(0);
//     }

//     {
//         let p = new ParserBase('    ');
//         let itab = Iterable.product(p.blanksP().not(), Iterable.IEPSILON);
//         let r = itab.getIter().next();
//         expect(r).toStrictEqual(Iterable.EOF);
//         expect(p._pos).toStrictEqual(0);
//     }
// });
