---

version: "1.0"

name: "Alchemy Stories Design System"

description: "Alchemy Stories is a premium editorial design system crafted for luxury art, handcrafted interiors, and nature-inspired storytelling. The interface emphasizes generous whitespace, museum-inspired layouts, elegant typography, immersive photography, and subtle interactions that elevate craftsmanship over commerce."

colors:

primary: "#173C7B"

secondary: "#F8F6F2"

tertiary: "#A9B89A"

neutral: "#2C2C2C"

background: "#FCFBF8"

surface: "#FFFFFF"

surface-alt: "#F3F1EB"

text-primary: "#1D1D1D"

text-secondary: "#666666"

border: "#E6E2D9"

accent: "#2F6DB3"

accent-earth: "#9C7A52"

accent-forest: "#556B4E"

success: "#668B63"

warning: "#C49B42"

typography:

display-xl:

```
fontFamily: "Cormorant Garamond"

fontSize: "120px"

fontWeight: 500

lineHeight: "110%"

letterSpacing: "-0.04em"
```

display-lg:

```
fontFamily: "Cormorant Garamond"

fontSize: "72px"

fontWeight: 500

lineHeight: "110%"

letterSpacing: "-0.03em"
```

heading-xl:

```
fontFamily: "Cormorant Garamond"

fontSize: "56px"

fontWeight: 500

lineHeight: "120%"
```

heading-lg:

```
fontFamily: "Cormorant Garamond"

fontSize: "42px"

fontWeight: 500

lineHeight: "125%"
```

heading-md:

```
fontFamily: "Cormorant Garamond"

fontSize: "32px"

fontWeight: 500

lineHeight: "130%"
```

body-lg:

```
fontFamily: "Manrope"

fontSize: "20px"

fontWeight: 400

lineHeight: "180%"
```

body-md:

```
fontFamily: "Manrope"

fontSize: "18px"

fontWeight: 400

lineHeight: "175%"
```

body-sm:

```
fontFamily: "Manrope"

fontSize: "16px"

fontWeight: 400

lineHeight: "170%"
```

label-md:

```
fontFamily: "Manrope"

fontSize: "14px"

fontWeight: 600

lineHeight: "22px"

letterSpacing: "0.12em"

textTransform: "uppercase"
```

rounded:

xs: "6px"

sm: "10px"

md: "16px"

lg: "24px"

xl: "32px"

spacing:

base: "8px"

xs: "8px"

sm: "16px"

md: "24px"

lg: "32px"

xl: "48px"

xxl: "64px"

xxxl: "96px"

section-padding: "120px"

container-padding: "80px"

card-padding: "40px"

gap: "32px"

components:

button-primary:

```
backgroundColor: "{colors.primary}"

textColor: "#FFFFFF"

border: "none"

rounded: "{rounded.md}"

typography: "{typography.label-md}"

padding: "18px 36px"
```

button-secondary:

```
backgroundColor: "transparent"

textColor: "{colors.primary}"

border: "1px solid {colors.primary}"

rounded: "{rounded.md}"

padding: "18px 36px"
```

button-link:

```
textColor: "{colors.primary}"

typography: "{typography.label-md}"

padding: "0"
```

card:

```
background: "{colors.surface}"

border: "1px solid {colors.border}"

rounded: "{rounded.lg}"

padding: "{spacing.card-padding}"
```

---

# Overview

Alchemy Stories follows an Editorial Gallery composition where storytelling takes precedence over selling. Every page should feel like wandering through an art exhibition instead of browsing an online shop.

Composition cues

• Layout: Editorial Grid

• Content Width: 1320px

• Structure: Spacious

• Image Priority: High

• White Space: Generous

• Grid: 12 Columns

• Reading Rhythm: Slow

---

# Colors

The palette is inspired by cyanotype printing, handmade paper, dried botanicals, forests, and natural sunlight.

Primary

#173C7B

Deep Cyanotype Blue

Used for:

• Brand Identity

• Buttons

• Links

• Icons

• Section Highlights

Secondary

#F8F6F2

Natural Ivory

Primary background color.

Accent

#2F6DB3

Interactive states

Hover

Links

Micro interactions

Earth

#9C7A52

Wood

Frames

Organic details

Forest

#556B4E

Nature highlights

Icons

Categories

Success states

Neutral

#2C2C2C

Body Typography

Text Secondary

#666666

Supporting information

Borders

#E6E2D9

Soft editorial separators

---

# Typography

Typography combines elegant editorial serif headlines with modern geometric sans-serif body text.

Display

Cormorant Garamond

Purpose

Hero Headlines

Editorial Quotes

Gallery Titles

Body

Manrope

Purpose

Reading

Descriptions

Navigation

Buttons

Forms

Hierarchy

Display XL

120px

Display LG

72px

Heading XL

56px

Heading LG

42px

Heading MD

32px

Body LG

20px

Body MD

18px

Body SM

16px

Label

14px Uppercase

---

# Layout

Content Width

1320px

Maximum Width

1440px

Grid

12 Columns

Column Gap

32px

Section Padding

120px

Container Padding

80px

Vertical Rhythm

96px

Image Ratio

Landscape

16:9

Portrait

4:5

Square

1:1

Whitespace is treated as a design element rather than empty space.

---

# Elevation & Depth

Alchemy Stories avoids modern glassmorphism and heavy shadows.

Depth comes from:

• Editorial layering

• Photography

• Texture

• Natural paper backgrounds

Surface Style

Paper

Natural Linen

Soft Shadows

Borders

1px #E6E2D9

Shadows

0px 10px 40px rgba(0,0,0,0.05)

Blur

None

Avoid:

Glass

Neon

Strong Glow

Heavy Drop Shadows

---

# Shapes

Corner Radius

Cards

24px

Buttons

16px

Inputs

16px

Images

24px

Icon Style

Thin Outline

Minimal

Nature Inspired

Icon Sets

Lucide

Phosphor

Custom Botanical Icons

---

# Photography Style

Photography is one of the strongest elements of the brand.

Guidelines

Natural sunlight

Warm shadows

Real textures

Botanical closeups

Studio process

Bird photography

Interior styling

Wood

Stone

Fabric

Avoid

Artificial lighting

Stock lifestyle

Over saturation

Hard flash

---

# Components

Primary Button

Deep Blue

Filled

Large Padding

Secondary Button

Outline

Blue Border

Transparent

Cards

Rounded

Minimal Border

Large Photography

Editorial spacing

Navigation

Transparent over hero

Ivory on scroll

Thin underline hover

Forms

Large Inputs

Rounded

Minimal borders

Soft focus ring

---

# Iconography

Style

Monoline

Stroke Width

1.75px

Themes

Leaves

Flowers

Birds

Trees

Frames

Cyanotype

Nature

Compass

Studio

---

# Motion

Motion should feel slow, calm, and intentional.

Motion Level

Elegant

Durations

150ms

300ms

600ms

900ms

1200ms

Easing

ease

ease-in-out

cubic-bezier(.22,.61,.36,1)

Interactions

Image Reveal

Fade Up

Parallax Scroll

Text Reveal

Slow Zoom

Horizontal Gallery Scroll

Section Fade

Avoid

Bounce

Elastic

Flash

Oversized Scale

---

# Illustration Style

Botanical Line Art

Pressed Leaves

Blueprint Cyanotype Textures

Minimal Nature Sketches

Scientific Illustration

Museum Labels

---

# Visual Motifs

Pressed Botanical Textures

Paper Grain

Blueprint Patterns

Natural Fibers

Handmade Paper

Botanical Borders

Editorial Dividers

Minimal Grid Lines

Museum Captions

---

# Accessibility

Minimum Contrast

4.5:1

Body Text

18px minimum

Interactive Targets

48px

Keyboard Accessible

Visible Focus States

Reduced Motion Support

Yes

---

# Do's

✓ Tell stories before selling products.

✓ Use generous whitespace.

✓ Let photography dominate each section.

✓ Keep typography elegant and editorial.

✓ Maintain calm motion.

✓ Use nature-inspired colors as accents only.

✓ Keep every page feeling like a premium gallery.

---

# Don'ts

✗ Don't make the website resemble a typical e-commerce storefront.

✗ Don't use loud gradients or neon colors.

✗ Don't overcrowd layouts.

✗ Don't rely on excessive shadows or glass effects.

✗ Don't use more than one accent color within a single section.

✗ Don't break the editorial rhythm with inconsistent spacing.

✗ Don't prioritize UI over storytelling.

---

# Brand Experience

The website should evoke the feeling of entering a quiet art gallery nestled within nature. Every scroll reveals another story—through handcrafted cyanotypes, botanical memories, and thoughtful interiors. The interface should disappear into the background, allowing the artwork, photography, and narratives to become the true focus.
