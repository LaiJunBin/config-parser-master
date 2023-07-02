import { Parser, ParserValueType } from '.'

export class JSONParser implements Parser {
  check(content: string): boolean {
    try {
      JSON.parse(content)
      return true
    } catch (e) {
      throw e
    }
  }
  put(content: string, key: string, value: ParserValueType): string {
    const data = JSON.parse(content)
    const keyProperties = key.split('.')
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
    return JSON.stringify(data, null, 2)
  }
  delete(content: string, key: string): string {
    const data = JSON.parse(content)
    const keyProperties = key.split('.')
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
    return JSON.stringify(data, null, 2)
  }
  get(content: string, key: string): ParserValueType {
    const data = JSON.parse(content)
    const keyProperties = key.split('.')
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
