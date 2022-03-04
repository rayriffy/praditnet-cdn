import fs from 'fs'
import path from 'path'

import xml2js from 'xml2js'

import { publicDirectory } from '../../constants/publicDirectory'
import { promiseSpawn } from '../../functions/promiseSpawn'



export const processMusic = async (chunithmOptionDirectory: string) => {
  const parser = new xml2js.Parser()

  const musicBaseDirectory = path.join(chunithmOptionDirectory, 'music')

  if (!fs.existsSync(musicBaseDirectory)) {
    console.log('no music to process here! skipping...')
    return []
  }

  const musicDirectories = fs
    .readdirSync(musicBaseDirectory)
    .filter(
      o =>
        !o.startsWith('.') &&
        fs.statSync(path.join(musicBaseDirectory, o)).isDirectory()
    )

  return await Promise.all(musicDirectories.map(async musicDirectoryName => {
    const musicDirectory = path.join(musicBaseDirectory, musicDirectoryName)
    const music = await parser.parseStringPromise(fs.readFileSync(path.join(musicDirectory, 'Music.xml')))

    const parseMusicFumenDataLevel = musicFumenData => {
      const level = musicFumenData.level[0]
      const levelDecimal = musicFumenData.levelDecimal[0]
      
      return Number(`${level}.${levelDecimal}`)
    }

    const payload = {
      id: Number(music.MusicData.name[0].id[0]),
      title: music.MusicData.name[0].str[0],
      artist: music.MusicData.artistName[0].str[0],
      level_basic: Number(parseMusicFumenDataLevel(music.MusicData.fumens[0].MusicFumenData[0])),
      level_advanced: Number(parseMusicFumenDataLevel(music.MusicData.fumens[0].MusicFumenData[1])),
      level_expert: Number(parseMusicFumenDataLevel(music.MusicData.fumens[0].MusicFumenData[2])),
      level_master: Number(parseMusicFumenDataLevel(music.MusicData.fumens[0].MusicFumenData[3])),
      level_ultima: Number(parseMusicFumenDataLevel(music.MusicData.fumens[0].MusicFumenData[4])),
      genre: Number(music.MusicData.genreNames[0].list[0].StringID[0].id[0]),
      // genreName: music.MusicData.genreNames[0].list[0].StringID[0].str[0],
    }

    const jacketName = music.MusicData.jaketFile[0].path[0]

    const outputDirectory = path.join(publicDirectory, 'chunithm', 'jacket')
    const expectedFilePath = path.join(outputDirectory, `${payload.id}.png`)

    if (!fs.existsSync(outputDirectory)) {
      await fs.promises.mkdir(outputDirectory, {
        recursive: true,
      })
    }

    if (!fs.existsSync(expectedFilePath)) {
      await promiseSpawn('convert', [
        `'${path.join(musicDirectory, jacketName)}'`,
        `'${expectedFilePath}'`,
      ], {
        shell: true,
      })
    }

    return payload
  }))
}
