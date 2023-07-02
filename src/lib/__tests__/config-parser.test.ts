import { ConfigParser } from '../config-parser'
import fs from 'fs'
import { Parser } from '../parsers'

class TestParser implements Parser {
  check(content: string): boolean {
    return true
  }

  get(content: string, key: string, defaultValue?: any): any {
    return null
  }

  put(content: string, key: string, value: any): string {
    return ''
  }

  delete(content: string, key: string): string {
    return ''
  }
}

describe('test list parsers', () => {
  test('init empty list', () => {
    expect(ConfigParser.listParsers()).toEqual([])
  })

  test('register parser', () => {
    ConfigParser.register('.test', class {})
    expect(ConfigParser.listParsers()).toEqual(['.test'])
  })
})

describe('test parse with register extension', () => {
  test('correct parser', () => {
    ConfigParser.register('.test', TestParser)
    vi.spyOn(fs, 'existsSync').mockReturnValue(true)
    vi.spyOn(fs, 'readFileSync').mockReturnValue('test')
    expect(() => {
      ConfigParser.parse('test.test')
    }).not.toThrow()
  })

  test('incorrect parser', () => {
    ConfigParser.register('.test', TestParser)
    vi.spyOn(fs, 'existsSync').mockReturnValue(true)
    vi.spyOn(fs, 'readFileSync').mockReturnValue('test')
    expect(() => {
      ConfigParser.parse('test.test1')
    }).toThrow()
  })

  test('file not exists', () => {
    ConfigParser.register('.test', TestParser)
    vi.spyOn(fs, 'existsSync').mockReturnValue(false)
    vi.spyOn(fs, 'readFileSync').mockReturnValue('test')
    expect(() => {
      ConfigParser.parse('test.test')
    }).toThrow()
  })

  test(`can't parse file`, () => {
    ConfigParser.register('.test', TestParser)
    vi.spyOn(fs, 'existsSync').mockReturnValue(true)
    vi.spyOn(fs, 'readFileSync').mockReturnValue('test')
    vi.spyOn(TestParser.prototype, 'check').mockReturnValueOnce(false)
    expect(() => {
      ConfigParser.parse('test.test')
    }).toThrow()
  })
})

describe('test parse with register endwith', () => {
  test('correct parser', () => {
    ConfigParser.registerEndwith('rc', TestParser)
    vi.spyOn(fs, 'existsSync').mockReturnValue(true)
    vi.spyOn(fs, 'readFileSync').mockReturnValue('test')
    expect(() => {
      ConfigParser.parse('testrc')
    }).not.toThrow()
  })

  test('incorrect parser', () => {
    ConfigParser.registerEndwith('rc', TestParser)
    vi.spyOn(fs, 'existsSync').mockReturnValue(true)
    vi.spyOn(fs, 'readFileSync').mockReturnValue('test')
    expect(() => {
      ConfigParser.parse('test.test1')
    }).toThrow()
  })
})
