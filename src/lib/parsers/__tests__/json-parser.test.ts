import { JSONParser } from '../json-parser'

const parser = new JSONParser()
describe('test json parser', () => {
  describe('test check', () => {
    test('test check success', () => {
      expect(parser.check('{}')).toBe(true)
      expect(parser.check('{"test": "test"}')).toBe(true)
      expect(parser.check('{"test": 1}')).toBe(true)
      expect(parser.check('{"test": true}')).toBe(true)
      expect(parser.check('{"test": false}')).toBe(true)
      expect(parser.check('{"test": null}')).toBe(true)
      expect(parser.check('{"test": []}')).toBe(true)
      expect(parser.check('{"test": {}}')).toBe(true)
    })

    test('test check fail', () => {
      expect(() => parser.check('')).toThrow()
      expect(() => parser.check('test')).toThrow()
      expect(() => parser.check('{"test": "test"')).toThrow()
      expect(() => parser.check('{"test": "test",}')).toThrow()
      expect(() => parser.check('{"test": "test", "test1": "test1"')).toThrow()
      expect(() =>
        parser.check('{"test": "test", "test1": "test1",}')
      ).toThrow()
    })
  })

  describe('test get', () => {
    test('test get success', () => {
      expect(parser.get('{"test": "test"}', 'test')).toBe('test')
      expect(parser.get('{"test": 1}', 'test')).toBe(1)
      expect(parser.get('{"test": true}', 'test')).toBe(true)
      expect(parser.get('{"test": false}', 'test')).toBe(false)
      expect(parser.get('{"test": null}', 'test')).toBe(null)
      expect(parser.get('{"test": []}', 'test')).toEqual([])
      expect(parser.get('{"test": {}}', 'test')).toEqual({})
    })

    test('test get undefined', () => {
      expect(parser.get('{"test": "test"}', 'test1')).toBe(undefined)
      expect(parser.get('{"test": "test"}', 'test.test1')).toBe(undefined)
      expect(parser.get('{"test": "test"}', 'test.test1.test2')).toBe(undefined)
      expect(parser.get('{"test": "test"}', 'test.test1.test2.test3')).toBe(
        undefined
      )
    })

    test('test get deep', () => {
      expect(parser.get('{"test": {"test1": "test1"}}', 'test.test1')).toBe(
        'test1'
      )
      expect(
        parser.get(
          '{"test": {"test1": {"test2": "test2"}}}',
          'test.test1.test2'
        )
      ).toBe('test2')
      expect(
        parser.get(
          '{"test": {"test1": {"test2": {"test3": "test3"}}}}',
          'test.test1.test2.test3'
        )
      ).toBe('test3')
    })
  })

  describe('test put', () => {
    test('test put success', () => {
      expect(
        parser.get(parser.put('{"test": "test"}', 'test', 'test1'), 'test')
      ).toBe('test1')

      expect(parser.get(parser.put('{"test": 1}', 'test', 2), 'test')).toBe(2)

      expect(
        parser.get(parser.put('{"test": true}', 'test', false), 'test')
      ).toBe(false)
    })

    test('test put deep', () => {
      expect(
        parser.get(parser.put('{"test": true}', 'a.b.c', 100), 'a.b.c')
      ).toBe(100)

      expect(
        parser.get(parser.put('{"test": true, "a": {}}', 'a.b.c', 100), 'a.b')
      ).toStrictEqual({ c: 100 })

      expect(
        parser.get(parser.put('{"test": "test"}', 'test1', 'test1'), 'test1')
      ).toBe('test1')

      expect(
        (
          parser.get(
            parser.put('{"test": "test"}', 'test1.test2', 'test1'),
            'test1'
          ) as Record<string, unknown>
        ).test2
      ).toBe('test1')

      expect(
        (
          parser.get(
            parser.put('{"test": "test"}', 'test1.test2.test3', 'test1'),
            'test1'
          ) as Record<string, Record<string, unknown>>
        ).test2.test3
      ).toBe('test1')
    })

    test('test put fail', () => {
      expect(() => parser.put('{"test": "test"}', 'test.a', 100)).toThrow()
    })
  })

  describe('test delete', () => {
    test('test delete success', () => {
      expect(
        parser.get(parser.delete('{"test": "test"}', 'test'), 'test')
      ).toBe(undefined)

      expect(
        parser.get(parser.delete('{"test": 1}', 'test'), 'test')
      ).toBeUndefined()

      expect(
        parser.get(parser.delete('{"test": true}', 'test'), 'test')
      ).toBeUndefined()
    })

    test('test delete deep', () => {
      expect(
        parser.get(parser.delete('{"test": true}', 'a.b.c'), 'a.b.c')
      ).toBeUndefined()

      expect(
        parser.get(parser.delete('{"test": true, "a": {}}', 'a.b.c'), 'a')
      ).toStrictEqual({})

      expect(
        parser.get(parser.delete('{"test": "test"}', 'test1'), 'test')
      ).toBe('test')

      expect(
        parser.get(parser.delete('{"test": "test"}', 'test1.test2'), 'test1')
      ).toBeUndefined()

      expect(
        parser.get(
          parser.delete('{"test": { "a": 100, "b": 200 }}', 'test.a'),
          'test.a'
        )
      ).toBeUndefined()

      expect(
        parser.get(
          parser.delete('{"test": { "a": 100, "b": 200 }}', 'test.a'),
          'test.b'
        )
      ).toBe(200)
    })
  })
})
