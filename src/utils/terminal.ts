function clear() {
  process.stdout.write('\x1bc')
}

export const terminal = {
  clear
}

export default terminal
