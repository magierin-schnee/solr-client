import { SolrDocument } from '../src/types'

export interface Goddess extends SolrDocument {
  id: string
  name: string
  age: number
  description: string
  occupation: string[]
  rate: number
}

export const GODDESSES: Goddess[] = [
  {
    id: 'konami_kirie',
    name: 'Konami Kirie',
    age: 17,
    description:
      'The No. 3 Attacker (former No. 1) in Border, known for being naïve and childish but also loyal and powerful.',
    occupation: ['Border Agent', 'Student'],
    rate: 8.9,
  },
  {
    id: 'megumin',
    name: 'Megumin',
    age: 14,
    description:
      'A 14-year-old arch-wizard from the Crimson Demon clan with an obsession for powerful Explosion Magic.',
    occupation: ['Adventurer', 'Arch-Wizard'],
    rate: 9.1,
  },
  {
    id: 'nao_tomori',
    name: 'Nao Tomori',
    age: 15,
    description:
      'Student council president known for being hardworking and intelligent, with the ability of imperfect invisibility.',
    occupation: ['Student'],
    rate: 9.5,
  },
  {
    id: 'yor_forger',
    name: 'Yor Forger',
    age: 27,
    description:
      'A 27-year-old professional assassin known as "Thorn Princess" who works as a clerk and is in a fake marriage.',
    occupation: ['Assassin', 'Clerk'],
    rate: 9.2,
  },
  {
    id: 'miwa_kasumi',
    name: 'Miwa Kasumi',
    age: 17,
    description:
      'A kind-hearted but relatively ordinary Grade 3 Jujutsu Sorcerer who admires Satoru Gojo and uses swordsmanship.',
    occupation: ['Student', 'Sorcerer'],
    rate: 8.7,
  },
]
