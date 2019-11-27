import { Iterable, Iterator, Stepper } from "./iterable";

const RET = Iterable.RET;
const CONTINUE = Iterable.CONTINUE;

const NOTHING = Iterable.NOTHING;

class Recognizer extends Iterable {
    static fromIterable(it: Iterable): Recognizer {
        return new class extends Recognizer {
            getIter() {
                return it.getIter();
            }
        }
    }


}
