/**
 * Получить актуальные курсы валют относительно baseCurrency (по умолчанию RUB)
 * @param baseCurrency - базовая валюта (например, 'RUB')
 * @returns Promise<{ [currency: string]: number }>
 */
export async function fetchExchangeRates(baseCurrency: string = 'RUB'): Promise<Record<string, number>> {
  try {
    const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
    if (!res.ok) throw new Error(`Ошибка запроса: ${res.status}`);
    const data = await res.json();
    if (!data.rates) throw new Error('Некорректный ответ API');
    return data.rates;
  } catch (err) {
    console.error('Ошибка получения курсов валют:', err);
    return {};
  }
} 