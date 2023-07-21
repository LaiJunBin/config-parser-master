import { Parser, ParserValueType } from '../parsers'
import fs from 'fs'

export class BaseConfig {
  protected _content: string
  constructor(
    private _file: string,
    protected parser: Parser,
    skipCheck = false
  ) {
    this._content = fs.readFileSync(_file, 'utf-8')

    if (!skipCheck && !this.parser.check(this._content)) {
      throw new Error('Invalid config content.')
    }
  }

  get content() {
    return this._content
  }

  get file() {
    return this._file
  }

  put(key: string, value: ParserValueType): BaseConfig {
    this._content = this.parser.put(this._content, key, value)
    return this
  }

  delete(key: string): BaseConfig {
    this._content = this.parser.delete(this._content, key)
    return this
  }

  get(
    key: string,
    defaultValue?: ParserValueType | ParserValueType[]
  ): ParserValueType {
    return this.parser.get(this._content, key) ?? defaultValue
  }

  async save(): Promise<void> {
    return fs.writeFileSync(this.file, this._content)
  }
}
