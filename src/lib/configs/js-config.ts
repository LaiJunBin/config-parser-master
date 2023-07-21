import { JSParser } from '../parsers/js-parser'
import { BaseJSConfig } from './base-js-config'

export class JSConfig extends BaseJSConfig {
  constructor(file: string, skipCheck = false) {
    super(file, new JSParser(), skipCheck)
  }
}
