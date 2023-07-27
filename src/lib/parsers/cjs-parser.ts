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
import { splitByDot, unwrapQuotes } from '../utils'

function checkModuleExports(content: string): boolean {
  const ast = parse(content, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
  })
  let hasModuleExports = false

  traverse(ast, {
    AssignmentExpression(path) {
      const { left, right } = path.node
      if (
        t.isMemberExpression(left) &&
        t.isIdentifier(left.object, { name: 'module' }) &&
        t.isIdentifier(left.property, { name: 'exports' })
      ) {
        if (!t.isObjectExpression(right)) {
          throw new Error('module.exports should be an object')
        }

        if (hasModuleExports) {
          throw new Error('Only one module.exports is allowed')
        }

        hasModuleExports = true
      }
    },
    ExportDefaultDeclaration(path) {
      throw new Error('module.exports should be used instead of export default')
    },
  })

  if (!hasModuleExports) {
    throw new Error('module.exports is missing')
  }

  return true
}

function getValueByPath(content: string, key: string): ParserValueType {
  const ast = parse(content, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
  })
  const keyProperties = splitByDot(key)
  let value = null

  traverse(ast, {
    AssignmentExpression(path) {
      const { left, right } = path.node
      if (
        t.isMemberExpression(left) &&
        t.isIdentifier(left.object, { name: 'module' }) &&
        t.isIdentifier(left.property, { name: 'exports' })
      ) {
        if (t.isObjectExpression(right)) {
          let currentObject = right
          let propertyIndex = -1

          for (let i = 0; i < keyProperties.length; i++) {
            const propertyName = unwrapQuotes(keyProperties[i])
            propertyIndex = currentObject.properties.findIndex(
              (prop) =>
                t.isIdentifier(prop.key, {
                  name: propertyName,
                }) || t.isLiteral(prop.key, { value: propertyName })
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
    plugins: ['jsx', 'typescript'],
  })
  traverse(ast, {
    AssignmentExpression(path) {
      const { left, right } = path.node
      if (
        t.isMemberExpression(left) &&
        t.isIdentifier(left.object, { name: 'module' }) &&
        t.isIdentifier(left.property, { name: 'exports' })
      ) {
        const properties = splitByDot(key).map((prop) => t.identifier(prop))

        if (t.isObjectExpression(right) && properties.length > 0) {
          const objectProperties = right.properties
          let currentObject = objectProperties

          for (let i = 0; i < properties.length - 1; i++) {
            const property = properties[i]
            const propertyIndex = currentObject.findIndex(
              (objProp) =>
                t.isIdentifier(objProp.key, {
                  name: unwrapQuotes(property.name),
                }) ||
                t.isLiteral(objProp.key, { value: unwrapQuotes(property.name) })
            )

            if (propertyIndex >= 0) {
              const nextObject = currentObject[propertyIndex].value
              if (t.isObjectExpression(nextObject)) {
                currentObject = nextObject.properties
              } else {
                throw new Error('Key path is not valid')
              }
            } else {
              const newProperty = t.objectProperty(
                t.identifier(`"${unwrapQuotes(property.name)}"`),
                t.objectExpression([])
              )
              currentObject.push(newProperty)
              currentObject = newProperty.value.properties
            }
          }

          const lastProperty = properties[properties.length - 1]
          const lastPropertyIndex = currentObject.findIndex(
            (objProp) =>
              t.isIdentifier(objProp.key, {
                name: unwrapQuotes(lastProperty.name),
              }) ||
              t.isLiteral(objProp.key, {
                value: unwrapQuotes(lastProperty.name),
              })
          )

          if (lastPropertyIndex >= 0) {
            if (t.isObjectExpression(currentObject[lastPropertyIndex].value)) {
              currentObject[lastPropertyIndex].value = recursiveAssign(
                currentObject[lastPropertyIndex].value,
                value
              )
            } else {
              currentObject[lastPropertyIndex] = recursiveAssign(
                currentObject[lastPropertyIndex],
                value
              )
            }
          } else {
            const newValue = recursiveAssign(t.objectExpression([]), value)
            const newProperty = t.objectProperty(
              t.identifier(`"${unwrapQuotes(lastProperty.name)}"`),
              newValue.value ?? newValue
            )
            currentObject.push(newProperty)
          }
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
    plugins: ['jsx', 'typescript'],
  })
  const keyProperties = splitByDot(key)

  traverse(ast, {
    AssignmentExpression(path) {
      const { left, right } = path.node
      if (
        t.isMemberExpression(left) &&
        t.isIdentifier(left.object, { name: 'module' }) &&
        t.isIdentifier(left.property, { name: 'exports' })
      ) {
        if (t.isObjectExpression(right)) {
          let currentObject = right
          let propertyIndex = -1
          let propertyToDeleteIndex = -1

          for (let i = 0; i < keyProperties.length; i++) {
            const propertyName = unwrapQuotes(keyProperties[i])
            propertyIndex = currentObject.properties.findIndex(
              (prop) =>
                t.isIdentifier(prop.key, {
                  name: propertyName,
                }) || t.isLiteral(prop.key, { value: propertyName })
            )

            if (propertyIndex >= 0) {
              const property = currentObject.properties[propertyIndex]
              if (i === keyProperties.length - 1) {
                propertyToDeleteIndex = propertyIndex
              } else if (t.isObjectExpression(property.value)) {
                currentObject = property.value
              } else {
                throw new Error('Key path is not valid')
              }
            } else {
              return
            }
          }

          if (propertyToDeleteIndex >= 0) {
            const trailingComments =
              currentObject.properties[propertyToDeleteIndex]
                .trailingComments ?? []
            const leadingComments =
              currentObject.properties[propertyToDeleteIndex].leadingComments ??
              []
            currentObject.properties.splice(propertyToDeleteIndex, 1)
            if (propertyToDeleteIndex > 0) {
              currentObject.properties[
                propertyToDeleteIndex - 1
              ].trailingComments = trailingComments
              currentObject.properties[
                propertyToDeleteIndex - 1
              ].leadingComments = leadingComments
            } else if (currentObject.properties.length > 0) {
              currentObject.properties[0].leadingComments = currentObject
                .properties[0].leadingComments
                ? [
                    ...leadingComments,
                    ...currentObject.properties[0].leadingComments,
                  ]
                : leadingComments
              currentObject.properties[0].trailingComments = currentObject
                .properties[0].trailingComments
                ? [
                    ...trailingComments,
                    ...currentObject.properties[0].trailingComments,
                  ]
                : trailingComments
            } else {
              currentObject.properties.push(t.noop())
              currentObject.properties[
                currentObject.properties.length - 1
              ].trailingComments = trailingComments
              currentObject.properties[
                currentObject.properties.length - 1
              ].leadingComments = leadingComments
            }
          }
        }
      }
    },
  })

  const { code } = generate(ast)
  return code
}

export class CJSParser implements IJSParser {
  check(content: string): boolean {
    return checkModuleExports(content)
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
