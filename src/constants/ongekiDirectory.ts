import fs from 'fs'
import path from 'path'

const basePath = '/Volumes/Arcade/ONGEKI/1.35.00 - ONGEKI bright memory/App'

export const ongekiDirectory = {
  app: basePath,
  assets: path.join(basePath, '../Assets/Texture2D'),
  options: [
    path.join(basePath, 'package/mu3_Data/StreamingAssets/GameData/A000'),
    ...(fs.existsSync(path.join(basePath, 'package/option'))
      ? fs
          .readdirSync(path.join(basePath, 'package/option'))
          .filter(
            o =>
              !o.startsWith('.') &&
              fs
                .statSync(path.join(basePath, 'package/option', o))
                .isDirectory()
          )
          .map(o => path.join(basePath, 'package/option', o))
      : []),
  ],
}
