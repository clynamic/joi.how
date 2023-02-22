// Blacklist logic taken from e621's source, refactored, added types, and added comments
// https://github.com/zwagoth/e621ng/blob/b4672dadeef12e7aa20401b6074bc7676bb23bbb/app/javascript/src/javascripts/blacklists.js

import { E621Post } from '../features/settings/types'

type InvalidCompairsons = '<<' | '<>' | '><' | '>>'
type FixableCompairsons = '' | '=' | '=<' | '=>'
type ValidComparisons = '<' | '<=' | '==' | '>=' | '>'
type AllComparisons = InvalidCompairsons | FixableCompairsons | ValidComparisons
type ScoreComparison = {
  comparison: ValidComparisons | InvalidCompairsons
  score: number
}

interface BlacklistEntry {
  tags: string
  require: string[]
  exclude: string[]
  optional: string[]
  scoreComparison: ScoreComparison | null
}

// Fix the comparisions that makes sense
function fixComparisonInsanity(input: AllComparisons): ValidComparisons | InvalidCompairsons {
  switch (input) {
    case '=>':
      return '>='
    case '=<':
      return '<='
    case '':
    case '=':
      return '=='
    default:
      return input
  }
}

// Does a comparison based on
// Returns "true" on invalid comparisions
function rangeComparator(comparison: ScoreComparison, target: number): boolean {
  switch (comparison.comparison) {
    case '<':
      return target < comparison.score
    case '<=':
      return target <= comparison.score
    case '==':
      return target === comparison.score
    case '>=':
      return target >= comparison.score
    case '>':
      return target > comparison.score
    default:
      return true
  }
}

function is_subset(array: any[], subarray: any[]) {
  return subarray.every(value => array.includes(value))
}

function intersect(a: any[], b: any[]) {
  return a.filter(value => b.includes(value))
}

export class Blacklist {
  private entries: BlacklistEntry[]

  constructor(blacklistTagsList: string) {
    this.entries = blacklistTagsList
      .split('\n')
      .filter(t => t.trim() !== '')
      .map(t => Blacklist.entryParse(t))
  }

  private static entryParse(blacklistTagsString: string): BlacklistEntry {
    // Convert to lowercase
    blacklistTagsString = blacklistTagsString.toLowerCase()

    // Remove the afe, uestionable, and xplict
    blacklistTagsString = blacklistTagsString.replace(/(rating:[sqe])\w+/gi, '$1')

    const entry: BlacklistEntry = {
      tags: blacklistTagsString,
      require: [],
      exclude: [],
      optional: [],
      scoreComparison: null,
    }

    // Split the string on whitespace
    const matches = blacklistTagsString.match(/\S+/g) || []

    // Loop through each tag and catgorize it
    for (const tag of matches) {
      if (tag.charAt(0) === '-') {
        // If it's a prefix of -, it's excluded
        entry.exclude.push(tag.slice(1))
      } else if (tag.charAt(0) === '~') {
        // If it's a prefix of ~, it's optional
        entry.optional.push(tag.slice(1))
      } else if (tag.match(/^score:[<=>]{0,2}-?\d+/)) {
        // If it's a score, parse the score
        const score = tag.match(/^score:([<=>]{0,2})(-?\d+)/)!
        entry.scoreComparison = {
          comparison: fixComparisonInsanity(score[1] as AllComparisons),
          score: parseInt(score[2], 10),
        }
      } else {
        // Otherwise it's just required
        entry.require.push(tag)
      }
    }
    return entry
  }

  // Using arrow syntax to keep this function bound to this
  // Pass this function into a post[].filter()
  public shouldKeepPost = (post: E621Post) => {
    // Return true unless some blacklist entry matches
    return !this.entries.some((entry: BlacklistEntry) => {
      const tags = post.tags.general.concat(
        post.tags.species,
        post.tags.character,
        post.tags.copyright,
        post.tags.artist,
        post.tags.invalid,
        post.tags.lore,
        post.tags.meta,
      )
      tags.push(`id:${post.id}`)
      tags.push(`rating:${post.rating}`)
      tags.push(`userid:${post.uploader_id}`)
      // Unfortunately the post does not return the user's screenname
      // So user:screenname will not work...
      // tags.push(`user:${post.user}`)
      tags.push(`height:${post.file.height}`)
      tags.push(`width:${post.file.width}`)
      if (post.is_favorited) tags.push('fav:me')
      if (post.flags.pending) tags.push('status:pending')
      if (post.flags.flagged) tags.push('status:flagged')
      if (post.flags.note_locked) tags.push('status:note_locked')
      if (post.flags.status_locked) tags.push('status:status_locked')
      if (post.flags.rating_locked) tags.push('status:rating_locked')
      if (post.flags.deleted) tags.push('status:deleted')

      if (intersect(tags, entry.exclude).length > 0) {
        return false
      }

      if (entry.optional.length > 0 && intersect(tags, entry.optional).length === 0) {
        return false
      }

      if (entry.scoreComparison != null && !rangeComparator(entry.scoreComparison, post.score.total)) {
        return false
      }

      return is_subset(tags, entry.require)
    })
  }
}
