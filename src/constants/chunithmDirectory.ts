import fs from 'fs'
import path from 'path'

const basePath = '/Volumes/Arcade/CHUNITHM NEW!! - Cabs'

export const chunithmDirectory = {
  app: basePath,
  options: [
    path.join(basePath, 'data', 'A000'),
    ...fs
      .readdirSync(path.join(basePath, 'bin/option'))
      .filter(
        o =>
          !o.startsWith('.') &&
          fs.statSync(path.join(basePath, 'bin/option', o)).isDirectory()
      )
      .map(o => path.join(basePath, 'bin/option', o)),
  ],
  // option: path.join(basePath, 'bin/option', 'A141'),
}
