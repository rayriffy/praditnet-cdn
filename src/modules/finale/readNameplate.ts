import fs from 'fs'
import path from 'path'

import { uniq } from 'lodash'

import { cacheDirectory } from '../../constants/cacheDirectory'
import { finaleDirectory } from '../../constants/finaleDirectory'

import { promiseSpawn } from '../../functions/promiseSpawn'

import { Item } from './@types/Item'
import { Textout } from './@types/Textout'

// name plate item category: 4

export const readNameplate = async (textouts: Textout[], items: Item[]) => {
  const encryptedNameplatePath = path.join(
    finaleDirectory,
    'maimai',
    'data',
    'tables',
    'mmClctPlate.bin'
  )
  const decryptedNameplatePath = path.join(cacheDirectory, 'mmClctPlate')

  try {
    await promiseSpawn(
      'python3',
      [
        'finaleDecrypt.py',
        `0x${process.env.FINALE_AES_KEY}`,
        `'${encryptedNameplatePath}'`,
        `'${decryptedNameplatePath}'`,
      ],
      {
        cwd: path.join(__dirname, '../../tools'),
        shell: true,
      }
    )
  } catch (e) {
    console.warn('cannot decode mmClctPlate, attempting to read from cache')
  }

  if (!fs.existsSync(decryptedNameplatePath)) {
    console.error('decoded mmClctPlate cache not found! crashing...')
    throw 'no-mmClctPlate'
  } else {
    const content = await fs.promises
      .readFile(decryptedNameplatePath)
      .then(o => o.toString('utf16le'))

    const rows = `ID, NAME, Ver, 連動, ItemID, 名前, d_name`
      .split(',')
      .map(o => o.trim())
    const parsedLine = content
      .split('\n')
      .filter(line => line.startsWith('MMCLCTPLATE('))
      .map(o => o.trim())
      .map(line => {
        const decodedLine = /^MMCLCTPLATE\((.+)\) \//.exec(line)[1]
        return decodedLine.split(',').map(o => o.trim())
      })
      .map(blocks => {
        const mappedObject = Object.fromEntries(
          blocks.map((block, i) => [rows[i], block])
        )
        return mappedObject
      })

    const processedNameplates = parsedLine
      .map(item => ({
        id: Number(item['ID']),
        name: textouts.find(o => o.key === item['名前']).value,
        description: items.find(o => o.id === Number(item['ItemID'])).text,
        price: items.find(o => o.id === Number(item['ItemID'])).price,
        genre: items.find(o => o.id === Number(item['ItemID'])).genre,
      }))
      .filter(o => o.name !== 'ネームプレート設定なし')

    return processedNameplates
  }
}
