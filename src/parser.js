const CALL_SKIP_WORDS = new Set([
  "if",
  "for",
  "while",
  "switch",
  "catch",
  "return",
  "function",
  "class",
  "def",
  "new",
  "typeof",
  "sizeof",
  "await",
  "yield",
  "import",
  "require",
  "console",
  "super",
])

const MAX_SNIPPET_CHARS = 160

export function languageForFile(filePath) {
  if (/\.(js|mjs|cjs|jsx)$/.test(filePath)) return "javascript"
  if (/\.(ts|tsx)$/.test(filePath)) return "typescript"
  if (/\.py$/.test(filePath)) return "python"
  if (/\.go$/.test(filePath)) return "go"
  if (/\.java$/.test(filePath)) return "java"
  if (/\.cs$/.test(filePath)) return "csharp"
  if (/\.php$/.test(filePath)) return "php"
  if (/\.rb$/.test(filePath)) return "ruby"
  if (/\.rs$/.test(filePath)) return "rust"
  if (/\.kt$/.test(filePath)) return "kotlin"
  if (/\.swift$/.test(filePath)) return "swift"
  return "unknown"
}

export function parseSourceFile(filePath, text) {
  const rawLines = text.split(/\r?\n/)
  const codeLines = stripNonCode(text).split(/\r?\n/)
  const symbols = []
  const imports = []
  const calls = []
  const classStack = []

  for (let index = 0; index < rawLines.length; index += 1) {
    const lineNumber = index + 1
    const rawLine = rawLines[index]
    const codeLine = codeLines[index] ?? ""
    const rawTrimmed = rawLine.trim()
    const codeTrimmed = codeLine.trim()

    if (!codeTrimmed || codeTrimmed.startsWith("#")) continue

    collectImports(codeTrimmed, rawTrimmed, lineNumber, imports)

    const classSymbol = matchClass(codeTrimmed, rawTrimmed, lineNumber)
    if (classSymbol) {
      symbols.push(classSymbol)
      classStack.push({ name: classSymbol.name, indent: leadingSpaces(rawLine) })
      continue
    }

    while (classStack.length > 0 && leadingSpaces(rawLine) <= classStack[classStack.length - 1].indent && codeTrimmed !== "}") {
      classStack.pop()
    }

    const functionSymbol = matchFunction(codeTrimmed, rawTrimmed, lineNumber, classStack[classStack.length - 1]?.name)
    if (functionSymbol) symbols.push(functionSymbol)

    collectCalls(codeTrimmed, rawTrimmed, lineNumber, calls, functionSymbol?.shortName ?? null)
  }

  symbols.sort((a, b) => a.line - b.line)
  for (let index = 0; index < symbols.length; index += 1) {
    symbols[index].endLine = symbols[index + 1]?.line ? symbols[index + 1].line - 1 : rawLines.length
  }

  for (const call of calls) {
    call.callerName = findEnclosingSymbol(symbols, call.line)?.name ?? null
  }

  return { language: languageForFile(filePath), symbols, imports, calls, lineCount: rawLines.length }
}

function collectImports(codeTrimmed, rawTrimmed, line, imports) {
  const detectors = [
    {
      detect: /^import\s+.*?\s+from\b/,
      extract: /^import\s+.*?\s+from\s+["']([^"']+)["']/,
    },
    {
      detect: /^import\b/,
      extract: /^import\s+["']([^"']+)["']/,
    },
    {
      detect: /\brequire\s*\(/,
      extract: /require\(["']([^"']+)["']\)/,
    },
    {
      detect: /^from\s+[\w.]+\s+import\b/,
      extract: /^from\s+([\w.]+)\s+import\s+/,
    },
    {
      detect: /^import\s+[\w.]+\b/,
      extract: /^import\s+([\w.]+)/,
    },
    {
      detect: /^use\s+[\w:]+/,
      extract: /^use\s+([\w:]+)/,
    },
    {
      detect: /^include\b/,
      extract: /^include\s+["']([^"']+)["']/,
    },
  ]

  for (const detector of detectors) {
    if (!detector.detect.test(codeTrimmed)) continue
    const match = rawTrimmed.match(detector.extract)
    if (match) {
      imports.push({ target: sanitizeSnippet(match[1]), line })
      return
    }
  }
}

function matchClass(codeTrimmed, rawTrimmed, line) {
  const patterns = [
    /^(?:export\s+)?(?:abstract\s+)?class\s+([A-Za-z_$][\w$]*)/,
    /^interface\s+([A-Za-z_$][\w$]*)/,
    /^class\s+([A-Za-z_][\w]*)\s*[:(]?/,
    /^(?:public\s+|private\s+|protected\s+)?(?:final\s+)?class\s+([A-Za-z_][\w]*)/,
    /^type\s+([A-Za-z_][\w]*)\s+struct/,
  ]

  for (const pattern of patterns) {
    const match = codeTrimmed.match(pattern)
    if (match) return symbol("class", match[1], line, sanitizeSnippet(rawTrimmed))
  }
  return null
}

function matchFunction(codeTrimmed, rawTrimmed, line, currentClass) {
  const patterns = [
    /^(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(([^)]*)\)/,
    /^(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\(?([^=]*)\)?\s*=>/,
    /^(?:async\s+)?([A-Za-z_$][\w$]*)\s*\(([^)]*)\)\s*[{]/,
    /^def\s+([A-Za-z_][\w]*)\s*\(([^)]*)\)/,
    /^func\s+(?:\([^)]*\)\s*)?([A-Za-z_][\w]*)\s*\(([^)]*)\)/,
    /^(?:public|private|protected|static|async|final|override|internal|open|fun|suspend|func)\s+.*?([A-Za-z_][\w]*)\s*\(([^)]*)\)/,
    /^(?:[A-Za-z_][\w<>\[\],.?]*\s+)+([A-Za-z_][\w]*)\s*\(([^)]*)\)\s*(?:throws\s+[\w.,\s]+)?\s*\{/,
    /^function\s+([A-Za-z_][\w]*)\s*\(([^)]*)\)/,
    /^fn\s+([A-Za-z_][\w]*)\s*\(([^)]*)\)/,
  ]

  for (const pattern of patterns) {
    const match = codeTrimmed.match(pattern)
    if (!match) continue
    const rawName = match[1]
    if (CALL_SKIP_WORDS.has(rawName)) continue
    const name = currentClass && !rawName.includes(".") ? `${currentClass}.${rawName}` : rawName
    return symbol(currentClass ? "method" : "function", name, line, sanitizeSnippet(rawTrimmed))
  }
  return null
}

function collectCalls(codeTrimmed, rawTrimmed, line, calls, declaredShortName = null) {
  const pattern = /(?:\b([A-Za-z_$][\w$]*)\.)?\b([A-Za-z_$][\w$]*)\s*\(/g
  const declarationEnd = declarationBoundary(codeTrimmed)
  let match
  while ((match = pattern.exec(codeTrimmed))) {
    const beforeMatch = codeTrimmed.slice(Math.max(0, match.index - 5), match.index)
    const objectName = match[1] ?? null
    const callName = match[2]
    if (/\bnew\s+$/.test(beforeMatch)) continue
    if (declaredShortName && match.index < declarationEnd && callName === declaredShortName) continue
    if (CALL_SKIP_WORDS.has(callName)) continue
    calls.push({ name: callName, objectName, line, text: sanitizeSnippet(rawTrimmed) })
  }
}

function findEnclosingSymbol(symbols, line) {
  return symbols.find((candidate) => candidate.line <= line && candidate.endLine >= line) ?? null
}

function symbol(kind, name, line, signature) {
  return { kind, name, shortName: name.split(".").at(-1), line, signature }
}

function leadingSpaces(line) {
  return line.length - line.trimStart().length
}

function declarationBoundary(codeTrimmed) {
  const blockStart = codeTrimmed.indexOf("{")
  if (blockStart !== -1) return blockStart + 1
  const arrowStart = codeTrimmed.indexOf("=>")
  if (arrowStart !== -1) return arrowStart + 2
  return 0
}

function sanitizeSnippet(text) {
  return compactSnippet(redactSensitiveText(text.trim()))
}

function compactSnippet(text) {
  if (text.length <= MAX_SNIPPET_CHARS) return text
  return `${text.slice(0, MAX_SNIPPET_CHARS - 3)}...`
}

function redactSensitiveText(text) {
  return text
    .replace(/\b(Bearer\s+)[A-Za-z0-9._=-]+/g, "$1[redacted]")
    .replace(/\bghp_[A-Za-z0-9]{20,}\b/g, "ghp_[redacted]")
    .replace(/\bgithub_pat_[A-Za-z0-9_]+\b/g, "github_pat_[redacted]")
    .replace(/\bAKIA[0-9A-Z]{16}\b/g, "AKIA[redacted]")
    .replace(/\b((?:api[_-]?key|token|secret|password|passwd|private[_-]?key))\b(\s*[:=]\s*)(["'`])([^"'`]+)\3/ig, "$1$2$3[redacted]$3")
}

function stripNonCode(text) {
  let result = ""
  let state = "code"

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    const next = text[index + 1]

    if (state === "line_comment") {
      if (char === "\n") {
        result += "\n"
        state = "code"
      } else {
        result += " "
      }
      continue
    }

    if (state === "block_comment") {
      if (char === "*" && next === "/") {
        result += "  "
        index += 1
        state = "code"
      } else if (char === "\n") {
        result += "\n"
      } else {
        result += " "
      }
      continue
    }

    if (state === "single_quote") {
      if (char === "\\") {
        result += " "
        if (next !== undefined) {
          result += next === "\n" ? "\n" : " "
          index += 1
        }
      } else if (char === "'" || char === "\n") {
        result += char === "\n" ? "\n" : " "
        state = "code"
      } else {
        result += " "
      }
      continue
    }

    if (state === "double_quote") {
      if (char === "\\") {
        result += " "
        if (next !== undefined) {
          result += next === "\n" ? "\n" : " "
          index += 1
        }
      } else if (char === '"' || char === "\n") {
        result += char === "\n" ? "\n" : " "
        state = "code"
      } else {
        result += " "
      }
      continue
    }

    if (state === "template_string") {
      if (char === "\\") {
        result += " "
        if (next !== undefined) {
          result += next === "\n" ? "\n" : " "
          index += 1
        }
      } else if (char === "`") {
        result += " "
        state = "code"
      } else if (char === "\n") {
        result += "\n"
      } else {
        result += " "
      }
      continue
    }

    if (char === "/" && next === "/") {
      result += "  "
      index += 1
      state = "line_comment"
      continue
    }

    if (char === "/" && next === "*") {
      result += "  "
      index += 1
      state = "block_comment"
      continue
    }

    if (char === "'") {
      result += " "
      state = "single_quote"
      continue
    }

    if (char === '"') {
      result += " "
      state = "double_quote"
      continue
    }

    if (char === "`") {
      result += " "
      state = "template_string"
      continue
    }

    result += char
  }

  return result
}
