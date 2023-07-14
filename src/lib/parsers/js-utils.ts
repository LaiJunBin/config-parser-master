import { parse } from '@babel/parser'
import { ParserValueType } from '.'
import * as t from '@babel/types'
import traverse from '@babel/traverse'
import generate from '@babel/generator'

export function getObjectValuesFromNode(node) {
  const objectValues = {}

  if (t.isArrayExpression(node)) {
    return node.elements.map((element) => getObjectValuesFromNode(element))
  }

  if (t.isObjectExpression(node)) {
    for (const property of node.properties) {
      if (t.isObjectProperty(property)) {
        const propertyName = property.key.name
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
      for (const key of Object.keys(value)) {
        const val = value[key]
        if (Array.isArray(val)) {
          const property = t.objectProperty(
            t.identifier(key),
            recursiveAssign(t.objectExpression([]), val).value
          )
          node.properties.push(property)
        } else if (typeof val === 'object') {
          const property = t.objectProperty(
            t.identifier(key),
            recursiveAssign(t.objectExpression([]), val)
          )
          node.properties.push(property)
        } else {
          const property = t.objectProperty(
            t.identifier(key),
            t.valueToNode(val)
          )
          node.properties.push(property)
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
  key: string,
  args?: ParserValueType[]
): t.CallExpression {
  const keyProperties = key.split('.')
  const callee = keyProperties.reduce((acc, prop) => {
    if (acc) {
      return t.memberExpression(acc, t.identifier(prop))
    } else {
      return t.identifier(prop)
    }
  }, null as t.Expression | null)

  const callExpression = t.callExpression(
    callee,
    args.map((arg) => t.valueToNode(arg))
  )

  return callExpression
}
