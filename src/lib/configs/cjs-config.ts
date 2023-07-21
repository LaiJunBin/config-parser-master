import { CJSParser } from '../parsers/cjs-parser'
import { BaseJSConfig } from './base-js-config'

export class CJSConfig extends BaseJSConfig {
  constructor(file: string, skipCheck = false) {
    super(file, new CJSParser(), skipCheck)
  }
}
