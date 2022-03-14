import fs from 'fs'
import path from 'path'

import xml2js from 'xml2js'

import { publicDirectory } from '../../constants/publicDirectory'
import { buildAsset } from '../../functions/buildAsset'
import { promiseSpawn } from '../../functions/promiseSpawn'

export const processFrame = async (chunithmOptionDirectory: string) => {
  const parser = new xml2js.Parser()

  const frameBaseDirectory = path.join(chunithmOptionDirectory, 'frame')

  if (!fs.existsSync(frameBaseDirectory)) {
    console.log('no frame to process here! skipping...')
    return []
  }

  const frameDirectories = fs
    .readdirSync(frameBaseDirectory)
    .filter(
      o =>
        !o.startsWith('.') &&
        fs.statSync(path.join(frameBaseDirectory, o)).isDirectory()
    )

  return await Promise.all(frameDirectories.map(async frameDirectoryName => {
    const frameDirectory = path.join(frameBaseDirectory, frameDirectoryName)
    const frame = await parser.parseStringPromise(fs.readFileSync(path.join(frameDirectory, 'Frame.xml')))

    // console.log(mapIcon.MapIconData.name)

    const payload = {
      id: Number(frame.FrameData.name[0].id[0]),
      name: frame.FrameData.name[0].str[0],
    }

    const jacketName = frame.FrameData.image[0].path[0]

    const outputDirectory = path.join(publicDirectory, 'chunithm', 'frame')
    const temporaryFilePath = path.join(outputDirectory, `${payload.id}_TMP.png`)
    const expectedFilePath = path.join(outputDirectory, `${payload.id}.png`)

    if (!fs.existsSync(outputDirectory)) {
      await fs.promises.mkdir(outputDirectory, {
        recursive: true,
      })
    }

    if (!fs.existsSync(expectedFilePath)) {
      await promiseSpawn('convert', [
        `'${path.join(frameDirectory, jacketName)}'`,
        `'${temporaryFilePath}'`,
      ], {
        shell: true,
      })

      await buildAsset(
        temporaryFilePath,
        expectedFilePath,
      )
      fs.rmSync(temporaryFilePath, {
        force: true
      })
    }

    return payload
  }))
}
