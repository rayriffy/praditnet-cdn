import fs from 'fs'
import path from 'path'

import xml2js from 'xml2js'

import { publicDirectory } from '../../constants/publicDirectory'
import { buildAsset } from '../../functions/buildAsset'
import { promiseSpawn } from '../../functions/promiseSpawn'

export const processNameplate = async (chunithmOptionDirectory: string) => {
  const parser = new xml2js.Parser()

  const namePlateBaseDirectory = path.join(chunithmOptionDirectory, 'namePlate')

  if (!fs.existsSync(namePlateBaseDirectory)) {
    console.log('no namePlate to process here! skipping...')
    return []
  }

  const namePlateDirectories = fs
    .readdirSync(namePlateBaseDirectory)
    .filter(
      o =>
        !o.startsWith('.') &&
        fs.statSync(path.join(namePlateBaseDirectory, o)).isDirectory()
    )

  return await Promise.all(namePlateDirectories.map(async namePlateDirectoryName => {
    const namePlateDirectory = path.join(namePlateBaseDirectory, namePlateDirectoryName)
    const namePlate = await parser.parseStringPromise(fs.readFileSync(path.join(namePlateDirectory, 'NamePlate.xml')))

    const payload = {
      id: Number(namePlate.NamePlateData.name[0].id[0]),
      name: namePlate.NamePlateData.name[0].str[0]
    }

    const jacketName = namePlate.NamePlateData.image[0].path[0]

    const outputDirectory = path.join(publicDirectory, 'chunithm', 'namePlate')
    const temporaryFilePath = path.join(outputDirectory, `${payload.id}_TMP.png`)
    const expectedFilePath = path.join(outputDirectory, `${payload.id}.png`)

    if (!fs.existsSync(outputDirectory)) {
      await fs.promises.mkdir(outputDirectory, {
        recursive: true,
      })
    }

    if (!fs.existsSync(expectedFilePath)) {
      await promiseSpawn('convert', [
        `'${path.join(namePlateDirectory, jacketName)}'`,
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
