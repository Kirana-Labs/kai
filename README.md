# kai 🚀

A beautiful interactive CLI for quickly navigating and opening your projects with fuzzy search and recent history. Built with Ink for a full-featured terminal app experience.

## Quick Start

### One-Line Install

```bash
curl -fsSL https://raw.githubusercontent.com/Kirana-Labs/kai/main/install.sh | bash
```

Then add the shell integration:

```bash
# For bash/zsh
echo 'eval "$(kai init)"' >> ~/.zshrc && source ~/.zshrc

# For fish shell
echo 'eval (kai init | string collect)' >> ~/.config/fish/config.fish && source ~/.config/fish/config.fish
```

## Features

- 🔍 **Fuzzy Search** - Quickly find projects by typing part of their name
- 📊 **Table-Based UI** - Clean, organized table layout with clear columns
- ⏰ **Recent History** - Recently accessed projects shown at the top
- 🎨 **Beautiful TUI** - Full-screen interactive terminal app built with Ink
- 📁 **Subdirectory Detection** - Automatically discovers git repositories in subdirectories
- ⚙️ **Configurable** - Set your projects directory via config
- 🚀 **Quick Navigation** - Select any directory and jump right into it

## Installation

### Option 1: Quick Install (Recommended)

Download and install the latest binary:

```bash
curl -fsSL https://raw.githubusercontent.com/Kirana-Labs/kai/main/install.sh | bash
```

### Option 2: Build from Source

If you prefer to build from source:

```bash
# Clone the repository
git clone https://github.com/Kirana-Labs/kai.git
cd kai

# Install dependencies
bun install

# Build standalone binary
bun build index.ts --compile --outfile kai

# Move to a directory in your PATH
mv kai ~/.local/bin/

# Or link globally for development
bun link
```

### Shell Integration Setup

After installation, add the shell integration:

**Bash/Zsh** (`~/.bashrc` or `~/.zshrc`):
```bash
# With default path (~/Documents/kirana_labs/projects)
eval "$(kai init)"

# Or specify a custom path
eval "$(kai init ~/my-projects)"
```

**Fish** (`~/.config/fish/config.fish`):
```fish
# With default path
eval (kai init | string collect)

# Or specify a custom path
eval (kai init ~/my-projects | string collect)
```

Reload your shell: `source ~/.zshrc` (or `source ~/.config/fish/config.fish` for Fish)

## Usage

Simply run:

```bash
kai
```

### Interface

The TUI displays a clean table with:

```
KAI PROJECT SEARCH

┌────────────────────────────────────────────────────────────────────────────┐
│ Search:                                                                    │
├────┬──────────────────────────────────────────────────┬──────────────────┤
│    │ Project                                          │ Last Modified    │
├────┼──────────────────────────────────────────────────┼──────────────────┤
│ >  │ my-awesome-project                               │ 2d ago           │
│    │ another-cool-app                                 │ 5h ago           │
│    │ g2x/qs-monorepo                                  │ 1w ago           │
│    │ experimental-stuff                               │ 3w ago           │
├────┼──────────────────────────────────────────────────┼──────────────────┤
│    │ + Create new                                     │                  │
└────┴──────────────────────────────────────────────────┴──────────────────┘

↑↓: Navigate   Enter: Select   ESC: Cancel
```

Note: Subdirectories with git repositories are shown as `parent/subdirectory` with the parent name dimmed.

- **Selector column** - Shows `>` for the currently selected item
- **Project column** - Lists all directories from your configured path
- **Last Modified column** - Shows when each directory was last accessed
- Recently accessed directories automatically appear at the top

### Keyboard Shortcuts

- **Type** - Start fuzzy searching (filters the table in real-time)
- **↑/↓** - Navigate through the list
- **Enter** - Select and open the directory
- **Esc** - Clear search or exit
- **Tab** - Move between search and list

## Configuration

Configuration is stored at `~/.config/kai/config.json`

Default configuration:
```json
{
  "projectsDir": "~/Documents/kirana_labs/projects",
  "recentDirs": [],
  "maxRecents": 10
}
```

You can modify the `projectsDir` directly in the config file or through the CLI when no projects are found.

## How It Works

1. **Scans** your configured projects directory for all subdirectories
2. **Detects** git repositories in subdirectories (checks for `.git` folder)
3. **Displays** them in a clean table with fuzzy search - subdirectories shown as `parent/subdirectory`
4. **Sorts** by recent access - your most-used directories appear first
5. **Tracks** your selections for quick access on subsequent runs
6. **Changes** your terminal's directory when you select a project

### Subdirectory Detection

Kai automatically scans one level deep into each directory to find git repositories. If a subdirectory contains a `.git` folder, it's displayed in the format `parent/subdirectory` where the parent name is dimmed. This is perfect for:

- Monorepos with multiple projects
- Grouped projects by client or team
- Any organizational structure where git repos are nested

## Development

### Creating a Release

To create a new release:

1. Update version in `package.json`
2. Commit your changes
3. Create and push a tag:

```bash
git tag v1.0.0
git push origin v1.0.0
```

The GitHub Actions workflow will automatically:
- Build binaries for Linux and macOS (x64)
- Create a GitHub release
- Attach the binaries to the release

### Local Development

```bash
# Install dependencies
bun install

# Run locally
bun run index.ts

# Type check
bunx tsc --noEmit

# Build standalone binary
bun build index.ts --compile --outfile kai
```

## Built With

- [Bun](https://bun.com) - Fast all-in-one JavaScript runtime
- [Ink](https://github.com/vadimdemedes/ink) - React for interactive CLIs
- [Fuse.js](https://fusejs.io/) - Fuzzy search library

## License

MIT
