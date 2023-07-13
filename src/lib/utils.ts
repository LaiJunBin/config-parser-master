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