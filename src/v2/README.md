# V2 — Vary.video v2 Architecture

This directory contains the v2 implementation, built alongside the frozen v1 code.

## Structure

```
src/v2/
├── schema/          # V2 document model (Zod schemas + types)
├── registry/        # Element + capability registries
├── elements/        # Element type definitions (text, image, shape)
├── animations/      # V2 animation system
├── merge-tags/      # Merge tag parsing and resolution
└── utils/           # Shared utilities
```

## Key Principles

- **Normalized coordinates:** x, y, width, height are 0-1 (not percentages or pixels)
- **Frame-based timing:** all timing in frames, not seconds
- **Responsive overrides:** per-aspect-ratio layout (16:9, 9:16, 1:1)
- **Shared schemas:** Zod schemas used by editor, renderer, API, and AI
- **No React in schema packages:** pure TypeScript, JSON-serializable
- **Versioned documents:** every document has schemaVersion for migrations
