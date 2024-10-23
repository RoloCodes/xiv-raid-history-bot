import { worldsByRegion, jobMap } from './tables.js'

export function colorCheck(n) {
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
}

export function cap(s) {
  return s[0].toUpperCase() + s.slice(1)
}

export function getEarliestClear(ranks) {
  let earliest = ranks[0].startTime + ranks[0].duration
  for (const rank of ranks) {
    const endTime = rank.startTime + rank.duration
    if (endTime < earliest) earliest = endTime
  }
  return earliest
}

export function timeDiffInWeeks(first, second) {
  const msInWeek = 604800000
  const weeks = Math.ceil((second - first) / msInWeek)
  return weeks
}

export function emojiFromJob(jobName) {
  return `<:${jobMap[jobName].abbrv}:${jobMap[jobName].emojiID}>`
}

export function getRegion(world) {
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
}
