import { BaseConfig } from '../base-config'
import { Parser } from '../../parsers'
import fs from 'fs'

class TestParser implements Parser {
  check(content: string): boolean {
    return true
  }

  get(content: string, key: string): any {
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

beforeEach(() => {
  vi.spyOn(fs, 'readFileSync').mockReturnValue('test')
})

describe('test base config', () => {
  test('test check false', () => {
    vi.spyOn(TestParser.prototype, 'check').mockReturnValueOnce(false)
    expect(() => {
      new TestConfig('test')
    }).toThrow()
  })

  test('test content', () => {
    const config = new TestConfig('test')
    expect(config.content).toBe('test')
  })

  test('test put', () => {
    const config = new TestConfig('test')
    vi.spyOn(TestParser.prototype, 'put').mockReturnValueOnce('test1')
    expect(config.put('test', 'test')).toBe(config)
    expect(config.content).toBe('test1')
  })

  test('test delete', () => {
    const config = new TestConfig('test')
    vi.spyOn(TestParser.prototype, 'delete').mockReturnValueOnce('test1')
    expect(config.delete('test')).toBe(config)
    expect(config.content).toBe('test1')
  })

  test('test get', () => {
    const config = new TestConfig('test')
    vi.spyOn(TestParser.prototype, 'get').mockReturnValueOnce('test1')
    expect(config.get('test')).toBe('test1')
  })

  test('test get with default value', () => {
    const config = new TestConfig('test')
    vi.spyOn(TestParser.prototype, 'get').mockReturnValueOnce(undefined)
    expect(config.get('test', 'test2')).toBe('test2')
  })

  test('test save config', () => {
    const config = new TestConfig('file')
    vi.spyOn(fs, 'writeFileSync')
    config.save()
    expect(fs.writeFileSync).toBeCalledWith('file', 'test')
  })
})
