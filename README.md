# config-parser-master

## Description
This is a simple config parser that can read and write to a config file.

Currently, it only supports reading and writing to a config file in the following formats:
* js、mjs、ts、mts(export default)
* cjs(module.exports)
* json、rc(json)
* yml、yaml

## Install

```bash
$ npm install config-parser-master
```

## Usage
```js
import { ConfigParser } from 'config-parser-master';

const config = ConfigParser.parse('./package.json')
config.put('scripts.hi', 'echo hi')
config.save()

```

## API

### ConfigParser.parse(path: string): Config
Parse a config file and return a Config object.

### Config.put(key: string, value: ParserValueType): Config
Put a value into the config object.

### Config.get(key: string, defaultValue?: ParserValueType | ParserValueType[]): ParserValueType
Retrieve a value from the config object.

### Config.delete(key: string): Config
Delete a value from the config object.

### async Config.save(): Promise&lt;void&gt;
Save the config object to the config file.


## Propterites

### Config.file: string
The path of the config file.

### Config.content: string
The content of the config file.

## Types

### ParserValueType
```ts
type ParserValueType =
  | string
  | number
  | boolean
  | ParserValueType[]
  | { [key: string]: ParserValueType }
```
In simple terms, configuration values can be strings, numbers, boolean values, arrays, or objects.

