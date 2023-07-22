import { JSParser } from '../../parsers/js-parser'
import { JSONParser } from '../../parsers/json-parser'
import { removeComments } from '../../utils'
import { JSONConfig } from '../json-config'
import fs from 'fs'

describe('test json config', () => {
  describe('test check', () => {
    test('test check false', () => {
      vi.spyOn(fs, 'readFileSync').mockReturnValueOnce('test')
      vi.spyOn(JSParser.prototype, 'check').mockReturnValueOnce(false)
      expect(() => {
        new JSONConfig('test')
      }).toThrow()
    })

    test('test check false, but skip check', () => {
      vi.spyOn(fs, 'readFileSync').mockReturnValueOnce('test')
      expect(() => {
        new JSONConfig('test', true)
      }).not.toThrow()
    })

    test('test check true', () => {
      vi.spyOn(fs, 'readFileSync').mockReturnValueOnce('{}')
      expect(() => {
        new JSONConfig('test')
      }).not.toThrow()
    })

    test('test check true, if content include comment', () => {
      vi.spyOn(fs, 'readFileSync').mockReturnValueOnce(`{
                // test
                "test": "test"
            }`)
      expect(() => {
        new JSONConfig('test')
      }).not.toThrow()
    })

    test('test check true, if content include comment and multi line', () => {
      vi.spyOn(fs, 'readFileSync').mockReturnValueOnce(`{
                    /* test */
                    "test": "test",
                    "parent": {
                        // test
                        "test": "test"
                    }
                }`)
      expect(() => {
        new JSONConfig('test')
      }).not.toThrow()
    })

    test('test check true, if content last comma', () => {
      vi.spyOn(fs, 'readFileSync').mockReturnValueOnce(`{
        "test": "test",
      }`)
      expect(() => {
        new JSONConfig('test')
      }).not.toThrow()
    })

    test('test check true, if json last semicolon', () => {
      vi.spyOn(fs, 'readFileSync').mockReturnValueOnce(`{
            "test": "test"
        };`)
      expect(() => {
        new JSONConfig('test')
      }).not.toThrow()
    })

    test('test check true, if json last semicolon and content last comma and include comment', () => {
      vi.spyOn(fs, 'readFileSync').mockReturnValueOnce(`{
                    // test
                    "test": "test",
                };`)
      expect(() => {
        new JSONConfig('test')
      }).not.toThrow()
    })

    test('test check true, if complex json', () => {
      vi.spyOn(fs, 'readFileSync').mockReturnValueOnce(`{
                /*
                    json file
                */
                "test": "test", // test
                "parent": {
                    "test": "test",
                },
                // last comment
            };`)
      expect(() => {
        new JSONConfig('test')
      }).not.toThrow()
    })
  })

  describe('test content', () => {
    test('test content', () => {
      vi.spyOn(fs, 'readFileSync').mockReturnValueOnce('{}')
      const config = new JSONConfig('test')
      expect(config.content).toBe('{}')
    })
  })

  describe('test put', () => {
    test('test put', () => {
      vi.spyOn(fs, 'readFileSync').mockReturnValueOnce('{}')
      const config = new JSONConfig('test')
      const parser = new JSONParser()

      expect(config.put('test', 'test')).toBe(config)
      expect(config.get('test')).toBe('test')
      expect(parser.get(config.content, 'test')).toBe('test')
    })

    test('test put deep', () => {
      vi.spyOn(fs, 'readFileSync').mockReturnValueOnce('{}')
      const config = new JSONConfig('test')
      const parser = new JSONParser()

      expect(config.put('test.test1.test2', 'test')).toBe(config)
      expect(config.get('test.test1.test2')).toBe('test')
      expect(parser.get(config.content, 'test.test1.test2')).toBe('test')
    })

    test('test put but content include comment', () => {
      vi.spyOn(fs, 'readFileSync').mockReturnValueOnce(`{
            // test
            "test": "test"
        }`)
      const config = new JSONConfig('test')
      const parser = new JSONParser()

      expect(config.put('a.b.c', 'value')).toBe(config)
      expect(config.get('a.b.c')).toBe('value')
      expect(config.get('test')).toBe('test')
      expect(() => parser.check(config.content)).toThrow()
      expect(parser.get(removeComments(config.content), 'test')).toBe('test')
      expect(parser.get(removeComments(config.content), 'a.b.c')).toBe('value')
    })

    test('test put but content include comment and multi line', () => {
      vi.spyOn(fs, 'readFileSync').mockReturnValueOnce(`{
                /* test */
                "test": "test",
                "parent": {
                    // test
                    "test": "test"
                }
            }`)
      const config = new JSONConfig('test')
      const parser = new JSONParser()

      expect(config.put('a.b.c', 'value')).toBe(config)
      expect(config.get('a.b.c')).toBe('value')
      expect(config.get('test')).toBe('test')
      expect(config.get('parent.test')).toBe('test')
      expect((config.get('parent') as Record<string, string>).test).toBe('test')
      expect(() => parser.check(config.content)).toThrow()
      expect(parser.get(removeComments(config.content), 'test')).toBe('test')
      expect(parser.get(removeComments(config.content), 'a.b.c')).toBe('value')
      expect(parser.get(removeComments(config.content), 'parent.test')).toBe(
        'test'
      )
      expect(
        (
          parser.get(removeComments(config.content), 'parent') as Record<
            string,
            string
          >
        ).test
      ).toBe('test')
    })

    test('test put to same key', () => {
      vi.spyOn(fs, 'readFileSync').mockReturnValueOnce('{ "test": "test" }')
      const config = new JSONConfig('test')
      const parser = new JSONParser()

      expect(config.put('test', '100')).toBe(config)
      expect(config.get('test')).toBe('100')
      expect(parser.get(config.content, 'test')).toBe('100')
      expect(config.content).toBe('{\n  "test": "100"\n}')
    })

    test('test put object to same key', () => {
      vi.spyOn(fs, 'readFileSync').mockReturnValueOnce(
        '{ "test": { "child": {}} }'
      )
      const config = new JSONConfig('test')
      const parser = new JSONParser()

      expect(
        config.put('test.child', {
          test: 'test',
          parent: {
            test: 'test',
          },
        })
      ).toBe(config)
      expect(config.get('test.child.test')).toBe('test')
      expect(parser.get(config.content, 'test.child.test')).toBe('test')
      expect(config.content).toBe(
        '{\n  "test": {\n    "child": {\n      "test": "test",\n      "parent": {\n        "test": "test"\n      }\n    }\n  }\n}'
      )
    })

    test('test put object to same child key', () => {
      vi.spyOn(fs, 'readFileSync').mockReturnValueOnce(
        `{
            "test": {
                "a": 1,
                "b": 2,
                "c": 3
            }
        }`
      )
      const config = new JSONConfig('test')
      const parser = new JSONParser()

      expect(
        config.put('test', {
          a: 11,
          c: 33,
          d: 44,
        })
      ).toBe(config)

      expect(config.get('test.a')).toBe(11)
      expect(config.get('test.b')).toBe(2)
      expect(config.get('test.c')).toBe(33)
      expect(config.get('test.d')).toBe(44)
      expect(parser.get(config.content, 'test.a')).toBe(11)
      expect(parser.get(config.content, 'test.b')).toBe(2)
      expect(parser.get(config.content, 'test.c')).toBe(33)
      expect(parser.get(config.content, 'test.d')).toBe(44)

      expect(config.content).toBe(
        `{
  "test": {
    "a": 11,
    "b": 2,
    "c": 33,
    "d": 44
  }
}`
      )
    })

    test('test put array', () => {
      vi.spyOn(fs, 'readFileSync').mockReturnValueOnce(`{
            "test": {
                "a": 1,
                "b": 2,
                "c": 3
            }
      }`)
      const config = new JSONConfig('test')
      config.put('test.d', [1, 2, 3])
      expect(config.get('test.d')).toStrictEqual([1, 2, 3])

      config.put('array', [1, 2, 3])
      expect(config.get('array')).toStrictEqual([1, 2, 3])

      expect(config.content).toBe(
        `{
  "test": {
    "a": 1,
    "b": 2,
    "c": 3,
    "d": [1, 2, 3]
  },
  "array": [1, 2, 3]
}`
      )
    })

    test('test put quote key', () => {
      vi.spyOn(fs, 'readFileSync').mockReturnValueOnce(`{
            "test": 1
      }`)
      const config = new JSONConfig('test')
      config.put('"test"', 'test')
      expect(config.get('test')).toBe('test')
      config.put('"abc.c"', {
        a: 1,
        b: 2,
      })
      expect(config.get('"abc.c".a')).toBe(1)
      expect(config.get('"abc.c".b')).toBe(2)
      expect(config.content).toBe(
        `{
  "test": "test",
  "abc.c": {
    "a": 1,
    "b": 2
  }
}`
      )
    })
  })

  describe('test delete', () => {
    test('test delete', () => {
      vi.spyOn(fs, 'readFileSync').mockReturnValueOnce('{}')
      const config = new JSONConfig('test')
      const parser = new JSONParser()

      expect(config.put('test', 'test')).toBe(config)
      expect(config.get('test')).toBe('test')
      expect(parser.get(config.content, 'test')).toBe('test')

      expect(config.delete('test')).toBe(config)
      expect(config.get('test')).toBeUndefined()
      expect(parser.get(config.content, 'test')).toBeUndefined()
    })

    test('test delete deep', () => {
      vi.spyOn(fs, 'readFileSync').mockReturnValueOnce('{}')
      const config = new JSONConfig('test')
      const parser = new JSONParser()

      expect(config.put('test.test1.test2', 'test')).toBe(config)
      expect(config.get('test.test1.test2')).toBe('test')
      expect(parser.get(config.content, 'test.test1.test2')).toBe('test')

      expect(config.delete('test.test1.test2')).toBe(config)
      expect(config.get('test.test1.test2')).toBeUndefined()
      expect(parser.get(config.content, 'test.test1.test2')).toBeUndefined()
    })

    test('test delete but content include comment', () => {
      vi.spyOn(fs, 'readFileSync').mockReturnValueOnce(`{
                // test
                "test": "test"
            }`)
      const config = new JSONConfig('test')
      const parser = new JSONParser()

      expect(config.put('a.b.c', 'value')).toBe(config)
      expect(config.get('a.b.c')).toBe('value')
      expect(config.get('test')).toBe('test')
      expect(() => parser.check(config.content)).toThrow()
      expect(parser.get(removeComments(config.content), 'test')).toBe('test')
      expect(parser.get(removeComments(config.content), 'a.b.c')).toBe('value')

      expect(config.delete('a.b.c')).toBe(config)
      expect(config.get('a.b.c')).toBeUndefined()
      expect(
        parser.get(removeComments(config.content), 'a.b.c')
      ).toBeUndefined()
      expect(config.delete('test')).toBe(config)
      expect(config.get('test')).toBeUndefined()
      expect(parser.get(removeComments(config.content), 'test')).toBeUndefined()
      expect(() => parser.check(config.content)).toThrow()
    })

    test('test delete quote key', () => {
      vi.spyOn(fs, 'readFileSync').mockReturnValueOnce(`{
                "test": 1,
                "abc.c": {
                    "a": 1,
                    "b": 2
                }
        }`)
      const config = new JSONConfig('test')
      config.delete('"test"')
      expect(config.get('test')).toBeUndefined()
      config.delete('abc.c')
      expect(config.get('"abc.c".a')).toBe(1)
      config.delete('"abc.c"')
      expect(config.get('"abc.c"')).toBeUndefined()
      expect(config.content).toBe('{\n}')
    })
  })

  describe('test save', () => {
    test('test save', async () => {
      vi.spyOn(fs, 'readFileSync').mockReturnValueOnce('{}')
      vi.spyOn(fs, 'writeFileSync').mockReturnValueOnce(undefined)
      const config = new JSONConfig('test')
      const parser = new JSONParser()

      expect(config.put('test', 'test')).toBe(config)
      expect(config.get('test')).toBe('test')
      expect(parser.get(config.content, 'test')).toBe('test')

      await config.save()
      expect(fs.writeFileSync).toBeCalledWith('test', `{\n  "test": "test"\n}`)
    })

    test('test save but content include comment', async () => {
      vi.spyOn(fs, 'readFileSync').mockReturnValueOnce(`{
            // test
            "test": "test"
        }`)
      vi.spyOn(fs, 'writeFileSync').mockReturnValueOnce(undefined)
      const config = new JSONConfig('test')

      expect(config.put('a.b.c', 'value')).toBe(config)
      await config.save()
      expect(fs.writeFileSync).toBeCalledWith(
        'test',
        `{
  // test
  "test": "test",
  "a": {
    "b": {
      "c": "value"
    }
  }
}`
      )
    })

    test('test save but delete all content', async () => {
      vi.spyOn(fs, 'readFileSync').mockReturnValueOnce(`{
        "test": "test"
      }`)
      vi.spyOn(fs, 'writeFileSync').mockReturnValueOnce(undefined)
      const config = new JSONConfig('test')

      expect(config.delete('test')).toBe(config)
      await config.save()
      expect(fs.writeFileSync).toBeCalledWith('test', '{\n}')
    })

    test('test save but delete all content and content include comment', async () => {
      vi.spyOn(fs, 'readFileSync').mockReturnValueOnce(`{
            // leading comment
            "test": "test"
            // trailing comment
        }`)
      vi.spyOn(fs, 'writeFileSync').mockReturnValueOnce(undefined)
      const config = new JSONConfig('test')

      expect(config.delete('test')).toBe(config)
      await config.save()
      expect(fs.writeFileSync).toBeCalledWith(
        'test',
        '{\n  // leading comment\n  // trailing comment\n}'
      )
    })
  })

  describe('test complex json', () => {
    test('test complex json operation', async () => {
      vi.spyOn(fs, 'readFileSync').mockReturnValueOnce(`{
            /*
                json file
            */
            "test": "test", // test
            "parent": {
                "test": "test",
            },
            // last comment
        };`)
      vi.spyOn(fs, 'writeFileSync').mockReturnValueOnce(undefined)

      const config = new JSONConfig('test')
      const parser = new JSONParser()

      expect(config.put('a.b.c', 'value')).toBe(config)
      expect(config.get('a.b.c')).toBe('value')
      expect(config.get('test')).toBe('test')
      expect(config.get('parent.test')).toBe('test')
      expect((config.get('parent') as Record<string, string>).test).toBe('test')
      expect(() => parser.check(config.content)).toThrow()
      expect(parser.get(removeComments(config.content), 'test')).toBe('test')
      expect(parser.get(removeComments(config.content), 'a.b.c')).toBe('value')
      expect(parser.get(removeComments(config.content), 'parent.test')).toBe(
        'test'
      )
      expect(
        (
          parser.get(removeComments(config.content), 'parent') as Record<
            string,
            string
          >
        ).test
      ).toBe('test')

      expect(config.delete('a.b.c')).toBe(config)
      expect(config.get('a.b.c')).toBeUndefined()
      expect(
        parser.get(removeComments(config.content), 'a.b.c')
      ).toBeUndefined()
      expect(config.delete('test')).toBe(config)
      expect(config.get('test')).toBeUndefined()
      expect(parser.get(removeComments(config.content), 'test')).toBeUndefined()
      expect(() => parser.check(config.content)).toThrow()

      await config.save()
      expect(fs.writeFileSync).toBeCalledWith(
        'test',
        `{
  /*
      json file
  */

  // test
  "parent": {
    "test": "test"
  }
  // last comment
  ,

  "a": {
    "b": {}
  }
}`
      )
    })

    test('test put object save correct format', async () => {
      vi.spyOn(fs, 'readFileSync').mockReturnValueOnce('{}')
      vi.spyOn(fs, 'writeFileSync').mockReturnValueOnce(undefined)
      const config = new JSONConfig('test')
      const parser = new JSONParser()

      expect(
        config.put('test', {
          test: 'test',
          parent: {
            test: 'test',
          },
        })
      ).toBe(config)
      expect(config.get('test.test')).toBe('test')

      expect(() => parser.check(config.content)).not.toThrow()

      await config.save()
      expect(fs.writeFileSync).toBeCalledWith(
        'test',
        `{
  "test": {
    "test": "test",
    "parent": {
      "test": "test"
    }
  }
}`
      )
    })
  })
})
