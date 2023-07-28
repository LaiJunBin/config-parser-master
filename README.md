# config-parser-master

## Description
This is a simple config parser that can read and write to a config file.

Currently, it only supports reading and writing to a config file in the following formats:
* js、mjs、ts、mts(export default)
* cjs(module.exports)
* json、rc(json)
* yml、yaml

Additionally, it also supports reading javascript or typescript files. (including jsx and tsx)

## Install

```bash
$ npm install config-parser-master
```

## Simple Usage
```js
import { ConfigParser } from 'config-parser-master';

const config = ConfigParser.parse('./package.json')
config.put('scripts.hi', 'echo hi')
config.save()
```


## ParseJs Exammple
If you want to parse a javascript or typescript file, you can use the parseJs or parse function, the difference is that the parseJs function will return a BaseJSConfig object, which has some additional functions.

If your javascript or typescript file isn't a config file, you can set the skipCheck parameter to true, and it will not check if the file is a config file.

### Parse a source file
```js
/*
file: main.js
---
import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

createApp(App).mount('#app')

function sum(a, b) {
  return a + b
}

sum(1, 2)
*/
import { ConfigParser } from 'config-parser-master';

const config = ConfigParser.parseJs('main.js', true)

// import
config.import('main.css') // import "main.css";
config.import('Home.vue', { defaultKey: 'Home' }) // import Home from "Home.vue";
config.import('config-parser-master', { keys: ['ConfigParser'] }) // import { ConfigParser } from "config-parser-master";
config.import('some-package', { defaultKey: 'defaultKey', keys: ['a', 'b'] }) // import defaultKey, { a, b } from "some-package";

// isContainCallExpression
console.log(config.isContainCallExpression('createApp()')) // true
console.log(config.isContainCallExpression('createApp().mount()')) // true
console.log(config.isContainCallExpression('sum()')) // true
console.log(config.isContainCallExpression('add()')) // false

console.log(config.content)
/*
import defaultKey, { a, b } from "some-package";
import { ConfigParser } from "config-parser-master";
import Home from "Home.vue";
import "main.css";
import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
createApp(App).mount('#app');
function sum(a, b) {
  return a + b;
}
sum(1, 2);
*/
```

### Parse a config file
```js
/*
file: config.js
---
import { svelte } from '@sveltejs/vite-plugin-svelte'

function sum(a, b) {
  return a + b
}

export default {
  plugins: [svelte(), sum(1, 2)],
}
*/
const config = ConfigParser.parseJs('config.js')
const plugins = config.get('plugins') as ParserValueType[]

// isSameCallExpression and isStrictSameCallExpression
console.log(
  plugins.map((plugin) => config.isSameCallExpression(plugin, 'svelte()'))
) // [true, false]
console.log(
  plugins.map((plugin) => config.isSameCallExpression(plugin, 'sum()'))
) // [false, true]
console.log(
  plugins.map((plugin) => config.isStrictSameCallExpression(plugin, 'sum()'))
) // [false, false]
console.log(
  plugins.map((plugin) =>
    config.isStrictSameCallExpression(plugin, 'sum()', [1, 2])
  )
) // [false, true]

// getCallExpressionArgs
console.log(plugins.map((plugin) => config.getCallExpressionArgs(plugin))) // [[], [1, 2]]

// createCallExpression and put
const plugin = config.createCallExpression('plugin', [1, 2, 3])
plugins.push(plugin)
config.put('plugins', plugins)

console.log(config.content)
/*
import { svelte } from '@sveltejs/vite-plugin-svelte';
function sum(a, b) {
  return a + b;
}
export default {
  plugins: [svelte(), sum(1, 2), plugin(1, 2, 3)]
};
*/
```


## API


### ConfigParser
* ConfigParser.parse(path: string): BaseConfig
  * Parse a config file and return a Config object.
* ConfigParser.parseJs(path: string, skipCheck?: boolean = false): BaseJSConfig
  * Parse a javascript or typescript file and return a Config object.

### BaseConfig
* BaseConfig.put(key: string, value: ParserValueType): BaseConfig
  * Put a value into the config object.
* BaseConfig.get(key: string, defaultValue?: ParserValueType | ParserValueType[]): ParserValueType
  * Retrieve a value from the config object.
* BaseConfig.delete(key: string): BaseConfig
  * Delete a value from the config object.
* async Config.save(): Promise&lt;void&gt;
  * Save the config object to the config file.

### BaseJSConfig
* Extends BaseConfig
* import(source: string, options: { defaultKey?: string, keys?: string[] } = {}): BaseJSConfig
  * Insert 「import defaultKey, { ...keys } from source」 to the config file.
* require(source: string, options: { defaultKey?: string, keys?: string[] } = {}): BaseJSConfig
  * Insert 「const defaultKey, { ...keys } = require(source)」 to the config file.
* createCallExpression(name: string, args?: ParserValueType[]): t.CallExpression
  * Create a call expression.
* isStrictSameCallExpression(callExpression: t.Expression, name: string, args?: ParserValueType[]): boolean
  * Check if the call expression is strict same (including name and args).
* isSameCallExpression(callExpression: t.Expression, name: string): boolean
  * Check if the call expression is same.
* getCallExpressionArgs(callExpression: t.Expression): ParserValueType[]
  * Get the arguments of the call expression.
* isContainCallExpression(name: string, args?: ParserValueType[]): boolean
  * Check if the config file contains the call expression.


## Propterites

### BaseConfig.file: string
The path of the config file.

### BaseConfig.content: string
The content of the config file.

## Types

### ParserValueType
```ts
type ParserValueType =
  | string
  | number
  | boolean
  | t.CallExpression
  | ParserValueType[]
  | { [key: string]: ParserValueType }
```
In simple terms, configuration values can be strings, numbers, boolean, t.CallExpression values, arrays, or objects.

