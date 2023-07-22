import { ParserValueType } from '../parsers'
import { JSParser } from '../parsers/js-parser'
import { jsObjectToJSONFormat } from '../utils'
import { BaseConfig } from './base-config'

export class JSONConfig extends BaseConfig {
  constructor(file: string, skipCheck = false) {
    super(file, new JSParser(), true)
    this._content = `export default ${this._content}`

    if (!skipCheck && !this.parser.check(this._content)) {
      throw new Error('Invalid config content.')
    }
  }

  get content() {
    return this._content
      .replace(/export default /, '')
      .replace(/;$/, '')
      .replace(/,(\s*(\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$)?\s})/gm, '$1')
  }

  put(key: string, value: ParserValueType): BaseConfig {
    key = key.replace(/([a-zA-Z0-9_]+)/g, '"$1"')
    if (typeof value === 'object') {
      value = jsObjectToJSONFormat(value)
    }
    return super.put(key, value)
  }

  delete(key: string): BaseConfig {
    return super.delete(key)
  }

  get(
    key: string,
    defaultValue?: ParserValueType | ParserValueType[]
  ): ParserValueType {
    return super.get(key, defaultValue)
  }

  async save(): Promise<void> {
    this._content = this.content
    super.save()
  }
}
