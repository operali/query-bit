import util from 'util'
import {
    TExpParser
} from "../src/TExpParser"



test('skipBlank', () => {
    {
        let p = new TExpParser(`  /a`);
        p.skipBlank();
        expect(p.curChar()).toStrictEqual('/');
    }
    {
        let p = new TExpParser(`  /*a`);
        p.skipBlank();
        expect(p.curChar()).toStrictEqual('/');
    }
    {
        let p = new TExpParser(`  /**a`);
        p.skipBlank();
        expect(p.curChar()).toStrictEqual('/');
    }
    {
        let p = new TExpParser(`  /*a*a`);
        p.skipBlank();
        expect(p.curChar()).toStrictEqual('/');
    }
    {
        let p = new TExpParser(`  /*a*/a`);
        p.skipBlank();
        expect(p.curChar()).toStrictEqual('a');
    }
    {
        let p = new TExpParser(`  /**/ a`);
        p.skipBlank();
        expect(p.src[p.idx]).toStrictEqual('a');
    }
    {
        let p = new TExpParser(`  /**///abcd
e`);
        p.skipBlank();
        expect(p.src[p.idx]).toStrictEqual('e');
    }
    {
        let p = new TExpParser(`  /**/a//abcd
e`);
        p.skipBlank();
        expect(p.src[p.idx]).toStrictEqual('a');
    }
    {
        let p = new TExpParser(`  /a
e`);
        p.skipBlank();
        expect(p.curChar()).toStrictEqual('/');
    }
})


test('parseBlock', () => {
    let p = new TExpParser("{d}");
    let r = p.parseBlock();
    expect(r).toStrictEqual([{ type: "var", name: "d" }]);
    expect(p.stateStk.length).toStrictEqual(0);
})

test('parseBlock', () => {
    let p = new TExpParser("{d e}");
    let r = p.parseBlock();
    expect(r).toStrictEqual([{ type: "var", name: "d" }, { type: "var", name: "e" }]);
    expect(p.stateStk.length).toStrictEqual(0);
})

test('parseBlock', () => {
    let p = new TExpParser("{d;e}");
    let r = p.parseBlock();
    expect(r).toStrictEqual([{ type: "var", name: "d" }, { type: "var", name: "e" }]);
    expect(p.stateStk.length).toStrictEqual(0);
})

test('parseAssign', () => {
    {
        let p = new TExpParser("b = 1");
        let r = p.parseAssign();
        expect(r).toStrictEqual({ type: 'assign', variable: 'b', exp: 1 })
    }
    {
        let p = new TExpParser("a = b{d[];e,'a',t(3, 5)}");
        let r = p.parseAssign();
        expect(r).toStrictEqual({
            type: 'assign',
            variable: 'a',
            exp: {
                type: 'texp',
                tag: 'b',
                blocks: [
                    [{
                        type: 'texp',
                        tag: 'd',
                        blocks: [
                            []
                        ]
                    }, { type: 'var', name: 'e' }, 'a', { type: 'texp', tag: 't', blocks: [[3, 5]] }]
                ]
            }
        })
        expect(p.stateStk.length).toStrictEqual(0);
    }
})

test.only('parseExp', () => {
    {
        let p = new TExpParser('a {b c}');
        let r = p.parse();
        expect(r).toStrictEqual({
            type: 'texp',
            tag: 'a',
            blocks: [
                [{
                    type: 'var',
                    name: 'b'
                }, {
                    type: 'var',
                    name: 'c'
                }]
            ]
        });
        expect(p.stateStk.length).toStrictEqual(0);
    }
    {
        let p = new TExpParser('a {b,c,d}');
        let r = p.parse();
        expect(r).toStrictEqual({
            type: 'texp',
            tag: 'a',
            blocks: [
                [{
                    type: 'var',
                    name: 'b'
                }, {
                    type: 'var',
                    name: 'c'
                }, {
                    type: 'var',
                    name: 'd'
                }]
            ]
        });
        expect(p.stateStk.length).toStrictEqual(0);
    }
    {
        let p = new TExpParser('a {b=1}');
        let r = p.parse();
        expect(r).toStrictEqual({
            type: 'texp',
            tag: 'a',
            blocks: [
                [{
                    type: 'assign',
                    exp: 1,
                    variable: 'b'
                }]
            ]
        });
        expect(p.stateStk.length).toStrictEqual(0);
    }
    {
        let p = new TExpParser('a {d[]}');
        let r = p.parse();
        expect(r).toStrictEqual({
            type: 'texp',
            tag: 'a',
            blocks: [
                [{
                    type: 'texp',
                    tag: 'd',
                    blocks: [
                        []
                    ]
                }]
            ]
        });
        expect(p.stateStk.length).toStrictEqual(0);
    }
})
