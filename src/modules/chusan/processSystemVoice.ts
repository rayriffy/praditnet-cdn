import fs from 'fs'
import path from 'path'

import xml2js from 'xml2js'

import { publicDirectory } from '../../constants/publicDirectory'
import { promiseSpawn } from '../../functions/promiseSpawn'

export const processSystemVoice = async (chunithmOptionDirectory: string) => {
  const parser = new xml2js.Parser()

  const systemVoiceBaseDirectory = path.join(chunithmOptionDirectory, 'systemVoice')

  if (!fs.existsSync(systemVoiceBaseDirectory)) {
    console.log('no systemVoice to process here! skipping...')
    return []
  }

  const systemVoiceDirectories = fs
    .readdirSync(systemVoiceBaseDirectory)
    .filter(
      o =>
        !o.startsWith('.') &&
        fs.statSync(path.join(systemVoiceBaseDirectory, o)).isDirectory()
    )

  return await Promise.all(systemVoiceDirectories.map(async systemVoiceDirectoryName => {
    const systemVoiceDirectory = path.join(systemVoiceBaseDirectory, systemVoiceDirectoryName)
    const systemVoice = await parser.parseStringPromise(fs.readFileSync(path.join(systemVoiceDirectory, 'SystemVoice.xml')))

    const payload = {
      id: Number(systemVoice.SystemVoiceData.name[0].id[0]),
      name: systemVoice.SystemVoiceData.name[0].str[0]
    }

    const jacketName = systemVoice.SystemVoiceData.image[0].path[0]

    const outputDirectory = path.join(publicDirectory, 'chunithm', 'systemVoice')
    const expectedFilePath = path.join(outputDirectory, `${payload.id}.png`)

    if (!fs.existsSync(outputDirectory)) {
      await fs.promises.mkdir(outputDirectory, {
        recursive: true,
      })
    }

    if (!fs.existsSync(expectedFilePath)) {
      await promiseSpawn('convert', [
        `'${path.join(systemVoiceDirectory, jacketName)}'`,
        `'${expectedFilePath}'`,
      ], {
        shell: true,
      })
    }

    return payload
  }))
}
