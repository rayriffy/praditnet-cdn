import fs from 'fs'
import path from 'path'

import { uniq } from 'lodash'

import { cacheDirectory } from '../../constants/cacheDirectory'
import { finaleDirectory } from '../../constants/finaleDirectory'

import { promiseSpawn } from '../../functions/promiseSpawn'

import { Item } from './@types/Item'
import { Textout } from './@types/Textout'

// frame item category: 5

export const readFrame = async (textouts: Textout[], items: Item[]) => {
  const encryptedFramePath = path.join(
    finaleDirectory,
    'maimai',
    'data',
    'tables',
    'mmClctFrame.bin'
  )
  const decryptedFramenPath = path.join(cacheDirectory, 'mmClctFrame')

  try {
    await promiseSpawn(
      'python3',
      [
        'finaleDecrypt.py',
        `0x${process.env.FINALE_AES_KEY}`,
        `'${encryptedFramePath}'`,
        `'${decryptedFramenPath}'`,
      ],
      {
        cwd: path.join(__dirname, '../../tools'),
        shell: true,
      }
    )
  } catch (e) {
    console.warn('cannot decode mmClctFrame, attempting to read from cache')
  }

  if (!fs.existsSync(decryptedFramenPath)) {
    console.error('decoded mmClctFrame cache not found! crashing...')
    throw 'no-mmClctFrame'
  } else {
    const content = await fs.promises
      .readFile(decryptedFramenPath)
      .then(o => o.toString('utf16le'))

    const rows = `ID, NAME, Ver, 連動, ItemID, 名前, d_name`
      .split(',')
      .map(o => o.trim())
    const parsedLine = content
      .split('\n')
      .filter(line => line.startsWith('MMCLCTFRAME('))
      .map(o => o.trim())
      .map(line => {
        const decodedLine = /^MMCLCTFRAME\((.+)\) \//.exec(line)[1]
        return decodedLine.split(',').map(o => o.trim())
      })
      .map(blocks => {
        const mappedObject = Object.fromEntries(
          blocks.map((block, i) => [rows[i], block])
        )
        return mappedObject
      })
    
      const processedFrames = parsedLine.map(item => ({
        id: Number(item['ID']),
        name: textouts.find(o => o.key === item['名前']).value,
        description: items.find(o => o.id === Number(item['ItemID'])).text,
        price: items.find(o => o.id === Number(item['ItemID'])).price,
        genre: items.find(o => o.id === Number(item['ItemID'])).genre,
      })).filter(o => o.name !== 'フレーム設定なし')
    
      // console.log(uniq(parsedLine.map(item => items.find(o => o.id === Number(item['ItemID'])).category)))

      return processedFrames
  }
}
