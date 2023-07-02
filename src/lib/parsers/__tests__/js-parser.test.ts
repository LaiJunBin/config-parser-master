import { ParserValueType } from '..'
import * as t from '@babel/types'
import { JSParser } from '../js-parser'

const parser = new JSParser()
const exportSyntax = 'export default '
describe('test js parser', () => {
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
      expect(() => parser.check('module.exports = {}')).toThrow()
      expect(() => parser.check('')).toThrow()
    })

    test('test check export call expression success', () => {
      expect(parser.check(`export default defineConfig({})`)).toBeTruthy()
    })

    test('test check export call expression fail', () => {
      expect(() =>
        parser.check(`export default defineConfig({}, {})`)
      ).toThrow()

      expect(() => parser.check(`export default defineConfig(123)`)).toThrow()
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

    test('test put to argument object', () => {
      expect(
        parser.get(
          parser.put(
            `export default defineConfig({
              plugins: [plugin1, plugin2],
            })`,
            'a.b.c',
            100
          ),
          'a.b.c'
        )
      ).toBe(100)
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
})
