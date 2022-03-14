import fs from 'fs'
import path from 'path'

import xml2js from 'xml2js'

import { publicDirectory } from '../../constants/publicDirectory'
import { buildAsset } from '../../functions/buildAsset'
import { promiseSpawn } from '../../functions/promiseSpawn'

export const processAvatarAccessory = async (
  chunithmOptionDirectory: string
) => {
  const parser = new xml2js.Parser()

  const avatarAccessoryBaseDirectory = path.join(
    chunithmOptionDirectory,
    'avatarAccessory'
  )

  if (!fs.existsSync(avatarAccessoryBaseDirectory)) {
    console.log('no avatarAccessory to process here! skipping...')
    return []
  }

  const avatarAccessoryDirectories = fs
    .readdirSync(avatarAccessoryBaseDirectory)
    .filter(
      o =>
        !o.startsWith('.') &&
        fs.statSync(path.join(avatarAccessoryBaseDirectory, o)).isDirectory()
    )

  return await Promise.all(
    avatarAccessoryDirectories.map(async avatarAccessoryDirectoryName => {
      const avatarAccessoryDirectory = path.join(
        avatarAccessoryBaseDirectory,
        avatarAccessoryDirectoryName
      )
      const avatarAccessory = await parser.parseStringPromise(
        fs.readFileSync(
          path.join(avatarAccessoryDirectory, 'AvatarAccessory.xml')
        )
      )

      const payload = {
        id: Number(avatarAccessory.AvatarAccessoryData.name[0].id[0]),
        name: avatarAccessory.AvatarAccessoryData.name[0].str[0],
        category: Number(avatarAccessory.AvatarAccessoryData.category[0]),
      }

      const jacketName = avatarAccessory.AvatarAccessoryData.image[0].path[0]

      const outputDirectory = path.join(
        publicDirectory,
        'chunithm',
        'avatarAccessory'
      )
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
            `'${path.join(avatarAccessoryDirectory, jacketName)}'`,
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
