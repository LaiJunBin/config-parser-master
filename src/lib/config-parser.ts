import fs from 'fs'
import path from 'path'
import { BaseConfig } from './configs/base-config'
import { BaseJSConfig } from './configs/base-js-config'

export class ConfigParser {
  static #configs = {}
  static #validates = []

  static parse(file: string, skipCheck = false): BaseConfig {
    if (!fs.existsSync(file)) {
      throw new Error(`File ${file} is not exists.`)
    }

    const ext = path.extname(file)
    const configs = (function getConfig() {
      if (ConfigParser.#configs[ext]) {
        return ConfigParser.#configs[ext]
      }

      for (const validate of ConfigParser.#validates) {
        const configs = validate(file)
        if (configs) {
          return configs
        }
      }
    })()

    if (!configs) {
      throw new Error(`Can't find config support ${ext}`)
    }

    try {
      for (const config of configs) {
        try {
          const instance = new config(file, skipCheck)
          return instance
        } catch (e) {
          continue
        }
      }

      throw new Error(`Can't find config to resolve ${file}`)
    } catch (e) {
      throw new Error(`Can't parser file: ${file}\n${e}`)
    }
  }

  static parseJs(file: string, skipCheck = false): BaseJSConfig {
    return this.parse(file, skipCheck) as BaseJSConfig
  }

  static register(ext, configs) {
    this.#configs[ext] = configs
  }

  static registerEndwith(ext, configs) {
    this.#validates.push((file) => {
      if (file.endsWith(ext)) {
        return configs
      }
    })
  }

  static listConfigs() {
    return Object.keys(this.#configs)
  }
}
