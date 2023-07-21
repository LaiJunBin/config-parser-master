import { IJSParser, ParserValueType } from '../parsers'
import { BaseConfig } from './base-config'

export class BaseJSConfig extends BaseConfig {
  protected declare parser: IJSParser

  import(
    source: string,
    options: {
      defaultKey?: string
      keys?: string[]
    } = {}
  ): BaseJSConfig {
    this._content = this.parser.import(this._content, source, options)
    return this
  }

  require(
    source: string,
    options: {
      defaultKey?: string
      keys?: string[]
    } = {}
  ): BaseJSConfig {
    this._content = this.parser.require(this._content, source, options)
    return this
  }

  createCallExpression(name: string, args?: ParserValueType[]) {
    return this.parser.createCallExpression(name, args)
  }

  isStrictSameCallExpression(
    callExpression: unknown,
    name: string,
    args?: ParserValueType[]
  ): boolean {
    return this.parser.isStrictSameCallExpression(callExpression, name, args)
  }

  isSameCallExpression(callExpression: unknown, name: string): boolean {
    return this.parser.isSameCallExpression(callExpression, name)
  }

  getCallExpressionArgs(callExpression: unknown): ParserValueType[] {
    return this.parser.getCallExpressionArgs(callExpression)
  }
}
