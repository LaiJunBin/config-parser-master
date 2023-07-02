import { Config } from '../config'
import { Parser } from '../parsers'
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

beforeEach(() => {
  vi.spyOn(fs, 'readFileSync').mockReturnValue('test')
})

describe('test config', () => {
  test('test check false', () => {
    vi.spyOn(TestParser.prototype, 'check').mockReturnValueOnce(false)
    expect(() => {
      new Config('test', new TestParser())
    }).toThrow()
  })

  test('test content', () => {
    const config = new Config('test', new TestParser())
    expect(config.content).toBe('test')
  })

  test('test put', () => {
    const config = new Config('test', new TestParser())
    vi.spyOn(TestParser.prototype, 'put').mockReturnValueOnce('test1')
    expect(config.put('test', 'test')).toBe(config)
    expect(config.content).toBe('test1')
  })

  test('test delete', () => {
    const config = new Config('test', new TestParser())
    vi.spyOn(TestParser.prototype, 'delete').mockReturnValueOnce('test1')
    expect(config.delete('test')).toBe(config)
    expect(config.content).toBe('test1')
  })

  test('test get', () => {
    const config = new Config('test', new TestParser())
    vi.spyOn(TestParser.prototype, 'get').mockReturnValueOnce('test1')
    expect(config.get('test')).toBe('test1')
  })

  test('test get with default value', () => {
    const config = new Config('test', new TestParser())
    vi.spyOn(TestParser.prototype, 'get').mockReturnValueOnce(undefined)
    expect(config.get('test', 'test2')).toBe('test2')
  })

  test('test save config', () => {
    const config = new Config('file', new TestParser())
    vi.spyOn(fs, 'writeFileSync')
    config.save()
    expect(fs.writeFileSync).toBeCalledWith('file', 'test')
  })
})
