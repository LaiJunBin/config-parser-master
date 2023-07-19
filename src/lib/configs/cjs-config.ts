import { CJSParser } from '../parsers/cjs-parser'
import { BaseJSConfig } from './base-js-config'

export class CJSConfig extends BaseJSConfig {
  constructor(file: string) {
    super(file, new CJSParser())
  }
}
