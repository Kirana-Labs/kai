# Shell Integration Guide

## How it works

The `kai` CLI outputs shell commands (like `cd '/path/to/project'`) to **stdout**, while all user-facing output (the TUI, messages, etc.) goes to **stderr**.

The shell wrapper function captures stdout and uses `eval` to execute the command in your current shell session, effectively changing your terminal's directory.

## Installation

Instead of manually copying a shell function, use the `init` command to generate it:

### Bash/Zsh

Add to `~/.bashrc` or `~/.zshrc`:

```bash
eval "$(kai init ~/Documents/kirana_labs/projects)"
```

Then reload: `source ~/.zshrc`

### Fish Shell

Add to `~/.config/fish/config.fish`:

```fish
eval (kai init ~/Documents/kirana_labs/projects | string collect)
```

Then reload: `source ~/.config/fish/config.fish`

## What does `kai init` do?

The `kai init` command outputs the shell wrapper function. It automatically detects your shell type and generates the appropriate function:

**For Bash/Zsh:**
```bash
kai() {
  local output
  output=$(command kai --path="~/Documents/kirana_labs/projects" "$@" 2>/dev/tty)
  local exit_code=$?
  
  if [ $exit_code -eq 0 ] && [ -n "$output" ]; then
    eval "$output"
  else
    return $exit_code
  fi
}
```

**For Fish:**
```fish
function kai
  set -l output (command kai --path="~/Documents/kirana_labs/projects" $argv 2>/dev/tty | string collect)
  set -l exit_code $status
  
  if test $exit_code -eq 0 -a -n "$output"
    eval $output
  else
    return $exit_code
  end
end
```

## Why `2>/dev/tty`?

The `2>/dev/tty` redirects stderr (the TUI) directly to the terminal, preventing it from being captured in `$output`. This ensures only the `cd` command is captured and eval'd.

## Example Flow

1. User runs: `kai`
2. TUI appears (written to stderr)
3. User selects a project
4. CLI writes to stdout: `cd '/Users/you/projects/my-project'`
5. Shell wrapper captures this and runs: `eval "cd '/Users/you/projects/my-project'"`
6. Terminal changes to that directory ✨

## Credit

This pattern is inspired by the excellent [try](https://github.com/tobi/try) CLI by Tobi Lütke.
