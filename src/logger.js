const COLORS = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function timestamp() {
  return new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function formatMessage(level, color, msg) {
  return `${COLORS.dim}[${timestamp()}]${COLORS.reset} ${color}${level}${COLORS.reset} ${msg}`;
}

export const log = {
  info: (msg) => console.log(formatMessage('INFO ', COLORS.green, msg)),
  warn: (msg) => console.warn(formatMessage('WARN ', COLORS.yellow, msg)),
  error: (msg) => console.error(formatMessage('ERROR', COLORS.red, msg)),
  step: (msg) => console.log(formatMessage(' ►   ', COLORS.cyan, msg)),
};
