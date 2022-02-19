import fs from 'fs'
import path from 'path'

import { cacheDirectory } from '../../constants/cacheDirectory'
import { finaleDirectory } from '../../constants/finaleDirectory'

import { promiseSpawn } from '../../functions/promiseSpawn'

import { Score } from './@types/Score'

const normalizeDifficulty = (difficulty: number): string =>
  difficulty === 1
    ? 'easy'
    : difficulty === 2
    ? 'basic'
    : difficulty === 3
    ? 'advanced'
    : difficulty === 4
    ? 'expert'
    : difficulty === 5
    ? 'master'
    : 'remaster'

export const readScore = async (): Promise<Score[]> => {
  const encryptedMusicPath = path.join(
    finaleDirectory,
    'maimai',
    'data',
    'tables',
    'mmScore.bin'
  )
  const decryptedMusicPath = path.join(cacheDirectory, 'mmScore')

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
    console.warn('cannot decode mmScore, attempting to read from cache')
  }

  if (!fs.existsSync(decryptedMusicPath)) {
    console.error('decoded mmScore cache not found! crashing...')
    throw 'no-mmScore'
  } else {
    const content = await fs.promises
      .readFile(decryptedMusicPath)
      .then(o => o.toString('utf16le'))

    const rows = `ID, NAME, LV, 譜面作者ID, 計算対象, safename`
      .split(',')
      .map(o => o.trim())
    const parsedLine = content
      .split('\n')
      .filter(line => line.startsWith('MMSCORE('))
      .map(o => o.trim())
      .map(line => {
        const decodedLine = /^MMSCORE\((.+)\)/.exec(line)[1]
        return decodedLine.split(',').map(o => o.trim())
      })
      .map(blocks => {
        const mappedObject = Object.fromEntries(
          blocks.map((block, i) => [rows[i], block])
        )
        return mappedObject
      })

    const processedScores = parsedLine.map(item => ({
      id: Number(item['ID']),
      name: item['NAME'],
      music: Number(item['NAME'].split('_')[1]),
      difficulty: Number(item['NAME'].split('_').reverse()[0]),
      level: Number(item['LV']),
      isUtage: item['計算対象'] === '0',
    }))

    return processedScores
  }
}
