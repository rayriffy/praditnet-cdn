import fs from 'fs'
import path from 'path'

import { finaleDirectory } from "../../constants/finaleDirectory"
import { publicDirectory } from '../../constants/publicDirectory'
import { promiseSpawn } from '../../functions/promiseSpawn'

export const processNameplateAssets = async () => {
  const nameplateDirectory = path.join(finaleDirectory, 'maimai', 'data', 'sprite', 'collection_nameplate')
  const nameplateOutputDirectory = path.join(publicDirectory, 'finale', 'nameplate')

  const nameplateFiles = await fs.promises.readdir(nameplateDirectory)
  const qualifiedNameplateFiles = nameplateFiles.filter(o => o.endsWith('.dds') && !o.startsWith('.'))

  for await (const nameplateFile of qualifiedNameplateFiles) {
    const nameplateId = Number(nameplateFile.split('_')[0].replace('namep', ''))
    
    const nameplatePath = path.join(nameplateDirectory, nameplateFile)
    const convertedNameplatePath = path.join(nameplateOutputDirectory, `${nameplateId}.png`)

    if (!fs.existsSync(nameplateOutputDirectory)) {
      await fs.promises.mkdir(nameplateOutputDirectory, { recursive: true })
    }

    if (!fs.existsSync(convertedNameplatePath)) {
      await promiseSpawn('convert', [
        `'${nameplatePath}'`,
        `'${convertedNameplatePath}'`,
      ], {
        shell: true,
      })
    }
  }
}