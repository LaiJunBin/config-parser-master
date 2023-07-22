import { ConfigParser } from './lib/config-parser'
import { CJSConfig } from './lib/configs/cjs-config'
import { JSConfig } from './lib/configs/js-config'
import { JSONConfig } from './lib/configs/json-config'
import { YamlConfig } from './lib/configs/yaml-config'
import { JSONParser } from './lib/parsers/json-parser'

ConfigParser.register('.cjs', CJSConfig)
ConfigParser.register('.js', JSConfig)
ConfigParser.register('.ts', JSConfig)
ConfigParser.register('.mjs', JSConfig)
ConfigParser.register('.mts', JSConfig)
ConfigParser.register('.yml', YamlConfig)
ConfigParser.register('.yaml', YamlConfig)
ConfigParser.register('.json', JSONConfig)
ConfigParser.registerEndwith('rc', JSONConfig)

const config = ConfigParser.parse('test.json')

config.put('test', {
  test: 'test',
  parent: {
    test: 'test',
  },
})
console.log(config.content)

export { ConfigParser }
