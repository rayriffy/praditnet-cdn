import fs from 'fs'
import path from 'path'

import sharp from 'sharp'

export const buildAsset = async (
  sourceFilePath: string,
  targetFilePath: string
) => {
  if (!fs.existsSync(targetFilePath)) {
    if (!fs.existsSync(path.dirname(targetFilePath))) {
      await fs.promises.mkdir(path.dirname(targetFilePath), {
        recursive: true,
      })
    }

    try {
      await sharp(sourceFilePath)
        .png({
          progressive: true,
          palette: true,
          compressionLevel: 9,
          effort: 7,
          quality: 98,
        })
        .toFile(targetFilePath)
    } catch (e) {
      if (fs.existsSync(targetFilePath)) {
        await fs.promises.rm(targetFilePath)
      }
    }
  }
}
