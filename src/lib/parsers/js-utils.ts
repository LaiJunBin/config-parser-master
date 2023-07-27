import { parse } from '@babel/parser'
import { ParserValueType } from '.'
import * as t from '@babel/types'
import traverse from '@babel/traverse'
import generate from '@babel/generator'
import { unwrapQuotes } from '../utils'

export function getObjectValuesFromNode(node) {
  const objectValues = {}

  if (t.isArrayExpression(node)) {
    return node.elements.map((element) => getObjectValuesFromNode(element))
  }

  if (t.isObjectExpression(node)) {
    for (const property of node.properties) {
      if (t.isObjectProperty(property)) {
        const propertyName = t.isIdentifier(property.key)
          ? property.key.name
          : property.key.value
        const propertyValue = property.value
        objectValues[propertyName] = getObjectValuesFromNode(propertyValue)
      }
    }

    return objectValues
  }

  if (t.isCallExpression(node)) {
    return node
  }

  return node.value
}

export function recursiveAssign(node, value: ParserValueType) {
  if (Array.isArray(value)) {
    node.value = t.arrayExpression(
      value.map((val) => {
        if (t.isCallExpression(val)) {
          return val
        } else if (typeof val === 'object') {
          return recursiveAssign(t.objectExpression([]), val)
        } else {
          return t.valueToNode(val)
        }
      })
    )
  } else {
    if (typeof value === 'object' && t.isObjectExpression(node)) {
      if (t.isCallExpression(value)) {
        node.value = value
        return node
      }
      for (let key of Object.keys(value)) {
        const val = value[key]
        key = unwrapQuotes(key)
        if (Array.isArray(val)) {
          const property = t.objectProperty(
            t.identifier(`"${key}"`),
            recursiveAssign(t.objectExpression([]), val).value
          )
          const index = node.properties.findIndex(
            (prop) => prop.key.name === key || prop.key.value === key
          )

          if (index !== -1) {
            node.properties[index] = property
          } else {
            node.properties.push(property)
          }
        } else if (typeof val === 'object') {
          const property = t.objectProperty(
            t.identifier(`"${key}"`),
            t.isCallExpression(val)
              ? val
              : recursiveAssign(t.objectExpression([]), val)
          )
          const index = node.properties.findIndex(
            (prop) => prop.key.name === key || prop.key.value === key
          )
          if (index !== -1) {
            node.properties[index] = property
          } else {
            node.properties.push(property)
          }
        } else {
          const property = t.objectProperty(
            t.identifier(`"${key}"`),
            t.valueToNode(val)
          )
          const index = node.properties.findIndex(
            (prop) => prop.key.name === key || prop.key.value === key
          )

          if (index !== -1) {
            node.properties[index] = property
          } else {
            node.properties.push(property)
          }
        }
      }
    } else {
      if (t.isCallExpression(value)) {
        node.value = value
      } else {
        node.value = t.valueToNode(value)
      }
    }
  }

  return node
}

export function importHandler(
  content: string,
  source: string,
  options: {
    defaultKey?: string
    keys?: string[]
  } = {
    defaultKey: undefined,
    keys: undefined,
  }
): string {
  const { keys, defaultKey } = options
  const ast = parse(content, {
    sourceType: 'module',
    plugins: ['jsx'],
  })

  const specifiers = []
  if (defaultKey) {
    specifiers.push(t.importDefaultSpecifier(t.identifier(defaultKey)))
  }

  if (keys) {
    specifiers.push(
      ...keys.map((key) =>
        t.importSpecifier(t.identifier(key), t.identifier(key))
      )
    )
  }

  const importDeclaration = t.importDeclaration(
    specifiers,
    t.stringLiteral(source)
  )

  traverse(ast, {
    Program(path) {
      path.node.body.unshift(importDeclaration)
    },
  })

  const { code } = generate(ast)
  return code
}

export function requireHandler(
  content: string,
  source: string,
  options?: { defaultKey?: string; keys?: string[] }
): string {
  const { keys, defaultKey } = options ?? {}
  const ast = parse(content, {
    sourceType: 'module',
    plugins: ['jsx'],
  })

  const requireDeclaration =
    !keys && !defaultKey
      ? t.expressionStatement(
          t.callExpression(t.identifier('require'), [t.stringLiteral(source)])
        )
      : t.variableDeclaration('const', [
          t.variableDeclarator(
            t.objectPattern([
              ...(defaultKey
                ? [
                    t.objectProperty(
                      t.identifier(defaultKey),
                      t.identifier('default')
                    ),
                  ]
                : []),
              ...(keys ?? []).map((key) =>
                t.objectProperty(t.identifier(key), t.identifier(key))
              ),
            ]),
            t.callExpression(t.identifier('require'), [t.stringLiteral(source)])
          ),
        ])

  traverse(ast, {
    Program(path) {
      path.node.body.unshift(requireDeclaration)
    },
  })

  const { code } = generate(ast)
  return code
}

export function createCallExpressionHandler(
  name: string,
  args?: ParserValueType[]
): t.CallExpression {
  const keyProperties = name.split('.')
  const callee = keyProperties.reduce((acc, prop) => {
    if (acc) {
      return t.memberExpression(acc, t.identifier(prop))
    } else {
      return t.identifier(prop)
    }
  }, null as t.Expression | null)

  const callExpression = t.callExpression(
    callee,
    args.map((arg) => (t.isCallExpression(arg) ? arg : t.valueToNode(arg)))
  )

  return callExpression
}

export function getCalleeFullName(
  callee: t.MemberExpression | t.Identifier
): string {
  if (t.isIdentifier(callee)) {
    return callee.name
  }

  if (callee.callee) {
    return getCalleeFullName(callee.callee) + '()'
  }

  return getCalleeFullName(callee.object) + '.' + callee?.property?.name
}

export function isStrictSameCallExpression(
  callExpression: t.Expression,
  name: string,
  args?: ParserValueType[]
): boolean {
  if (!t.isCallExpression(callExpression)) {
    return false
  }

  if (args && args.length !== callExpression.arguments.length) {
    return false
  }

  return (
    getCalleeFullName(callExpression) === name &&
    Array.isArray(callExpression.arguments) &&
    callExpression.arguments.every((arg, index) => {
      if (!args) {
        return t.isIdentifier(arg)
      } else {
        if (t.isCallExpression(arg)) {
          return isStrictSameCallExpression(
            arg,
            getCalleeFullName(args[index]),
            getCallExpressionArgs(args[index])
          )
        }

        return t.isLiteral(arg) && arg.value === args[index]
      }
    })
  )
}

export function isSameCallExpression(
  callExpression: t.Expression,
  name: string
): boolean {
  if (!t.isCallExpression(callExpression)) {
    return false
  }

  return getCalleeFullName(callExpression) === name
}

export function getCallExpressionArgs(
  callExpression: t.Expression
): ParserValueType[] {
  if (!t.isCallExpression(callExpression)) {
    return []
  }

  return callExpression.arguments.map((arg) => {
    if (t.isLiteral(arg)) {
      return arg.value
    } else {
      return arg
    }
  })
}

export function isContainCallExpression(
  content: string,
  name: string,
  args?: ParserValueType[]
): boolean {
  const ast = parse(content, {
    sourceType: 'module',
    plugins: ['jsx'],
  })

  let isContain = false

  traverse(ast, {
    CallExpression(path) {
      const { node } = path
      if (
        args
          ? isStrictSameCallExpression(node, name, args)
          : isSameCallExpression(node, name)
      ) {
        isContain = true
      }
    },
  })

  return isContain
}
