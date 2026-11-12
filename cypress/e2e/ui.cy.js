describe("ServeRest frontend", () => {
  it("registers a new admin user and lands on the admin home", () => {
    const id = Cypress._.random(100, 999);
    const user = {
      nome: `user${id}`,
      email: `user${id}@test.com`,
      password: "Password@123",
    };

    cy.visit("/cadastrarusuarios");
    cy.get('[data-testid="nome"]').type(user.nome);
    cy.get('[data-testid="email"]').type(user.email);
    cy.get('[data-testid="password"]').type(user.password);
    cy.get('[data-testid="checkbox"]').check();
    cy.get('[data-testid="cadastrar"]').click();

    cy.contains("Cadastro realizado com sucesso").should("be.visible");
    cy.url().should("include", "/admin/home");
    cy.contains(`Bem Vindo ${user.nome}`).should("be.visible");
  });
});
