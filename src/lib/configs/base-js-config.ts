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

  createCallExpression(key: string, args?: ParserValueType[]) {
    return this.parser.createCallExpression(key, args)
  }
}
