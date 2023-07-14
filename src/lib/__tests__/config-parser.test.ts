import { ConfigParser } from '../config-parser'
import fs from 'fs'
import { Parser } from '../parsers'
import { BaseConfig } from '../configs/base-config'
import { BaseJSConfig } from '../configs/base-js-config'

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

class TestConfig extends BaseConfig {
  constructor(file: string) {
    super(file, new TestParser())
  }
}

class TestJSConfig extends BaseJSConfig {
  constructor(file: string) {
    super(file, new TestParser())
  }
}

describe('test list configs', () => {
  test('init empty list', () => {
    expect(ConfigParser.listConfigs()).toEqual([])
  })

  test('register parser', () => {
    ConfigParser.register('.test', BaseConfig)
    expect(ConfigParser.listConfigs()).toEqual(['.test'])
  })
})

describe('test parse with register extension', () => {
  test('correct parser', () => {
    ConfigParser.register('.test', TestConfig)
    vi.spyOn(fs, 'existsSync').mockReturnValue(true)
    vi.spyOn(fs, 'readFileSync').mockReturnValue('test')
    expect(() => {
      ConfigParser.parse('test.test')
    }).not.toThrow()
  })

  test('incorrect parser', () => {
    ConfigParser.register('.test', TestConfig)
    vi.spyOn(fs, 'existsSync').mockReturnValue(true)
    vi.spyOn(fs, 'readFileSync').mockReturnValue('test')
    expect(() => {
      ConfigParser.parse('test.test1')
    }).toThrow()
  })

  test('file not exists', () => {
    ConfigParser.register('.test', TestConfig)
    vi.spyOn(fs, 'existsSync').mockReturnValue(false)
    vi.spyOn(fs, 'readFileSync').mockReturnValue('test')
    expect(() => {
      ConfigParser.parse('test.test')
    }).toThrow()
  })

  test(`can't parse file`, () => {
    ConfigParser.register('.test', TestConfig)
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
    ConfigParser.registerEndwith('rc', TestConfig)
    vi.spyOn(fs, 'existsSync').mockReturnValue(true)
    vi.spyOn(fs, 'readFileSync').mockReturnValue('test')
    expect(() => {
      ConfigParser.parse('testrc')
    }).not.toThrow()
  })

  test('incorrect parser', () => {
    ConfigParser.registerEndwith('rc', TestConfig)
    vi.spyOn(fs, 'existsSync').mockReturnValue(true)
    vi.spyOn(fs, 'readFileSync').mockReturnValue('test')
    expect(() => {
      ConfigParser.parse('test.test1')
    }).toThrow()
  })
})

describe('test parse instance type', () => {
  test('parse js', () => {
    ConfigParser.register('.js', TestJSConfig)
    vi.spyOn(fs, 'existsSync').mockReturnValue(true)
    vi.spyOn(fs, 'readFileSync').mockReturnValue('module.exports = { test: 1 }')
    expect(ConfigParser.parseJs('test.js')).instanceOf(BaseJSConfig)
  })

  test('parse other', () => {
    ConfigParser.register('.test', TestConfig)
    vi.spyOn(fs, 'existsSync').mockReturnValue(true)
    vi.spyOn(fs, 'readFileSync').mockReturnValue('test')
    expect(ConfigParser.parse('test.test')).instanceOf(BaseConfig)
  })

  test('parse js with parse, should return base config', () => {
    ConfigParser.register('.js', TestJSConfig)
    vi.spyOn(fs, 'existsSync').mockReturnValue(true)
    vi.spyOn(fs, 'readFileSync').mockReturnValue('module.exports = { test: 1 }')
    expect(ConfigParser.parse('test.js')).instanceOf(BaseConfig)
  })
})
