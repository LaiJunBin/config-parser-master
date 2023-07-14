import { Parser, ParserValueType } from '.'
import yaml from 'js-yaml'
import { splitByDot } from '../utils'

export class YamlParser extends Parser {
  check(content: string): boolean {
    try {
      yaml.load(content, 'utf-8')
      return true
    } catch (e) {
      throw e
    }
  }
  put(content: string, key: string, value: ParserValueType): string {
    const data = yaml.load(content, 'utf-8')
    const keyProperties = splitByDot(key)
    let currentObject = data
    for (let i = 0; i < keyProperties.length; i++) {
      const propertyName = keyProperties[i]
      if (i === keyProperties.length - 1) {
        currentObject[propertyName] = value
      } else {
        if (!currentObject[propertyName]) {
          currentObject[propertyName] = {}
        }
        if (typeof currentObject[propertyName] !== 'object') {
          throw new Error('Key path is not valid')
        }
        currentObject = currentObject[propertyName]
      }
    }
    return yaml.dump(data)
  }
  delete(content: string, key: string): string {
    const data = yaml.load(content, 'utf-8')
    const keyProperties = splitByDot(key)
    let currentObject = data
    for (let i = 0; i < keyProperties.length; i++) {
      const propertyName = keyProperties[i]
      if (i === keyProperties.length - 1) {
        delete currentObject[propertyName]
      } else {
        if (!currentObject[propertyName]) {
          return content
        }
        currentObject = currentObject[propertyName]
      }
    }
    return yaml.dump(data)
  }
  get(content: string, key: string): ParserValueType {
    const data = yaml.load(content, 'utf-8')
    const keyProperties = splitByDot(key)
    let currentObject = data
    for (let i = 0; i < keyProperties.length - 1; i++) {
      const propertyName = keyProperties[i]
      if (!currentObject[propertyName]) {
        return
      }
      currentObject = currentObject[propertyName]
    }

    const lastPropertyName = keyProperties[keyProperties.length - 1]
    return currentObject[lastPropertyName]
  }
}
