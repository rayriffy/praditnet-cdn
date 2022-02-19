import fs from 'fs'
import path from 'path'

import { cacheDirectory } from '../../constants/cacheDirectory'
import { finaleDirectory } from '../../constants/finaleDirectory'

import { promiseSpawn } from '../../functions/promiseSpawn'

import { Textout } from './@types/Textout'

export const readTextout = async (): Promise<Textout[]> => {
  const encryptedTextoutPath = path.join(
    finaleDirectory,
    'maimai',
    'data',
    'tables',
    'mmtextout_jp.bin'
  )
  const decryptedTextoutPath = path.join(cacheDirectory, 'mmtextout_jp')

  try {
    await promiseSpawn(
      'python3',
      [
        'finaleDecrypt.py',
        `0x${process.env.FINALE_AES_KEY}`,
        `'${encryptedTextoutPath}'`,
        `'${decryptedTextoutPath}'`,
      ],
      {
        cwd: path.join(__dirname, '../../tools'),
        shell: true,
      }
    )
  } catch (e) {
    console.warn('cannot decode mmtextout_jp, attempting to read from cache')
  }

  if (!fs.existsSync(decryptedTextoutPath)) {
    console.error('decoded mmtextout_jp cache not found! crashing...')
    throw 'no-mmtextout_jp'
  } else {
    const content = await fs.promises
      .readFile(decryptedTextoutPath)
      .then(o => o.toString('utf16le'))
    const parsedLine = content
      .split('\n')
      .filter(line => line.startsWith('MMTEXTOUT('))
      .map(line => {
        const filteredLine = /^MMTEXTOUT\((.+)\)$/
          .exec(line.trim())[1]
          .split(',L')
          .map(block => (/^L?\"(.+)\"$/.exec(block.trim()) ?? ['', ''])[1])
        return {
          key: filteredLine[0],
          value: filteredLine[1],
        }
      })

    return parsedLine
  }
}
