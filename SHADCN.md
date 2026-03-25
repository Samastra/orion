# UI Manifest: shadcn/ui First

> "If shadcn has it or it can be derived by the manipulation of shadcn components, **USE SHADCN**."

## Rules
1. **Never build from scratch**: Before creating a new UI element, check the [shadcn/ui documentation](https://ui.shadcn.com/).
2. **Component Manipulation**: If a standard shadcn component doesn't perfectly fit, wrap it or extend its primitives (Radix UI) rather than building a custom one.
3. **Consistency**: Maintain the established design tokens (colors, spacing, radius) defined in `globals.css` and `shadcn` configuration.
4. **Accessibility**: Leverage the built-in accessibility features of shadcn's Radix-based components.
