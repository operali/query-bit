# gml-parser
a parser for Groovy DSL like Marked Language

# What is GML
GML stand for 'Grovvy DSL like markup language', it has a form like any other markup language, like XML, 
but is more general and expressive.

a sample below

```grovvy
// a DSL of HTML, by GML grammar
html {
  head { title='a script of GML' }
  body {
    div {
      id="root"
    };
    script {
      type="text/GML"
      content = GScript {
        assign(document[querySelector]('root')[content], 'hello world')
      }
    }
  }
}
```

# usage
```js
import {fromString} from 'gml-parser'

let p = fromString('a(b, c) {d=0}');
expect(p).toEqual({type:'texp', 
  tag:'a', 
  blocks:[[
    {type:'var', name:'b'}, 
    {type:'var', name:'c'}], 
    [{type:'assign', variable:'d', exp:0}]]})

```
