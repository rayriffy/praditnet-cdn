import fs from 'fs'
import path from 'path'

import { processCard } from './modules/ongeki/processCard'
import { processSkill } from './modules/ongeki/processSkill'
import { processMusic } from './modules/ongeki/processMusic'
import { processTrophy } from './modules/ongeki/processTrophy'
import { processNameplate } from './modules/ongeki/processNameplate'

import { ongekiDirectory } from './constants/ongekiDirectory'

;import { createKnexInstance } from './functions/createKnexInstance';
(async () => {
  for await (const option of ongekiDirectory.options) {
    console.log(`--- ${path.basename(option)}`)

    const [
      cards,
      skills,
      musics,
      trophies,
      nameplates,
    ] = await Promise.all([
      processCard(option),
      processSkill(option),
      processMusic(option),
      processTrophy(option),
      processNameplate(option)
    ])

    const knex = createKnexInstance()
    const [
      databaseOngekiCard,
      databaseOngekiSkill,
      databaseOngekiMusic,
      databaseOngekiTrophy,
      databaseOngekiNameplate,
    ] = await Promise.all([
      knex('praditnet_ongeki_card').select('*'),
      knex('praditnet_ongeki_skill').select('*'),
      knex('praditnet_ongeki_music').select('*'),
      knex('praditnet_ongeki_trophy').select('*'),
      knex('praditnet_ongeki_nameplate').select('*'),
    ])

    // update database for ongeki cards
    for await (const item of cards) {
      const targetItem = databaseOngekiCard.find(o => o.id === item.id)

      if (!targetItem) {
        console.log(`card:write ${item.id}`)
        await knex('praditnet_ongeki_card').insert(item)
      }
    }

    // update database for ongeki skills
    for await (const item of skills) {
      const targetItem = databaseOngekiSkill.find(o => o.id === item.id)

      if (!targetItem) {
        console.log(`skill:write ${item.id}`)
        await knex('praditnet_ongeki_skill').insert(item)
      }
    }

    // update database for ongeki musics
    for await (const item of musics) {
      const targetItem = databaseOngekiMusic.find(o => o.id === item.id)

      if (!targetItem) {
        console.log(`music:write ${item.id}`)
        await knex('praditnet_ongeki_music').insert(item)
      }
    }

    // update database for ongeki trophies
    for await (const item of trophies) {
      const targetItem = databaseOngekiTrophy.find(o => o.id === item.id)

      if (!targetItem) {
        console.log(`trophy:write ${item.id}`)
        await knex('praditnet_ongeki_trophy').insert(item)
      }
    }

    // update database for ongeki nameplates
    for await (const item of nameplates) {
      const targetItem = databaseOngekiNameplate.find(o => o.id === item.id)

      if (!targetItem) {
        console.log(`nameplate:write ${item.id}`)
        await knex('praditnet_ongeki_nameplate').insert(item)
      }
    }

    await knex.destroy()
  }
})()