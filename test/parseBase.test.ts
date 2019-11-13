import { ParserBase } from "../src/parserBase"

test('trace/retrace', () => {
    let p = new ParserBase(`
    (a 'b' 'c')`);
    p.trace();
    expect(p.stateStk.length).toBe(1);
    p.retrace();
    expect(p.stateStk.length).toBe(0);
    expect(p.idx).toBe(0);
    p.trace();
    p.retrace(24);
    expect(p.idx).toBe(24);
    expect(p.stateStk.length).toBe(0);
    p.trace();
    p.trace();
    expect(p.stateStk.length).toBe(2);
    p.retrace(24);
    expect(p.stateStk.length).toBe(1);
    p.retrace();
    expect(p.stateStk.length).toBe(0);
    let r = false;
    try {
        p.retrace();
    } catch (ex) {
        r = true;
    }
    expect(r).toBe(true);
});

test('idx2rowcol', () => {
    let p = new ParserBase(`0123
456
78
901`);

    expect(p.idx2rowcol(0)).toEqual([0, 0])
    expect(p.idx2rowcol(14)).toEqual([3, 2])
})

test('parseREMLine', () => {
    {
        let p = new ParserBase(`/a
456`);
        p.parseREMLine();
        expect(p.src[p.idx]).toStrictEqual('/');
        expect(p.stateStk.length).toStrictEqual(0);
    }
    {
        let p = new ParserBase(`a
456`);
        p.parseREMLine();
        expect(p.src[p.idx]).toStrictEqual('a');
        expect(p.stateStk.length).toStrictEqual(0);
    }
    {
        let p = new ParserBase(`//
456`);
        p.parseREMLine();
        expect(p.src[p.idx]).toBe('4');
        expect(p.stateStk.length).toStrictEqual(0);
    }
    {
        let p = new ParserBase(`////abc
456`);
        p.parseREMLine();
        expect(p.src[p.idx]).toBe('4');
        expect(p.stateStk.length).toStrictEqual(0);
    }
    {
        let p = new ParserBase(`/a`);
        let r = p.parseREMLine();
        expect(r).toStrictEqual(null);
        expect(p.src[p.idx]).toStrictEqual("/");
        expect(p.stateStk.length).toStrictEqual(0);
    }
    {
        let p = new ParserBase(`/a/a`);
        let r = p.parseREMLine();
        expect(r).toStrictEqual(null);
        expect(p.src[p.idx]).toStrictEqual("/");
        expect(p.stateStk.length).toStrictEqual(0);
    }
    {
        let p = new ParserBase(`/**a`);
        let r = p.parseREMLine();
        expect(r).toStrictEqual(null);
        expect(p.src[p.idx]).toStrictEqual("/");
        expect(p.stateStk.length).toStrictEqual(0);
    }
});

test('parseREMMulline', () => {
    {
        let p = new ParserBase(`/*abc*/`);
        p.parseREMMulline();
        expect(p.src[p.idx]).toStrictEqual(undefined);
        expect(p.stateStk.length).toStrictEqual(0);
    }
    {
        let p = new ParserBase(`/**/a`);
        p.parseREMMulline();
        expect(p.src[p.idx]).toStrictEqual('a');
        expect(p.stateStk.length).toStrictEqual(0);
    }
    {
        let p = new ParserBase(`/*abc*/a`);
        p.parseREMMulline();
        expect(p.src[p.idx]).toStrictEqual('a');
        expect(p.stateStk.length).toStrictEqual(0);
    }
    {
        let p = new ParserBase(`/*
        *
        ** / */a`);
        p.parseREMMulline();
        expect(p.src[p.idx]).toStrictEqual("a");
        expect(p.stateStk.length).toStrictEqual(0);
    }
    {
        let p = new ParserBase(`/**a*/`);
        p.parseREMMulline();
        expect(p.src[p.idx]).toStrictEqual(undefined);
        expect(p.stateStk.length).toStrictEqual(0);
    }
    {
        let p = new ParserBase(`/a`);
        let r = p.parseREMMulline();
        expect(r).toStrictEqual(null);
        expect(p.src[p.idx]).toStrictEqual("/");
        expect(p.stateStk.length).toStrictEqual(0);
    }
    {
        let p = new ParserBase(`/*a`);
        let r = p.parseREMMulline();
        expect(r).toStrictEqual(null);
        expect(p.src[p.idx]).toStrictEqual("/");
        expect(p.stateStk.length).toStrictEqual(0);
    }
    {
        let p = new ParserBase(`/**a`);
        let r = p.parseREMMulline();
        expect(r).toStrictEqual(null);
        expect(p.src[p.idx]).toStrictEqual("/");
        expect(p.stateStk.length).toStrictEqual(0);
    }
    {
        let p = new ParserBase(`/*
        *
        ** / *`);
        let r = p.parseREMMulline();
        expect(r).toStrictEqual(null);
        expect(p.src[p.idx]).toStrictEqual("/");
        expect(p.stateStk.length).toStrictEqual(0);
    }
});


test('skipBlank', () => {
    {
        let p = new ParserBase(`  1\t\r\naaa asdfasdf 1`);
        p.skipBlank();
        expect(p.idx).toBe(2);
        p.idx++;
        p.skipBlank();
        expect(p.idx).toBe(6);
        expect(p.stateStk.length).toStrictEqual(0);
    }
})

test('parseStr', () => {
    let p = new ParserBase(`  (a b c)`);
    let s = p.parseStr('(');
    expect(s).toStrictEqual('(');
    expect(p.idx).toStrictEqual(3);
    s = p.parseStr('a');
    expect(s).toStrictEqual('a');
    expect(p.idx).toStrictEqual(4);
    s = p.parseStr('a');
    expect(s).toStrictEqual(null);
    expect(p.idx).toStrictEqual(5);
    s = p.parseStr('b');
    expect(s).toStrictEqual('b');
    expect(p.idx).toStrictEqual(6);
    expect(p.stateStk.length).toStrictEqual(0);

    let p1 = new ParserBase(`  (a b c)`);
    let s1 = p.parseStr('a');
    expect(s1).toStrictEqual(null);
    expect(p1.idx).toStrictEqual(0);
    expect(p1.stateStk.length).toStrictEqual(0);
})

test('parseNumber', () => {
    let p = new ParserBase(`12345`)
    let n = p.parseNumber();
    expect(n).toStrictEqual(12345);
    expect(p.stateStk.length).toStrictEqual(0);
    let n1 = new ParserBase(` 12345 `).parseNumber();;
    expect(n1).toStrictEqual(12345);
    let n2 = new ParserBase(` -12345 `).parseNumber();;
    expect(n2).toStrictEqual(-12345);
    let n3 = new ParserBase(` -12345. `).parseNumber();;
    expect(n3).toStrictEqual(-12345);
    let n4 = new ParserBase(` -12345.123456 `).parseNumber();;
    expect(n4).toBeCloseTo(-12345.123456);
    {
        let p = new ParserBase(`x`)
        p.parseNumber();;
        expect(p.stateStk.length).toStrictEqual(0);
    }
})

test('parseQuotString', () => {
    {
        let p = new ParserBase(`'12345'`);
        let n = p.parseQuotString();
        expect(p.stateStk.length).toStrictEqual(0);
        expect(n).toStrictEqual('12345');
    }

    let n1 = new ParserBase(` 'a12345' `).parseQuotString();;
    expect(n1).toStrictEqual('a12345');
    let n2 = new ParserBase(` ' -12345 ' `).parseQuotString();;
    expect(n2).toStrictEqual(' -12345 ');
    let n3 = new ParserBase(` ' -12345. ' `).parseQuotString();;
    expect(n3).toStrictEqual(" -12345. ");
    let n4 = new ParserBase(`' -12345.123456 '`).parseQuotString();;
    expect(n4).toStrictEqual(' -12345.123456 ');

    {
        let p = new ParserBase("1")
        p.parseQuotString();;
        expect(p.stateStk.length).toStrictEqual(0);
    }
})

test('parseBoolean', () => {
    {
        let p = new ParserBase(`1`)
        let n = p.parseBoolean();
        expect(n).toStrictEqual(null);
        expect(p.stateStk.length).toStrictEqual(0);
    }
    {
        let p = new ParserBase(`true`)
        let n = p.parseBoolean();
        expect(n).toStrictEqual(true);
        expect(p.stateStk.length).toStrictEqual(0);
    }

    let p1 = new ParserBase(`false`)
    let n1 = p1.parseBoolean();
    expect(n1).toStrictEqual(false);


    let p2 = new ParserBase(` true`)
    let n2 = p2.parseBoolean();
    expect(n2).toStrictEqual(true);
    let p3 = new ParserBase(`false `)
    let n3 = p3.parseBoolean();
    expect(n3).toStrictEqual(false);


})

test('parseVarable', () => {
    {
        let p = new ParserBase(`  `)
        let v = p.parseVarable();
        expect(v).toStrictEqual(null);
        expect(p.stateStk.length).toStrictEqual(0);
    }
    {
        let p = new ParserBase(`d[]`)
        let v = p.parseVarable();
        expect(v).toStrictEqual({ type: 'var', name: 'd' });
        expect(p.stateStk.length).toStrictEqual(0);
    }
    {
        let p = new ParserBase(`\r\n\t  _`)
        let v = p.parseVarable();
        expect(v).toStrictEqual({ type: 'var', name: '_' });
    }
    {
        let p = new ParserBase(`\r\n\ta`)
        let v = p.parseVarable();
        expect(v).toStrictEqual({ type: 'var', name: 'a' });
    }
    {
        let p = new ParserBase(`1abc`)
        let v = p.parseVarable();
        expect(v).toStrictEqual(null);
    }
    {
        let p = new ParserBase(`_1abc`)
        let v = p.parseVarable();
        expect(v).toStrictEqual({ type: 'var', name: "_1abc" });
    }
    {
        let p = new ParserBase(`_1abc `)
        let v = p.parseVarable();
        expect(v).toStrictEqual({ type: 'var', name: "_1abc" });
    }
    {
        let p = new ParserBase(`_1abc% `)
        let v = p.parseVarable();
        expect(v).toStrictEqual({ type: 'var', name: '_1abc' });
    }
    {
        let p = new ParserBase(` abc `)
        let v = p.parseVarable();
        expect(v).toStrictEqual({ type: 'var', name: 'abc' });
    }
    {
        let p = new ParserBase(` abc `)
        let v = p.parseVarable();
        expect(v).toStrictEqual({ type: 'var', name: 'abc' });
    }
    {
        let p = new ParserBase("_");
        let r = p.parseVarable();
        expect(r).toStrictEqual({ type: "var", name: "_" });
        expect(p.curChar()).toStrictEqual(undefined);
    }
    {
        let p = new ParserBase("d ");
        let r = p.parseVarable();
        expect(r).toStrictEqual({ type: "var", name: "d" });
        expect(p.curChar()).toStrictEqual(' ');
    }
    {
        let p = new ParserBase("de 1");
        let r = p.parseVarable();
        expect(r).toStrictEqual({ type: "var", name: "de" });
        expect(p.curChar()).toStrictEqual(' ');
    }
    {
        let p = new ParserBase("_1(");
        let r = p.parseVarable();
        expect(r).toStrictEqual({ type: "var", name: "_1" });
        expect(p.curChar()).toStrictEqual('(');
    }
    {
        let p = new ParserBase("_1a;");
        let r = p.parseVarable();
        expect(r).toStrictEqual({ type: "var", name: "_1a" });
        expect(p.curChar()).toStrictEqual(';');
    }
    {
        let p = new ParserBase("a1_");
        let r = p.parseVarable();
        expect(r).toStrictEqual({ type: "var", name: "a1_" });
        expect(p.curChar()).toStrictEqual(undefined);
    }
    {
        let p = new ParserBase("1");
        let r = p.parseVarable();
        expect(r).toStrictEqual(null);
        expect(p.curChar()).toStrictEqual('1');
        expect(p.stateStk.length).toStrictEqual(0);
    }
})
