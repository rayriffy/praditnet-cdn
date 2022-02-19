import fs from 'fs'
import path from 'path'

import { finaleDirectory } from "../../constants/finaleDirectory"
import { publicDirectory } from '../../constants/publicDirectory'
import { promiseSpawn } from '../../functions/promiseSpawn'

export const processFrameMiniAssets = async () => {
  const frameDirectory = path.join(finaleDirectory, 'maimai', 'data', 'sprite', 'collection_frame_mini')
  const frameOutputDirectory = path.join(publicDirectory, 'finale', 'frameMini')

  const frameFiles = await fs.promises.readdir(frameDirectory)
  const qualifiedFrameFiles = frameFiles.filter(o => o.endsWith('.dds') && !o.startsWith('.'))

  for await (const frameFile of qualifiedFrameFiles) {
    const frameId = Number(frameFile.split('_')[0].replace('frame', ''))
    
    const framePath = path.join(frameDirectory, frameFile)
    const convertedFramePath = path.join(frameOutputDirectory, `${frameId}.png`)

    if (!fs.existsSync(frameOutputDirectory)) {
      await fs.promises.mkdir(frameOutputDirectory, { recursive: true })
    }

    if (!fs.existsSync(convertedFramePath)) {
      await promiseSpawn('convert', [
        `'${framePath}'`,
        `'${convertedFramePath}'`,
      ], {
        shell: true,
      })
    }
  }
}
