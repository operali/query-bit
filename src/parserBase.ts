import { Stepper, Iterable } from "./iterable";


export class ParseBase {
    _src: any = null;
    _dest: any = undefined

    input(from: any): boolean {
        this._src = from;
        return true;
    }

    getResult(): any {
        return this._dest;
    }

    process(): Stepper {
        throw "non implement";
    }

    static passesOf(...passes: ParseBase[]) {
        let idx = 0;
        let curPassStepper: Stepper = null;
        const stNewPass = 0;
        const stPassStep = 1;
        const stValue = 2;
        let state = stNewPass;
        return new class extends ParseBase {
            process(): Stepper {
                let that = this;
                that._dest = this._src;
                return new class extends Stepper {
                    step() {
                        let item: any = null;
                        if (this._async !== Stepper.SYNC) {
                            item = this._async;
                            this._async = Stepper.SYNC;
                            state = stValue;
                        }

                        while (true) {
                            switch (state) {
                                case stNewPass:
                                    if (idx === passes.length) return Iterable.EOF;
                                    let pass = passes[idx];
                                    pass.input(that._dest);
                                    curPassStepper = pass.process();
                                    state = stPassStep;
                                case stPassStep:
                                    return curPassStepper;
                                case stValue:
                                    if (item === Iterable.EOF) {
                                        let pass = passes[idx];
                                        that._dest = pass.getResult();
                                        idx++;
                                        state = stNewPass;
                                        continue;
                                    }
                                    state = stPassStep;
                                    return item;
                            }
                        }
                    }
                }
            }
        }
    }
}

const isBlank = (str: string) => {
    return str.trim() == "";
}

export class String2tokens extends ParseBase {
    _pos: number = 0;
    _src: string = "";
    process(): Stepper {
        return this.tokens().getIter() as Stepper;
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
        return Iterable.product(blanksP, noblanksP).transform(n => {
            let v = n[1];
            return v;
        }).many()
            .hook(() => start = this._pos, () => this._pos = start);
    }
}
