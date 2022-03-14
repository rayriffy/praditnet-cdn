import fs from 'fs'
import path from 'path'

import xml2js from 'xml2js'
import { extractorDirectory } from '../../constants/extractorDirectory'

import { publicDirectory } from '../../constants/publicDirectory'
import { buildAsset } from '../../functions/buildAsset'
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

    /**
     * Extract system voice icon
     */
    const outputIconDirectory = path.join(publicDirectory, 'chunithm', 'systemVoice', 'icon')
    const temporaryFilePath = path.join(outputIconDirectory, `${payload.id}_TMP.png`)
    const expectedIconFilePath = path.join(outputIconDirectory, `${payload.id}.png`)

    if (!fs.existsSync(outputIconDirectory)) {
      await fs.promises.mkdir(outputIconDirectory, {
        recursive: true,
      })
    }

    if (!fs.existsSync(expectedIconFilePath)) {
      await promiseSpawn('convert', [
        `'${path.join(systemVoiceDirectory, jacketName)}'`,
        `'${temporaryFilePath}'`,
      ], {
        shell: true,
      })

      await buildAsset(
        temporaryFilePath,
        expectedIconFilePath
      )
      fs.rmSync(temporaryFilePath, {
        force: true
      })
    }

    /**
     * Get sample audio
     */
    const targetSystemVoiceSampleFilePath = path.join(extractorDirectory, 'output', 'chusan', 'sound', 'systemvoice', payload.id.toString(), 'dat_000034.wav')
    const outputSystemVoiceSampleDirectory = path.join(publicDirectory, 'chunithm', 'systemVoice', 'sample')
    const expectedSystemVoiceSampleFilePath = path.join(outputSystemVoiceSampleDirectory, `${payload.id}.mp3`)

    if (!fs.existsSync(outputSystemVoiceSampleDirectory)) {
      await fs.promises.mkdir(outputSystemVoiceSampleDirectory, {
        recursive: true,
      })
    }

    if (!fs.existsSync(expectedSystemVoiceSampleFilePath)) {
      await promiseSpawn('ffmpeg', [
        '-i',
        `'${targetSystemVoiceSampleFilePath}'`,
        '-acodec libmp3lame',
        `'${expectedSystemVoiceSampleFilePath}'`,
      ], {
        shell: true,
      })
    }

    return payload
  }))
}
