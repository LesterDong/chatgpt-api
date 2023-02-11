export const ErrorCodeEnums = {
  401: { code: 401, msg: 'Login required.' },
  403: { code: 403, msg: 'The OpenAI server refused to access.' },
  429: { code: 429, msg: 'The OpenAI server was limited.' },
  500: { code: 500, msg: 'The OpenAI server is busy.' },
  503: { code: 503, msg: 'The OpenAI server is busy.' },
  999: { code: 999, msg: 'Unknown error.' }
}
