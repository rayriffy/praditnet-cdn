import fs from 'fs'
import path from 'path'

import xml2js from 'xml2js'

export const processTrophy = async (option: string) => {
  const parser = new xml2js.Parser()

  const baseDataTypeDirectory = path.join(option, 'trophy')

  if (!fs.existsSync(baseDataTypeDirectory)) {
    console.log(`no trophy to process here! skipping...`)
    return []
  }

  const itemDirectories = fs
    .readdirSync(baseDataTypeDirectory)
    .filter(
      o =>
        fs.statSync(path.join(baseDataTypeDirectory, o)).isDirectory() &&
        !o.startsWith('.')
    )
  const sampleItemDirectories = [itemDirectories[0]]

  return await Promise.all(
    itemDirectories.map(async itemDirectoryName => {
      const itemDirectory = path.join(baseDataTypeDirectory, itemDirectoryName)
      const item = await parser.parseStringPromise(
        fs.readFileSync(path.join(itemDirectory, 'Trophy.xml'))
      )

      /**
       * Build payload
       */
      const payload = {
        id: Number(item.TrophyData.Name[0].id[0]),
        name: item.TrophyData.Name[0].str[0],
        description: item.TrophyData.Description[0],
        rarity: item.TrophyData.TrophyRarityType[0],
      }

      return payload
    })
  )
}
