import { EOF, Iterable, Iterator, option_t } from '../src/iter';

let nubmerable = class extends Iterable {
    getIter() {
        let iter = class extends Iterator {
            _cur: number
            constructor() {
                super();
                this._cur = 0;
            }

            next(): option_t {
                let r = this._cur++;
                return r;
            }
        }
        return new iter();
    }
}

test('nubmerIter', () => {
    let n = new nubmerable();
    let ni = n.getIter();
    for (let i = 0; i < 100; ++i) {
        expect(ni.next()).toEqual(i);
    }
})

let filterIter = (itab: Iterable, filter: (any) => boolean) => new class extends Iterable {
    getIter() {
        let it = itab.getIter();
        return new class extends Iterator {
            next(): option_t {
                let opr: option_t = null;
                let r: any = null;
                do {
                    opr = it.next();
                    if (opr == Iterator.EOF) return Iterator.EOF;
                    r = opr;
                } while (!filter(r))
                return r;
            }
        };
    }
}

test('filterIter', () => {
    let n = new nubmerable();
    let even = filterIter(n, v => v % 2 == 0);
    let it = even.getIter();
    for (let i = 0; i < 100; i = i + 2) {
        expect(it.next()).toEqual(i);
    }
})

test('linq func', () => {
    let n = new nubmerable();
    {
        let it = n.getIter();
        expect(it.nth(0)).toEqual(0);
    }
    {
        let n1 = n.cons(3);
        expect(n1.getIter().next()).toEqual(3);
        expect(n1.getIter().nth(0)).toEqual(3);
        expect(n1.getIter().nth(0)).toEqual(3);
        expect(n1.getIter().nth(1)).toEqual(0);
        expect(n1.getIter().nth(2)).toEqual(1);
    }
    {
        let n1 = n.uncons();
        expect(n1[0]).toEqual(0);
        expect(n1[1].getIter().nth(0)).toEqual(1);
        expect(n1[1].getIter().nth(0)).toEqual(1);
    }
    {
        let n1 = n.take(5);
        let r = n1.uncons();
        expect(r[0]).toEqual(0);
        expect(r[1].getIter().toArray()).toEqual([1, 2, 3, 4]);
    }
    {
        let n1 = n.take(0);
        let r = n1.uncons();
        expect(r).toEqual(null);
    }
    {
        let sum = n.take(5).getIter().fold(0, (a, i) => a + i);
        expect(sum).toEqual(10);
    }
    {
        let n1 = n.take(5)
        expect(n1.getIter().length()).toEqual(5);
    }
    {
        let n1 = n.map(i => i * 2);
        let it = n1.getIter();
        expect(it.next()).toEqual(0);
        expect(it.next()).toEqual(2);
        expect(it.next()).toEqual(4);
    }
    {
        let n1 = n.filter(n => n % 3 == 0)
        let it = n1.getIter();
        expect(it.next()).toEqual(0);
        expect(it.next()).toEqual(3);
        expect(it.next()).toEqual(6);
    }
    {
        let n1 = n.getIter().nth(100);
        expect(n1).toEqual(100);
    }
    {
        let n1 = n.skip(5);
        let it = n1.getIter();
        expect(it.next()).toEqual(5);
    }
    {
        let n1 = n.take(5).getIter().toArray();
        expect(n1).toEqual([0, 1, 2, 3, 4]);
    }
    {
        // sieve

    }
});


test('from', () => {
    {
        let a = Iterator.fromN(0);
        expect(a.next()).toEqual(0);
        expect(a.next()).toEqual(1);
        let b = a.clone();
        expect(a.next()).toEqual(2);
        expect(b.next()).toEqual(2);
    }
    {
        let a = Iterator.fromArray([0, 1, 2, 3, 4]);
        expect(a.next()).toEqual(0);
        expect(a.next()).toEqual(1);
        let b = a.clone();
        expect(a.next()).toEqual(2);
        expect(b.next()).toEqual(2);
    }
})

let arr = [[1, 2], [3, 4], [5, [6, [7]]]];

interface arr_t {
    [key: number]: arr_t | number
    [Symbol.iterator]();
    length: number
}

const fromArr = (arr: arr_t): Iterator => {
    return new class extends Iterator {
        cur: number = 0;
        next() {
            if (this.cur == arr.length) return EOF;
            let item = arr[this.cur++];
            if (item instanceof Array) {
                return fromArr(item);
            } else {
                return item;
            }
        }
    }
}

test('flatter', () => {
    let it = fromArr([1, 2, [3, [4, [[5], 6]]]]);
    expect(it.flatten().toArray()).toEqual([1, 2, 3, 4, 5, 6]);
});

// const fromArr = (arr:any[])=>{
//     return new class extends Iterable {
//         getIter()
//     }
// };

// test('flatter', () => {
//     Iterator
// });
