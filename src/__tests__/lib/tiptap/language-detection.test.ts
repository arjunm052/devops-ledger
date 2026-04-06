/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest'
import { lowlight } from '@/lib/tiptap/editor-extensions'
import { LANGUAGE_NAMES } from '@/components/editor/code-block-node'

describe('Language Auto-Detection', () => {
  const subset = Object.keys(LANGUAGE_NAMES)

  const testCases = [
    {
      lang: 'javascript',
      snippet: `function test() {\n  return true;\n}\nconsole.log(test());\n`,
    },
    {
      lang: 'python',
      snippet: `def my_func(a):\n    return a + 1\n\nprint(my_func(5))\n`,
    },
    {
      lang: 'go',
      snippet: `package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}\n`,
    },
    {
      lang: 'yaml',
      snippet: `version: '3'\nservices:\n  web:\n    image: nginx:latest\n    ports:\n      - 80:80\n`,
    },
    {
      lang: 'dockerfile',
      snippet: `FROM ubuntu:20.04\nRUN apt-get update && apt-get install -y python3\nCOPY . /app\nCMD ["python3", "/app/main.py"]\n`,
    },
    {
      lang: 'bash',
      snippet: `#!/bin/bash\necho "Hello, World!"\nif [ -z "$1" ]; then\n  echo "No argument supplied"\nfi\n`,
    },
    {
      lang: 'json',
      snippet: `{\n  "key": "value",\n  "number": 123,\n  "nested": {\n    "boolean": true\n  }\n}\n`,
    },
    {
      lang: 'css',
      snippet: `body {\n  margin: 0;\n  padding: 0;\n  background-color: #f0f0f0;\n}\n.container {\n  width: 100%;\n}\n`,
    },
    {
      lang: 'rust',
      snippet: `#[derive(Debug)]\nstruct Person {\n    name: String,\n    age: u8,\n}\n\nfn main() {\n    let p = Person { name: String::from("Alice"), age: 30 };\n    println!("{:?}", p);\n}\n`,
    },
    {
      lang: 'java',
      snippet: `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner scanner = new Scanner(System.in);\n        System.out.println("Hello World");\n    }\n}\n`,
    },
    {
      lang: 'sql',
      snippet: `SELECT id, name FROM users WHERE active = true ORDER BY created_at DESC;\n`,
    },
    {
      lang: 'php',
      snippet: `<?php\n$foo = "bar";\necho "Hello World";\n?>\n`,
    },
    {
      lang: 'ruby',
      snippet: `def hello\n  puts "Hello World"\nend\n\nhello\n`,
    },
    {
      lang: 'xml', // HTML is identified as xml
      snippet: `<!DOCTYPE html>\n<html>\n<head>\n<title>Title</title>\n</head>\n<body>\n<h1>Hello</h1>\n</body>\n</html>\n`,
    },
  ]

  it.each(testCases)('should auto-detect $lang correctly with relevance >= 3', ({ lang, snippet }) => {
    const result = lowlight.highlightAuto(snippet, { subset })
    const data = result.data as { language?: string; relevance?: number } | undefined
    
    // We expect the language to be detected
    expect(data?.language).toBeDefined()
    
    // Check if the detected language matches our expected language
    // XML/HTML are aliased and normalized in HLJS, so we accept 'xml' for our HTML snippet
    if (lang === 'xml') {
      expect(['xml', 'html']).toContain(data?.language)
    } else {
      expect(data?.language).toBe(lang)
    }
    
    // Relevance should be at least 3 for these meaningful snippets
    expect(data?.relevance).toBeGreaterThanOrEqual(3)
  })
})
