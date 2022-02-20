import fs from 'fs'
import path from 'path'

import { uniq } from 'lodash'

import { cacheDirectory } from '../../constants/cacheDirectory'
import { finaleDirectory } from '../../constants/finaleDirectory'

import { promiseSpawn } from '../../functions/promiseSpawn'

import { Textout } from './@types/Textout'
import { Item } from './@types/Item'

export const readItem = async (textouts: Textout[]): Promise<Item[]> => {
  const encryptedItemPath = path.join(
    finaleDirectory,
    'maimai',
    'data',
    'tables',
    'mmClctItem.bin'
  )
  const decryptedItemPath = path.join(cacheDirectory, 'mmClctItem')

  try {
    await promiseSpawn(
      'python3',
      [
        'finaleDecrypt.py',
        `0x${process.env.FINALE_AES_KEY}`,
        `'${encryptedItemPath}'`,
        `'${decryptedItemPath}'`,
      ],
      {
        cwd: path.join(__dirname, '../../tools'),
        shell: true,
      }
    )
  } catch (e) {
    console.warn('cannot decode mmClctItem, attempting to read from cache')
  }

  if (!fs.existsSync(decryptedItemPath)) {
    console.error('decoded mmClctItem cache not found! crashing...')
    throw 'no-mmClctItem'
  } else {
    const content = await fs.promises
      .readFile(decryptedItemPath)
      .then(o => o.toString('utf16le'))

    const rows = `ID, NAME, OLDID, Ver, Linkage, Activity, EVENTPOINT, MaxGetNum, SortID, MilePrice, DispEv, ItemMission, MsEv, MsASub, MsANrm, MsBSub, MsBNrm, MsCSub, MsCNrm, CatID, GenreID, DispMs, MsA, MsAD, MsB, MsBD, MsC, MsCD, 条件名`
      .split(',')
      .map(o => o.trim())
    const parsedLine = content
      .split('\n')
      .filter(line => line.startsWith('MMCLCTITEM('))
      .map(o => o.trim())
      .map(line => {
        const decodedLine = /^MMCLCTITEM\((.+)\) \//.exec(line)[1]
        return decodedLine.split(',').map(o => o.trim())
      })
      .map(blocks => {
        const mappedObject = Object.fromEntries(
          blocks.map((block, i) => [rows[i], block])
        )
        return mappedObject
      })

    const processedItem = parsedLine.map(item => ({
      id: Number(item['ID']),
      price: Number(item['MilePrice']),
      category: Number(item['CatID']),
      genre: Number(item['GenreID']),
      text: textouts.find(o => o.key === `${item['条件名']}_0`).value
    }))

    return processedItem
  }
}
