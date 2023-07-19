import { YamlParser } from '../parsers/yaml-parser'
import { BaseConfig } from './base-config'

export class YamlConfig extends BaseConfig {
  constructor(file: string) {
    super(file, new YamlParser())
  }
}
