import fs from 'fs'
import path from 'path'

import xml2js from 'xml2js'

import { publicDirectory } from '../../constants/publicDirectory'
import { buildAsset } from '../../functions/buildAsset'
import { promiseSpawn } from '../../functions/promiseSpawn'

import { DDSImage } from './@types/DDSImage'

export const processCharacter = async (chunithmOptionDirectory: string, ddsItems: DDSImage[]) => {
  const parser = new xml2js.Parser()

  const characterBaseDirectory = path.join(chunithmOptionDirectory, 'chara')

  if (!fs.existsSync(characterBaseDirectory)) {
    console.log('no character to process here! skipping...')
    return []
  }

  const characterDirectories = fs
    .readdirSync(characterBaseDirectory)
    .filter(
      o =>
        !o.startsWith('.') &&
        fs.statSync(path.join(characterBaseDirectory, o)).isDirectory()
    )
  
  // read character
  return await Promise.all(characterDirectories.map(async characterDirectoryName => {
    const characterDirectory = path.join(characterBaseDirectory, characterDirectoryName)
    const character = await parser.parseStringPromise(fs.readFileSync(path.join(characterDirectory, 'Chara.xml')))

    const payload = {
      id: Number(character.CharaData.name[0].id[0]),
      name: character.CharaData.name[0].str[0],
      illustrator: character.CharaData.illustratorName[0].str[0],
      works: character.CharaData.works[0].str[0],
    }

    if (ddsItems.find(o => o.name === character.CharaData.defaultImages[0].str[0]) !== undefined) {
      await Promise.all(Object.entries(ddsItems.find(o => o.name === character.CharaData.defaultImages[0].str[0]).file).map(async ([key, value]) => {
        // render file to output
        const outputDirectory = path.join(publicDirectory, 'chunithm', 'character', key)
        const temporaryFilePath = path.join(outputDirectory, `${value.fileName}_TMP.png`)
        const expectedFilePath = path.join(outputDirectory, `${payload.id}.png`)
    
        if (!fs.existsSync(outputDirectory)) {
          await fs.promises.mkdir(outputDirectory, {
            recursive: true,
          })
        }
    
        if (!fs.existsSync(expectedFilePath)) {
          await promiseSpawn('convert', [
            `'${value.fullPath}'`,
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
      }))
    }

    return payload
  }))
}
