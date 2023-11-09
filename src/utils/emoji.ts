const items = {
  check: '✔️',
  close: '✖️'
}

function normalize(str: string) {
  const regex = new RegExp(String.fromCharCode(65039), 'g')
  return str.replace(regex, '')
}

function get(name: Required<keyof typeof items>) {
  const emoji = items[name]
  if (!emoji) {
    throw new Error('Emoji not found!')
  }

  return normalize(emoji)
}

export const emoji = {
  get
}
