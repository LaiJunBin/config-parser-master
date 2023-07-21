import { ParserValueType } from '..'
import { CJSParser } from '../cjs-parser'
import * as t from '@babel/types'
import generate from '@babel/generator'

const parser = new CJSParser()
const exportSyntax = 'module.exports = '
describe('test cjs parser', () => {
  describe('test check', () => {
    test('test check success', () => {
      expect(parser.check(exportSyntax + ' {}')).toBeTruthy()
      expect(parser.check(exportSyntax + ' { a: 1 }')).toBeTruthy()
      expect(parser.check(exportSyntax + ' { a: { b: 1 } }')).toBeTruthy()
      expect(
        parser.check(exportSyntax + ' { a: { b: { c: 1 } } }')
      ).toBeTruthy()
    })

    test('test check fail', () => {
      expect(() => parser.check(exportSyntax + '')).toThrow()
      expect(() => parser.check(exportSyntax + ' {')).toThrow()
      expect(() => parser.check(exportSyntax + ' { a: 1')).toThrow()
      expect(() => parser.check(exportSyntax + ' 100')).toThrow()
      expect(() =>
        parser.check(exportSyntax + ' {};' + exportSyntax + ' {}')
      ).toThrow()
      expect(() => parser.check('export default {}')).toThrow()
      expect(() => parser.check('')).toThrow()
    })
  })

  describe('test get', () => {
    test('test get number', () => {
      expect(parser.get(exportSyntax + ' { a: 1 }', 'a')).toBe(1)
      expect(parser.get(exportSyntax + ' { a: { b: 1 } }', 'a.b')).toBe(1)
      expect(
        parser.get(exportSyntax + ' { a: { b: { c: 1 } } }', 'a.b.c')
      ).toBe(1)
    })

    test('test get string', () => {
      expect(parser.get(exportSyntax + ' { a: "1" }', 'a')).toBe('1')
      expect(parser.get(exportSyntax + ' { a: { b: "1" } }', 'a.b')).toBe('1')
      expect(
        parser.get(exportSyntax + ' { a: { b: { c: "1" } } }', 'a.b.c')
      ).toBe('1')
    })

    test('test get boolean', () => {
      expect(parser.get(exportSyntax + ' { a: true }', 'a')).toBe(true)
      expect(parser.get(exportSyntax + ' { a: { b: true } }', 'a.b')).toBe(true)
      expect(
        parser.get(exportSyntax + ' { a: { b: { c: true } } }', 'a.b.c')
      ).toBe(true)
    })

    test('test get array', () => {
      expect(parser.get(exportSyntax + ' { a: [1] }', 'a')).toEqual([1])
      expect(parser.get(exportSyntax + ' { a: { b: [1] } }', 'a.b')).toEqual([
        1,
      ])
      expect(
        parser.get(exportSyntax + ' { a: { b: { c: [1] } } }', 'a.b.c')
      ).toEqual([1])
    })

    test('test get object', () => {
      expect(
        parser.get(exportSyntax + ' { a: { b: { c: { d: 1 } } } }', 'a.b.c')
      ).toEqual({ d: 1 })
      expect(
        parser.get(exportSyntax + ' { a: { b: { c: { d: 1 } } } }', 'a.b')
      ).toEqual({ c: { d: 1 } })
      expect(
        parser.get(exportSyntax + ' { a: { b: { c: { d: 1 } } } }', 'a')
      ).toEqual({ b: { c: { d: 1 } } })
    })

    test('test get undefined', () => {
      expect(parser.get(exportSyntax + ' { a: 1 }', 'b')).toBeUndefined()
      expect(
        parser.get(exportSyntax + ' { a: { b: 1 } }', 'a.c')
      ).toBeUndefined()
      expect(
        parser.get(exportSyntax + ' { a: { b: { c: 1 } } }', 'a.b.d')
      ).toBeUndefined()
      expect(
        parser.get(exportSyntax + ' { a: { b: [1, 2] } }', 'a.b.c')
      ).toBeUndefined()
    })

    test('test get call expression value', () => {
      expect(
        t.isCallExpression(
          parser.get(
            exportSyntax + ' { a: require(123) }',
            'a'
          ) as unknown as t.Node
        )
      ).toBeTruthy()
    })

    test('test get call expression in object', () => {
      expect(
        t.isCallExpression(
          (
            parser.get(
              exportSyntax + ' { a: { b: require(123) } }',
              'a'
            ) as unknown as Record<string, t.Node>
          ).b
        )
      ).toBeTruthy()
    })

    test('test get array include call expression value', () => {
      const values = parser.get(exportSyntax + ' { a: [1, require(123)] }', 'a')
      expect(values).toHaveLength(2)
      expect(values[0]).toBe(1)
      expect(t.isCallExpression(values[1] as unknown as t.Node)).toBeTruthy()
    })

    test('test get object include call expression value', () => {
      const values = parser.get(
        exportSyntax + ' { a: { b: 1, c: require(123) } }',
        'a'
      ) as Record<string, unknown>

      expect(values).toEqual({ b: 1, c: expect.anything() })
      expect(t.isCallExpression(values.c as unknown as t.Node)).toBeTruthy()
    })

    test('test get object key is string', () => {
      expect(
        (
          parser.get(exportSyntax + ' { "a": { "b": 1 } }', 'a') as Record<
            string,
            unknown
          >
        ).b
      ).toBe(1)
      expect(
        (
          parser.get(
            exportSyntax + ' { "a": { "b": { "c": 1 } } }',
            'a'
          ) as Record<string, Record<string, unknown>>
        ).b.c
      ).toBe(1)
    })
  })

  describe('test put', () => {
    test('test put number', () => {
      expect(
        parser.get(parser.put(exportSyntax + ' { a: 1 }', 'a', 2), 'a')
      ).toBe(2)

      expect(
        parser.get(
          parser.put(exportSyntax + ' { a: { b: 1 } }', 'a.b', 2),
          'a.b'
        )
      ).toBe(2)

      expect(
        parser.get(
          parser.put(exportSyntax + ' { a: { b: { c: 1 } } }', 'a.b.c', 2),
          'a.b.c'
        )
      ).toBe(2)
    })

    test('test put string', () => {
      expect(
        parser.get(parser.put(exportSyntax + ' { a: "1" }', 'a', '2'), 'a')
      ).toBe('2')

      expect(
        parser.get(
          parser.put(exportSyntax + ' { a: { b: "1" } }', 'a.b', '2'),
          'a.b'
        )
      ).toBe('2')

      expect(
        parser.get(
          parser.put(exportSyntax + ' { a: { b: { c: "1" } } }', 'a.b.c', '2'),
          'a.b.c'
        )
      ).toBe('2')
    })

    test('test put boolean', () => {
      expect(
        parser.get(parser.put(exportSyntax + ' { a: true }', 'a', false), 'a')
      ).toBe(false)

      expect(
        parser.get(
          parser.put(exportSyntax + ' { a: { b: true } }', 'a.b', false),
          'a.b'
        )
      ).toBe(false)

      expect(
        parser.get(
          parser.put(
            exportSyntax + ' { a: { b: { c: true } } }',
            'a.b.c',
            false
          ),
          'a.b.c'
        )
      ).toBe(false)
    })

    test('test put array', () => {
      expect(
        parser.get(parser.put(exportSyntax + ' { a: [1] }', 'a', [2]), 'a')
      ).toEqual([2])

      expect(
        parser.get(
          parser.put(exportSyntax + ' { a: { b: [1] } }', 'a.b', [2]),
          'a.b'
        )
      ).toEqual([2])

      expect(
        parser.get(
          parser.put(exportSyntax + ' { a: { b: { c: [1] } } }', 'a.b.c', [2]),
          'a.b.c'
        )
      ).toEqual([2])
    })

    test('test put object', () => {
      expect(
        parser.get(
          parser.put(exportSyntax + ' { a: { b: { c: { d: 1 } } } }', 'a.b.c', {
            d: 2,
          }),
          'a.b.c'
        )
      ).toEqual({ d: 2 })

      expect(
        parser.get(
          parser.put(exportSyntax + ' { a: { b: { c: { d: 1 } } } }', 'a.b', {
            c: { d: 2 },
          }),
          'a.b'
        )
      ).toEqual({ c: { d: 2 } })

      expect(
        parser.get(
          parser.put(exportSyntax + ' { a: { b: { c: { d: 1 } } } }', 'a', {
            b: { c: { d: 2 } },
          }),
          'a'
        )
      ).toEqual({ b: { c: { d: 2 } } })
    })

    test('test put call expression value', () => {
      expect(
        t.isCallExpression(
          parser.get(
            parser.put(
              exportSyntax + ' { a: 1 }',
              'a',
              t.callExpression(t.identifier('require'), [
                t.stringLiteral('123'),
              ]) as unknown as ParserValueType
            ),
            'a'
          ) as unknown as t.Node
        )
      ).toBeTruthy()
    })

    test('test put array include call expression value', () => {
      const values = parser.get(
        parser.put(exportSyntax + ' { a: [1] }', 'a', [
          1,
          t.callExpression(t.identifier('require'), [
            t.stringLiteral('123'),
          ]) as unknown as ParserValueType,
          3,
        ]),
        'a'
      )
      expect(values).toHaveLength(3)
      expect(values[0]).toBe(1)
      expect(t.isCallExpression(values[1] as unknown as t.Node)).toBeTruthy()
      expect(values[2]).toBe(3)
    })

    test('test put object include call expression value', () => {
      const values = parser.get(
        parser.put(exportSyntax + ' { a: { b: 1, c: 1 } }', 'a', {
          b: 1,
          c: t.callExpression(t.identifier('require'), [
            t.stringLiteral('123'),
          ]) as unknown as ParserValueType,
        }),
        'a'
      ) as Record<string, unknown>

      expect(values).toEqual({ b: 1, c: expect.anything() })
      expect(t.isCallExpression(values.c as unknown as t.Node)).toBeTruthy()
    })

    test('test put into array', () => {
      const values = parser.get(
        parser.put(exportSyntax + ' { a: [1] }', 'a', [1, 2, 3]),
        'a'
      ) as ParserValueType[]

      expect(values).toHaveLength(3)

      values.push({
        d: 4,
      })

      const result = parser.get(
        parser.put(exportSyntax + ' { "a": { "b": [1] } }', 'a.b', values),
        'a.b'
      ) as ParserValueType[]

      expect(result).toHaveLength(4)
      expect(result[3]).toEqual({ d: 4 })
    })

    test('test put other cases', () => {
      expect(
        () =>
          parser.put(exportSyntax + ' { a: { b: [1, 2, 3] } }', 'a.b.c', 100),
        'a.b'
      ).toThrow()

      expect(
        (
          parser.get(
            parser.put(exportSyntax + ' { a: {} }', 'a.b.c', 100),
            'a.b'
          ) as Record<string, unknown>
        ).c
      ).toBe(100)

      expect(
        (
          parser.get(
            parser.put(exportSyntax + ' { a: {} }', 'a.b.c', [1, 2, 3]),
            'a.b'
          ) as Record<string, unknown>
        ).c
      ).toStrictEqual([1, 2, 3])

      expect(
        (
          parser.get(
            parser.put(exportSyntax + ' { a: {} }', 'a.b.c', { d: 123 }),
            'a.b'
          ) as Record<string, unknown>
        ).c
      ).toStrictEqual({ d: 123 })
    })

    test('test put array in object', () => {
      expect(
        parser.get(
          parser.put(exportSyntax + '{}', 'test', {
            files: ['*.svelte'],
            parser: 'svelte-eslint-parser',
            parserOptions: {
              parser: '@typescript-eslint/parser',
            },
          }),
          'test.files'
        )
      ).toStrictEqual(['*.svelte'])
    })

    test('test put object in array', () => {
      expect(
        parser.get(
          parser.put(exportSyntax + '{}', 'test', [
            {
              files: ['*.svelte'],
              parser: 'svelte-eslint-parser',
              parserOptions: {
                parser: '@typescript-eslint/parser',
              },
            },
          ]),
          'test'
        )
      ).toStrictEqual([
        {
          files: ['*.svelte'],
          parser: 'svelte-eslint-parser',
          parserOptions: {
            parser: '@typescript-eslint/parser',
          },
        },
      ])
    })

    test('test put call expression in object', () => {
      expect(
        parser.isStrictSameCallExpression(
          parser.get(
            parser.put(
              exportSyntax + '{ test: {} }',
              'test.call',
              parser.createCallExpression('testCall')
            ),
            'test.call'
          ),
          'testCall'
        )
      ).toBeTruthy()
    })
  })

  describe('test delete', () => {
    test('test delete literal', () => {
      expect(
        parser.get(parser.delete(exportSyntax + ' { a: 1 }', 'a'), 'a')
      ).toBeUndefined()

      expect(
        parser.get(
          parser.delete(exportSyntax + ' { a: { b: 1 } }', 'a.b'),
          'a.b'
        )
      ).toBeUndefined()

      expect(
        parser.get(
          parser.delete(exportSyntax + ' { a: { b: { c: 1 } } }', 'a.b.c'),
          'a.b'
        )
      ).toEqual({})

      expect(
        parser.get(
          parser.delete(exportSyntax + ' { a: { b: { c: 1 } } }', 'a.b.c'),
          'a'
        )
      ).toEqual({ b: {} })
    })

    test('test delete include call expression value', () => {
      expect(
        parser.get(
          parser.delete(
            exportSyntax + ' { a: require("123"), b: 123 }',
            'a'
          ) as unknown as string,
          'a'
        )
      ).toBeUndefined()

      expect(
        parser.get(
          parser.delete(
            exportSyntax + ' { a: require("123"), b: 123 }',
            'a'
          ) as unknown as string,
          'b'
        )
      ).toBe(123)

      expect(
        parser.get(
          parser.delete(
            exportSyntax + ' { a: { b: require("123"), c: 456}, d: 789 }',
            'a'
          ) as unknown as string,
          'd'
        )
      ).toBe(789)

      expect(
        parser.get(
          parser.delete(
            exportSyntax + ' { a: { b: require("123"), c: 456}, d: 789 }',
            'a.b'
          ) as unknown as string,
          'a.c'
        )
      ).toBe(456)

      expect(
        t.isCallExpression(
          parser.get(
            parser.delete(
              exportSyntax + ' { a: { b: require("123"), c: 456}, d: 789 }',
              'a.c'
            ) as unknown as string,
            'a.b'
          ) as unknown as t.Node
        )
      ).toBeTruthy()

      const values = parser.get(
        parser.delete(
          exportSyntax + ' { a: { b: require("123"), c: 456}, d: 789 }',
          'a.c'
        ) as unknown as string,
        'a'
      ) as Record<string, unknown>

      expect(values).toEqual({ b: expect.anything() })
      expect(t.isCallExpression(values.b as unknown as t.Node)).toBeTruthy()
    })

    test('test delete array', () => {
      expect(
        parser.get(parser.delete(exportSyntax + ' { a: [1] }', 'a'), 'a')
      ).toBeUndefined()

      expect(
        parser.get(
          parser.delete(exportSyntax + ' { a: { b: [1] } }', 'a.b'),
          'a.b'
        )
      ).toBeUndefined()

      expect(
        parser.get(
          parser.delete(exportSyntax + ' { a: { b: { c: [1] } } }', 'a.b.c'),
          'a.b'
        )
      ).toEqual({})
    })

    test('test delete other cases', () => {
      expect(
        () => parser.delete(exportSyntax + ' { a: { b: [1, 2, 3] } }', 'a.b.c'),
        'a.b'
      ).toThrow()

      expect(
        parser.get(parser.delete(exportSyntax + ' { a: {} }', 'a.b.c'), 'a')
      ).toStrictEqual({})
    })
  })

  describe('test import', () => {
    test('test import default', () => {
      expect(
        parser.import('', 'bar.js', {
          defaultKey: 'foo',
        })
      ).toBe(`import foo from "bar.js";`)
    })

    test('test import with keys', () => {
      expect(
        parser.import('', 'bar.js', {
          keys: ['foo', 'bar'],
        })
      ).toBe(`import { foo, bar } from "bar.js";`)
    })

    test('test import with keys and default', () => {
      expect(
        parser.import('', 'bar.js', {
          defaultKey: 'foo',
          keys: ['bar'],
        })
      ).toBe(`import foo, { bar } from "bar.js";`)
    })

    test('test import without keys and default', () => {
      expect(parser.import('', 'bar.js')).toBe(`import "bar.js";`)
    })
  })

  describe('test require', () => {
    test('test require default', () => {
      expect(
        parser
          .require('', 'bar.js', {
            defaultKey: 'foo',
          })
          .replace(/\s+/g, ' ')
      ).toBe(`const { foo: default } = require("bar.js");`)
    })

    test('test require with keys', () => {
      expect(
        parser
          .require('', 'bar.js', {
            keys: ['foo', 'bar'],
          })
          .replace(/\s+/g, ' ')
      ).toBe(`const { foo: foo, bar: bar } = require("bar.js");`)
    })

    test('test require with keys and default', () => {
      expect(
        parser
          .require('', 'bar.js', {
            defaultKey: 'foo',
            keys: ['bar'],
          })
          .replace(/\s+/g, ' ')
      ).toBe(`const { foo: default, bar: bar } = require("bar.js");`)
    })

    test('test require without keys and default', () => {
      expect(parser.require('', 'bar.js')).toBe(`require("bar.js");`)
    })
  })

  describe('test createCallExpression', () => {
    test('test create call expression', () => {
      expect(
        generate(parser.createCallExpression('console.log', ['hello world']))
          .code
      ).toBe(`console.log("hello world")`)
    })
    test('test args is object', () => {
      expect(
        generate(
          parser.createCallExpression('console.log', [{ a: 1 }])
        ).code.replace(/\s+/g, ' ')
      ).toBe(`console.log({ a: 1 })`)
    })

    test('test args is array', () => {
      expect(
        generate(
          parser.createCallExpression('console.log', [[1, 2, 3]])
        ).code.replace(/\s+/g, ' ')
      ).toBe(`console.log([1, 2, 3])`)
    })

    test('test args is multiple', () => {
      expect(
        generate(
          parser.createCallExpression('console.log', ['hello world', 123])
        ).code.replace(/\s+/g, ' ')
      ).toBe(`console.log("hello world", 123)`)
    })

    test('test args is empty', () => {
      expect(
        generate(parser.createCallExpression('console.log')).code.replace(
          /\s+/g,
          ' '
        )
      ).toBe(`console.log()`)
    })

    test('test args is call expression', () => {
      expect(
        generate(
          parser.createCallExpression('console.log', [
            parser.createCallExpression('console.log', ['hello world']),
          ])
        ).code.replace(/\s+/g, ' ')
      ).toBe(`console.log(console.log("hello world"))`)
    })
  })

  describe('test createCallExpression integrate', () => {
    test('test put call expression', () => {
      expect(
        parser
          .put(exportSyntax + ' { }', 'test', [
            1,
            parser.createCallExpression('console.log', ['hello world']),
            3,
          ])
          .replace(/\s+/g, ' ')
      ).toBe(exportSyntax + `{ test: [1, console.log("hello world"), 3] };`)
    })
  })

  describe('test isSameCallExpression', () => {
    test('test is same call expression', () => {
      expect(
        parser.isSameCallExpression(
          parser.createCallExpression('console.log', ['hello world']),
          'console.log'
        )
      ).toBeTruthy()
    })

    test('test is same deep call expression', () => {
      expect(
        parser.isSameCallExpression(
          parser.createCallExpression('console.log.mid.last', ['1', '2']),
          'console.log.mid.last'
        )
      ).toBeTruthy()
    })

    test('test is same call expression with call expression args', () => {
      expect(
        parser.isSameCallExpression(
          parser.createCallExpression('console.log', [
            parser.createCallExpression('console.log', ['hello world']),
          ]),
          'console.log'
        )
      ).toBeTruthy()
    })

    test('test is not same call expression', () => {
      expect(
        parser.isSameCallExpression(
          parser.createCallExpression('console.log', ['hello world']),
          'console.error'
        )
      ).toBeFalsy()
    })

    test('test is not same deep call expression', () => {
      expect(
        parser.isSameCallExpression(
          parser.createCallExpression('console.log.mid.last', ['1', '2']),
          'console.log.mid.last.error'
        )
      ).toBeFalsy()
    })

    test('test callExpression is not Expression', () => {
      expect(parser.isSameCallExpression(123, '123')).toBeFalsy()
    })
  })

  describe('test isStrictSameCallExpression', () => {
    test('test is strict same call expression', () => {
      expect(
        parser.isStrictSameCallExpression(
          parser.createCallExpression('console.log', ['hello world']),
          'console.log',
          ['hello world']
        )
      ).toBeTruthy()
    })

    test('test is strict same deep call expression', () => {
      expect(
        parser.isStrictSameCallExpression(
          parser.createCallExpression('console.log.mid.last', ['1', '2']),
          'console.log.mid.last',
          ['1', '2']
        )
      ).toBeTruthy()
    })

    test('test is strict same call expression with call expression args', () => {
      expect(
        parser.isStrictSameCallExpression(
          parser.createCallExpression('console.log', [
            parser.createCallExpression('console.log', ['hello world']),
          ]),
          'console.log',
          [parser.createCallExpression('console.log', ['hello world'])]
        )
      ).toBeTruthy()
    })

    test('test is not strict same call expression', () => {
      expect(
        parser.isStrictSameCallExpression(
          parser.createCallExpression('console.log', ['hello world']),
          'console.log',
          ['hello world', '1']
        )
      ).toBeFalsy()
    })

    test('test is not strict same deep call expression', () => {
      expect(
        parser.isStrictSameCallExpression(
          parser.createCallExpression('console.log.mid.last', ['1', '2']),
          'console.log.mid.last',
          ['1']
        )
      ).toBeFalsy()
    })

    test('test is not strict same call expression with call expression args', () => {
      expect(
        parser.isStrictSameCallExpression(
          parser.createCallExpression('console.log', [
            parser.createCallExpression('console.log', ['hello world']),
          ]),
          'console.log',
          [parser.createCallExpression('console.log', ['hello world!'])]
        )
      ).toBeFalsy()
    })

    test('test is strict same call expression with complex args', () => {
      expect(
        parser.isStrictSameCallExpression(
          parser.createCallExpression('console.log', [
            parser.createCallExpression('console.log', [
              'hello world',
              parser.createCallExpression('console.log', ['hello world!']),
            ]),
            parser.createCallExpression('console.log', ['hello world!']),
          ]),
          'console.log',
          [
            parser.createCallExpression('console.log', [
              'hello world',
              parser.createCallExpression('console.log', ['hello world!']),
            ]),
            parser.createCallExpression('console.log', ['hello world!']),
          ]
        )
      ).toBeTruthy()
    })

    test('test callExpression is not Expression', () => {
      expect(parser.isStrictSameCallExpression(123, '123')).toBeFalsy()
    })

    test('test args length is not equal', () => {
      expect(
        parser.isStrictSameCallExpression(
          parser.createCallExpression('console.log', ['hello world']),
          'console.log'
        )
      ).toBeFalsy()
    })
  })

  describe('test getCallExpressionArgs', () => {
    test('test get call expression args', () => {
      expect(
        parser.getCallExpressionArgs(
          parser.createCallExpression('console.log', ['hello world'])
        )
      ).toEqual(['hello world'])
    })

    test('test get call expression args with call expression args', () => {
      expect(
        parser.getCallExpressionArgs(
          parser.createCallExpression('console.log', [
            parser.createCallExpression('console.log', ['hello world']),
          ])
        )
      ).toEqual([parser.createCallExpression('console.log', ['hello world'])])
    })

    test('test get call expression args with complex args', () => {
      expect(
        parser.getCallExpressionArgs(
          parser.createCallExpression('console.log', [
            1,
            '2',
            parser.createCallExpression('console.log', [
              'hello world',
              parser.createCallExpression('console.log', ['hello world!']),
            ]),
            parser.createCallExpression('console.log', ['hello world!']),
          ])
        )
      ).toEqual([
        1,
        '2',
        parser.createCallExpression('console.log', [
          'hello world',
          parser.createCallExpression('console.log', ['hello world!']),
        ]),
        parser.createCallExpression('console.log', ['hello world!']),
      ])
    })

    test('test callExpression is not Expression', () => {
      expect(parser.getCallExpressionArgs(123)).toStrictEqual([])
    })
  })

  describe('test isContainCallExpression', () => {
    test('test is contain call expression without arg', () => {
      expect(
        parser.isContainCallExpression('console.log(123)', 'console.log')
      ).toBeTruthy()
    })

    test('test is contain call expression with arg success', () => {
      expect(
        parser.isContainCallExpression('console.log(123)', 'console.log', [123])
      ).toBeTruthy()
    })

    test('test is contain call expression with arg fail', () => {
      expect(
        parser.isContainCallExpression('console.log(123)', 'console.log', [456])
      ).toBeFalsy()
    })
  })
})
