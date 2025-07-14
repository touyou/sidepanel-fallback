---
applyTo: 'src/**/*.js,test/**/*.js,**/*.md,package.json,scripts/**/*.js'
---

# Development Process Instructions

## TDD Development Cycle

### Core Principles

- Follow strict **Red → Green → Refactor** cycle (@t_wada methodology)
- **Write tests before implementation** - never skip this step
- Function names should reflect their specifications
- Start with concrete examples rather than abstract implementation

### Development Workflow

1. **Red Phase**: Write failing test cases that define the desired behavior
2. **Green Phase**: Write minimal implementation to make tests pass
3. **Refactor Phase**: Improve code quality while maintaining test coverage

### Testing Standards

- Maintain **100% test coverage** for core functionality
- Use **descriptive test names** that explain behavior clearly
- Test both **happy path** and **edge cases** (undefined, empty strings, errors)
- Mock external dependencies appropriately (DOM, localStorage, Chrome APIs)

### File Organization

```
src/                    # Implementation files
test/                   # Test files (mirror src/ structure)
docs/                   # Documentation
public/                 # Demo/test HTML files
.github/                # CI/CD and project instructions
scripts/                # Utility scripts
```

## Code Quality Standards

### Language Requirements

- **All code, tests, and documentation must be in English**
- Use clear, descriptive variable and function names
- Include comprehensive JSDoc comments for public APIs

### Error Handling

- Validate input parameters and throw meaningful errors
- Provide fallback mechanisms for API failures
- Return consistent error objects with descriptive messages

### Browser Compatibility

- Support Chrome, Firefox, Safari, Edge
- Handle both Extension context and regular web page context
- Use feature detection rather than user agent sniffing where possible

## Architecture Patterns

### Module Design

- **Zero external dependencies** - keep the library lightweight
- **Loose coupling** between modules for easier testing and maintenance
- **Single responsibility** - each module has one clear purpose

### API Design Principles

- **Simple and intuitive** developer experience
- **Consistent method signatures** across all modules
- **Promise-based async operations** for better error handling
- **Configuration over convention** where it improves usability

## CHANGELOG Management

### AI Development Instructions

When working on this project as an AI assistant, **always update the CHANGELOG.md** after completing any significant work:

1. **Add entries to the [Unreleased] section** for any changes made
2. **Use appropriate categories**: Added, Changed, Fixed, Removed, Security
3. **Write clear, user-focused descriptions** of what changed and why
4. **Include breaking changes** with BREAKING prefix when applicable
5. **Follow Keep a Changelog format** consistently

### CHANGELOG Update Process

- **During development**: Add entries to [Unreleased] section
- **Before release**: Entries will be automatically moved to versioned section
- **Categories to use**:
  - **Added**: New features or capabilities
  - **Changed**: Changes to existing functionality  
  - **Fixed**: Bug fixes and corrections
  - **Removed**: Removed features or deprecated functionality
  - **Security**: Security-related changes

### Example Entry Format

```markdown
### Added
- New browser detection for Edge browser support
- Automatic fallback mechanism for sidepanel API failures

### Changed  
- **BREAKING**: Updated minimum Node.js requirement to 18.18.0
- Improved error handling in panel launcher

### Fixed
- Fixed ESLint configuration for catch block variables
```

### Release Process

The release workflow automatically:
- Moves [Unreleased] content to a versioned section
- Creates new empty [Unreleased] section
- Updates version comparison links
- Generates GitHub release notes from CHANGELOG content
