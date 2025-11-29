# Quality Assurance Checklist

QA process for i18n implementation.

## Pre-Launch Checklist

### Configuration
- [ ] next-intl installed (v4.x+)
- [ ] Locale config created
- [ ] Routing configuration complete
- [ ] Middleware configured
- [ ] Request configuration setup
- [ ] Navigation helpers implemented
- [ ] TypeScript types defined

### Content
- [ ] All message files created
- [ ] No placeholder text remaining
- [ ] No hardcoded strings in components
- [ ] Translations reviewed (if multiple languages)
- [ ] Terminology consistent

### Formatting
- [ ] Currency display correct
- [ ] Number formatting locale-aware
- [ ] Date formatting appropriate
- [ ] Time zones configured

### SEO
- [ ] Hreflang tags implemented (multi-language)
- [ ] Meta tags translatable
- [ ] Localized URLs working
- [ ] Canonical URLs set

### Performance
- [ ] Messages loaded efficiently
- [ ] Static generation working
- [ ] No translation-related layout shifts

## Testing Matrix

### Functional Testing

| Feature | English | [Other] | Notes |
|---------|---------|---------|-------|
| Homepage | [ ] | [ ] | |
| Navigation | [ ] | [ ] | |
| Forms | [ ] | [ ] | |
| Error messages | [ ] | [ ] | |
| Date displays | [ ] | [ ] | |
| Number formats | [ ] | [ ] | |

### Browser Testing

- [ ] Chrome (Desktop)
- [ ] Safari (Desktop)
- [ ] Firefox (Desktop)
- [ ] Chrome (Mobile)
- [ ] Safari (Mobile iOS)

## Adding Language Checklist

When adding a new language:

- [ ] Add locale to config
- [ ] Create messages file
- [ ] Translate all keys
- [ ] Test all pages
- [ ] Verify formatting (dates, numbers)
- [ ] Check SEO tags
- [ ] Update language switcher
- [ ] Test navigation

## Common Issues

**Missing translations**
- Check all keys exist in new language file
- Use fallback to default locale during development

**Layout shifts**
- Text lengths vary by language
- Test with actual translations, not placeholders

**Date/number formats**
- Verify locale-specific formatting
- Check timezone handling
