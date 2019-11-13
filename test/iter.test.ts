import { Iterable, Iterator, Stepable, Stepper, option_t } from '../src/iter';

let nubmerIter = class extends Iterable {
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
    let n = new nubmerIter();
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
    let n = new nubmerIter();
    let even = filterIter(n, v => v % 2 == 0);
    let it = even.getIter();
    for (let i = 0; i < 100; i = i + 2) {
        expect(it.next()).toEqual([i]);
    }
})

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
        let tab: table_t = [3, 4, [5, 6], [7, [8]]];
        let tabStab = new tableStepable(tab);
        let tabSter = tabStab.getStep();
        let iter = tabSter.toIterator();
        for (let i = 3; i < 9; ++i) {
            expect(iter.next()).toEqual([i]);
        }
    }
});
