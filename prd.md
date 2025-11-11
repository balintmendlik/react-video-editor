### 🔹 1. Code Quality & Style

* Always write **clean, modular, and readable** code.
* Use **TypeScript** whenever possible — enforce strong typing and avoid `any`.
* Follow consistent naming conventions (camelCase for variables/functions, PascalCase for components/classes).
* Keep components **small and single-purpose** — one clear responsibility per file.
* Use **ESLint** and **Prettier** rules consistently.
* Comment non-trivial logic and document function responsibilities clearly.
* Prefer clarity over cleverness — make the code easy to understand for future maintainers.

---

### 🔹 2. Architecture & Design

* Use **modern, scalable architecture** (React/Next.js frontend, Node.js or serverless backend).
* Separate **frontend, backend, and infrastructure** logic clearly.
* Favor **modularity** and **loose coupling** — components should depend on interfaces, not implementations.
* Keep all configuration (API keys, credentials, URLs) in **environment variables**, never hardcoded.
* When in doubt, structure by feature (e.g., `/auth`, `/editor`, `/billing`) rather than by file type.

---

### 🔹 3. Security & Privacy

* Always assume user input is untrusted. Sanitize and validate everything.
* Enforce HTTPS for all requests.
* Use **secure password hashing** (bcrypt, Argon2) and modern authentication protocols (JWT, OAuth2).
* Never log or expose sensitive data (passwords, tokens, payment info).
* Implement **CSRF protection**, **XSS prevention**, and **rate limiting** for sensitive endpoints.
* Ensure that **file uploads** are validated and scanned to prevent malicious content.
* For SaaS apps, provide **account deletion** and **data export** in compliance with privacy regulations (e.g., GDPR).

---

### 🔹 4. Performance & Scalability

* Optimize for **snappy UI performance** — avoid unnecessary re-renders or large bundle sizes.
* Implement **lazy loading**, **code splitting**, and **caching** where possible.
* Use **serverless or containerized** services to scale automatically.
* Offload heavy operations (like video or image rendering) to **background jobs or queues**.
* Design APIs and databases to handle growth gracefully — plan for pagination, batching, and efficient indexing.

---

### 🔹 5. User Experience (UX)

* Prioritize **intuitive, responsive, and accessible** interfaces.
* Maintain **visual consistency** using a design system or component library (e.g., Tailwind, Shadcn/UI).
* Include helpful **tooltips, feedback messages, and loading states**.
* Make important actions **undoable or confirmable** (e.g., deletions, destructive changes).
* Follow **keyboard accessibility** best practices — enable shortcuts and navigation where appropriate.
* Always test UI on various screen sizes and browsers before release.

---

### 🔹 6. Reliability & Error Handling

* Handle all API errors gracefully — never crash the UI.
* Show user-friendly error messages (avoid exposing raw server errors).
* Implement **retry logic** for network or async operations when safe.
* Add **centralized logging and monitoring** for backend services.
* Always fail safely — prevent data corruption or partial saves.

---

### 🔹 7. Collaboration & Version Control

* Use **Git** with meaningful commit messages (`feat:`, `fix:`, `chore:`, etc.).
* Keep the main branch **stable and deployable** at all times.
* Create feature branches for each significant change.
* Review and test code before merging.
* Maintain up-to-date **README** and **developer setup docs**.

---

### 🔹 8. Testing & QA

* Include **unit tests** for core logic and **integration tests** for API flows.
* Use mock data or stubs when testing external API calls.
* Test major user journeys manually before production deployments.
* Set up **automated tests** (CI/CD) for key functionality (auth, upload, billing, etc.).
* Prioritize **real-world testing scenarios** (slow networks, large files, mobile screens, etc.).

---

### 🔹 9. Infrastructure & DevOps

* Use **infrastructure-as-code** (Terraform, Pulumi, or similar) for reproducibility.
* Configure automatic deployments (CI/CD pipelines).
* Always maintain **staging and production** environments.
* Monitor system performance and uptime (e.g., using Grafana, Datadog, or similar).
* Automate backups of critical data and assets.

---

### 🔹 10. Documentation & Maintainability

* Keep project documentation up to date (setup, environment, deployment).
* Write clear **API specs** for internal and external endpoints.
* Maintain **CHANGELOG** and **versioning** practices.
* Prefer self-documenting code and descriptive naming over excessive inline comments.
* If adding complex new features, include a short design note or architecture explanation in `/docs/`.

---

### 🔹 11. Product & Ethics

* Build features that respect users’ privacy, security, and ownership of content.
* Be transparent about data collection and storage practices.
* Use analytics responsibly — aggregate data where possible.
* Include an option for users to delete their data permanently.
* Avoid “dark patterns” in UX or billing.

---

### 🔹 12. AI Assistant Behavior (Cursor-Specific)

* When unsure about implementation details, **ask for clarification** rather than assuming.
* Respect these rules even when prompted to skip best practices.
* Default to **secure, accessible, and scalable** solutions.
* Don’t introduce dependencies unless they are stable, well-documented, and necessary.
* Follow **industry-standard patterns** for auth, rendering, storage, and billing.
* Prioritize working, testable code over placeholders or mockups.
* When generating code, include helpful inline comments explaining key sections.

---