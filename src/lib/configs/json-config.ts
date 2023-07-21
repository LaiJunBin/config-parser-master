import { JSONParser } from '../parsers/json-parser'
import { BaseConfig } from './base-config'

export class JSONConfig extends BaseConfig {
  constructor(file: string, skipCheck = false) {
    super(file, new JSONParser(), skipCheck)
  }
}
