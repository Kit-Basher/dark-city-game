# Contributing to Dark City RPG

Thank you for your interest in contributing to Dark City RPG! This document provides guidelines for contributors.

## Getting Started

### Prerequisites
- Node.js 18.0.0 or higher
- Git
- Basic knowledge of HTML, CSS, and JavaScript

### Setup
1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/dark-city-game.git`
3. Navigate to the project directory: `cd dark-city-game`
4. Install dependencies: `npm install`
5. Start the development server: `npm run dev`

## Code Style and Standards

### JavaScript
- Use ESLint configuration provided
- Follow ES6+ standards
- Use meaningful variable and function names
- Add JSDoc comments for functions

### CSS
- Use BEM methodology for class naming
- Follow mobile-first responsive design
- Use CSS custom properties for theming

### HTML
- Use semantic HTML5 elements
- Ensure proper accessibility attributes
- Validate HTML markup

## Development Workflow

### Branching
- `main`: Production-ready code
- `develop`: Integration branch
- `feature/*`: New features
- `bugfix/*`: Bug fixes
- `hotfix/*`: Critical fixes

### Commit Messages
Use conventional commit format:
```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

Examples:
```
feat(character): add character validation
fix(api): resolve authentication issue
docs(readme): update installation instructions
```

## Pull Request Process

### Before Submitting
1. Run tests: `npm test`
2. Check code style: `npm run lint`
3. Format code: `npm run format`
4. Update documentation if needed

### Pull Request Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] Manual testing completed
- [ ] Accessibility tested
- [ ] Cross-browser tested

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No console errors
```

## Testing

### Unit Tests
- Use Jest for unit testing
- Test critical functions and components
- Aim for >80% code coverage

### Integration Tests
- Test API endpoints
- Test user workflows
- Test error scenarios

### Accessibility Testing
- Use screen readers (NVDA, JAWS)
- Test keyboard navigation
- Check color contrast
- Validate with accessibility tools

## Security Guidelines

### General Security
- Never commit sensitive data (API keys, passwords)
- Use environment variables for configuration
- Validate all user inputs
- Sanitize outputs to prevent XSS

### API Security
- Use HTTPS in production
- Implement proper authentication
- Rate limit API endpoints
- Log security events

## Performance Guidelines

### Frontend Performance
- Optimize images and assets
- Minimize JavaScript bundle size
- Use lazy loading for images
- Implement caching strategies

### Backend Performance
- Use efficient database queries
- Implement proper indexing
- Cache frequently accessed data
- Monitor response times

## Documentation

### Code Documentation
- Add JSDoc comments to functions
- Document complex algorithms
- Explain business logic

### README Updates
- Update installation instructions
- Document new features
- Update API documentation

### API Documentation
- Use OpenAPI/Swagger for API docs
- Document all endpoints
- Include request/response examples
- Document error responses

## Issue Reporting

### Bug Reports
Use the bug report template:
```markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Go to...
2. Click on...
3. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: [e.g. Windows 10]
- Browser: [e.g. Chrome 91]
- Version: [e.g. 1.0.0]

## Screenshots
If applicable, add screenshots

## Additional Context
Any other context about the problem
```

### Feature Requests
Use the feature request template:
```markdown
## Feature Description
Clear description of the feature

## Problem Statement
What problem does this solve?

## Proposed Solution
How should this be implemented?

## Alternatives Considered
Other approaches considered

## Additional Context
Any other context or screenshots
```

## Release Process

### Versioning
Use semantic versioning (SemVer):
- `MAJOR.MINOR.PATCH`
- `MAJOR`: Breaking changes
- `MINOR`: New features (backward compatible)
- `PATCH`: Bug fixes (backward compatible)

### Release Checklist
- [ ] All tests pass
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped
- [ ] Tag created
- [ ] Release notes written

## Community Guidelines

### Code of Conduct
- Be respectful and inclusive
- Welcome newcomers
- Provide constructive feedback
- Focus on what is best for the community

### Communication
- Use GitHub issues for bug reports
- Use discussions for questions
- Be patient with responses
- Help others when possible

## Getting Help

### Resources
- [README.md](./README.md) - General project information
- [API Documentation](./docs/api.md) - API reference
- [Style Guide](./docs/style-guide.md) - Coding standards

### Contact
- Create an issue for bugs
- Start a discussion for questions
- Check existing issues before creating new ones

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Annual contributor highlights

Thank you for contributing to Dark City RPG! 🎲
