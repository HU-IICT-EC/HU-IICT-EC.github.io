---
applyTo: "**"
---
# Project General Coding Standards

## All Languages

- Write clear, concise, and self-documenting code.
- Use meaningful names following the conventions below.
- Add comments for complex logic or non-obvious decisions.
- Keep functions and methods short and focused.
- Prefer immutability and pure functions where practical.
- Remove unused code and imports.
- Use version control best practices (atomic commits, descriptive messages).

## JavaScript / TypeScript

### Naming Conventions
- Use PascalCase for component names, classes, interfaces, and type aliases.
- Use camelCase for variables, functions, and methods.
- Prefix private class members with underscore (_).
- Use ALL_CAPS for constants.

### Code Style
- Use `const` and `let` (never `var`).
- Prefer arrow functions for callbacks and short functions.
- Use template literals for string interpolation.
- Always use strict equality (`===`/`!==`).
- Use semicolons consistently.
- Organize imports: external, then internal, then styles/assets.

### Error Handling
- Use try/catch blocks for async operations.
- Always log errors with contextual information.
- Avoid silent failures.

### Linting & Formatting
- Run `eslint` and fix all reported issues before committing.
- Use Prettier or editor formatting for consistent style.

## Ruby

### Naming Conventions
- Use PascalCase for classes and modules.
- Use snake_case for variables, methods, and file names.
- Prefix private instance variables with @.
- Use ALL_CAPS for constants.

### Code Style
- Use two spaces for indentation.
- Prefer single quotes for strings unless interpolation is needed.
- Avoid global variables.
- Use `begin/rescue` for error handling and log errors with context.

### Linting & Formatting
- Run RuboCop and fix all reported issues before committing.

## Python

### Naming Conventions
- Use PascalCase for class names.
- Use snake_case for variables, functions, methods, and file names.
- Prefix private instance variables and methods with a single underscore (_).
- Use ALL_CAPS for constants.

### Code Style
- Use 4 spaces for indentation.
- Prefer single quotes for strings unless interpolation or escaping is needed.
- Avoid global variables.
- Use list comprehensions and generator expressions where appropriate.
- Follow PEP8 for formatting and style.

### Error Handling
- Use try/except blocks for error handling.
- Always log errors with contextual information.
- Avoid bare excepts; catch specific exceptions.

### Linting & Formatting
- Run `flake8` and/or `pylint` and fix all reported issues before committing.
- Use `black` or editor formatting for consistent style.

## CSS

### Naming Conventions
- Use kebab-case for class and ID names (e.g., `.main-header`, `#user-profile`).
- Use BEM (Block__Element--Modifier) methodology for complex components if appropriate.
- Use ALL_CAPS for CSS custom properties (variables), e.g., `--PRIMARY-COLOR`.

### Code Style
- Use 2 spaces for indentation.
- Use lowercase for property names and values (except font names, etc.).
- Always include a space after the colon in property declarations.
- Group related rules together and order properties logically (layout, box, typography, visual).
- Use shorthand properties where possible.
- End each declaration with a semicolon.

### Formatting & Organization
- Organize CSS: external libraries first, then base styles, layout, components, utilities.
- Prefer external stylesheets over inline styles.
- Remove unused selectors and rules.
- Use comments to separate sections and explain non-obvious styles.

## HTML

### Naming Conventions
- Use lowercase for all tag and attribute names.
- Use kebab-case for custom data attributes and CSS classes/IDs.
- Use semantic HTML elements where possible (e.g., `<main>`, `<nav>`, `<section>`, `<article>`, `<footer>`).

### Code Style
- Use 2 spaces for indentation.
- Always close tags (including self-closing tags).
- Use double quotes for attribute values.
- Omit optional closing tags only when allowed by HTML5 and it improves readability.
- Keep attribute order consistent: id, class, name, data-*, src/href, type, value, others.
- Avoid inline styles and scripts; prefer external files.

### Formatting & Organization
- Organize markup logically: structure, content, then scripts.
- Use comments to separate major sections and explain complex markup.
- Keep lines under 120 characters where possible.
- Remove unused or commented-out code before committing.

## Markdown / Documentation

- Use proper heading levels and consistent formatting.
- Write in clear, concise English.
- Use code blocks for code samples.
- Keep lines under 120 characters where possible.

## Git

- Write descriptive commit messages (imperative mood, e.g., "Add feature X").
- Group related changes in a single commit.
- Do not commit commented-out or dead code.