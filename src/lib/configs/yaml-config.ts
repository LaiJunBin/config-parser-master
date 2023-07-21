import { YamlParser } from '../parsers/yaml-parser'
import { BaseConfig } from './base-config'

export class YamlConfig extends BaseConfig {
  constructor(file: string, skipCheck = false) {
    super(file, new YamlParser(), skipCheck)
  }
}
