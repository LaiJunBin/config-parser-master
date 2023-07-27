import { parse } from '@babel/parser'
import traverse from '@babel/traverse'
import { getCalleeFullName } from '../js-utils'

describe('test js-utils', () => {
  test('test getCalleeFullName', () => {
    const content = `import { createApp } from 'vue'
    import './style.css'
    import App from './App.vue'
    
    createApp(App).mount('#app')
    
    function sum(a, b) {
      return a + b
    }
    
    sum(1, 2)
    `
    const ast = parse(content, {
      sourceType: 'module',
    })

    const whitelist = ['createApp()', 'createApp().mount()', 'sum()']

    traverse(ast, {
      CallExpression(path) {
        const { node } = path
        expect(whitelist).toContain(getCalleeFullName(node))
      },
    })
  })
})
