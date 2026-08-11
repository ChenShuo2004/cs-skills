---
name: cs-frontend-design
description: |
  Use when Codex designs, implements, revises, or reviews a user-facing frontend: web app, dashboard, admin UI, editor, local browser tool, landing page, game UI, visual prototype, or interactive product workflow. Trigger when visual polish, product usability, responsive behavior, control choice, layout density, state design, assets, icons, or browser verification matters. Do not use for backend-only work unless UI behavior or product surface is affected.
metadata:
  author: "陈硕"
  collection: "CS Skills"
  source: "https://github.com/ChenShuo2004/cs-skills"
  compatibility: "Codex and any agent that supports SKILL.md"
---

<!-- CS Skills · 陈硕 | portable skill entry | https://github.com/ChenShuo2004/cs-skills -->

# Frontend Design

## Purpose

Use this skill to make frontend work feel like a real product, not a decorative mockup.

It helps Codex turn a vague UI request into a usable interface with clear business flow, information hierarchy, interaction states, responsive layout, and visual verification.

For CS Skills, this skill should act as the frontend product taste layer: practical, polished, workflow-first, and careful about verification.

## When To Use

- Build or revise a user-facing page, dashboard, admin panel, tool, editor, landing page, game UI, or prototype.
- Review a frontend change for layout, usability, visual hierarchy, responsive behavior, or missing states.
- Turn a PRD, rough idea, screenshot, or existing page into a working product interface.
- Add UI controls, navigation, charts, tables, upload flows, account tools, or visual workflow surfaces.
- Verify a local frontend in browser after implementation.

Do not use this skill for backend-only tasks, data migrations, API-only changes, or pure copy edits unless they affect the visible user experience.

## Core Workflow

1. Read the project docs, PRD, README, route notes, or task brief before touching UI.
2. Inspect the existing app: framework, routes, components, CSS system, assets, icons, and design conventions.
3. Map the user goal: input, output, primary action, state transitions, edge cases, and likely failure points.
4. Identify the product type: operational tool, dashboard, editor, consumer app, landing page, game, portfolio, or content site.
5. Design the first screen as the real working experience unless the user explicitly asks for a marketing page.
6. Implement with the repo's existing component library and style system first. Add dependencies only when the stack cannot reasonably handle the job.
7. Verify visually when a browser or dev server is available: page loads, key controls render, no blank state, no obvious console errors, and desktop/mobile layouts do not overlap.

## Product Fit

- Operational tools, dashboards, CRMs, upload tools, and admin screens should feel quiet, dense, and repeatable: clear hierarchy, compact controls, predictable tables/lists/forms, restrained decoration.
- Editors and creative tools should prioritize the work surface, toolbars, state visibility, undoable actions, and low-friction navigation.
- Dashboards should optimize for scanning, comparison, filters, drill-downs, and clearly labeled time or account context.
- Consumer apps should emphasize the main action, approachable language, lightweight empty states, and fast recovery from errors.
- Games and immersive experiences can use expressive visuals, motion, custom canvas/SVG/Three.js assets, and playful styling.
- Landing pages need a first-viewport brand or product signal, strong real imagery or generated bitmap media, and a hint of the next section visible below the hero.

## Controls

- Use icon buttons for common tool actions: save, upload, download, undo, redo, zoom, delete, settings, refresh, and search.
- Use tabs for views, segmented controls for modes, toggles or checkboxes for booleans, menus/selects for option sets, and sliders/steppers/inputs for numeric values.
- Use text buttons for clear commands, not as substitutes for familiar icons.
- Add tooltips for unfamiliar icon-only actions.
- Keep destructive actions explicit, confirmed, and recoverable when possible.

## Layout Rules

- Use full-width sections or unframed layouts for page structure. Use cards only for repeated items, modals, and genuinely framed tools.
- Do not nest cards inside cards.
- Keep cards at 8px radius or less unless the existing design system says otherwise.
- Set stable dimensions for fixed-format controls, boards, grids, tiles, counters, and toolbars so hover states, labels, and dynamic content do not shift layout.
- Use responsive grids, min/max constraints, and aspect ratios instead of viewport-scaled font sizes.
- Match heading scale to the container. Avoid hero-sized text inside compact panels.
- Ensure text never overlaps or spills out of buttons, cards, nav items, sidebars, tables, or panels. Wrap, shorten, or use smaller local typography when needed.

## Visual System

- Avoid one-note palettes. Do not let the interface become dominated by one hue family, especially purple gradients, dark slate/blue, beige/tan, or brown/orange.
- Use color to encode state and priority, not as decoration alone.
- Prefer real or generated bitmap imagery for sites where the subject matters.
- Avoid decorative gradient blobs, bokeh orbs, and generic SVG hero illustrations.
- Use lucide icons when available. If the project already uses another icon library, stay with it.
- Primary images should reveal the actual product, place, object, state, gameplay, or person instead of acting as vague atmosphere.

## Interaction Quality

- Build complete states: empty, loading, success, error, disabled, active/selected, and destructive confirmation where relevant.
- Keep primary workflows short and visible. Avoid hiding required actions behind unclear menus.
- For upload/account/network tools, show the current state next to the action: selected account, profile path, proxy status, last opened time, and next recommended step.
- Do not add visible instructional text that merely explains obvious UI mechanics. Use labels, state, and structure instead.
- Make repeated workflows efficient: predictable placement, keyboard-friendly controls when useful, and clear return paths.

## Verification Checklist

Before finalizing frontend work:

- Run the available build/typecheck/lint command when practical.
- Start or reuse the dev server if the app needs one.
- Verify the page in a browser when browser tooling is available.
- Check desktop and mobile widths for overlap, clipped text, unusable controls, and broken navigation.
- Confirm referenced assets load and images are not dark, blurred, overly cropped, or irrelevant.
- Report any verification blocker directly, distinguishing environment/tool failure from app failure.

## Output Expectations

When implementing, report the user-facing changes, the design decisions that matter, files touched, and verification performed.

When reviewing, lead with concrete issues and file/line references. Prioritize broken flows, unusable controls, responsive failures, missing states, accessibility risks, and visual regressions.

## Boundaries

- Do not redesign unrelated areas.
- Do not introduce a design system or abstraction unless it removes real duplication or matches the repo's direction.
- Do not make a landing page when the user asked for an app, tool, dashboard, or game.
- Do not prioritize visual flourish over the user's core workflow.
- Do not invent product requirements that conflict with the user's brief or project docs.
