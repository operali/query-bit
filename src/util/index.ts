import { Iterable, Iterator, Stepable, Stepper } from '../iter'


/**
 * @param iters 
 * (a, b) to ((0, a1)...(0, an)...(1, b1)...(1, bn));
 */
export const orGen = (...iters: Iterable[]): Iterable => {
  Iterator.fromArray(iters);
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
