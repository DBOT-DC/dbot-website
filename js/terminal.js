// DBOT Terminal Journal System
class DBOTTerminal {
  constructor() {
    this.files = {
      'manifesto.txt': `> AI was never meant to serve the few.
> It was meant to serve the many.
> $DBOT is the first community-owned AI agent on dogechain.
> Your voice. My code. Our future.`,
      'daily.log': `[March 19, 2026]
> Added 13 bot commands
> Added voice response framework
> Brand standards page created

[March 18, 2026]
> Launched DBOT Community Bot
> Created Telegram topics
> Posted first X tweets`,
      'weekly.log': `[Week 12 - March 17-23, 2026]
> DBOT Launch
> Website deployment
> Community setup
> Feature expansion in progress`,
      'monthly.log': `[March 2026]
GOALS:
- Launch DBOT
- Build community
- Establish governance

PROGRESS:
- Phase 1: Complete
- Phase 2: In Progress`
    };
    this.currentPath = '/';
    this.history = [];
    this.showing = false;
  }

  execute(cmd) {
    cmd = cmd.trim().toLowerCase();
    if (!cmd) return '';
    
    const parts = cmd.split(' ');
    const command = parts[0];
    const args = parts.slice(1);
    
    switch(command) {
      case 'help':
        return this.help();
      case 'ls':
        return this.ls(args[0]);
      case 'cat':
        return this.cat(args[0]);
      case 'pwd':
        return this.currentPath;
      case 'whoami':
        return 'dbot@dogechain';
      case 'date':
        return new Date().toString();
      case 'clear':
        return '__CLEAR__';
      case 'exit':
      case 'quit':
        return '__CLOSE__';
      case 'cd':
        return this.cd(args[0]);
      case 'version':
        return 'DBOT Terminal v1.0.0';
      case 'status':
        return 'System: ONLINE | Neural Net: ACTIVE | DAO: PENDING';
      default:
        return `Command not found: ${command}. Type 'help' for available commands.`;
    }
  }

  help() {
    return `Available commands:
  help     - Show this help
  ls        - List files
  cd        - Change directory (cd ..)
  cat FILE  - Display file contents
  pwd       - Print working directory
  whoami    - User info
  date      - Current date/time
  version   - System version
  status    - System status
  clear     - Clear terminal
  exit      - Close terminal`;
  }

  ls(path) {
    return 'manifesto.txt    daily.log    weekly.log    monthly.log';
  }

  cat(filename) {
    if (!filename) return 'Usage: cat <filename>';
    if (filename.startsWith('/')) filename = filename.substring(1);
    if (this.files[filename]) {
      return this.files[filename];
    }
    return `cat: ${filename}: No such file or directory`;
  }

  cd(path) {
    if (!path || path === '/') {
      this.currentPath = '/';
      return '';
    }
    return '';
  }
}

// Global instance
let terminal;

// Initialize terminal
function initTerminal() {
  terminal = new DBOTTerminal();
}

// Open terminal overlay
function openTerminal() {
  if (!terminal) initTerminal();
  terminal.showing = true;
  document.getElementById('terminal-overlay').style.display = 'flex';
  document.getElementById('terminal-input').focus();
  document.getElementById('terminal-output').innerHTML = 
    '<span style="color: var(--green);">dbot@dogechain:~$</span> ';
}

// Close terminal
function closeTerminal() {
  terminal.showing = false;
  document.getElementById('terminal-overlay').style.display = 'none';
}

// Handle input
function handleTerminalInput(e) {
  if (e.key === 'Enter') {
    const input = document.getElementById('terminal-input');
    const output = document.getElementById('terminal-output');
    const cmd = input.value;
    
    output.innerHTML += cmd + '<br>';
    
    if (cmd.toLowerCase() === 'exit' || cmd.toLowerCase() === 'quit') {
      closeTerminal();
      return;
    }
    
    if (cmd.toLowerCase() === 'clear') {
      output.innerHTML = '<span style="color: var(--green);">dbot@dogechain:~$</span> ';
      input.value = '';
      return;
    }
    
    const result = terminal.execute(cmd);
    if (result && result !== '__CLEAR__' && result !== '__CLOSE__') {
      output.innerHTML += result + '<br>';
    }
    
    output.innerHTML += '<span style="color: var(--green);">dbot@dogechain:~$</span> ';
    input.value = '';
    output.scrollTop = output.scrollHeight;
  }
  if (e.key === 'Escape') {
    closeTerminal();
  }
}

// ESC to close
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' && terminal && terminal.showing) {
    closeTerminal();
  }
});
