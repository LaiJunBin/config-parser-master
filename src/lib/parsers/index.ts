import * as t from '@babel/types'

export type ParserValueType =
  | string
  | number
  | boolean
  | t.CallExpression
  | ParserValueType[]
  | { [key: string]: ParserValueType }

export interface Parser {
  check(content: string): boolean | never
  get(content: string, key: string): ParserValueType
  put(content: string, key: string, value: ParserValueType): string
  delete(content: string, key: string): string
}

export interface IJSParser extends Parser {
  require(
    content: string,
    source: string,
    options?: { defaultKey?: string; keys?: string[] }
  )
  import(
    content: string,
    source: string,
    options?: { defaultKey?: string; keys?: string[] }
  )
  createCallExpression(key: string, args?: ParserValueType[])
}
