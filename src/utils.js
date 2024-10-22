const { worldsByRegion, jobMap } = require('./tables.js')

module.exports = {
  colorCheck: function (n) {
    if (n == 100) {
      return '🟨 Gold'
    } else if (n >= 99) {
      return '🌸 Pink'
    } else if (n >= 95) {
      return '🟧 Orange'
    } else if (n >= 75) {
      return '🟪 Purple'
    } else if (n >= 50) {
      return '🟦 Blue'
    } else if (n >= 25) {
      return '🟩 Green'
    } else {
      return '⬜ Grey'
    }
  },

  cap: function (s) {
    return s[0].toUpperCase() + s.slice(1)
  },

  getEarliestClear: function (ranks) {
    let earliest = ranks[0].startTime + ranks[0].duration
    for (const rank of ranks) {
      const endTime = rank.startTime + rank.duration
      if (endTime < earliest) earliest = endTime
    }
    return earliest
  },

  timeDiffInWeeks: function (first, second) {
    const msInWeek = 604800000
    const weeks = Math.ceil((second - first) / msInWeek)
    console.log(`release: ${first}, clear: ${second}, weeks: ${weeks}`)
    return weeks
  },

  emojiFromJob: function (jobName) {
    return `<:${jobMap[jobName].abbrv}:${jobMap[jobName].emojiID}>`
  },

  getRegion: function (world) {
    if (worldsByRegion.na.includes(world.toLowerCase())) {
      return 'na'
    } else if (worldsByRegion.oce.includes(world.toLowerCase())) {
      return 'oce'
    } else if (worldsByRegion.eu.includes(world.toLowerCase())) {
      return 'eu'
    } else if (worldsByRegion.jp.includes(world.toLowerCase())) {
      return 'jp'
    } else {
      return 'other'
    }
  },
}
