class RegisterPage {
    register({ nome, email, password }) {
      cy.visit('/cadastrarusuarios');
      cy.get('[data-testid="nome"]').type(nome);
      cy.get('[data-testid="email"]').type(email);
      cy.get('[data-testid="password"]').type(password, { log: false });
      cy.get('[data-testid="checkbox"]').check();
      return cy.get('[data-testid="cadastrar"]').click();
    }
  }
  
  export default RegisterPage;