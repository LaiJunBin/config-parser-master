import { JSONParser } from '../parsers/json-parser'
import { BaseConfig } from './base-config'

export class JSONConfig extends BaseConfig {
  constructor(file: string) {
    super(file, new JSONParser())
  }
}
