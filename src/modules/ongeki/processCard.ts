import fs from 'fs'
import path from 'path'

import xml2js from 'xml2js'
import sharp from 'sharp'

import { ongekiDirectory } from '../../constants/ongekiDirectory'
import { publicDirectory } from '../../constants/publicDirectory'

import { buildAsset } from '../../functions/buildAsset'

export const processCard = async (option: string) => {
  const parser = new xml2js.Parser()

  const baseDataTypeDirectory = path.join(option, 'card')

  if (!fs.existsSync(baseDataTypeDirectory)) {
    console.log(`no card to process here! skipping...`)
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
        fs.readFileSync(path.join(itemDirectory, 'Card.xml'))
      )

      /**
       * Build payload
       */
      const payload = {
        id: Number(item.CardData.Name[0].id[0]),
        name: item.CardData.Name[0].str[0],
        nickname: item.CardData.NickName[0],
        characterId: Number(item.CardData.CharaID[0].id[0]),
        attribute: item.CardData.Attribute[0],
        rarity: item.CardData.Rarity[0],
        skillId: Number(item.CardData.SkillID[0].id[0]),
        chokaikaSkillId: Number(item.CardData.ChoKaikaSkillID[0].id[0]),
        cardNumber: item.CardData.CardNumberString[0],
      }

      /**
       * Build assets
       */
      const baseOutputDirectory = path.join(publicDirectory, 'ongeki', 'card')

      // full
      const fullCardPromise = buildAsset(
        path.join(
          ongekiDirectory.assets,
          `UI_Card_${payload.id.toString().padStart(6, '0')}.png`
        ),
        path.join(baseOutputDirectory, 'full', `${payload.id}.png`)
      )

      // background
      const backgroundCardPromise = buildAsset(
        path.join(
          ongekiDirectory.assets,
          `UI_Card_Chara_${payload.id.toString().padStart(6, '0')}_P.png`
        ),
        path.join(baseOutputDirectory, 'background', `${payload.id}.png`)
      )

      // deka
      const dekaCardPromise = buildAsset(
        path.join(
          ongekiDirectory.assets,
          `UI_Card_Chara_${payload.id.toString().padStart(6, '0')}.png`
        ),
        path.join(baseOutputDirectory, 'deka', `${payload.id}.png`)
      )

      // icon
      const iconCardPromise = buildAsset(
        path.join(
          ongekiDirectory.assets,
          `UI_Card_Icon_${payload.id.toString().padStart(6, '0')}.png`
        ),
        path.join(baseOutputDirectory, 'icon', `${payload.id}.png`)
      )

      await Promise.all([
        fullCardPromise,
        backgroundCardPromise,
        dekaCardPromise,
        iconCardPromise,
      ])

      return payload
    })
  )
}
