// Taken from https://github.com/e621ng/e621ng/blob/59f5fda98f0877190bb5816f766c17bd6b9affb9/app/javascript/src/javascripts/blacklists.js

import { E621Post } from '.';

class Utility {
  static is_subset(array: string[], subarray: string[]): boolean {
    let all = true;
    subarray.forEach(val => {
      if (!array.includes(val)) {
        all = false;
      }
    });
    return all;
  }

  static intersect(a: string[], b: string[]): string[] {
    a = a.slice().sort();
    b = b.slice().sort();
    const result: string[] = [];
    while (a.length > 0 && b.length > 0) {
      if (a[0] < b[0]) {
        a.shift();
      } else if (a[0] > b[0]) {
        b.shift();
      } else {
        result.push(a.shift()!);
        b.shift();
      }
    }
    return result;
  }
}

type ScoreComparison = [string, number];

export type BlacklistEntry = {
  tags: string;
  require: string[];
  exclude: string[];
  optional: string[];
  score_comparison?: ScoreComparison;
  username?: string;
  user_id?: number;
};

export class Blacklist {
  static entryParse(string: string): BlacklistEntry {
    const fixInsanity = (input: string): string => {
      switch (input) {
        case '=>':
          return '>=';
        case '=<':
          return '<=';
        case '=':
          return '==';
        default:
          return input;
      }
    };

    const entry: BlacklistEntry = {
      tags: string,
      require: [],
      exclude: [],
      optional: [],
    };

    const matches = string.match(/\S+/g) || [];
    matches.forEach(tag => {
      if (tag.startsWith('-')) {
        entry.exclude.push(tag.slice(1));
      } else if (tag.startsWith('~')) {
        entry.optional.push(tag.slice(1));
      } else if (tag.match(/^score:[<=>]{0,2}-?\d+/)) {
        const score = tag.match(/^score:([<=>]{0,2})(-?\d+)/);
        if (score) {
          entry.score_comparison = [
            fixInsanity(score[1]),
            parseInt(score[2], 10),
          ];
        }
      } else {
        entry.require.push(tag);
      }
    });

    const user_matches = string.match(/user:(?!!)([\S]+)/) || [];
    if (user_matches.length) {
      entry.username = user_matches[0]?.substring(5);
    }

    const userid_matches = string.match(/userid:!?(\d+)/) || [];
    if (userid_matches.length) {
      entry.user_id = parseInt(userid_matches[1], 10);
    }

    return entry;
  }

  static entriesParse(blacklistedTags: string[]): BlacklistEntry[] {
    return blacklistedTags
      .filter(tags => !tags.trim().startsWith('#'))
      .map(tags =>
        this.entryParse(tags.replace(/(rating:[qes])\w+/gi, '$1').toLowerCase())
      );
  }

  static postMatch(post: E621Post, entry: BlacklistEntry): boolean {
    const rangeComparator = (
      comparison?: ScoreComparison,
      target?: number
    ): boolean => {
      if (
        !Array.isArray(comparison) ||
        typeof target === 'undefined' ||
        comparison.length !== 2
      )
        return true;
      switch (comparison[0]) {
        case '<':
          return target < comparison[1];
        case '<=':
          return target <= comparison[1];
        case '==':
          return target == comparison[1];
        case '>=':
          return target >= comparison[1];
        case '>':
          return target > comparison[1];
        default:
          return true;
      }
    };

    const score_test = rangeComparator(
      entry.score_comparison,
      post.score.total
    );
    const tags = Object.keys(post.tags)
      .map(cat => post.tags[cat])
      .flat();
    tags.push(
      `id:${post.id}`,
      `rating:${post.rating}`,
      `userid:${post.uploader_id}`,
      `user:!${post.uploader_id}`,
      // `user:${post.user}`,
      `height:${post.file.height}`,
      `width:${post.file.width}`
    );
    if (post.is_favorited) {
      tags.push('fav:me');
    }

    return (
      Utility.is_subset(tags, entry.require) &&
      score_test &&
      (!entry.optional.length ||
        Utility.intersect(tags, entry.optional).length > 0) &&
      Utility.intersect(tags, entry.exclude).length === 0
    );
  }
}
