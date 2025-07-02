## Attribute-based Localization with `<localized-mixin>`

The `<ars-calendar>` component supports fully declarative localization using the [`<localized-mixin>`](../mixins/localized-mixin/) and the `data-localize-map` convention. This allows you to localize all calendar labels (days, months, etc.) using a translation table, without modifying the calendar component itself.

### How to Use

1. **Wrap `<ars-calendar>` in `<localized-mixin>`**
2. **Provide a `data-localize-map` attribute** on `<ars-calendar>`, mapping attribute names to translation keys or arrays of keys.
3. **Ensure your translation table (e.g., `window.globalTranslations`) contains the required keys.**

#### Example

```html
<localized-mixin locale="en">
  <ars-calendar
    data-localize-map='{
      "localized_abbreviated_days": [
        "days.sun", "days.mon", "days.tue", "days.wed", "days.thu", "days.fri", "days.sat"
      ],
      "localized_months": [
        "months.jan", "months.feb", "months.mar", "months.apr", "months.may", "months.jun", "months.jul", "months.aug", "months.sep", "months.oct", "months.nov", "months.dec"
      ],
      "localized_today": "today"
    }'
  ></ars-calendar>
</localized-mixin>
```

#### How it Works

- `<ars-calendar>` declares which attributes to localize and which translation keys to use via `data-localize-map`.
- `<localized-mixin>` observes the current language and sets the appropriate attributes on `<ars-calendar>`.
- This pattern is generic and works for any component that follows the convention.

#### Required Translation Keys

Your translation table should include keys like:

```js
window.globalTranslations = {
  en: {
    days: { sun: "Sun", mon: "Mon", ... },
    months: { jan: "January", feb: "February", ... },
    today: "Today"
  },
  es: {
    days: { sun: "Dom", mon: "Lun", ... },
    months: { jan: "Enero", feb: "Febrero", ... },
    today: "Hoy"
  }
  // ... more languages
};
```

#### Notes

- You can use this pattern for any web component that localizes via attributes.
- The `data-localize-map` can map any attribute to any translation key or array of keys.
- For more advanced usage (per-mixin translation tables, etc.), see the [localized-mixin documentation](../mixins/localized-mixin/README.md).
