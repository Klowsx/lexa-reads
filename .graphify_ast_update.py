import json
from graphify.extract import collect_files, extract
from pathlib import Path

# Only extract changed code files
code_files = [Path(r'C:\Users\jhernandez\.config\opencode\plugins\engram.ts')]
result = extract(code_files)
Path('.graphify_ast.json').write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding='utf-8')
print(f'AST: {len(result["nodes"])} nodes, {len(result["edges"])} edges')
