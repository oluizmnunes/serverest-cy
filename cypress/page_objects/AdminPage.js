class AdminPage {
    openProductRegistration() {
      return cy.get('[data-testid="cadastrarProdutos"]').click();
    }
  }
  
  export default AdminPage;