# ClaimSight Architecture Diagrams

This folder contains UML diagrams documenting the ClaimSight system architecture. All diagrams are created using **Mermaid**, which renders natively in GitHub and most modern markdown viewers.

## 📊 Available Diagrams

### 1. [Context Diagram](./context-diagram.md)
**Purpose:** Shows the ClaimSight system in its environment, including external users (members, providers, administrators) and external systems (PostgreSQL, Hasura, PromptQL).

**Key Elements:**
- User personas and their interactions
- System boundaries
- External dependencies
- Communication protocols (HTTPS, WSS, GraphQL, SQL)

**Use this diagram to:**
- Understand who uses the system and how
- Identify external dependencies
- See high-level data flows

---

### 2. [Component Diagram](./component-diagram.md)
**Purpose:** Breaks down ClaimSight into its internal components and shows how they interact.

**Key Elements:**
- Web Application layer (React, Apollo Client, routing)
- GraphQL layer (Hasura Engine, Actions, RLS, Subscriptions, optional Federation)
- Data layer (PostgreSQL, indexes, constraints)
- Natural Language layer (PromptQL)

**Use this diagram to:**
- Understand the internal architecture
- See component responsibilities
- Trace data flow from UI to database
- Plan development tasks

---

### 3. [Sequence Diagram: Claim Detail & Add Note](./sequence-claim-detail.md)
**Purpose:** Shows the step-by-step interaction flow for two key user operations:
1. Opening a claim detail page (with related data)
2. Adding a note with optimistic UI updates

**Key Elements:**
- Query execution with Row-Level Security (RLS)
- Optimistic updates in Apollo Client cache
- Server-side validation and confirmation
- Real-time subscription updates (for other sessions)

**Use this diagram to:**
- Understand the request/response flow
- See how optimistic UI works
- Learn how RLS is enforced
- Debug performance or caching issues

---

### 4. [Deployment Diagram](./deployment-diagram.md)
**Purpose:** Shows how ClaimSight components are deployed across different runtime environments on a developer machine.

**Key Elements:**
- Cross-platform setup (Windows, macOS, Linux)
- Port mappings for all services
- Native installations (no Docker)
- Installation instructions per platform

**Use this diagram to:**
- Set up your local development environment
- Understand port assignments
- Troubleshoot connectivity issues
- Plan production deployment (adapt for cloud)

---

## 🛠️ Viewing the Diagrams

### GitHub / GitLab
All diagrams render automatically when viewing the `.md` files.

### VS Code
Install the **Markdown Preview Mermaid Support** extension:
```bash
code --install-extension bierner.markdown-mermaid
```

### IntelliJ / WebStorm
Mermaid support is built-in for recent versions. Ensure the Markdown plugin is enabled.

### Command Line / Browser
Use [Mermaid Live Editor](https://mermaid.live/) to paste and render diagrams.

---

## 📐 Diagram Standards

### Naming Conventions
- Use descriptive, action-oriented names for processes
- Include technology stack in component names (e.g., "React UI - TypeScript, Vite")
- Show port numbers in deployment diagrams

### Color Coding
- **Blue tones**: Frontend/client components
- **Teal/cyan**: GraphQL/API layer
- **Dark blue**: Database layer
- **Red/orange**: External services or natural language processing

### Relationship Labels
- Include protocol (HTTP, WSS, SQL, GraphQL)
- Show directionality clearly
- Add key parameters or headers when relevant

---

## 🔄 Updating Diagrams

When modifying the system:

1. **Identify affected diagrams:**
   - Adding a new service? Update **Component** and **Deployment** diagrams
   - Changing user flow? Update **Sequence** diagrams
   - Adding external dependencies? Update **Context** diagram

2. **Edit the Mermaid syntax** directly in the `.md` files

3. **Verify rendering:**
   ```bash
   # Preview in VS Code or push to GitHub
   git add diagrams/
   git commit -m "docs: update architecture diagrams"
   ```

4. **Update this README** if adding/removing diagrams

---

## 📚 Additional Documentation

These diagrams are part of the larger documentation suite:

- **`../DOCUMENTS/ARCHITECTURE_OVERVIEW.md`** - Detailed architecture narrative
- **`../DOCUMENTS/BEST_PRACTICES.md`** - Coding standards and patterns
- **`../DOCUMENTS/LEARNING_CHECKLIST.md`** - Step-by-step learning path
- **`../DOCUMENTS/ADRs/`** - Architecture Decision Records

---

## 🎓 Learning Path

For new team members, review diagrams in this order:

1. **Context** → Understand the big picture
2. **Deployment** → Set up your environment
3. **Component** → Learn the internal structure
4. **Sequence** → See how data flows in real scenarios

Then dive into the codebase with confidence!

---

**Last Updated:** 2025-09-30
**Maintained By:** ClaimSight Development Team
