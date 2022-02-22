import fs from 'fs'
import path from 'path'

import { uniq } from 'lodash'

import { cacheDirectory } from '../../constants/cacheDirectory'
import { finaleDirectory } from '../../constants/finaleDirectory'

import { promiseSpawn } from '../../functions/promiseSpawn'

import { Item } from './@types/Item'
import { Textout } from './@types/Textout'

export const readTitle = async (textouts: Textout[], items: Item[]) => {
  const encryptedPath = path.join(
    finaleDirectory,
    'maimai',
    'data',
    'tables',
    'mmClctTitle.bin'
  )
  const decryptedPath = path.join(cacheDirectory, 'mmClctTitle')

  try {
    await promiseSpawn(
      'python3',
      [
        'finaleDecrypt.py',
        `0x${process.env.FINALE_AES_KEY}`,
        `'${encryptedPath}'`,
        `'${decryptedPath}'`,
      ],
      {
        cwd: path.join(__dirname, '../../tools'),
        shell: true,
      }
    )
  } catch (e) {
    console.warn('cannot decode mmClctTitle, attempting to read from cache')
  }

  if (!fs.existsSync(decryptedPath)) {
    console.error('decoded mmClctTitle cache not found! crashing...')
    throw 'no-mmClctTitle'
  } else {
    const content = await fs.promises
      .readFile(decryptedPath)
      .then(o => o.toString('utf16le'))

    const rows = `ID, NAME, Ver, Color, 連動, ItemID, 名前`
      .split(',')
      .map(o => o.trim())
    const parsedLine = content
      .split('\n')
      .filter(line => line.startsWith('MMCLCTTITLE('))
      .map(o => o.trim())
      .map(line => {
        const decodedLine = /^MMCLCTTITLE\((.+)\) \//.exec(line)[1]
        return decodedLine.split(',').map(o => o.trim())
      })
      .map(blocks => {
        const mappedObject = Object.fromEntries(
          blocks.map((block, i) => [rows[i], block])
        )
        return mappedObject
      })

    const processedTitles = parsedLine.map(item => ({
      id: Number(item['ID']),
      name: textouts.find(o => o.key === item['名前']).value,
      description: items.find(o => o.id === Number(item['ItemID'])).text,
      price: items.find(o => o.id === Number(item['ItemID'])).price,
      genre: items.find(o => o.id === Number(item['ItemID'])).genre,
    }))

    return processedTitles
  }
}
