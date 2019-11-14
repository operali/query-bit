import { Iterable, Iterator, Stepable, Stepper, option_t } from '../src/iter';

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
                return [r];
            }
        }
        return new iter();
    }
}

test('nubmerIter', () => {
    let n = new nubmerable();
    let ni = n.getIter();
    for (let i = 0; i < 100; ++i) {
        expect(ni.next()).toEqual([i]);
    }
})

let filterIter = (itab: Iterable, filter: (any) => boolean) => new class extends Iterable {
    getIter() {
        let it = itab.getIter();
        const iter = class extends Iterator {
            next(): option_t {
                let opr: option_t = null;
                let r: any = null;
                do {
                    opr = it.next();
                    if (opr == null) return null;
                    r = opr[0];
                } while (!filter(r))
                return [r];
            }
        }
        return new iter();
    }
}

test('filterIter', () => {
    let n = new nubmerable();
    let even = filterIter(n, v => v % 2 == 0);
    let it = even.getIter();
    for (let i = 0; i < 100; i = i + 2) {
        expect(it.next()).toEqual([i]);
    }
})

test('linq func', () => {
    let n = new nubmerable();
    {
        let it = n.getIter();
        expect(it.nth(0)).toEqual([0]);
    }
    {
        let n1 = n.cons(3);
        expect(n1.getIter().next()).toEqual([3]);
        expect(n1.getIter().nth(0)).toEqual([3]);
        expect(n1.nth(0)).toEqual([3]);
        expect(n1.nth(1)).toEqual([0]);
        expect(n1.nth(2)).toEqual([1]);
    }
    {
        let n1 = n.uncons();
        expect(n1[0]).toEqual(0);
        expect(n1[1].nth(0)).toEqual([1]);
        expect(n1[1].nth(0)).toEqual([1]);
    }
    {
        let n1 = n.take(5);
        let r = n1.uncons();
        expect(r[0]).toEqual(0);
        expect(r[1].toArray()).toEqual([1, 2, 3, 4]);
    }
    {
        let n1 = n.take(0);
        let r = n1.uncons();
        expect(r).toEqual(null);
    }
    {
        let sum = n.take(5).fold(0, (a, i) => a + i);
        expect(sum).toEqual(10);
    }
    {
        let n1 = n.take(5)
        expect(n1.length()).toEqual(5);
    }
    {
        let n1 = n.map(i => i * 2);
        let it = n1.getIter();
        expect(it.next()).toEqual([0]);
        expect(it.next()).toEqual([2]);
        expect(it.next()).toEqual([4]);
    }
    {
        let n1 = n.filter(n => n % 3 == 0)
        let it = n1.getIter();
        expect(it.next()).toEqual([0]);
        expect(it.next()).toEqual([3]);
        expect(it.next()).toEqual([6]);
    }
    {
        let n1 = n.nth(100);
        expect(n1).toEqual([100]);
    }
    {
        let n1 = n.skip(5);
        let it = n1.getIter();
        expect(it.next()).toEqual([5]);
    }
    {
        let n1 = n.take(5).toArray();
        expect(n1).toEqual([0, 1, 2, 3, 4]);
    }
    {
        // sieve

    }
});

interface table_t {
    [idx: number]: (table_t | number)
}

class tableStepable extends Stepable {
    _tab: table_t
    constructor(tab: table_t) {
        super();
        this._tab = tab;
    }
    getStep() {
        return new tableStepper(this._tab);
    }
}

class tableStepper extends Stepper {
    _tab: table_t
    _idx: number
    constructor(tab: table_t) {
        super();
        this._tab = tab;
        this._idx = 0;
    }
    stepIn(): Stepable | option_t {
        let item = this._tab[this._idx++];
        if (typeof item == 'number') {
            return [item]
        } else if (item == undefined) {
            return null;
        } else {
            return new tableStepable(item);
        }
    }
}

test('tableIter', () => {
    {
        let tab: table_t = [3, 4, [5, 6], [7, [8, [9, 10, 11]]]];
        let tabStab = new tableStepable(tab);
        let tabSter = tabStab.getStep();
        let iter = tabSter.toIterator();
        for (let i = 3; i < 12; ++i) {
            expect(iter.next()).toEqual([i]);
        }
    }
});


test('fromEnum', () => {
    {
        let tab: option_t[] = [[1], [2], [3], [4]];
        let st = Stepper.fromEnum(tab);
        let it = st.toIterable().getIter();
        expect(it.toArray()).toEqual([[0, 1], [1, 2], [2, 3], [3, 4]]);
    }

    {
        let itab = new class extends Iterable {
            getIter() {
                return Iterator.fromN(3);
            }
        }
        let tab: Iterable[] = [itab];
        let st = Stepper.fromEnum(tab);
        let it = st.toIterable().getIter();
        expect(it.take(3).toArray()).toEqual([[0, 3], [0, 4], [0, 5]]);
    }
});
