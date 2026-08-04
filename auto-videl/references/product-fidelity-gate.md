# Product Fidelity Gate

Use this before storyboard prompt generation, storyboard QC, regeneration decisions, and Seedance prompt writing.

## P0 Rule

Product fidelity is the first gate. If the replacement product is wrong or deformed, the storyboard fails even when composition, lighting, or overall beauty is strong.

Do not reduce, hide, or remove product identity details to avoid AI rendering risk. If a logo/mark/label is part of the product and the shot angle should show it, preserve it in the physically correct place and scale.

## Build The Product Contract

From product images and product notes, write an internal contract:

- product category and exact variant
- color and color temperature
- length/proportion/scale
- thickness and softness
- cuff/opening/edge structure
- toe/heel/end shape
- seams, ribs, panels, ventilation zones, weave/texture
- logo/mark location on the product body
- logo/mark size relative to the product
- logo/mark color and direction
- which side of the product carries the logo/mark
- what the product must never become

For socks, include: sock height, cuff ribbing, body knit, toe shape, heel shape, arch/instep texture, logo side, logo height below cuff, logo size, logo color, and whether the current camera angle should reveal the logo.

## Per-Cell QC Order

Check every generated storyboard cell in this exact order:

1. Product fidelity: variant, color, length/proportion, thickness, cuff/opening, toe/heel, texture, logo/mark, and no deformation.
2. Logo/mark physical logic: whether the logo-bearing side is visible, whether the logo rotates with the product surface, whether it stays the right size and place, and whether it avoids wrong surfaces such as toe, sole, front, underside, shoe, package, or background.
3. Real physical logic: contact points, gravity, support direction, hand/object contact, body-part count, product count, fabric stretch, and no intersections.
4. Benchmark similarity: matching original frame composition, framing, camera angle, product position, body-part position, hand action, props, background, and shot function.
5. Output usability: whether the cell can actually guide Seedance without causing product drift.

## Failure Levels

P0 fail, do not accept:

- wrong product type, color, variant, length, scale, or material
- product visibly deformed or morphing
- logo/mark missing when the product side should show it
- logo/mark on the wrong surface or wrong side
- logo/mark much too large, too small, wrong color, or forced upright against product rotation
- product identity removed to avoid rendering risk

P1 fail, repair if limited:

- 1-2 cells have correctable composition drift
- 1-2 cells have minor hand/contact or product-position issues
- logo/mark is present and correctly placed but slightly unclear

Accept with note:

- exact readable text is imperfect, but the mark is physically placed, scaled, colored, and product images will be used as the Seedance appearance lock
- a logo is hidden because the benchmark-equivalent camera angle shows the non-logo side or it is naturally covered by shoe/hand

## Stop And Retry Rule

- Generate the whole planned storyboard once.
- QC the whole image once, cell by cell.
- If only 1-2 cells have repairable issues, regenerate once with targeted corrections.
- If many cells drift, or any P0 product-fidelity failure remains after one targeted retry, stop and mark the storyboard failed. Report the failing cells and reason instead of continuing automatic retries.
