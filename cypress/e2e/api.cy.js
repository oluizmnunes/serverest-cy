describe('ServeRest API tests', () => {
    it('creates a user and retrieves it by id', () => {
      const apiUrl = 'https://serverest.dev';
      const id = Cypress._.random(100, 999);
      const user = {
        nome: `user${id}`,
        email: `user${id}@test.com`,
        password: 'Password@123',
        administrador: 'true',
      };

      cy.request({
        method: 'POST',
        url: `${apiUrl}/usuarios`,
        body: user,
      }).then((createResponse) => {
        expect(createResponse.status).to.eq(201);
        expect(createResponse.body.message).to.eq('Cadastro realizado com sucesso');
        expect(createResponse.body).to.have.property('_id');
  
        return cy.request({
          url: `${apiUrl}/usuarios/${createResponse.body._id}`,
        });
      }).then((getResponse) => {
        expect(getResponse.status).to.eq(200);
        expect(getResponse.body).to.include({
          nome: user.nome,
          email: user.email,
          administrador: 'true',
        });
      });
    });
  });