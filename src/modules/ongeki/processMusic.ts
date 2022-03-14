import fs from 'fs'
import path from 'path'

import xml2js from 'xml2js'
import { ongekiDirectory } from '../../constants/ongekiDirectory'
import { publicDirectory } from '../../constants/publicDirectory'
import { buildAsset } from '../../functions/buildAsset'

export const processMusic = async (option: string) => {
  const parser = new xml2js.Parser()

  const baseDataTypeDirectory = path.join(option, 'music')

  if (!fs.existsSync(baseDataTypeDirectory)) {
    console.log(`no music to process here! skipping...`)
    return []
  }

  const itemDirectories = fs
    .readdirSync(baseDataTypeDirectory)
    .filter(
      o =>
        fs.statSync(path.join(baseDataTypeDirectory, o)).isDirectory() &&
        !o.startsWith('.')
    )
  // const sampleItemDirectories = [itemDirectories.reverse()[0]]

  return await Promise.all(
    itemDirectories.map(async itemDirectoryName => {
      const itemDirectory = path.join(baseDataTypeDirectory, itemDirectoryName)
      const item = await parser.parseStringPromise(
        fs.readFileSync(path.join(itemDirectory, 'Music.xml'))
      )

      /**
       * Build payload
       */
      const fumenToDifficulty = (fumenData: any) => {
        try {
          return Number(
            `${fumenData.FumenConstIntegerPart[0]}.${fumenData.FumenConstFractionalPart[0]}`
          )
        } catch (e) {
          return 0
        }
      }

      const payload = {
        id: Number(item.MusicData.Name[0].id[0]),
        name: item.MusicData.Name[0].str[0],
        artist: item.MusicData.ArtistName[0].str[0],
        level_basic: fumenToDifficulty(
          item.MusicData.FumenData[0].FumenData[0]
        ),
        level_advanced: fumenToDifficulty(
          item.MusicData.FumenData[0].FumenData[1]
        ),
        level_expert: fumenToDifficulty(
          item.MusicData.FumenData[0].FumenData[2]
        ),
        level_master: fumenToDifficulty(
          item.MusicData.FumenData[0].FumenData[3]
        ),
        level_lunatic: fumenToDifficulty(
          item.MusicData.FumenData[0].FumenData[4]
        ),
        genre: Number(item.MusicData.Genre[0].id[0]),
      }

      const baseOutputDirectory = path.join(publicDirectory, 'ongeki', 'jacket')
      await buildAsset(
        path.join(
          ongekiDirectory.assets,
          `UI_Jacket_${payload.id.toString().padStart(4, '0')}.png`
        ),
        path.join(baseOutputDirectory, `${payload.id}.png`)
      )

      return payload
    })
  )
}
