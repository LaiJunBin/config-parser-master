import { ConfigParser } from './lib/config-parser'
import { CJSConfig } from './lib/configs/cjs-config'
import { JSConfig } from './lib/configs/js-config'
import { JSONConfig } from './lib/configs/json-config'
import { YamlConfig } from './lib/configs/yaml-config'

ConfigParser.register('.cjs', [CJSConfig, JSConfig])
ConfigParser.register('.js', [JSConfig, CJSConfig])
ConfigParser.register('.ts', [JSConfig, CJSConfig])
ConfigParser.register('.mjs', [JSConfig, CJSConfig])
ConfigParser.register('.mts', [JSConfig, CJSConfig])
ConfigParser.register('.yml', [YamlConfig])
ConfigParser.register('.yaml', [YamlConfig])
ConfigParser.register('.json', [JSONConfig])
ConfigParser.registerEndwith('rc', JSONConfig)

export { ConfigParser }
