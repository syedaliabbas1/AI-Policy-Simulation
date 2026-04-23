# Portrait Generation — FLUX.2 via HF Space

Generate 4 portraits at https://huggingface.co/spaces/black-forest-labs/FLUX.1-schnell

## Composition spec (keep identical across all 4)

```
stylized editorial portrait illustration, head-and-shoulders centered composition,
neutral closed mouth at lower-center of face, soft even lighting,
flat-colour background, warm friendly expression, semi-realistic painterly style,
[PERSONA_DESCRIPTOR], vertical 3:4 aspect ratio
```

## Per-archetype descriptors

**Sarah — low_income_worker**
```
stylized editorial portrait illustration, head-and-shoulders centered composition,
neutral closed mouth at lower-center of face, soft even lighting,
flat-colour background, warm friendly expression, semi-realistic painterly style,
34-year-old white British woman, part-time carer, tired but warm expression, subtle winter scarf,
vertical 3:4 aspect ratio
```

**Mark — small_business_owner**
```
stylized editorial portrait illustration, head-and-shoulders centered composition,
neutral closed mouth at lower-center of face, soft even lighting,
flat-colour background, warm friendly expression, semi-realistic painterly style,
48-year-old British self-employed builder, casual shirt, slight practical smile, weathered look,
vertical 3:4 aspect ratio
```

**Priya — urban_professional**
```
stylized editorial portrait illustration, head-and-shoulders centered composition,
neutral closed mouth at lower-center of face, soft even lighting,
flat-colour background, warm friendly expression, semi-realistic painterly style,
31-year-old British South Asian woman, financial analyst, light blue shirt, clean-cut, confident,
vertical 3:4 aspect ratio
```

**Arthur — retired_pensioner**
```
stylized editorial portrait illustration, head-and-shoulders centered composition,
neutral closed mouth at lower-center of face, soft even lighting,
flat-colour background, warm friendly expression, semi-realistic painterly style,
72-year-old British retiree, greying hair, kind eyes, knitted cardigan, stoic expression,
vertical 3:4 aspect ratio
```

## Output

Save images as PNG files in `policy-sim/web/public/portraits/`:
- `low_income_worker.png`
- `small_business_owner.png`
- `urban_professional.png`
- `retired_pensioner.png`

The ArchetypeCard will automatically load them. Fallback is the name initial if the file is missing.
