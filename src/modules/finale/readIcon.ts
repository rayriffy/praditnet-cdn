import fs from 'fs'
import path from 'path'

import { uniq } from 'lodash'

import { cacheDirectory } from '../../constants/cacheDirectory'
import { finaleDirectory } from '../../constants/finaleDirectory'

import { promiseSpawn } from '../../functions/promiseSpawn'

import { Item } from './@types/Item'
import { Textout } from './@types/Textout'

// icon item category: 2

export const readIcon = async (textouts: Textout[], items: Item[]) => {
  const encryptedIconPath = path.join(
    finaleDirectory,
    'maimai',
    'data',
    'tables',
    'mmClctIcon.bin'
  )
  const decryptedIconPath = path.join(cacheDirectory, 'mmClctIcon')

  try {
    await promiseSpawn(
      'python3',
      [
        'finaleDecrypt.py',
        `0x${process.env.FINALE_AES_KEY}`,
        `'${encryptedIconPath}'`,
        `'${decryptedIconPath}'`,
      ],
      {
        cwd: path.join(__dirname, '../../tools'),
        shell: true,
      }
    )
  } catch (e) {
    console.warn('cannot decode mmClctIcon, attempting to read from cache')
  }

  if (!fs.existsSync(decryptedIconPath)) {
    console.error('decoded mmClctIcon cache not found! crashing...')
    throw 'no-mmClctIcon'
  } else {
    const content = await fs.promises
      .readFile(decryptedIconPath)
      .then(o => o.toString('utf16le'))

    const rows = `ID, NAME, Ver, 連動, ItemID, 名前, d_name`
      .split(',')
      .map(o => o.trim())
    const parsedLine = content
      .split('\n')
      .filter(line => line.startsWith('MMCLCTICON('))
      .map(o => o.trim())
      .map(line => {
        const decodedLine = /^MMCLCTICON\((.+)\) \//.exec(line)[1]
        return decodedLine.split(',').map(o => o.trim())
      })
      .map(blocks => {
        const mappedObject = Object.fromEntries(
          blocks.map((block, i) => [rows[i], block])
        )
        return mappedObject
      })
    
      const processedIcons = parsedLine.map(item => ({
        id: Number(item['ID']),
        name: textouts.find(o => o.key === item['名前']).value,
        description: items.find(o => o.id === Number(item['ItemID'])).text,
        price: items.find(o => o.id === Number(item['ItemID'])).price,
        genre: items.find(o => o.id === Number(item['ItemID'])).genre,
      })).filter(o => o.name !== 'SIMPLE')

      // console.log(uniq(parsedLine.map(item => items.find(o => o.id === Number(item['ItemID'])).category)))

      return processedIcons
  }
}
