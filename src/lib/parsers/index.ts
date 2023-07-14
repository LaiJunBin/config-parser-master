import * as t from '@babel/types'

export type ParserValueType =
  | string
  | number
  | boolean
  | t.CallExpression
  | ParserValueType[]
  | { [key: string]: ParserValueType }

export abstract class Parser {
  abstract check(content: string): boolean | never
  abstract get(content: string, key: string): ParserValueType
  abstract put(content: string, key: string, value: ParserValueType): string
  abstract delete(content: string, key: string): string

  require(
    content: string,
    source: string,
    options?: { defaultKey?: string; keys?: string[] }
  ): string {
    throw new Error(`Not support require in ${this.constructor.name}`)
  }
  import(
    content: string,
    source: string,
    options?: { defaultKey?: string; keys?: string[] }
  ): string {
    throw new Error(`Not support import in ${this.constructor.name}`)
  }
  createCallExpression(
    key: string,
    args?: ParserValueType[]
  ): t.CallExpression {
    throw new Error(
      `Not support createCallExpression in ${this.constructor.name}`
    )
  }
}
