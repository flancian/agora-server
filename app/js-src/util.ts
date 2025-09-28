
// app/js-src/util.ts

export const CLIENT_DEFAULTS = {
  user: 'flancian',
  autoPullSearch: false,
  autoPullWikipedia: false,
  showBrackets: false,
  showGraphLabels: true,
  showHypothesis: false,
  autoExpandStoas: false,
  demoTimeoutSeconds: '17',
  showEditSection: false,
};

export function safeJsonParse(value: string, defaultValue: any) {
  try {
    return JSON.parse(value);
  } catch (e) {
    return defaultValue;
  }
}
