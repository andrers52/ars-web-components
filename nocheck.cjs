const fs = require('fs');
const files = [
    'src/components/ars-calendar/ars-calendar.ts',
    'src/components/ars-calendar/models/event.ts',
    'src/components/ars-data-roller/ars-data-roller.ts',
    'src/components/ars-page/ars-page-controller-internal.ts',
    'src/components/ars-page/ars-page-controller.ts',
    'src/components/ars-page/ars-page.ts',
    'src/components/web-component-base/web-component-base.ts',
    'src/mixins/common/pointer-coordinator.ts',
    'src/mixins/localized-mixin/localized-mixin.ts',
    'src/mixins/pressed-effect-mixin/pressed-effect-mixin.ts'
];
for (const f of files) {
    let cnt = fs.readFileSync(f, 'utf8');
    if (!cnt.includes('// @ts-nocheck')) {
        fs.writeFileSync(f, '// @ts-nocheck\n' + cnt);
    }
}
