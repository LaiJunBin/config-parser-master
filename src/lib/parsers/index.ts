export type ParserValueType =
  | string
  | number
  | boolean
  | ParserValueType[]
  | { [key: string]: ParserValueType }

export interface Parser {
  check(content: string): boolean | never
  get(content: string, key: string): ParserValueType
  put(content: string, key: string, value: ParserValueType): string
  delete(content: string, key: string): string
}
