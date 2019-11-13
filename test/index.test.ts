
import { fromString, toString, getLastError } from '../src/index'

test('fromString', () => {
    {
        let r = fromString('a');
        expect(r).toStrictEqual({ type: 'var', name: 'a' });
    }
    {
        let r = fromString('1');
        expect(r).toStrictEqual(1);
    }
    {
        let r = fromString('true');
        expect(r).toStrictEqual(true);
    }
    {
        let r = fromString(`'abc'`);
        expect(r).toStrictEqual('abc');
    }
    {
        let r = fromString(`a{} `);
        expect(r).toStrictEqual({ type: 'texp', tag: 'a', blocks: [[]] });
    }
    {
        let r = fromString(`a{} a`);
        expect(r).toStrictEqual(null);
    }
});


test('toString', () => {
    {
        let r = toString('a');
        expect(r).toStrictEqual(`'a'`);
    }
    {
        let r = toString(1);
        expect(r).toStrictEqual('1');
    }
    {
        let r = toString(true);
        expect(r).toStrictEqual('true');
    }
    {
        let r = toString({ type: 'var', name: `abc` });
        expect(r).toStrictEqual('abc');
    }
    {
        let r = toString({ type: 'texp', tag: 'a', blocks: [[]] });
        expect(r).toStrictEqual(`a ()`);
    }
    {
        let r = toString({ type: 'texp', tag: 'a', blocks: [[1, 2]] });
        expect(r).toStrictEqual(`a (
    1
    2 )`);
    }
});
