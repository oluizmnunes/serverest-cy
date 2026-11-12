class LoginPage {
    login({ email, password }) {
      cy.visit('/login');
      cy.get('[data-testid="email"]').type(email);
      cy.get('[data-testid="senha"]').type(password);

      return cy.get('[data-testid="entrar"]').click();
    }
  }
  
  export default LoginPage;