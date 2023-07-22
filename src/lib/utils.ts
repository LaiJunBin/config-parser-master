export function splitByDot(str: string): string[] {
  const result = []
  let temp = ''
  let quote = ''
  for (let i = 0; i < str.length; i++) {
    const char = str[i]
    if (char === '.' && !quote) {
      result.push(temp)
      temp = ''
    } else if (char === '"' || char === "'") {
      if (quote) {
        if (quote === char) {
          quote = ''
        } else {
          temp += char
        }
      } else {
        quote = char
      }
    } else temp += char
  }
  result.push(temp)
  return result
}

export function removeComments(str: string): string {
  return str
    .replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1')
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => line.replace(/\s+$/, ''))
    .join('\n')
}
