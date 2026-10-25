# room-peer

A fake room member, for trying rooms with one computer. It joins a room, announces itself, drops random pings and prints the pings, emotes, text, alive lines and votes it receives.

```bash
node tools/room-peer/run.mjs PING-XXXXX-XXXXX --name Bot --rate 1
```

| Option | Default | |
| --- | --- | --- |
| `--name` | `Bot` | Name shown under its pings |
| `--color` | `4` | Tag colour, 0–7 |
| `--rate` | `1` | Pings per second; `0` only listens, `20` tests the spam limit (at most 5 with `--relay`) |
| `--host` | `127.0.0.1` | Address of the machine running lolPing (LAN only) |
| `--port` | `47475` | This peer's own UDP port; lolPing uses 47474 (LAN only) |
| `--display` | `1` | Display number its pings target |
| `--relay` | off | Join through the public relays instead of the LAN |
| `--emotes` | off | Also send emotes (see below) |
| `--image` | none | A still `.webp` this peer owns and shares (see below) |
| `--app` | `room-peer` | The app version it announces. `0.5.2` or newer makes lolPing treat it as able to see text and votes (see below) |
| `--text` | none | A line of room text, at most 120 characters, sent every 5 s at a random spot on `--display` |
| `--alive` | off | Every 7 s, an alive line about a random member |
| `--vote` | none | `ff` or `ready`: start one vote of that kind 3 s after joining |
| `--answer` | none | `yes` or `no`: answer every vote it sees with that ballot |
| `--nf` | none | `text`, `votes` or `text,votes`: announce those room features as switched off |
| `--legacy` | off | Act like lolPing 0.5.1: a random peer id and no signatures (see below) |
| `--forge` | none | A member's peer id: 3 s after joining, send an unsigned bye and a ping with a huge sequence number claiming it (see below) |

Start lolPing, create a room, copy the code and run the command with it. Several peers can run at once on different ports.

## Emotes

With `--emotes` the peer alternates pings and random bundled emotes at `--rate`, so the total stays at that rate, and every 10 s it sends an emote of a made-up own image (`c:` and 32 hex characters). lolPing has no such image, so it shows the "?" placeholder. Emotes it receives print as `[in] emote <ref> on display <d> at x, y`. With `--rate 0` it only listens.

```bash
node tools/room-peer/run.mjs PING-XXXXX-XXXXX --emotes --rate 0.5
```

## Custom emote images

The peer always fetches the images lolPing announces (the custom emotes on its wheel and centre) and prints `[in] still <hash> arrived and passed the hash and image checks` for each.

With `--image still.webp` it also owns that image: it announces it, prints `[in] want <hash>` when lolPing asks for it, and sends it in chunks. With `--emotes`, its custom emote every 10 s is that image, so lolPing shows the picture instead of "?". The file must pass the import checks: a still WebP of at most 12,288 bytes and 160 px. The still lolPing writes for an imported image (`<settings folder>/emotes/<hash>.webp`) is one; copy it out, then remove that emote in lolPing so it has to fetch it.

```bash
node tools/room-peer/run.mjs PING-XXXXX-XXXXX --emotes --rate 0.5 --image still.webp
```

Two peers on different ports reach each other too: the second one sends to the first on port 47474, and the first answers.

## Text and votes

Without `--app`, the peer announces itself as `room-peer`, which lolPing does not call old. Pass `--app 0.5.1` (or any version below 0.5.2) to be flagged "can't see text and votes", or `--app 0.5.2` to be treated as able to see them. lolPing does not send text or votes to a member that is flagged or has the feature switched off.

`--text "gg wp"` sends that line every 5 s. `--alive` sends an alive line every 7 s about a random member the peer has heard from, lolPing included; the line shows that member's name. `--vote ff` starts a surrender vote and `--vote ready` a ready check, once, 3 s after joining, with an 8-character hex id as the app makes. `--answer yes` or `--answer no` answers each vote the peer sees, at once and again every 3 s until the vote's time is up, as the app does. `--nf text,votes` announces text and votes as switched off, so lolPing should not send them.

What it receives prints as `[in] text "<text>" from <name> on display <d> at x, y`, `[in] alive <who> from <name>`, `[in] vote <kind> <id> from <name>` and `[in] ballot <yes|no> <id> from <name>`. With `--relay`, these messages count against the same relay limit as pings, so a high `--rate` can crowd them out.

```bash
node tools/room-peer/run.mjs PING-XXXXX-XXXXX --app 0.5.2 --text "gg wp" --answer yes
node tools/room-peer/run.mjs PING-XXXXX-XXXXX --app 0.5.2 --vote ff --rate 0
node tools/room-peer/run.mjs PING-XXXXX-XXXXX --app 0.5.1 --rate 0
```

## Over the internet path

With `--relay` the peer never touches the LAN: it reaches the room only through the relays pinned in `src/main/relays.ts`, like a friend on another network would. lolPing should list it with an `Internet` badge within a few seconds.

```bash
node tools/room-peer/run.mjs PING-XXXXX-XXXXX --relay --name Remote
```

## Signatures

Like lolPing 0.5.2, the peer signs everything it sends except chunks, and its peer id is its key's hash. It prints its id when it starts. With `--legacy` it acts like 0.5.1 and signs nothing.

`--forge <id>` checks that a member can't be impersonated. Run one signed peer and one `--legacy` peer, then a third with `--forge` and the signed peer's id: lolPing keeps the signed peer and its pings keep arriving. Forge the legacy peer's id instead and lolPing shows it leaving; members on 0.5.1 stay open to this until they update.

```bash
node tools/room-peer/run.mjs PING-XXXXX-XXXXX --port 47477 --rate 0 --forge 0123456789abcdef
```
