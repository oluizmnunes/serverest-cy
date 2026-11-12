class ProductsPage {
    create(product) {
      cy.get('[data-testid="nome"]').type(product.nome);
      cy.get('[data-testid="preco"]').type(product.preco);
      cy.get('[data-testid="descricao"]').type(product.descricao);
      cy.get('[data-testid="quantity"]').type(product.quantidade);
      return cy.get('[data-testid="cadastarProdutos"]').click();
    }
  }
  
  export default ProductsPage;