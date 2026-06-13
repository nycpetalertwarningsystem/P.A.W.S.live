x = object()
y = object()
┌──────────────────────────┐
│        Azure Agent       │  ← reasoning, planning, decisions
└─────────────┬────────────┘
              │ calls tools
┌─────────────▼────────────┐
│        MCP Server         │  ← your tools: memory, skills, logs
│  - write_memory           │
│  - read_memory            │
│  - search_memory          │
│  - update_memory          │
└─────────────┬────────────┘
              │ DB access
┌─────────────▼────────────┐
│     Memory Database       │  ← long-term memory
│  - experiences            │
│  - user profile           │
│  - facts                  │
│  - embeddings             │
└──────────────────────────┘
x_list = [x] * 10
y_list = [y] * 10
big_list = x_list + y_list

print("x_list contains %d objects" % len(x_list))
print("y_list contains %d objects" % len(y_list))
print("big_list contains %d objects" % len(big_list))

if x_list.count(x) == 10 and y_list.count(y) == 10:
    print("Almost there...")
if big_list.count(x) == 10 and big_list.count(y) == 10:
    print("Great!")