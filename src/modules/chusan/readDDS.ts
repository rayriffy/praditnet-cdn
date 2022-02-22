import fs from 'fs'
import path from 'path'

import xml2js from 'xml2js'

import { DDSImage } from './@types/DDSImage'

export const readDDS = async (chunithmOptionDirectory: string): Promise<DDSImage[]> => {
  const parser = new xml2js.Parser()

  const ddsBaseDirectory = path.join(chunithmOptionDirectory, 'ddsImage')

  if (!fs.existsSync(ddsBaseDirectory)) {
    console.log('no ddsImage to process here! skipping...')
    return []
  }

  const ddsDirectories = fs
    .readdirSync(ddsBaseDirectory)
    .filter(
      o =>
        !o.startsWith('.') &&
        fs.statSync(path.join(ddsBaseDirectory, o)).isDirectory()
    )

  // read direcotries
  return await Promise.all(
    ddsDirectories.map(async ddsDirectoryName => {
      const ddsDirectory = path.join(ddsBaseDirectory, ddsDirectoryName)
      const dds = await parser.parseStringPromise(
        fs.readFileSync(path.join(ddsDirectory, 'DDSImage.xml'))
      )

      const payload = {
        name: dds.DDSImageData.name[0].str[0],
        file: {
          icon: {
            fileName: dds.DDSImageData.ddsFile2[0].path[0],
            fullPath: path.join(ddsDirectory, dds.DDSImageData.ddsFile2[0].path[0]),
          },
          deka: {
            fileName: dds.DDSImageData.ddsFile0[0].path[0],
            fullPath: path.join(ddsDirectory, dds.DDSImageData.ddsFile0[0].path[0]),
          },
        },
      }

      return payload
    })
  )
}
