import { Iterable, Iterator } from '../src/iterable';

let nubmerable = class extends Iterable {
    getIter() {
        let iter = class extends Iterator {
            _cur: number
            constructor() {
                super();
                this._cur = 0;
            }

            next(): any {
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
            next(): any {
                let opr: any = null;
                let r: any = null;
                do {
                    opr = it.next();
                    if (opr == Iterable.RET) return Iterable.RET;
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
        let from0 = Iterable.fromN(0);
        expect(from0.next()).toEqual(0);
        expect(from0.next()).toEqual(1);
        let from2 = from0.clone();
        expect(from0.next()).toEqual(2);
        expect(from2.next()).toEqual(2);
    }
    {
        let a = Iterable.fromRange(0, 10, 3).toArray();
        expect(a).toEqual([0, 3, 6, 9]);
    }
    {
        let a = Iterable.fromArray([0, 1, 2, 3, 4]);
        expect(a.next()).toEqual(0);
        expect(a.next()).toEqual(1);
        let b = a.clone();
        expect(a.next()).toEqual(2);
        expect(b.next()).toEqual(2);
        expect(b.next()).toEqual(3);
        expect(b.next()).toEqual(4);
        expect(b.next()).toEqual(Iterable.RET);
    }
    {
        let a = Iterable.fromGenerator(0, pre => pre + 1).take(5).getIter().toArray();
        expect(a).toEqual([0, 1, 2, 3, 4]);
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
            if (this.cur == arr.length) return Iterable.RET;
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


test('sum', () => {
    let itab1 = Iterable.fromArray([1, 2]).toIterable();
    let itab2 = Iterable.fromArray([4, 5]).toIterable();

    let itab3 = Iterable.sum(itab1, itab2)
    let it1 = itab3.getIter();
    expect(it1.next()).toEqual([0, 1]);
    expect(it1.next()).toEqual([0, 2]);
    expect(it1.next()).toEqual([1, 4]);
    expect(it1.next()).toEqual([1, 5]);
    expect(it1.next()).toEqual(Iterable.RET);

    let itab4 = Iterable.sum(itab3, itab3);
    let it4 = itab4.getIter();

    expect(it4.next()).toEqual([0, [0, 1]]);
    expect(it4.next()).toEqual([0, [0, 2]]);
    expect(it4.next()).toEqual([0, [1, 4]]);
    expect(it4.next()).toEqual([0, [1, 5]]);
    expect(it4.next()).toEqual([1, [0, 1]]);
    expect(it4.next()).toEqual([1, [0, 2]]);
    expect(it4.next()).toEqual([1, [1, 4]]);
    expect(it4.next()).toEqual([1, [1, 5]]);
    expect(it4.next()).toEqual(Iterable.RET);
    // expect(sum(it1, it2).getIter().toArray()).toEqual([[0, 1], [0, 2], [1, 4], [1, 5]]);
})

test('product', () => {
    let itab1 = Iterable.fromArray([1, 2]).toIterable();
    let itab2 = Iterable.fromArray([4, 5]).toIterable();
    let itab3 = Iterable.product(itab1, itab2);
    expect(itab3.getIter().toArray()).toEqual([[1, 4], [1, 5], [2, 4], [2, 5]]);


    {
        let itb4 = Iterable.product(itab3, itab1);
        let it = itb4.getIter();
        expect(it.next()).toEqual([[1, 4], 1]);
        expect(it.next()).toEqual([[1, 4], 2]);
        expect(it.next()).toEqual([[1, 5], 1]);
        expect(it.next()).toEqual([[1, 5], 2]);
        expect(it.next()).toEqual([[2, 4], 1]);
        expect(it.next()).toEqual([[2, 4], 2]);
        expect(it.next()).toEqual([[2, 5], 1]);
        expect(it.next()).toEqual([[2, 5], 2]);
        expect(it.next()).toEqual(Iterable.RET);
    }

    {
        let itb4 = Iterable.product(itab3, itab3);
        let it = itb4.getIter();
        expect(it.next()).toEqual([[1, 4], [1, 4]]);
        expect(it.next()).toEqual([[1, 4], [1, 5]]);
        expect(it.next()).toEqual([[1, 4], [2, 4]]);
        expect(it.next()).toEqual([[1, 4], [2, 5]]);

        expect(it.next()).toEqual([[1, 5], [1, 4]]);
        expect(it.next()).toEqual([[1, 5], [1, 5]]);
        expect(it.next()).toEqual([[1, 5], [2, 4]]);
        expect(it.next()).toEqual([[1, 5], [2, 5]]);

        expect(it.next()).toEqual([[2, 4], [1, 4]]);
        expect(it.next()).toEqual([[2, 4], [1, 5]]);
        expect(it.next()).toEqual([[2, 4], [2, 4]]);
        expect(it.next()).toEqual([[2, 4], [2, 5]]);

        expect(it.next()).toEqual([[2, 5], [1, 4]]);
        expect(it.next()).toEqual([[2, 5], [1, 5]]);
        expect(it.next()).toEqual([[2, 5], [2, 4]]);
        expect(it.next()).toEqual([[2, 5], [2, 5]]);

        expect(it.next()).toEqual(Iterable.RET);
    }
});

test('action', () => {
    {
        let count = 0;
        let action = Iterable.fromAction(() => count++);
        let from3 = Iterable.fromN(3).toIterable();
        expect(Iterable.product(from3, action).take(3).getIter().toArray()).toEqual([[3], [4], [5]]);
        expect(count).toBe(3);
    }
})
test('action1', () => {

    {
        let count = 0;
        let action = Iterable.fromAction(() => count++);
        let from3 = Iterable.fromN(3).toIterable();
        expect(Iterable.product(action, from3).take(3).getIter().toArray()).toEqual([[3], [4], [5]]);
        expect(count).toBe(1);
    }
})

test('action2', () => {
    // context 参数
    {
        let vals = [];
        let action = Iterable.fromAction((ctx) => vals.push(ctx));
        let from3 = Iterable.fromN(3).toIterable();
        expect(Iterable.product(action, from3).take(3).getIter().toArray()).toEqual([[3], [4], [5]]);
        expect(vals).toStrictEqual([[]]);
    }
    {
        let vals = [];
        let action = Iterable.fromAction((ctx) => vals.push(ctx));
        let from3 = Iterable.fromN(3).toIterable();
        expect(Iterable.product(from3, action).take(3).getIter().toArray()).toEqual([[3], [4], [5]]);
        expect(vals).toStrictEqual([[3], [4], [5]]);
    }
    {
        let vals = [];
        let action = Iterable.fromAction((ctx) => vals.push(ctx));
        let from3 = Iterable.fromN(3).toIterable();
        expect(Iterable.product(from3.take(2), from3.take(2), action).take(3).getIter().toArray()).toEqual([[3, 3], [3, 4], [4, 3]]);
        expect(vals).toStrictEqual([[3, 3], [3, 4], [4, 3]]);
    }
    {
        let vals = [];
        let action = Iterable.fromAction((ctx) => vals.push(ctx));
        let from3 = Iterable.fromN(3).toIterable();
        expect(Iterable.product(from3.take(2), action, from3.take(2)).take(3).getIter().toArray()).toEqual([[3, 3], [3, 4], [4, 3]]);
        expect(vals).toStrictEqual([[3], [4]]);
    }
});

test('action3', () => {
    // context 参数
    {
        let vals = [];
        let action = Iterable.fromAction((ctx) => vals.push(ctx));
        let from3 = Iterable.fromN(3).toIterable();
        expect(Iterable.sum(from3.take(3), action).take(6).getIter().toArray()).toEqual([[0, 3], [0, 4], [0, 5]]);
        expect(vals).toStrictEqual([1]);
    }
});

test('cut', () => {
    {
        let action = Iterable.fromAction(() => console.log('hello'));
        let from3 = Iterable.fromN(3).toIterable();
        expect(Iterable.product(from3, action, Iterable.CUT).take(3).getIter().toArray()).toEqual([[3]]);
    }
})

test('fromPred', () => {
    {
        let i = 0;
        let vals = [];
        let lessThan3 = Iterable.fromPred((ctx) => {
            vals.push(ctx);
            if (i++ < 3) {
                return true;
            }
            return false;
        });

        let from3 = Iterable.fromN(3).toIterable();
        expect(Iterable.product(from3, lessThan3).getIter().take(3).toArray()).toEqual([[3], [4], [5]]);
        expect(vals).toEqual([[3], [4], [5]]);
    }
})
