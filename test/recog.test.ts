import { Iterable, Iterator } from '../src/iterable';

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

    noSideEffect(it: Iterable) {
        let start = 0;
        return it.hook(() => start = this._pos, () => this._pos = start);
    }

    // until(doIt: Iterable, cond: Iterable) {
    //     let start = 0;
    //     let undoneCond = cond.hook(() => {
    //         start = this._pos;
    //     }, () => {
    //         this._pos = start;
    //     })
    // }

    oneChar() {
        let start = 0;
        return Iterable.fromPred(() => {
            if (this._pos === this._src.length) {
                return false;
            }
            this._pos++;
            return true;
        });
    }

    stringP(str: string): Iterable {
        let start = 0;
        let len = str.length;
        return Iterable.fromFunction(() => {
            if (this._src.startsWith(str, this._pos)) {
                this._pos = this._pos + len;
                return str;
            } else {
                return Iterable.EOF;
            }
        });
    };

    blanksP(): Iterable {
        let idx = 0;
        let len = this._src.length;
        return Iterable.fromFunction(() => {
            for (idx = this._pos; idx < len; ++idx) {
                if (!isBlank(this._src[idx])) {
                    this._pos = idx;
                    break;
                }
            }
            this._pos = idx;
            return Iterable.NOTHING;
        });
    }

    noblanksP(): Iterable {
        let idx = 0;
        let len = this._src.length;
        return Iterable.fromFunction(() => {
            let start = this._pos;
            for (idx = start; idx < len; ++idx) {
                if (isBlank(this._src[idx])) {
                    this._pos = idx;
                    break;
                }
            }
            if (idx === start) return Iterable.EOF;
            this._pos = idx;
            let r = this._src.substring(start, idx);
            return r;

        });
    }

    tokens(): Iterable {
        let blanksP = this.blanksP();
        let noblanksP = this.noblanksP();
        return this.noSideEffect(Iterable.product(blanksP, noblanksP).transform(n => {
            let v = n[1];
            return v;
        })).many();
    }
}

test('parseBase1', () => {
    {
        let p = new ParserBase('asdfasdf');
        expect(p.stringP('asd').getIter().next()).toStrictEqual('asd');
        expect(p._pos).toEqual(3);
        expect(p.stringP('fas').getIter().next()).toStrictEqual('fas');
        expect(p.stringP('df').getIter().next()).toStrictEqual('df');
        expect(p.stringP('df').getIter().next()).toStrictEqual(Iterable.EOF);
    }
    {
        let p = new ParserBase('asdfasdf');
        let iter = p.noSideEffect(p.stringP('asd')).getIter();
        expect(iter.next()).toStrictEqual('asd');
        expect(iter.next()).toStrictEqual(Iterable.EOF);
        expect(p._pos).toStrictEqual(0);
    }
    {
        let p = new ParserBase('');
        let blanks = p.blanksP();
        expect(blanks.getIter().next()).toStrictEqual(Iterable.NOTHING);
        expect(blanks.getIter().next()).toStrictEqual(Iterable.NOTHING);
        expect(blanks.getIter().next()).toStrictEqual(Iterable.NOTHING);
        expect(p._pos).toStrictEqual(0);
    }
    {
        let p = new ParserBase(' ');
        let blanks = p.blanksP();
        expect(blanks.getIter().next()).toStrictEqual(Iterable.NOTHING);
        expect(p._pos).toStrictEqual(1);
        expect(blanks.getIter().next()).toStrictEqual(Iterable.NOTHING);
        expect(blanks.getIter().next()).toStrictEqual(Iterable.NOTHING);
        expect(p._pos).toStrictEqual(1);
    }
});

test('parseBase2', () => {
    {
        let p = new ParserBase(' asdf asdf1');
        let blanksP = p.blanksP();
        let noblanksP = p.noblanksP();
        expect(blanksP.getIter().next()).toStrictEqual(Iterable.NOTHING);
        expect(noblanksP.getIter().next()).toStrictEqual('asdf');
        expect(blanksP.getIter().next()).toStrictEqual(Iterable.NOTHING);
        expect(noblanksP.getIter().next()).toStrictEqual('asdf1');
        expect(p._pos).toStrictEqual(11);
        expect(blanksP.getIter().next()).toStrictEqual(Iterable.NOTHING);
        expect(noblanksP.getIter().next()).toStrictEqual(Iterable.EOF);
    }
    {
        let p = new ParserBase(' asdf asdf1');
        let blanksP = p.blanksP();
        let noblanksP = p.noblanksP();
        let itab = p.noSideEffect(Iterable.product(blanksP, noblanksP).transform(r => r[1]));
        expect(itab.getIter().next()).toStrictEqual('asdf');
        expect(itab.getIter().next()).toStrictEqual('asdf1');
        expect(itab.getIter().next()).toStrictEqual(Iterable.EOF);
        expect
    }
});

test('parseBase3', () => {
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

    let strTok = ' asdf asdf1 ';
    let strToks = '';
    for (let i = 0; i < 5000; ++i) {
        strToks = strToks + strTok;
    }
    {
        let p = new ParserBase(strToks);
        let toks = p.tokens();
        expect(toks.getIter().next().length).toBe(10000);
    }
});

test('more', () => {
    {
        let strToks = 'asdfasdfasdf';
        let p = new ParserBase(strToks);
        let itemIt = p.noSideEffect(p.stringP('asdf'));
        let itemsIt = itemIt.more().getIter();

        expect(itemsIt.next()).toStrictEqual(['asdf', 'asdf', 'asdf']);
        expect(itemsIt.next()).toStrictEqual(['asdf', 'asdf']);
        expect(itemsIt.next()).toStrictEqual(['asdf']);
        expect(itemsIt.next()).toStrictEqual(Iterable.EOF);
    }
    {
        let strToks = '';
        let p = new ParserBase(strToks);
        let itemIt = p.noSideEffect(p.stringP('asdf'));
        let itemsIt = itemIt.more().getIter();
        expect(itemsIt.next()).toStrictEqual(Iterable.EOF);
        expect(p._pos).toStrictEqual(0);
    }
});

// test('separatedBy', () => {
//     {
//         let strToks = 'asdf,asdf,asdf';
//         let p = new ParserBase(strToks);
//         let strsIt = p.stringP('asdf').separatedBy(p.stringP(',')).getIter();
//         expect(strsIt.next()).toStrictEqual(['asdf', 'asdf', 'asdf']);
//     }
//     {
//         let strToks = 'asdf,asdf,asdf ,asdf';
//         let p = new ParserBase(strToks);
//         let strsIt = p.stringP('asdf').separatedBy(p.stringP(',')).getIter();
//         expect(strsIt.next()).toStrictEqual(['asdf', 'asdf', 'asdf']);
//     }
//     {
//         let strToks = 'asdf,asdf,asdf,';
//         let p = new ParserBase(strToks);
//         let strsIt = p.stringP('asdf').separatedBy(p.stringP(',')).getIter();
//         expect(strsIt.next()).toStrictEqual(['asdf', 'asdf', 'asdf']);
//     }
//     {
//         let strToks = 'asdf,asdf,asdf, asdf';
//         let p = new ParserBase(strToks);
//         let strsIt = p.stringP('asdf').separatedBy(p.stringP(',')).getIter();
//         expect(strsIt.next()).toStrictEqual(['asdf', 'asdf', 'asdf']);
//     }
// });

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
//         let itab = Iterable.product(p.noblanksP().not(), Iterable.INOTHING);
//         let r = itab.getIter().next();
//         expect(r).toStrictEqual([Iterable.NOTHING]);
//         expect(p._pos).toStrictEqual(0);
//     }
//     {
//         let p = new ParserBase('    ');
//         let itab = Iterable.product(p.blanksP().not(), Iterable.INOTHING);
//         let r = itab.getIter().next();
//         expect(r).toStrictEqual(Iterable.EOF);
//         expect(p._pos).toStrictEqual(4);
//     }
// });

// test('until', () => {
//     {
//         let p = new ParserBase('    asdf');
//         p.oneChar().getIter().next();
//         expect(p._pos).toStrictEqual(1);
//     }
//     {
//         let p = new ParserBase('    asdf');
//         let itab = p.oneChar().till(p.stringP('asdf'));
//         itab.getIter().next();
//         expect(p._pos).toStrictEqual(8);
//     }

//     {
//         let p = new ParserBase('asdf');
//         let itab = p.oneChar().till(p.stringP('asdf'));
//         itab.getIter().next();
//         expect(p._pos).toStrictEqual(4);
//     }

//     {
//         let p = new ParserBase('asdfasdf  ');
//         let start = 0;
//         let itab = p.stringP('asdf').till(p.noblanksP().transform(
//             () => {

//             }
//         ));
//         itab.getIter().next();
//         expect(p._pos).toStrictEqual(9);
//     }
// });
