# JellyBridge

Downloads files from MediaFire, detects content type, and delivers them to the right folder automatically.

- Archives (zip, rar, 7z): extracted with password support
- Video files: moved directly to destination
- Multiple destination folders (Movies, Series, etc.)
- Real-time download progress via SSE
- Designed for CasaOS

## Stack

Astro + React + Tailwind + Bun. Docker image: `oven/bun`.

## Installation (CasaOS)

```bash
mkdir -p /DATA/AppData/jellybridge
git clone <repo> /DATA/AppData/jellybridge
cd /DATA/AppData/jellybridge
docker compose up -d --build
```

Access at `http://<casaos-ip>:4321`

## Volumes

| Host | Container |
|---|---|
| `/DATA/AppData/jellybridge` | `/app/data` |
| `/mnt` | `/mnt` |

## First-time setup

1. Open Settings
2. Add destination folders (e.g. `/mnt/disk/Movies`)
3. Add extraction passwords if your archives are password-protected
4. Save

## Development

```bash
bun install
bun run dev      # localhost:4321
bun run build
```

## Adding a new provider

1. Create `src/lib/providers/<name>.ts` exporting `resolveUrl(url): Promise<{ directUrl, filename }>`
2. Add the provider to `PROVIDERS` in `src/components/DownloadForm.tsx`
3. Handle it in `src/lib/pipeline.ts`
