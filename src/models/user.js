/**
 * Modelo de usuário
 */
class User {
  constructor({ cpf, nome, email, hashedPassword, createdAt, updatedAt }) {
    this.cpf = cpf;
    this.nome = nome;
    this.email = email;
    this.hashedPassword = hashedPassword;
    this.createdAt = createdAt || new Date().toISOString();
    this.updatedAt = updatedAt || new Date().toISOString();
  }

  /**
   * Converte para objeto JSON sem senha
   */
  toJSON() {
    return {
      cpf: this.cpf,
      nome: this.nome,
      email: this.email,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Atualiza timestamp de última modificação
   */
  touch() {
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Valida se o usuário tem todos os campos obrigatórios
   */
  isValid() {
    return !!(this.cpf && this.nome && this.email && this.hashedPassword);
  }
}

module.exports = User;