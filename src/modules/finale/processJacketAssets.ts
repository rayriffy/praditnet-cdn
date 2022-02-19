import fs from 'fs'
import path from 'path'

import { finaleDirectory } from "../../constants/finaleDirectory"
import { publicDirectory } from '../../constants/publicDirectory'
import { promiseSpawn } from '../../functions/promiseSpawn'

export const processJacketAssets = async () => {
  const jacketDirectory = path.join(finaleDirectory, 'maimai', 'data', 'sprite', 'movie_selector')
  const jacketOutputDirectory = path.join(publicDirectory, 'finale', 'jacket')

  const jacketFiles = await fs.promises.readdir(jacketDirectory)
  const qualifiedJacketFiles = jacketFiles.filter(o => o.endsWith('.dds') && !o.startsWith('.')).filter(o => Number.isSafeInteger(Number(o[0])))

  for await (const jacketFile of qualifiedJacketFiles) {
    const jacketId = Number(jacketFile.split('_')[0])
    
    const jacketPath = path.join(jacketDirectory, jacketFile)
    const convertedJacketPath = path.join(jacketOutputDirectory, `${jacketId}.png`)

    if (!fs.existsSync(jacketOutputDirectory)) {
      await fs.promises.mkdir(jacketOutputDirectory, { recursive: true })
    }

    if (!fs.existsSync(convertedJacketPath)) {
      await promiseSpawn('convert', [
        `'${jacketPath}'`,
        `'${convertedJacketPath}'`,
      ], {
        shell: true,
      })
    }
  }
}
