import {
  jsObjectToJSONFormat,
  removeComments,
  splitByDot,
  unwrapQuotes,
} from '../utils'

describe('test utils', () => {
  describe('test splitByDot', () => {
    test('test splitByDot best case', () => {
      expect(splitByDot('test')).toEqual(['test'])
      expect(splitByDot('test.test1')).toEqual(['test', 'test1'])
      expect(splitByDot('test.test1.test2')).toEqual(['test', 'test1', 'test2'])
      expect(splitByDot('test.test1.test2.test3')).toEqual([
        'test',
        'test1',
        'test2',
        'test3',
      ])
    })

    test('test splitByDot quote cases', () => {
      expect(splitByDot('"test"')).toEqual(['test'])
      expect(splitByDot('"test.test1"')).toEqual(['test.test1'])
      expect(splitByDot('"test.test1.test2"')).toEqual(['test.test1.test2'])
      expect(splitByDot('"test.test1.test2.test3"')).toEqual([
        'test.test1.test2.test3',
      ])

      expect(splitByDot("'test'")).toEqual(['test'])
      expect(splitByDot("'test.test1'")).toEqual(['test.test1'])
      expect(splitByDot("'test.test1.test2'")).toEqual(['test.test1.test2'])
      expect(splitByDot("'test.test1.test2.test3'")).toEqual([
        'test.test1.test2.test3',
      ])

      expect(splitByDot('test."test"')).toEqual(['test', 'test'])
      expect(splitByDot('test."test.test1"')).toEqual(['test', 'test.test1'])
      expect(splitByDot('test."test.test1.test2"')).toEqual([
        'test',
        'test.test1.test2',
      ])
      expect(splitByDot('test."test.test1"."test2.test3"')).toEqual([
        'test',
        'test.test1',
        'test2.test3',
      ])
    })

    test('test splitByDot other cases', () => {
      expect(splitByDot('')).toEqual([''])
      expect(splitByDot('test.')).toEqual(['test', ''])
      expect(splitByDot('.test')).toEqual(['', 'test'])
      expect(splitByDot('.test.')).toEqual(['', 'test', ''])
      expect(splitByDot('test..test1')).toEqual(['test', '', 'test1'])
      expect(splitByDot('test1..test2')).toEqual(['test1', '', 'test2'])
    })

    test('test splitByDot quote mix', () => {
      expect(splitByDot(`test."test.'test1'".test2`)).toEqual([
        'test',
        `test.'test1'`,
        'test2',
      ])
    })
  })

  describe('test removeComments', () => {
    test('test removeComments in single line', () => {
      expect(removeComments('test')).toBe('test')
      expect(removeComments('test//test')).toBe('test')
      expect(removeComments('test/*test*/')).toBe('test')
      expect(removeComments('test/*test*/test')).toBe('testtest')
      expect(removeComments('test/*test*/test//test')).toBe('testtest')
      expect(removeComments('test/*test*/test//test/*test*/')).toBe('testtest')
      expect(removeComments('test/*test*/test//test/*test*/test')).toBe(
        'testtest'
      )
      expect(removeComments('test/*test*/test//test/*test*/test/*test*/')).toBe(
        'testtest'
      )
      expect(
        removeComments('test/*test*/test//test/*test*/test/*test*/test')
      ).toBe('testtest')
      expect(removeComments('test/*test//test*/test')).toBe('testtest')
      expect(removeComments('test/*test//test*/test/*test//test*/test')).toBe(
        'testtesttest'
      )
      expect(
        removeComments('test/*test//test*/test/*test//test*/test/*test//test*/')
      ).toBe('testtesttest')
      expect(
        removeComments(
          'test/*test//test*/test/*test//test*/test/*test//test*/test'
        )
      ).toBe('testtesttesttest')
      expect(
        removeComments(
          'test/*test//test*/test/*test//test*/test/*test//test*/test/*test//test*/'
        )
      ).toBe('testtesttesttest')
    })

    test('test removeComments in multi line', () => {
      expect(
        removeComments(`{
            // test
            "test": "test"
      }`)
      ).toBe(`{
            "test": "test"
      }`)

      expect(
        removeComments(`{
            /* test */
            "test": "test"
      }`)
      ).toBe(`{
            "test": "test"
      }`)

      expect(
        removeComments(`{
            /* test */
            "test": "test" // test  
      }`)
      ).toBe(`{
            "test": "test"
      }`)

      expect(
        removeComments(`{
            /* test */
            "test": "test" // test
            // test
      }`)
      ).toBe(`{
            "test": "test"
      }`)

      expect(
        removeComments(`{
            /* test */
            "test": "test" // test
            // test
            /* test */
            "a": "a"
      }`)
      ).toBe(`{
            "test": "test"
            "a": "a"
      }`)

      expect(
        removeComments(`{ 
            /* test */
            "test": "test" // test
            // test
            /* test */
            "a": "a" /* test */
            "parent": {
                "test": "test" // test
                // test
                /* test */
                "a": "a"
            }
      }`)
      ).toBe(`{
            "test": "test"
            "a": "a"
            "parent": {
                "test": "test"
                "a": "a"
            }
      }`)
    })
  })

  describe('test jsObjectToJSONFormat', () => {
    test('test jsObjectToJSONFormat', () => {
      expect(jsObjectToJSONFormat({ test: 'test' })).toEqual({
        '"test"': 'test',
      })
      expect(jsObjectToJSONFormat({ test: { test: 'test' } })).toEqual({
        '"test"': {
          '"test"': 'test',
        },
      })
      expect(
        jsObjectToJSONFormat({ test: { test: { test: 'test' } } })
      ).toEqual({
        '"test"': {
          '"test"': {
            '"test"': 'test',
          },
        },
      })

      expect(
        jsObjectToJSONFormat({
          test: { test: { test: 'test' } },
          test1: { test1: { test1: 'test1' } },
          number: 1,
          boolean: true,
          null: null,
          array: [1, 2, 3],
        })
      ).toEqual({
        '"test"': {
          '"test"': {
            '"test"': 'test',
          },
        },
        '"test1"': {
          '"test1"': {
            '"test1"': 'test1',
          },
        },
        '"number"': 1,
        '"boolean"': true,
        '"null"': null,
        '"array"': [1, 2, 3],
      })
    })
  })

  describe('test unwrapQuotes', () => {
    test('test unwrapQuotes', () => {
      expect(unwrapQuotes('"test"')).toBe('test')
      expect(unwrapQuotes("'test'")).toBe('test')
      expect(unwrapQuotes('"test')).toBe('"test')
      expect(unwrapQuotes("'test")).toBe("'test")
      expect(unwrapQuotes('test"')).toBe('test"')
      expect(unwrapQuotes("test'")).toBe("test'")
      expect(unwrapQuotes('test')).toBe('test')
      expect(unwrapQuotes('')).toBe('')
    })

    test('test unwrap multi quotes', () => {
      expect(unwrapQuotes(`""test""`)).toBe('test')
      expect(unwrapQuotes(`''test''`)).toBe('test')
      expect(unwrapQuotes(`"'test'"`)).toBe('test')
      expect(unwrapQuotes(`'"test"'`)).toBe('test')
      expect(unwrapQuotes(`"""test"""`)).toBe('test')
      expect(unwrapQuotes(`'''test'''`)).toBe('test')
      expect(unwrapQuotes(`""'test'""`)).toBe('test')
      expect(unwrapQuotes(`''"test"''`)).toBe('test')
    })
  })
})
