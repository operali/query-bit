import { Iterable } from '../src/iterable';


test('maybe', ()=>{
    let itab = Iterable.fromArray([0]).toIterable();
    let itab1 = itab.maybe();
    let it = itab1.getIter();
    expect(it.next()).toStrictEqual(0);
    expect(it.next()).toStrictEqual(Iterable.NOTHING);
})


test('repeat', ()=>{
    {
        let itab = Iterable.fromArray([1]).toIterable();
        let itab1 = itab.repeat(1);
        let it = itab1.getIter();
        expect(it.next()).toStrictEqual([1]);
        expect(it.next()).toStrictEqual(Iterable.RET);
    }
    {
        let itab = Iterable.fromArray([1]).toIterable();
        let itab1 = itab.repeat(3);
        let it = itab1.getIter();
        expect(it.next()).toStrictEqual([1, 1, 1]);
        expect(it.next()).toStrictEqual(Iterable.RET);
    }
    {
        let itab = Iterable.fromArray([1,2]).toIterable();
        let itab1 = itab.repeat(3);
        let it = itab1.getIter();
        expect(it.next()).toStrictEqual([1, 1, 1]);
        expect(it.next()).toStrictEqual([1, 1, 2]);
        expect(it.next()).toStrictEqual([1, 2, 1]);
        expect(it.next()).toStrictEqual([1, 2, 2]);
        expect(it.next()).toStrictEqual([2, 1, 1]);
        expect(it.next()).toStrictEqual([2, 1, 2]);
        expect(it.next()).toStrictEqual([2, 2, 1]);
        expect(it.next()).toStrictEqual([2, 2, 2]);
        expect(it.next()).toStrictEqual(Iterable.RET);
    }
});
