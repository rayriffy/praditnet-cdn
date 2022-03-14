import fs from 'fs'
import path from 'path'

import { finaleDirectory } from '../../constants/finaleDirectory'
import { publicDirectory } from '../../constants/publicDirectory'
import { buildAsset } from '../../functions/buildAsset'
import { promiseSpawn } from '../../functions/promiseSpawn'

export const processIconAssets = async () => {
  const iconDirectory = path.join(
    finaleDirectory,
    'maimai',
    'data',
    'sprite',
    'collection_icon'
  )
  const iconOutputDirectory = path.join(publicDirectory, 'finale', 'icon')

  const iconFiles = await fs.promises.readdir(iconDirectory)
  const qualifiedIconFiles = iconFiles.filter(
    o => o.endsWith('.dds') && !o.startsWith('.')
  )

  for await (const iconFile of qualifiedIconFiles) {
    const iconId = Number(iconFile.split('_')[0].replace('icon', ''))

    const iconPath = path.join(iconDirectory, iconFile)
    const temporaryFilePath = path.join(
      iconOutputDirectory,
      `${iconId}_TMP.png`
    )
    const convertedIconPath = path.join(iconOutputDirectory, `${iconId}.png`)

    if (!fs.existsSync(iconOutputDirectory)) {
      await fs.promises.mkdir(iconOutputDirectory, { recursive: true })
    }

    if (!fs.existsSync(convertedIconPath)) {
      await promiseSpawn(
        'convert',
        [`'${iconPath}'`, `'${convertedIconPath}'`],
        {
          shell: true,
        }
      )

      await buildAsset(temporaryFilePath, convertedIconPath)
      fs.rmSync(temporaryFilePath, {
        force: true,
      })
    }
  }
}
