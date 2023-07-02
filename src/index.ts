import { ConfigParser } from './lib/config-parser'
import { CJSParser } from './lib/parsers/cjs-parser'
import { JSParser } from './lib/parsers/js-parser'
import { JSONParser } from './lib/parsers/json-parser'
import { YamlParser } from './lib/parsers/yaml-parser'

ConfigParser.register('.cjs', CJSParser)
ConfigParser.register('.js', JSParser)
ConfigParser.register('.ts', JSParser)
ConfigParser.register('.mjs', JSParser)
ConfigParser.register('.mts', JSParser)
ConfigParser.register('.yml', YamlParser)
ConfigParser.register('.yaml', YamlParser)
ConfigParser.register('.json', JSONParser)
ConfigParser.registerEndwith('rc', JSONParser)

export { ConfigParser }
