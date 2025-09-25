/**
 * Valida se um CPF é válido
 * @param {string} cpf - CPF para validar
 * @returns {boolean} - true se válido, false se inválido
 */
function validateCpf(cpf) {
  // Remove caracteres não numéricos
  cpf = cpf.replace(/[^\d]/g, '');

  // Verifica se tem 11 dígitos
  if (cpf.length !== 11) return false;

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  
  let firstDigit = 11 - (sum % 11);
  if (firstDigit === 10 || firstDigit === 11) firstDigit = 0;
  
  if (firstDigit !== parseInt(cpf.charAt(9))) return false;

  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  
  let secondDigit = 11 - (sum % 11);
  if (secondDigit === 10 || secondDigit === 11) secondDigit = 0;
  
  if (secondDigit !== parseInt(cpf.charAt(10))) return false;

  return true;
}

/**
 * Formata CPF com máscara
 * @param {string} cpf - CPF sem formatação
 * @returns {string} - CPF formatado (000.000.000-00)
 */
function formatCpf(cpf) {
  cpf = cpf.replace(/[^\d]/g, '');
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Remove formatação do CPF
 * @param {string} cpf - CPF com ou sem formatação
 * @returns {string} - CPF apenas com números
 */
function cleanCpf(cpf) {
  return cpf.replace(/[^\d]/g, '');
}

module.exports = {
  validateCpf,
  formatCpf,
  cleanCpf
};