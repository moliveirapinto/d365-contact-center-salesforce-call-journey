/* The D365 widget sets the panel width inline via Open CTI; !important overrides it. */
.oneUtilityBarPanel:has(iframe.openctiSoftPhone) {
  width: clamp(900px, 64vw, 1300px) !important;
  max-width: calc(100vw - 32px) !important;
}

/* Only resize when open, so the minimized panel stays fully hidden. */
.oneUtilityBarPanel:has(iframe.openctiSoftPhone):not(.MINIMIZED) {
  height: calc(100vh - 190px) !important;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.28) !important;
  border-radius: 6px 6px 0 0 !important;
}

.oneUtilityBarPanel:has(iframe.openctiSoftPhone) .slds-utility-panel__body {
  flex: 1 1 auto !important;
  height: auto !important;
}

.oneUtilityBarPanel:has(iframe.openctiSoftPhone) iframe.openctiSoftPhone {
  width: 100% !important;
  height: 100% !important;
}

/* Hide the invisible background loader's button in the utility bar. */
.slds-utility-bar__item:has(> [data-component-id="d365_cti_panel_styles"]) {
  display: none !important;
}
