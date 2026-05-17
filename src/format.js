export function asJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`
}

export function shortNode(node) {
  if (!node) return null
  return {
    id: node.id,
    type: node.type,
    kind: node.kind,
    name: node.name,
    file: node.file,
    line: node.line,
    signature: node.signature,
  }
}

export function compactCallResult(items, side) {
  return items.map((item) => ({
    symbol: shortNode(item.symbol),
    [side]: shortNode(item[side]),
    line: item.edge.line,
    confidence: item.edge.confidence,
    detail: item.edge.detail,
  }))
}

export function compactImpactResult(result) {
  return {
    start: shortNode(result.start),
    impactedSymbols: result.impactedSymbols.map(shortNode),
    impactPaths: result.impactPaths.map((path) => path.map(shortNode)),
  }
}

export function compactContextPack(pack) {
  return {
    type: pack.type,
    query: pack.query,
    explanation: pack.explanation,
    beginnerSummary: pack.beginnerSummary,
    mainSymbols: pack.mainSymbols.map(shortNode),
    relevantFiles: pack.relevantFiles.map(shortNode),
    callers: compactCallResult(pack.callers, "caller"),
    callees: compactCallResult(pack.callees, "callee"),
    traceStart: shortNode(pack.traceStart),
    flowPaths: pack.flowPaths.map((path) => path.map(shortNode)),
    relatedTests: pack.relatedTests,
  }
}
