// Central custom-element registration for ars-web-components.
// Importing this module and calling registerArsWebComponents() registers
// every component tag. This used to happen as a side effect of importing
// component classes, which prevented tree-shaking.

import { ArsAvatar } from "./components/ars-avatar/ars-avatar.js";
import { ArsBadge } from "./components/ars-badge/ars-badge.js";
import { ArsBottomNav, ArsBottomNavItem } from "./components/ars-bottom-nav/ars-bottom-nav.js";
import { ArsButton } from "./components/ars-button/ars-button.js";
import { ArsCalendar } from "./components/ars-calendar/ars-calendar.js";
import { ArsCandlestickChart } from "./components/ars-candlestick-chart/ars-candlestick-chart.js";
import { ArsCard } from "./components/ars-card/ars-card.js";
import { ArsChatPanel } from "./components/ars-chat-panel/ars-chat-panel.js";
import { ArsColorSelect } from "./components/ars-color-select/ars-color-select.js";
import { ArsDataRoller } from "./components/ars-data-roller/ars-data-roller.js";
import { ArsDatePicker } from "./components/ars-date-picker/ars-date-picker.js";
import { ArsDialog } from "./components/ars-dialog/ars-dialog.js";
import { ArsFab } from "./components/ars-fab/ars-fab.js";
import { ArsGroup } from "./components/ars-group/ars-group.js";
import { ArsImageUpload } from "./components/ars-image-upload/ars-image-upload.js";
import { ArsInfoTile } from "./components/ars-info-tile/ars-info-tile.js";
import { ArsInput } from "./components/ars-input/ars-input.js";
import { ArsLeaderboard } from "./components/ars-leaderboard/ars-leaderboard.js";
import { ArsLineChart } from "./components/ars-line-chart/ars-line-chart.js";
import { ArsList } from "./components/ars-list/ars-list.js";
import { ArsMarkdown } from "./components/ars-markdown/ars-markdown.js";
import { ArsMinimap } from "./components/ars-minimap/ars-minimap.js";
import { ArsPageController } from "./components/ars-page/ars-page-controller.js";
import { ArsPageControllerInternal } from "./components/ars-page/ars-page-controller-internal.js";
import { ArsPage } from "./components/ars-page/ars-page.js";
import { ArsPanel } from "./components/ars-panel/ars-panel.js";
import { ArsPropertyEditor } from "./components/ars-property-editor/ars-property-editor.js";
import { ArsSelect } from "./components/ars-select/ars-select.js";
import { ArsTable } from "./components/ars-table/ars-table.js";
import { ArsTabPanel, ArsTabs } from "./components/ars-tabs/ars-tabs.js";
import { ArsToast } from "./components/ars-toast/ars-toast.js";
import { ArsToggle } from "./components/ars-toggle/ars-toggle.js";
import { ArsToolbar } from "./components/ars-toolbar/ars-toolbar.js";
import { ArsTypedPropertyEditor } from "./components/ars-typed-property-editor/ars-typed-property-editor.js";
import { DraggableMixin } from "./mixins/draggable-mixin/draggable-mixin.js";
import { LocalizedMixin } from "./mixins/localized-mixin/localized-mixin.js";
import { PressedEffectMixin } from "./mixins/pressed-effect-mixin/pressed-effect-mixin.js";
import { RemoteCallCallerMixin } from "./mixins/remote-call-mixin/remote-call-caller-mixin.js";
import { RemoteCallReceiverMixin } from "./mixins/remote-call-mixin/remote-call-receiver-mixin.js";
import { RollMixin } from "./mixins/roll-mixin/roll-mixin.js";
import { ShowIfPropertyTrueMixin } from "./mixins/show-if-property-true-mixin/show-if-property-true-mixin.js";
import { SwipeableMixin } from "./mixins/swipeable-mixin/swipeable-mixin.js";

/** Register all ars-web-components custom elements.
 *  Safe to call multiple times; tags already defined are skipped.
 *  Consumers must call this explicitly before using <ars-*> tags in the DOM.
 */
export function registerArsWebComponents(): void {
  if (typeof customElements === 'undefined') return;

  if (!customElements.get("ars-avatar")) customElements.define("ars-avatar", ArsAvatar);
  if (!customElements.get("ars-badge")) customElements.define("ars-badge", ArsBadge);
  if (!customElements.get("ars-bottom-nav")) customElements.define("ars-bottom-nav", ArsBottomNav);
  if (!customElements.get("ars-bottom-nav-item")) customElements.define("ars-bottom-nav-item", ArsBottomNavItem);
  if (!customElements.get("ars-button")) customElements.define("ars-button", ArsButton);
  if (!customElements.get("ars-calendar")) customElements.define("ars-calendar", ArsCalendar);
  if (!customElements.get("ars-candlestick-chart")) customElements.define("ars-candlestick-chart", ArsCandlestickChart);
  if (!customElements.get("ars-card")) customElements.define("ars-card", ArsCard);
  if (!customElements.get("ars-chat-panel")) customElements.define("ars-chat-panel", ArsChatPanel);
  if (!customElements.get("ars-color-select")) customElements.define("ars-color-select", ArsColorSelect);
  if (!customElements.get("ars-data-roller")) customElements.define("ars-data-roller", ArsDataRoller);
  if (!customElements.get("ars-date-picker")) customElements.define("ars-date-picker", ArsDatePicker);
  if (!customElements.get("ars-dialog")) customElements.define("ars-dialog", ArsDialog);
  if (!customElements.get("ars-fab")) customElements.define("ars-fab", ArsFab);
  if (!customElements.get("ars-group")) customElements.define("ars-group", ArsGroup);
  if (!customElements.get("ars-image-upload")) customElements.define("ars-image-upload", ArsImageUpload);
  if (!customElements.get("ars-info-tile")) customElements.define("ars-info-tile", ArsInfoTile);
  if (!customElements.get("ars-input")) customElements.define("ars-input", ArsInput);
  if (!customElements.get("ars-leaderboard")) customElements.define("ars-leaderboard", ArsLeaderboard);
  if (!customElements.get("ars-line-chart")) customElements.define("ars-line-chart", ArsLineChart);
  if (!customElements.get("ars-list")) customElements.define("ars-list", ArsList);
  if (!customElements.get("ars-markdown")) customElements.define("ars-markdown", ArsMarkdown);
  if (!customElements.get("ars-minimap")) customElements.define("ars-minimap", ArsMinimap);
  if (!customElements.get("ars-page-controller")) customElements.define("ars-page-controller", ArsPageController);
  if (!customElements.get("ars-page-controller-internal")) customElements.define("ars-page-controller-internal", ArsPageControllerInternal);
  if (!customElements.get("ars-page")) customElements.define("ars-page", ArsPage);
  // Deprecated alias kept for backwards compatibility.
  if (!customElements.get("ars-relational-node")) customElements.define("ars-relational-node", class extends ArsInfoTile {});
  if (!customElements.get("ars-panel")) customElements.define("ars-panel", ArsPanel);
  if (!customElements.get("ars-property-editor")) customElements.define("ars-property-editor", ArsPropertyEditor);
  if (!customElements.get("ars-select")) customElements.define("ars-select", ArsSelect);
  if (!customElements.get("ars-table")) customElements.define("ars-table", ArsTable);
  if (!customElements.get("ars-tab-panel")) customElements.define("ars-tab-panel", ArsTabPanel);
  if (!customElements.get("ars-tabs")) customElements.define("ars-tabs", ArsTabs);
  if (!customElements.get("ars-toast")) customElements.define("ars-toast", ArsToast);
  if (!customElements.get("ars-toggle")) customElements.define("ars-toggle", ArsToggle);
  if (!customElements.get("ars-toolbar")) customElements.define("ars-toolbar", ArsToolbar);
  if (!customElements.get("ars-typed-property-editor")) customElements.define("ars-typed-property-editor", ArsTypedPropertyEditor);
  // @ts-ignore
  if (!customElements.get("draggable-mixin")) customElements.define("draggable-mixin", DraggableMixin);
  // @ts-ignore
  if (!customElements.get("localized-mixin")) customElements.define("localized-mixin", LocalizedMixin);
  // @ts-ignore
  if (!customElements.get("pressed-effect-mixin")) customElements.define("pressed-effect-mixin", PressedEffectMixin);
  // @ts-ignore
  if (!customElements.get("remote-call-caller-mixin")) customElements.define("remote-call-caller-mixin", RemoteCallCallerMixin);
  // @ts-ignore
  if (!customElements.get("remote-call-receiver-mixin")) customElements.define("remote-call-receiver-mixin", RemoteCallReceiverMixin);
  // @ts-ignore
  if (!customElements.get("roll-mixin")) customElements.define("roll-mixin", RollMixin);
  // @ts-ignore
  if (!customElements.get("show-if-property-true-mixin")) customElements.define("show-if-property-true-mixin", ShowIfPropertyTrueMixin);
  // @ts-ignore
  if (!customElements.get("swipeable-mixin")) customElements.define("swipeable-mixin", SwipeableMixin);
}
