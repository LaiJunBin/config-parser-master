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
  createCallExpression(name: string, args?: ParserValueType[]): t.CallExpression
  isStrictSameCallExpression(
    callExpression: unknown,
    name: string,
    args?: ParserValueType[]
  ): boolean
  isSameCallExpression(callExpression: unknown, name: string): boolean
  getCallExpressionArgs(callExpression: unknown): ParserValueType[]

  isContainCallExpression(
    content: string,
    name: string,
    args?: ParserValueType[]
  ): boolean
}
