import fs from 'fs'
import path from 'path'

import xml2js from 'xml2js'

export const processSkill = async (option: string) => {
  const parser = new xml2js.Parser()

  const baseDataTypeDirectory = path.join(option, 'skill')

  if (!fs.existsSync(baseDataTypeDirectory)) {
    console.log(`no skill to process here! skipping...`)
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
        fs.readFileSync(path.join(itemDirectory, 'Skill.xml'))
      )

      /**
       * Build payload
       */
      const payload = {
        id: Number(item.SkillData.Name[0].id[0]),
        name: item.SkillData.Name[0].str[0],
        description: item.SkillData.Info[0].str[0],
        category: item.SkillData.CategoryIcon[0],
      }

      return payload
    })
  )
}
