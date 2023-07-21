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
    const config = (function getConfig() {
      if (ConfigParser.#configs[ext]) {
        return ConfigParser.#configs[ext]
      }

      for (const validate of ConfigParser.#validates) {
        const config = validate(file)
        if (config) {
          return config
        }
      }
    })()

    if (!config) {
      throw new Error(`Can't find config support ${ext}`)
    }

    try {
      return new config(file, skipCheck)
    } catch (e) {
      throw new Error(`Can't parser file: ${file}\n${e}`)
    }
  }

  static parseJs(file: string, skipCheck = false): BaseJSConfig {
    return this.parse(file, skipCheck) as BaseJSConfig
  }

  static register(ext, config) {
    this.#configs[ext] = config
  }

  static registerEndwith(ext, config) {
    this.#validates.push((file) => {
      if (file.endsWith(ext)) {
        return config
      }
    })
  }

  static listConfigs() {
    return Object.keys(this.#configs)
  }
}
