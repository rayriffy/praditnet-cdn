import fs from 'fs'
import path from 'path'

import { finaleDirectory } from '../../constants/finaleDirectory'
import { publicDirectory } from '../../constants/publicDirectory'
import { buildAsset } from '../../functions/buildAsset'
import { promiseSpawn } from '../../functions/promiseSpawn'

export const processJacketAssets = async () => {
  const jacketDirectory = path.join(
    finaleDirectory,
    'maimai',
    'data',
    'sprite',
    'movie_selector'
  )
  const jacketOutputDirectory = path.join(publicDirectory, 'finale', 'jacket')

  const jacketFiles = await fs.promises.readdir(jacketDirectory)
  const qualifiedJacketFiles = jacketFiles
    .filter(o => o.endsWith('.dds') && !o.startsWith('.'))
    .filter(o => Number.isSafeInteger(Number(o[0])))

  for await (const jacketFile of qualifiedJacketFiles) {
    const jacketId = Number(jacketFile.split('_')[0])

    const jacketPath = path.join(jacketDirectory, jacketFile)
    const temporaryFilePath = path.join(
      jacketOutputDirectory,
      `${jacketId}_TMP.png`
    )
    const convertedJacketPath = path.join(
      jacketOutputDirectory,
      `${jacketId}.png`
    )

    if (!fs.existsSync(jacketOutputDirectory)) {
      await fs.promises.mkdir(jacketOutputDirectory, { recursive: true })
    }

    if (!fs.existsSync(convertedJacketPath)) {
      await promiseSpawn(
        'convert',
        [`'${jacketPath}'`, `'${temporaryFilePath}'`],
        {
          shell: true,
        }
      )

      await buildAsset(temporaryFilePath, convertedJacketPath)
      fs.rmSync(temporaryFilePath, {
        force: true,
      })
    }
  }
}
