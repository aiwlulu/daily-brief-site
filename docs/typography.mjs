// Typography for reader-facing Traditional Chinese news copy.
// Do not modify data schema units, source URLs, English copy or stable IDs.
export function formatZhText(input) {
  if (typeof input !== 'string' || !input) return input;
  let text = input.normalize('NFC');
  // Chinese sentence punctuation. Keep punctuation inside numbers/English intact.
  text = text.replace(/([\p{Script=Han}]),(?=[\p{Script=Han}])/gu, '$1，');
  text = text.replace(/([\p{Script=Han}]);(?=[\p{Script=Han}])/gu, '$1；');
  text = text.replace(/([\p{Script=Han}]):(?=[\p{Script=Han}])/gu, '$1：');
  text = text.replace(/([\p{Script=Han}])\?(?=[\p{Script=Han}\s]|$)/gu, '$1？');
  text = text.replace(/([\p{Script=Han}])!(?=[\p{Script=Han}\s]|$)/gu, '$1！');

  // Han versus ASCII letters/numerals, including Chinese numeral units.
  text = text.replace(/([\p{Script=Han}])([A-Za-z0-9])/gu, '$1 $2');
  text = text.replace(/([A-Za-z0-9%])([\p{Script=Han}])/gu, '$1 $2');

  // Standard English measurement units are attached to their numbers.
  text = text.replace(/(\d+(?:\.\d+)?) +(?=(?:KB|MB|GB|TB|ms|kW|MW|GW|kWh|MHz|GHz|Gbps|Mbps|nm)\b)/g, '$1');
  text = text.replace(/ +([，。、；：！？）】》])/g, '$1');
  text = text.replace(/([（【《]) +/g, '$1');
  return text.replace(/ {2,}/g, ' ');
}

// Recursively format only public zh strings and the short story.metric label.
// Structured numbers, dates, owner URLs and English prose remain unchanged.
export function formatChineseFields(value) {
  if (Array.isArray(value)) return value.map(formatChineseFields);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => {
    if (key === 'zh' && typeof item === 'string') return [key, formatZhText(item)];
    if (key === 'metric' && typeof item === 'string') return [key, formatZhText(item)];
    return [key, formatChineseFields(item)];
  }));
}
