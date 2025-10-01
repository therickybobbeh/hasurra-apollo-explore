# ClaimSight Documentation

Comprehensive documentation for the ClaimSight healthcare claims management system.

## Contents

### Core Documentation

- **[BEST_PRACTICES.md](BEST_PRACTICES.md)** - Development guidelines for GraphQL, Hasura, Apollo Client, and the codebase
- **[ARCHITECTURE_OVERVIEW.md](ARCHITECTURE_OVERVIEW.md)** - System architecture, data flow, security model, and deployment topology
- **[LEARNING_CHECKLIST.md](LEARNING_CHECKLIST.md)** - Step-by-step guide to learn the stack from scratch

### UML Diagrams

All diagrams are in PlantUML format (`.puml`). View them:
- **Online:** [PlantUML Web Server](http://www.plantuml.com/plantuml/uml/)
- **VS Code:** Install PlantUML extension
- **IntelliJ:** Built-in PlantUML support

**Diagrams:**
- **[context-diagram.puml](UML/context-diagram.puml)** - System context showing actors and external systems
- **[component-diagram.puml](UML/component-diagram.puml)** - Internal component structure and interactions
- **[sequence-claim-detail.puml](UML/sequence-claim-detail.puml)** - Sequence diagram for viewing claim and adding notes
- **[deployment-diagram.puml](UML/deployment-diagram.puml)** - Cross-platform deployment without Docker

### Architecture Decision Records (ADRs)

Documents key architectural decisions with context, rationale, and trade-offs:

- **[0001-hasura-vs-custom-resolvers.md](ADRs/0001-hasura-vs-custom-resolvers.md)** - Why Hasura over custom GraphQL resolvers
- **[0002-why-apollo-client.md](ADRs/0002-why-apollo-client.md)** - Apollo Client for frontend data management
- **[0003-adding-promptql.md](ADRs/0003-adding-promptql.md)** - Natural language database queries

## Quick Links

### For Developers
1. Start with [ARCHITECTURE_OVERVIEW.md](ARCHITECTURE_OVERVIEW.md) to understand the system
2. Follow [LEARNING_CHECKLIST.md](LEARNING_CHECKLIST.md) for hands-on learning
3. Reference [BEST_PRACTICES.md](BEST_PRACTICES.md) while coding

### For Architects
1. Review [ADRs/](ADRs/) for technology decisions
2. Study [UML/](UML/) diagrams for system design
3. Read [ARCHITECTURE_OVERVIEW.md](ARCHITECTURE_OVERVIEW.md) for deployment patterns

### For Product Managers
1. View [context-diagram.puml](UML/context-diagram.puml) for user roles
2. Read [0003-adding-promptql.md](ADRs/0003-adding-promptql.md) for future capabilities
3. Check [LEARNING_CHECKLIST.md](LEARNING_CHECKLIST.md) Phase 7 for extension ideas

## Documentation Standards

### UML Best Practices

- Use PlantUML for version-controllable diagrams
- Keep diagrams focused (one concern per diagram)
- Update diagrams when architecture changes
- Include both logical and deployment views

### ADR Format

Each ADR follows this structure:
- **Status:** Accepted, Proposed, Deprecated, Superseded
- **Context:** The problem or decision to be made
- **Decision:** What we decided
- **Rationale:** Why we made this decision
- **Consequences:** Positive, negative, and neutral outcomes
- **Alternatives:** Other options considered and why rejected

### Code Documentation

- GraphQL schemas: Document in Hasura metadata
- TypeScript: Use TSDoc for complex functions
- React components: Props documentation
- Database: SQL comments for tables and columns

## Contributing to Documentation

### When to Create an ADR

Create a new ADR when:
- Choosing between significant technologies
- Making architectural changes with long-term impact
- Deciding on patterns that affect multiple components
- Responding to quality attribute requirements (security, performance, etc.)

### ADR Naming Convention

`NNNN-short-title.md` where:
- `NNNN` = Four-digit number (0001, 0002, etc.)
- `short-title` = Lowercase with hyphens

Example: `0004-adding-authentication.md`

### Updating Diagrams

1. Edit `.puml` source file
2. Verify it renders correctly
3. Update related documentation if needed
4. Commit both source and any generated images

## External Resources

### Learning Resources
- [GraphQL Official Tutorial](https://graphql.org/learn/)
- [Hasura Tutorials](https://hasura.io/learn/)
- [Apollo Client React Tutorial](https://www.apollographql.com/docs/react/get-started/)
- [PostgreSQL Row-Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

### Reference Documentation
- [Hasura Docs](https://hasura.io/docs/latest/index/)
- [Apollo Client API](https://www.apollographql.com/docs/react/api/core/)
- [React Hooks](https://react.dev/reference/react)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

### Community
- [Hasura Discord](https://discord.gg/hasura)
- [GraphQL Slack](https://graphql.org/community/)
- [Apollo Community](https://community.apollographql.com/)

## Documentation Maintenance

### Review Schedule
- **Monthly:** Check for outdated information
- **Per Release:** Update architecture diagrams
- **Per Major Change:** Create or update ADRs
- **Per Quarter:** Review best practices

### Quality Checklist
- [ ] Links work and point to current content
- [ ] Code examples are tested and working
- [ ] Diagrams reflect current architecture
- [ ] ADRs have all required sections
- [ ] Terminology is consistent across docs

## Feedback

Found an issue or have a suggestion?
1. Check existing documentation first
2. Ask in team chat or standup
3. Create a GitHub issue if it's a gap
4. Submit a PR with improvements

---

**Last Updated:** 2024-03-15
**Maintainers:** ClaimSight Development Team
