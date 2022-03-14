import fs from 'fs'
import path from 'path'

import xml2js from 'xml2js'
import { ongekiDirectory } from '../../constants/ongekiDirectory'
import { publicDirectory } from '../../constants/publicDirectory'
import { buildAsset } from '../../functions/buildAsset'

export const processNameplate = async (option: string) => {
  const parser = new xml2js.Parser()

  const baseDataTypeDirectory = path.join(option, 'nameplate')

  if (!fs.existsSync(baseDataTypeDirectory)) {
    console.log(`no nameplate to process here! skipping...`)
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
        fs.readFileSync(path.join(itemDirectory, 'NamePlate.xml'))
      )

      /**
       * Build payload
       */
      const payload = {
        id: Number(item.NamePlateData.Name[0].id[0]),
        name: item.NamePlateData.Name[0].str[0],
      }

      const baseOutputDirectory = path.join(publicDirectory, 'ongeki', 'nameplate')
      await buildAsset(
        path.join(
          ongekiDirectory.assets,
          `UI_UserPlate_Icon_${payload.id.toString().padStart(6, '0')}.png`,
        ),
        path.join(baseOutputDirectory, `${payload.id}.png`)
      )

      return payload
    })
  )
}
