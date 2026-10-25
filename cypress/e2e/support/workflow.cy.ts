describe('Complete Support Ticket and User Journey E2E Suite', () => {
  const uniqueSuffix = Date.now();
  const userEmail = `user_${uniqueSuffix}@example.com`;
  const agentEmail = `agent_${uniqueSuffix}@example.com`;
  const adminEmail = `admin_${uniqueSuffix}@example.com`;
  const password = 'SecurePassword123!';

  before(() => {
    cy.task('db:seed');
  });

  it('should complete full user signup, ticket registration, agent replies, and admin status updates', () => {
    // 1. User Signup & Onboarding
    cy.visit('/signup');
    cy.get('input[name="email"]').type(userEmail);
    cy.get('input[name="password"]').type(password);
    cy.get('input[name="confirmPassword"]').type(password);
    cy.get('button[type="submit"]').click();
    
    cy.url().should('include', '/dashboard');
    cy.get('[data-testid="user-welcome"]').should('be.visible');

    // 2. Ticket Registration
    cy.get('[data-testid="nav-new-ticket"]').click();
    cy.get('input[name="subject"]').type('Integration Failure in Payment Gateway');
    cy.get('select[name="priority"]').select('High');
    cy.get('textarea[name="description"]').type('Transactions are throwing 500 internal server errors intermittently during peak load.');
    cy.get('button[type="submit"]').click();

    cy.url().should('match', /\/tickets\/[a-zA-Z0-9-]+$/);
    cy.get('[data-testid="ticket-status"]').should('contain', 'Open');
    const ticketUrl = window.location.href;

    // Logout user
    cy.get('[data-testid="user-menu"]').click();
    cy.get('[data-testid="logout-btn"]').click();

    // 3. Agent Reply Workflow
    cy.visit('/login');
    cy.get('input[name="email"]').type(agentEmail);
    cy.get('input[name="password"]').type(password);
    cy.get('button[type="submit"]').click();

    cy.visit(ticketUrl);
    cy.get('[data-testid="ticket-status"]').should('contain', 'Open');
    cy.get('textarea[name="reply"]').type('We are currently investigating the gateway logs. Stand by for updates.');
    cy.get('[data-testid="submit-reply"]').click();

    cy.get('[data-message-author]').should('contain', agentEmail);
    cy.get('[data-testid="ticket-status"]').should('contain', 'In Progress');

    // Logout agent
    cy.get('[data-testid="user-menu"]').click();
    cy.get('[data-testid="logout-btn"]').click();

    // 4. Admin Status Updates and Resolution
    cy.visit('/login');
    cy.get('input[name="email"]').type(adminEmail);
    cy.get('input[name="password"]').type(password);
    cy.get('button[type="submit"]').click();

    cy.visit(ticketUrl);
    cy.get('[data-testid="status-dropdown"]').select('Resolved');
    cy.get('[data-testid="save-status"]').click();

    cy.get('[data-testid="ticket-status"]').should('contain', 'Resolved');
    cy.get('[data-testid="audit-log"]').should('contain', adminEmail);

    // Verify back on User end
    cy.get('[data-testid="user-menu"]').click();
    cy.get('[data-testid="logout-btn"]').click();

    cy.visit('/login');
    cy.get('input[name="email"]').type(userEmail);
    cy.get('input[name="password"]').type(password);
    cy.get('button[type="submit"]').click();

    cy.visit(ticketUrl);
    cy.get('[data-testid="ticket-status"]').should('contain', 'Resolved');
    cy.get('[data-testid="reopen-ticket-btn"]').should('be.visible');
  });
});