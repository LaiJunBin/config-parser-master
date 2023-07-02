import fs from 'fs'
import path from 'path'
import { Config } from './config'

export class ConfigParser {
  static #parsers = {}
  static #validates = []

  static parse(file) {
    if (!fs.existsSync(file)) {
      throw new Error(`File ${file} is not exists.`)
    }

    const ext = path.extname(file)
    const parser = (function getParser() {
      if (ConfigParser.#parsers[ext]) {
        return ConfigParser.#parsers[ext]
      }

      for (const validate of ConfigParser.#validates) {
        const parser = validate(file)
        if (parser) {
          return parser
        }
      }
    })()

    if (!parser) {
      throw new Error(`Can't find ${ext} parser.`)
    }

    try {
      return new Config(file, new parser())
    } catch (e) {
      throw new Error(`Can't parser file: ${file}\n${e}`)
    }
  }

  static register(ext, parser) {
    this.#parsers[ext] = parser
  }

  static registerEndwith(ext, parser) {
    this.#validates.push((file) => {
      if (file.endsWith(ext)) {
        return parser
      }
    })
  }

  static listParsers() {
    return Object.keys(this.#parsers)
  }
}
