import fs from 'fs'
import path from 'path'

import xml2js from 'xml2js'

import { publicDirectory } from '../../constants/publicDirectory'
import { buildAsset } from '../../functions/buildAsset'
import { promiseSpawn } from '../../functions/promiseSpawn'

export const processMapIcon = async (chunithmOptionDirectory: string) => {
  const parser = new xml2js.Parser()

  const mapIconBaseDirectory = path.join(chunithmOptionDirectory, 'mapIcon')

  if (!fs.existsSync(mapIconBaseDirectory)) {
    console.log('no mapIcon to process here! skipping...')
    return []
  }

  const mapIconDirectories = fs
    .readdirSync(mapIconBaseDirectory)
    .filter(
      o =>
        !o.startsWith('.') &&
        fs.statSync(path.join(mapIconBaseDirectory, o)).isDirectory()
    )

  return await Promise.all(
    mapIconDirectories.map(async mapIconDirectoryName => {
      const mapIconDirectory = path.join(
        mapIconBaseDirectory,
        mapIconDirectoryName
      )
      const mapIcon = await parser.parseStringPromise(
        fs.readFileSync(path.join(mapIconDirectory, 'MapIcon.xml'))
      )

      // console.log(mapIcon.MapIconData.name)

      const payload = {
        id: Number(mapIcon.MapIconData.name[0].id[0]),
        name: mapIcon.MapIconData.name[0].str[0],
      }

      const jacketName = mapIcon.MapIconData.image[0].path[0]

      const outputDirectory = path.join(publicDirectory, 'chunithm', 'mapIcon')
      const temporaryFilePath = path.join(
        outputDirectory,
        `${payload.id}_TMP.png`
      )
      const expectedFilePath = path.join(outputDirectory, `${payload.id}.png`)

      if (!fs.existsSync(outputDirectory)) {
        await fs.promises.mkdir(outputDirectory, {
          recursive: true,
        })
      }

      if (!fs.existsSync(expectedFilePath)) {
        await promiseSpawn(
          'convert',
          [
            `'${path.join(mapIconDirectory, jacketName)}'`,
            `'${temporaryFilePath}'`,
          ],
          {
            shell: true,
          }
        )

        await buildAsset(temporaryFilePath, expectedFilePath)
        fs.rmSync(temporaryFilePath, {
          force: true,
        })
      }

      return payload
    })
  )
}
