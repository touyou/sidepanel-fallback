# Security Policy

## Supported Versions

We actively support the following versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security vulnerability, please follow these steps:

### Private Disclosure

Please **DO NOT** file a public issue. Instead, create a [security advisory](https://github.com/touyou/sidepanel-fallback/security/advisories/new) or contact via GitHub with:

- A clear description of the vulnerability
- Steps to reproduce the issue
- Potential impact and affected components
- Your contact information

### What to Expect

- **Acknowledgment**: We will acknowledge receipt within 48 hours
- **Investigation**: We will investigate and assess the vulnerability within 7 days
- **Resolution**: We will work on a fix and release it as soon as possible
- **Disclosure**: We will coordinate with you on public disclosure timing

### Scope

This security policy applies to:

- The main sidepanel-fallback library code
- Dependencies and build tools
- Documentation that could lead to security issues

### Out of Scope

- Issues in example code or documentation that don't affect the library
- Dependencies that are clearly marked as development-only
- Social engineering attacks

## Security Best Practices

When using sidepanel-fallback:

1. **Validate URLs**: Always validate URLs passed to `openPanel()`
2. **Sanitize Input**: Sanitize any user input before passing to the library
3. **Content Security Policy**: Use appropriate CSP headers in your extension
4. **Permissions**: Request only the minimum necessary permissions
5. **Updates**: Keep the library updated to the latest version

## Known Security Considerations

### Browser Extension Context

- This library operates in browser extension context and relies on extension APIs
- Ensure your extension's manifest.json properly declares required permissions
- Be aware that storage operations may be visible to other extensions with storage permissions

### Cross-Origin Issues

- When using popup windows, be mindful of cross-origin restrictions
- URLs must be accessible to your extension's origin
- Local files require appropriate extension permissions

## Contact

For security-related questions or concerns:
- Use [GitHub Security Advisories](https://github.com/touyou/sidepanel-fallback/security/advisories)
- For general questions, use the [GitHub issues](https://github.com/touyou/sidepanel-fallback/issues)

Thank you for helping keep sidepanel-fallback secure!
