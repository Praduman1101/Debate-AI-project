# DebateAI — Assets

## Required Images

Place these in the `assets/` directory (or generate via Expo):

| File | Size | Purpose |
|------|------|---------|
| `icon.png` | 1024×1024 | App icon |
| `splash.png` | 1284×2778 | Splash screen |
| `adaptive-icon.png` | 1024×1024 | Android adaptive icon |
| `favicon.png` | 32×32 | Web favicon |

## Sound Effects (`assets/sounds/`)

Place `.mp3` files here for debate sound effects.
The app gracefully skips missing sounds.

| File | Trigger |
|------|---------|
| `turn_start.mp3` | Your turn begins |
| `scored.mp3` | Your argument is scored |
| `ai_response.mp3` | AI argument appears |
| `round_end.mp3` | Round advances |
| `win.mp3` | Debate won |
| `loss.mp3` | Debate lost |
| `tap.mp3` | Button press |
| `timer_urgent.mp3` | Timer below 10s |
| `matched.mp3` | PvP match found |

## Free Sound Sources

- [freesound.org](https://freesound.org) (CC0 license sounds)
- [mixkit.co/free-sound-effects](https://mixkit.co/free-sound-effects)
- Generate tones programmatically with expo-av

## Generating placeholder icon

```bash
# Using ImageMagick:
convert -size 1024x1024 xc:#1D9E75 -font Helvetica -pointsize 400 \
  -fill white -gravity center -annotate 0 "⚡" assets/icon.png
```
