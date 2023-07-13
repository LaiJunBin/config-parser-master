import { YamlParser } from '../yaml-parser'

const parser = new YamlParser()
const yamlContent = `
a:
  b:
    c: 1
    d: 2
  e: 3
f: 4
test.test: test
`
describe('test yaml parser', () => {
  describe('test check', () => {
    test('test check success', () => {
      expect(parser.check(yamlContent)).toBe(true)
    })

    test('test check fail', () => {
      expect(() =>
        parser.check(`
          test:
        - item1
        item2: value2
        `)
      ).toThrow()
    })
  })

  describe('test get', () => {
    test('test get success', () => {
      expect(parser.get(yamlContent, 'a.b.c')).toBe(1)
      expect(parser.get(yamlContent, 'a.b.d')).toBe(2)
      expect(parser.get(yamlContent, 'a.e')).toBe(3)
      expect(parser.get(yamlContent, 'f')).toBe(4)
    })

    test('test get . in same level', () => {
      expect(parser.get(yamlContent, 'test.test')).toBe(undefined)
      expect(parser.get(yamlContent, '"test.test"')).toBe('test')
      expect(parser.get(yamlContent, 'test.test.test')).toBe(undefined)
    })

    test('test get undefined', () => {
      expect(parser.get(yamlContent, 'a.b.c.d')).toBe(undefined)
      expect(parser.get(yamlContent, 'a.b.c.d.e')).toBe(undefined)
      expect(parser.get(yamlContent, 'a.b.c.d.e.f')).toBe(undefined)
    })
  })

  describe('test put', () => {
    test('test put success', () => {
      expect(parser.get(parser.put(yamlContent, 'a.b.c', 100), 'a.b.c')).toBe(
        100
      )
      expect(parser.get(parser.put(yamlContent, 'a.b.d', 200), 'a.b.d')).toBe(
        200
      )
      expect(parser.get(parser.put(yamlContent, 'a.e', 300), 'a.e')).toBe(300)
      expect(parser.get(parser.put(yamlContent, 'f', 400), 'f')).toBe(400)

      expect(parser.get(parser.put(yamlContent, 'd.e.f', 100), 'd.e.f')).toBe(
        100
      )
    })

    test('test put . in same level', () => {
      expect(
        parser.get(parser.put(yamlContent, '"test.test"', 'test1'), 'test.test')
      ).toBeUndefined()

      expect(
        parser.get(
          parser.put(yamlContent, '"test.test"', 'test1'),
          '"test.test"'
        )
      ).toBe('test1')
    })

    test('test put fail', () => {
      expect(() => parser.put(yamlContent, 'a.b.c.d.e.f', 300)).toThrow()
    })
  })

  describe('test delete', () => {
    test('test delete success', () => {
      expect(parser.get(parser.delete(yamlContent, 'a.b.c'), 'a.b.c')).toBe(
        undefined
      )
      expect(parser.get(parser.delete(yamlContent, 'a.b.d'), 'a.b.d')).toBe(
        undefined
      )
      expect(parser.get(parser.delete(yamlContent, 'a.e'), 'a.e')).toBe(
        undefined
      )
      expect(parser.get(parser.delete(yamlContent, 'f'), 'f')).toBe(undefined)
    })

    test('test delete deep', () => {
      expect(parser.get(parser.delete(yamlContent, 'a.b.c.d'), 'a.b.c.d')).toBe(
        undefined
      )
      expect(
        parser.get(parser.delete(yamlContent, 'a.b.c.d.e'), 'a.b.c.d.e')
      ).toBe(undefined)
      expect(
        parser.get(parser.delete(yamlContent, 'a.b.c.d.e.f'), 'a.b.c.d.e.f')
      ).toBe(undefined)
    })

    test('test delete . in same level', () => {
      expect(
        parser.get(parser.delete(yamlContent, '"test.test"'), '"test.test"')
      ).toBeUndefined()

      expect(
        parser.get(parser.delete(yamlContent, 'test.test'), '"test.test"')
      ).toBe('test')
    })
  })
})
