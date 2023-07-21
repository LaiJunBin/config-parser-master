import { IJSParser, ParserValueType } from '.'
import { parse } from '@babel/parser'
import generate from '@babel/generator'
import traverse from '@babel/traverse'
import * as t from '@babel/types'
import {
  createCallExpressionHandler,
  getCallExpressionArgs,
  getObjectValuesFromNode,
  importHandler,
  isContainCallExpression,
  isSameCallExpression,
  isStrictSameCallExpression,
  recursiveAssign,
  requireHandler,
} from './js-utils'

function getDeclaration(path) {
  const declaration = path.node.declaration
  if (t.isCallExpression(declaration)) {
    return declaration.arguments[0]
  }

  return declaration
}

function checkExportDefault(content: string): boolean {
  const ast = parse(content, {
    sourceType: 'module',
  })
  let hasExportDefaultObject = false

  traverse(ast, {
    ExportDefaultDeclaration(path) {
      const declaration = path.node.declaration
      if (
        t.isObjectExpression(declaration) ||
        (t.isCallExpression(declaration) &&
          declaration.arguments.length === 1 &&
          t.isObjectExpression(declaration.arguments[0]))
      ) {
        hasExportDefaultObject = true
      }
    },
  })

  if (!hasExportDefaultObject) {
    throw new Error('export default should be an object')
  }

  return hasExportDefaultObject
}

function getValueByPath(content: string, key: string): ParserValueType {
  const ast = parse(content, {
    sourceType: 'module',
  })
  const keyProperties = key.split('.')
  let value = null

  traverse(ast, {
    ExportDefaultDeclaration(path) {
      const declaration = getDeclaration(path)
      if (t.isObjectExpression(declaration)) {
        let currentObject = declaration
        let propertyIndex = -1

        for (let i = 0; i < keyProperties.length; i++) {
          const propertyName = keyProperties[i]
          propertyIndex = currentObject.properties.findIndex(
            (prop) =>
              t.isIdentifier(prop.key, { name: propertyName }) ||
              t.isLiteral(prop.key, { value: propertyName })
          )

          if (propertyIndex >= 0) {
            const property = currentObject.properties[propertyIndex]
            if (i === keyProperties.length - 1) {
              value = property.value
            } else if (t.isObjectExpression(property.value)) {
              currentObject = property.value
            } else {
              return
            }
          } else {
            return
          }
        }
      }
    },
  })

  if (!value) {
    return undefined
  }
  return getObjectValuesFromNode(value)
}

function putValueByPath(
  content: string,
  key: string,
  value: ParserValueType
): string {
  const ast = parse(content, {
    sourceType: 'module',
  })
  traverse(ast, {
    ExportDefaultDeclaration(path) {
      const declaration = getDeclaration(path)
      const keyProperties = key.split('.').map((prop) => t.identifier(prop))
      if (t.isObjectExpression(declaration) && keyProperties.length > 0) {
        let currentObject = declaration
        for (let i = 0; i < keyProperties.length - 1; i++) {
          const propertyName = keyProperties[i].name
          const existingProperty = currentObject.properties.find(
            (prop) =>
              t.isIdentifier(prop.key, { name: propertyName }) ||
              t.isLiteral(prop.key, { value: propertyName })
          )

          if (existingProperty) {
            if (t.isObjectExpression(existingProperty.value)) {
              currentObject = existingProperty.value
            } else {
              throw new Error('Key path is not valid')
            }
          } else {
            const newProperty = t.objectProperty(
              t.identifier(propertyName),
              t.objectExpression([])
            )
            currentObject.properties.push(newProperty)
            currentObject = newProperty.value
          }
        }

        const lastPropertyName = keyProperties[keyProperties.length - 1].name
        const lastPropertyIndex = currentObject.properties.findIndex(
          (prop) =>
            t.isIdentifier(prop.key, { name: lastPropertyName }) ||
            t.isLiteral(prop.key, { value: lastPropertyName })
        )

        if (lastPropertyIndex >= 0) {
          if (
            t.isObjectExpression(
              currentObject.properties[lastPropertyIndex].value
            )
          ) {
            currentObject.properties[lastPropertyIndex].value = recursiveAssign(
              currentObject.properties[lastPropertyIndex].value,
              value
            )
          } else {
            currentObject.properties[lastPropertyIndex] = recursiveAssign(
              currentObject.properties[lastPropertyIndex],
              value
            )
          }
        } else {
          const newValue = recursiveAssign(t.objectExpression([]), value)
          const newProperty = t.objectProperty(
            t.identifier(lastPropertyName),
            newValue.value ?? newValue
          )

          currentObject.properties.push(newProperty)
        }
      }
    },
  })

  const { code } = generate(ast)
  return code
}

function deleteKeyByPath(content: string, key: string): string {
  const ast = parse(content, {
    sourceType: 'module',
  })
  const keyProperties = key.split('.')

  traverse(ast, {
    ExportDefaultDeclaration(path) {
      const declaration = getDeclaration(path)

      if (t.isObjectExpression(declaration)) {
        const properties = declaration.properties

        let currentObject = properties
        let propertyIndex = -1

        for (let i = 0; i < keyProperties.length; i++) {
          const propertyName = keyProperties[i]
          propertyIndex = currentObject.findIndex(
            (prop) =>
              t.isIdentifier(prop.key, { name: propertyName }) ||
              t.isLiteral(prop.key, { value: propertyName })
          )

          if (propertyIndex >= 0) {
            const property = currentObject[propertyIndex]
            if (i === keyProperties.length - 1) {
              currentObject.splice(propertyIndex, 1)
              break
            } else if (t.isObjectExpression(property.value)) {
              currentObject = property.value.properties
            } else {
              throw new Error('Key path is not valid')
            }
          } else {
            return
          }
        }
      }
    },
  })

  const { code } = generate(ast)
  return code
}

export class JSParser implements IJSParser {
  check(content: string): boolean {
    return checkExportDefault(content)
  }
  put(content: string, key: string, value: ParserValueType): string {
    return putValueByPath(content, key, value)
  }
  delete(content: string, key: string): string {
    return deleteKeyByPath(content, key)
  }
  get(content: string, key: string): ParserValueType {
    return getValueByPath(content, key)
  }

  import(
    content: string,
    source: string,
    options?: { defaultKey?: string; keys?: string[] }
  ): string {
    return importHandler(content, source, options)
  }

  require(
    content: string,
    source: string,
    options?: { defaultKey?: string; keys?: string[] }
  ): string {
    return requireHandler(content, source, options)
  }

  createCallExpression(
    name: string,
    args: ParserValueType[] = []
  ): t.CallExpression {
    return createCallExpressionHandler(name, args)
  }

  isStrictSameCallExpression(
    callExpression: unknown,
    name: string,
    args?: ParserValueType[]
  ): boolean {
    return isStrictSameCallExpression(callExpression, name, args)
  }

  isSameCallExpression(callExpression: unknown, name: string): boolean {
    return isSameCallExpression(callExpression, name)
  }
  getCallExpressionArgs(callExpression: unknown): ParserValueType[] {
    return getCallExpressionArgs(callExpression)
  }

  isContainCallExpression(
    content: string,
    name: string,
    args?: ParserValueType[]
  ): boolean {
    return isContainCallExpression(content, name, args)
  }
}
