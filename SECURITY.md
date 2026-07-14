# Security

This is a static website. There is no server-side form handler or database in this repository.

## Current protections

- A Content Security Policy is included in `index.html` and mirrored in `_headers` for static hosts that support header files.
- External links that open a new tab use `rel="noopener noreferrer"`.
- The contact form validates required fields in the browser and includes a honeypot field for future backend integrations.
- No user input is written back into the DOM.

## Reporting

Please report security issues privately to `getsiteuzbekistan@gmail.com`.
