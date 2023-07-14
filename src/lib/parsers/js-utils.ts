import { ParserValueType } from '.'
import * as t from '@babel/types'

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
