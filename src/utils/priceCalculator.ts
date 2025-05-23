/**
 * Функция для безопасного вычисления математического выражения в поле цены
 * Поддерживает:
 * - Числа с пробелами (например, "45 500" -> 45500)
 * - Математические выражения (например, "45000+500" -> 45500)
 * - Стандартные числа (например, "45500" -> 45500)
 * Разрешает только числа, точки, +, -, *, /
 */
export function safeCalculate(expression: string): number | null {
  // Удаляем все пробелы
  const sanitizedExpression = expression.replace(/\s+/g, '');
  
  // Проверяем на допустимые символы (цифры, точка, +, -, *, /)
  if (!/^[-+\*\/\.\d]+$/.test(sanitizedExpression)) {
    return null; // Недопустимые символы
  }
  
  // Простая проверка на опасные конструкции (хотя regex выше должен отсечь)
  if (sanitizedExpression.includes('--') || sanitizedExpression.includes('++') || sanitizedExpression.includes('**') || sanitizedExpression.includes('//')) {
      return null;
  }
  
  try {
    // Используем new Function для безопасного вычисления
    // 'use strict' добавляет дополнительный слой безопасности
    const calculate = new Function(`'use strict'; return (${sanitizedExpression});`);
    const result = calculate();
    
    // Проверяем, что результат - конечное число
    if (typeof result === 'number' && isFinite(result)) {
      return result;
    } else {
      return null; // Результат не число или бесконечность
    }
  } catch (error) {
    console.error("Ошибка вычисления выражения:", error);
    return null; // Ошибка во время вычисления
  }
} 