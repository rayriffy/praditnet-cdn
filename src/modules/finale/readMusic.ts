import fs from 'fs'
import path from 'path'

import { cacheDirectory } from '../../constants/cacheDirectory'
import { finaleDirectory } from '../../constants/finaleDirectory'

import { promiseSpawn } from '../../functions/promiseSpawn'
import { Music } from './@types/Music'

import { Textout } from './@types/Textout'

export const readMusic = async (textouts: Textout[]): Promise<Music[]> => {
  const encryptedMusicPath = path.join(
    finaleDirectory,
    'maimai',
    'data',
    'tables',
    'mmMusic.bin'
  )
  const decryptedMusicPath = path.join(cacheDirectory, 'mmMusic')

  try {
    await promiseSpawn(
      'python3',
      [
        'finaleDecrypt.py',
        `0x${process.env.FINALE_AES_KEY}`,
        `'${encryptedMusicPath}'`,
        `'${decryptedMusicPath}'`,
      ],
      {
        cwd: path.join(__dirname, '../../tools'),
        shell: true,
      }
    )
  } catch (e) {
    console.warn('cannot decode mmMusic, attempting to read from cache')
  }

  if (!fs.existsSync(decryptedMusicPath)) {
    console.error('decoded mmMusic cache not found! crashing...')
    throw 'no-mmMusic'
  } else {
    const content = await fs.promises
      .readFile(decryptedMusicPath)
      .then(o => o.toString('utf16le'))

    const rows = `ID, NAME, Ver, SubCate, BPM, SortID, ドレス, 暗黒, mile, VL, Event, Rec, PVStart, PVEnd, 曲長さ, オフRanking, AD Def, ReMaster, 特殊PV, チャレンジトラック, ボーナス, GenreID, タイトル, アーティスト, sort_jp_index, sort_ex_index, filename`.split(',').map(o => o.trim())
    const parsedLine = content
      .split('\n')
      .filter(line => line.startsWith('MMMUSIC('))
      .map(o => o.trim())
      .map(line => {
        const decodedLine = /^MMMUSIC\((.+)\)/.exec(line)[1]
        return decodedLine.split(',').map(o => o.trim())
      })
      .map(blocks => {
        const mappedObject = Object.fromEntries(blocks.map((block, i) => [rows[i], block]))
        return mappedObject
      })
    
    const processedMusic = parsedLine.map(item => {
      return {
        id: Number(item['ID']),
        title: textouts.find(o => o.key === item['タイトル']).value,
        artist: textouts.find(o => o.key === item['アーティスト']).value,
      }
    })

    return processedMusic
  }
}
