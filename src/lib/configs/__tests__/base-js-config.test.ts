import { IJSParser, ParserValueType } from '../../parsers'
import fs from 'fs'
import { BaseJSConfig } from '../base-js-config'

class TestParser implements IJSParser {
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

  import(
    content: string,
    source: string,
    options?: { defaultKey?: string; keys?: string[] }
  ) {
    return ''
  }

  require(
    content: string,
    source: string,
    options?: { defaultKey?: string; keys?: string[] }
  ) {
    return ''
  }

  createCallExpression(key: string, args?: any[]) {
    return null
  }

  isStrictSameCallExpression(
    callExpression: unknown,
    key: string,
    args?: ParserValueType[]
  ): boolean {
    return true
  }
  isSameCallExpression(callExpression: unknown, key: string): boolean {
    return true
  }
  getCallExpressionArgs(callExpression: unknown): ParserValueType[] {
    return []
  }

  isContainCallExpression(
    content: string,
    key: string,
    args?: ParserValueType[]
  ): boolean {
    return true
  }
}

class TestConfig extends BaseJSConfig {
  constructor(file: string) {
    super(file, new TestParser())
  }
}

beforeEach(() => {
  vi.spyOn(fs, 'readFileSync').mockReturnValue('test')
})

describe('test base js config', () => {
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

  test('test import', () => {
    const config = new TestConfig('file')
    vi.spyOn(TestParser.prototype, 'import').mockReturnValueOnce('test1')
    expect(config.import('test')).toBe(config)
    expect(config.content).toBe('test1')
  })

  test('test require', () => {
    const config = new TestConfig('file')
    vi.spyOn(TestParser.prototype, 'require').mockReturnValueOnce('test1')
    expect(config.require('test')).toBe(config)
    expect(config.content).toBe('test1')
  })

  test('test create call expression', () => {
    const config = new TestConfig('file')
    vi.spyOn(TestParser.prototype, 'createCallExpression').mockReturnValueOnce(
      'test1'
    )
    expect(config.createCallExpression('test')).toBe('test1')
  })

  test('test is strict same call expression', () => {
    const config = new TestConfig('file')
    vi.spyOn(
      TestParser.prototype,
      'isStrictSameCallExpression'
    ).mockReturnValueOnce(true)
    expect(config.isStrictSameCallExpression('test', 'test')).toBe(true)
  })

  test('test is same call expression', () => {
    const config = new TestConfig('file')
    vi.spyOn(TestParser.prototype, 'isSameCallExpression').mockReturnValueOnce(
      true
    )
    expect(config.isSameCallExpression('test', 'test')).toBe(true)
  })

  test('test get call expression args', () => {
    const config = new TestConfig('file')
    vi.spyOn(TestParser.prototype, 'getCallExpressionArgs').mockReturnValueOnce(
      []
    )
    expect(config.getCallExpressionArgs('test')).toEqual([])
  })

  test('test is contain call expression', () => {
    const config = new TestConfig('file')
    vi.spyOn(
      TestParser.prototype,
      'isContainCallExpression'
    ).mockReturnValueOnce(true)
    expect(config.isContainCallExpression('test')).toBe(true)
  })
})
