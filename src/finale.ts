import dotenv from 'dotenv'

import { createKnexInstance } from './functions/createKnexInstance'

import { readTextout } from './modules/finale/readTextout'
import { readMusic } from './modules/finale/readMusic'
import { readScore } from './modules/finale/readScore'

import { processIconAssets } from './modules/finale/processIconAssets'
import { processNameplateAssets } from './modules/finale/processNameplateAssets'
import { processFrameAssets } from './modules/finale/processFrameAssets'
import { processJacketAssets } from './modules/finale/processJacketAssets'
import { processFrameMiniAssets } from './modules/finale/processFrameMiniAssets'

import { FinaleMusic } from './modules/finale/@types/database/FinaleMusic'
import { FinaleScore } from './modules/finale/@types/database/FinaleScore'

dotenv.config()

;(async () => {
  /**
   * Section 1: process database
   */

  // read data
  const [textout, scores] = await Promise.all([readTextout(), readScore()])
  const musics = await readMusic(textout)

  // read database
  const knex = createKnexInstance()
  const databaseFinaleMusic = await knex<FinaleMusic>('praditnet_finale_music').select('*')
  const databaseFinaleScore = await knex<FinaleScore>('praditnet_finale_score').select('*')

  // update database for finale music
  for await (const music of musics) {
    const targetMusic = databaseFinaleMusic.find(o => o.id === music.id)
    
    if (!targetMusic) {
      await knex<FinaleMusic>('praditnet_finale_music').insert(music)
    }
  }

  // update database for finale score
  for await (const score of scores) {
    const targetScore = databaseFinaleScore.find(o => o.id === score.id)

    if (!targetScore) {
      await knex<FinaleScore>('praditnet_finale_score').insert({
        id: score.id,
        music: score.music,
        difficulty: score.difficulty,
        level: score.level,
        isUtage: score.isUtage,
      })
    }
  }

  await knex.destroy()

  /**
   * Section 2: Process assets
   */
  // icons
  await Promise.all([
    processIconAssets(),
    processNameplateAssets(),
    processFrameAssets(),
    processJacketAssets(),
    processFrameMiniAssets(),
  ])
})()
