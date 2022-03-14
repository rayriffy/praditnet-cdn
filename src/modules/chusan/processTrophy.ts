import fs from 'fs'
import path from 'path'

import xml2js from 'xml2js'

export const processTrophy = async (chunithmOptionDirectory: string) => {
  const parser = new xml2js.Parser()

  const trophyVoiceBaseDirectory = path.join(chunithmOptionDirectory, 'trophy')

  if (!fs.existsSync(trophyVoiceBaseDirectory)) {
    console.log('no trophy to process here! skipping...')
    return []
  }

  const trophyDirectories = fs
    .readdirSync(trophyVoiceBaseDirectory)
    .filter(
      o =>
        !o.startsWith('.') &&
        fs.statSync(path.join(trophyVoiceBaseDirectory, o)).isDirectory()
    )

  return await Promise.all(
    trophyDirectories.map(async trophyDirectoryName => {
      const trophyDirectory = path.join(
        trophyVoiceBaseDirectory,
        trophyDirectoryName
      )
      const trophy = await parser.parseStringPromise(
        fs.readFileSync(path.join(trophyDirectory, 'Trophy.xml'))
      )

      const payload = {
        id: Number(trophy.TrophyData.name[0].id[0]),
        name: trophy.TrophyData.name[0].str[0],
        description: trophy.TrophyData.explainText[0],
        rarity: Number(trophy.TrophyData.rareType[0]),
      }

      // console.log(payload)

      return payload
    })
  )
}
