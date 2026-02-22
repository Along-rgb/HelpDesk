// Tab styles — ใช้ CSS variables จาก _variables.scss (:root) เพื่อไม่ hard-code สี/ระยะ

export const CUSTOM_TAB_CSS = `
    .custom-tabmenu .p-menuitem-text { color: var(--hd-text-muted) !important; transition: color var(--hd-transition); font-weight: 500; }
    .custom-tabmenu .p-menuitem-link:hover .p-menuitem-text { color: var(--primary-color) !important; }
    .custom-tabmenu .p-highlight .p-menuitem-text { color: var(--primary-color) !important; font-weight: bold; }
    .custom-tabmenu .p-tabmenu-nav { border-bottom: 1px solid var(--hd-border); }
    .custom-tabmenu .p-tabmenuitem .p-menuitem-link { background: transparent !important; border: none !important; box-shadow: none !important; }
    .custom-tabmenu .p-highlight .p-menuitem-link { border-bottom: 2px solid var(--primary-color) !important; border-radius: 0; }
`;
