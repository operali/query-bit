import { Iterable, Iterator, option_t, Stepable, Stepper } from '../iter'

export const gen = (first: any, next: (pre: any) => option_t): Iterator => {
  let cur = first;
  return new class extends Iterator {
    next() {
      let r = cur;
      cur = next(cur);
      return r;
    }
  }
}

export const fromN = (n: number): Iterator => {
  let cur = n;
  return new class extends Iterator {
    next(): [any] {
      let r = cur++;
      return [r];
    }
  }
}

/**
 * @param iters 
 * (a, b) to ((0, a1)...(0, an)...(1, b1)...(1, bn));
 */
export const orGen = (...iters: Iterable[]): Iterable => {
  let i = 0;
  let curIter: Iterator = null;
  let tree = new class extends Stepper {
    stepIn(): Stepable | option_t {
      if (curIter != null) {
        let opr = curIter.next();
        if (opr == null) return null;
        let j = i;
        return [[j, opr[0]]];
      }
      let iterab = iters[i++];
      if (iterab instanceof Stepable) {
        curIter = null;
        let j = i;
        return iterab.map(n => [[j, n]]);
      } else {
        curIter = 
      }
    }
  }
}

/**
 * 
 * @param iters 
 * (a, b) to ([a1, b1], [a1, b2], [a1, b3]...[a2, b1]...[an, bn]...)
 */
export const andGen = (...iters: Iterable[]): Iterable => {

}
