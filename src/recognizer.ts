import { Iterable, Iterator, Stepper } from "./iterable";



class Recognizer extends Iterable {
    static fromIterable(it: Iterable): Recognizer {
        return new class extends Recognizer {
            getIter() {
                return it.getIter();
            }
        }
    }


}
