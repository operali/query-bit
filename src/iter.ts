export type option_t = null | [any]

export class Iterable {
    getIter(): Iterator {
        throw "no implement"
    }
}

export class Iterator {
    next(): option_t {
        throw "no implement"
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
