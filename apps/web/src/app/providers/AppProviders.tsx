import type { ReactNode } from 'react';
import { ConfigProvider } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../../context/AuthContext';
import { ThemeProvider, useTheme } from '../../context/ThemeContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

/**
 * Ink & Vermillion — Ant Design ConfigProvider theme
 *
 * Remaps every AntD color token to our design system:
 *   primary = Vermilion, base bg = Ink, surface bg = Washi,
 *   border = Charcoal, text = Linen/Stone,
 *   font = DM Sans / JetBrains Mono, radius = 4px.
 *
 * This prevents blue/purple/green AntD defaults from leaking
 * into the UI. Everything the user sees should come from
 * one of the 6 palette colors.
 */
const inkVermillionTokenDark = {
  // ── Primary / Accent: Vermilion ──
  colorPrimary: '#D83A2C',
  colorPrimaryBg: 'rgba(216,58,44,0.1)',
  colorPrimaryBgHover: 'rgba(216,58,44,0.15)',
  colorPrimaryBorder: '#D83A2C',
  colorPrimaryBorderHover: '#B83024',
  colorPrimaryHover: '#B83024',
  colorPrimaryActive: '#9E2820',
  colorPrimaryTextHover: '#B83024',
  colorPrimaryText: '#D83A2C',
  colorPrimaryTextActive: '#9E2820',

  // Status: single accent principle — success/warning use vermilion variants
  colorSuccess: '#D83A2C',
  colorWarning: '#D83A2C',
  colorError: '#D83A2C',
  colorInfo: '#787878',
  colorSuccessBg: 'rgba(216,58,44,0.1)',
  colorWarningBg: 'rgba(216,58,44,0.08)',
  colorErrorBg: 'rgba(216,58,44,0.08)',
  colorInfoBg: 'rgba(120,120,120,0.1)',
  colorSuccessBorder: 'rgba(216,58,44,0.3)',
  colorWarningBorder: 'rgba(216,58,44,0.25)',
  colorErrorBorder: 'rgba(216,58,44,0.3)',
  colorInfoBorder: 'rgba(120,120,120,0.25)',

  // ── Background: Ink / Washi ──
  colorBgBase: '#0C0C0C',
  colorBgContainer: '#1A1A1A',
  colorBgElevated: '#1A1A1A',
  colorBgLayout: '#0C0C0C',
  colorBgSpotlight: '#1A1A1A',
  colorBgMask: 'rgba(0,0,0,0.65)',

  // ── Text: Linen / Stone ──
  colorTextBase: '#E6E0D8',
  colorText: '#E6E0D8',
  colorTextSecondary: '#787878',
  colorTextTertiary: '#787878',
  colorTextQuaternary: '#787878',
  colorTextPlaceholder: '#787878',
  colorTextDisabled: '#2E2E2E',
  colorTextHeading: '#E6E0D8',
  colorTextLabel: '#787878',
  colorTextDescription: '#787878',

  // ── Border & Radius ──
  borderRadius: 4,
  borderRadiusLG: 6,
  borderRadiusSM: 2,
  borderRadiusXS: 2,
  borderRadiusOuter: 4,
  colorBorder: '#2E2E2E',
  colorBorderSecondary: '#1A1A1A',
  colorSplit: '#2E2E2E',

  // ── Typography ──
  fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif",
  fontFamilyCode: "'JetBrains Mono', ui-monospace, monospace",
  fontSize: 14,
  fontSizeLG: 16,
  fontSizeXL: 20,
  fontSizeHeading1: 32,
  fontSizeHeading2: 24,
  fontSizeHeading3: 20,
  fontSizeHeading4: 18,
  fontSizeHeading5: 16,

  // ── Control heights ──
  controlHeight: 38,
  controlHeightLG: 46,
  controlHeightSM: 30,

  // ── Padding ──
  padding: 16,
  paddingLG: 24,
  paddingSM: 12,
  paddingXS: 8,

  // ── Shadow — no glow, no blur, just minimal depth ──
  boxShadow: 'none',
  boxShadowSecondary: '0 0 0 1px rgba(46,46,46,0.5)',
  boxShadowTertiary: 'none',

  // ── Link ──
  colorLink: '#D83A2C',
  colorLinkHover: '#B83024',
  colorLinkActive: '#9E2820',

  // ── Fill (used by Tag, Badge bg, etc) ──
  colorFill: 'rgba(120,120,120,0.1)',
  colorFillSecondary: 'rgba(120,120,120,0.06)',
  colorFillTertiary: 'rgba(120,120,120,0.04)',
  colorFillQuaternary: 'rgba(120,120,120,0.02)',
};

const inkVermillionTokenLight = {
  ...inkVermillionTokenDark,
  
  // ── Background: Light Mode ──
  colorBgBase: '#F4F4F4',
  colorBgContainer: '#FFFFFF',
  colorBgElevated: '#FFFFFF',
  colorBgLayout: '#F4F4F4',
  colorBgSpotlight: '#FFFFFF',
  colorBgMask: 'rgba(0,0,0,0.45)',

  // ── Text: Light Mode ──
  colorTextBase: '#1A1A1A',
  colorText: '#1A1A1A',
  colorTextSecondary: '#787878',
  colorTextTertiary: '#787878',
  colorTextQuaternary: '#787878',
  colorTextPlaceholder: '#787878',
  colorTextDisabled: '#E0E0E0',
  colorTextHeading: '#1A1A1A',

  // ── Border & Radius ──
  colorBorder: '#E0E0E0',
  colorBorderSecondary: '#F4F4F4',
  colorSplit: '#E0E0E0',

  boxShadowSecondary: '0 0 0 1px rgba(224,224,224,0.5)',
};

function AppConfigProvider({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  const token = theme === 'dark' ? inkVermillionTokenDark : inkVermillionTokenLight;

  return (
    <ConfigProvider
      theme={{
        token,
        components: {
          Menu: {
            itemBorderRadius: 4,
            itemMarginInline: 8,
            itemHeight: 42,
            iconSize: 18,
            collapsedIconSize: 20,
            darkItemBg: 'var(--theme-washi)',
            darkItemColor: 'var(--theme-linen)',
            darkItemSelectedBg: 'rgba(216,58,44,0.12)',
            darkItemSelectedColor: '#D83A2C',
            darkItemHoverBg: 'rgba(120,120,120,0.08)',
            darkItemHoverColor: 'var(--theme-linen)',
            darkSubMenuItemBg: 'var(--theme-washi)',
            darkPopupBg: 'var(--theme-washi)',
          },
          Button: {
            fontWeight: 600,
            paddingInline: 20,
            paddingInlineLG: 28,
            primaryShadow: 'none',
            defaultBorderColor: 'var(--theme-charcoal)',
            defaultColor: 'var(--theme-linen)',
            defaultBg: 'var(--theme-washi)',
            defaultHoverBg: 'var(--theme-charcoal)',
            defaultHoverBorderColor: 'var(--theme-stone)',
            defaultHoverColor: 'var(--theme-linen)',
          },
          Card: {
            paddingLG: 24,
            borderRadiusLG: 4,
            colorBgContainer: 'var(--theme-washi)',
          },
          Table: {
            headerBg: 'var(--theme-washi)',
            headerColor: 'var(--theme-stone)',
            rowHoverBg: 'rgba(216,58,44,0.04)',
            borderColor: 'var(--theme-charcoal)',
          },
          Modal: {
            borderRadiusLG: 4,
            paddingLG: 24,
            colorBgElevated: 'var(--theme-washi)',
            headerBg: 'var(--theme-washi)',
            contentBg: 'var(--theme-washi)',
          },
          Tag: {
            borderRadiusSM: 2,
            defaultBg: 'rgba(120,120,120,0.1)',
            defaultColor: 'var(--theme-linen)',
          },
          Tabs: {
            inkBarColor: '#D83A2C',
            itemActiveColor: '#D83A2C',
            itemHoverColor: 'var(--theme-linen)',
            itemSelectedColor: '#D83A2C',
          },
          Input: {
            activeBorderColor: '#D83A2C',
            hoverBorderColor: 'var(--theme-stone)',
            colorBgContainer: 'var(--theme-washi)',
            colorBorder: 'var(--theme-charcoal)',
            colorText: 'var(--theme-linen)',
            colorTextPlaceholder: 'var(--theme-stone)',
            borderRadius: 4,
          },
          Select: {
            colorBgContainer: 'var(--theme-washi)',
            colorBorder: 'var(--theme-charcoal)',
            colorText: 'var(--theme-linen)',
            colorTextPlaceholder: 'var(--theme-stone)',
            optionActiveBg: 'rgba(216,58,44,0.1)',
            optionSelectedBg: 'rgba(216,58,44,0.12)',
            borderRadius: 4,
          },
          Dropdown: {
            colorBgElevated: 'var(--theme-washi)',
            controlItemBgHover: 'rgba(216,58,44,0.1)',
          },
          Tooltip: {
            colorTextLightSolid: 'var(--theme-linen)',
          },
          Notification: {
            colorBgElevated: 'var(--theme-washi)',
          },
          Message: {
            colorBgElevated: 'var(--theme-washi)',
            contentBg: 'var(--theme-washi)',
          },
          Spin: {
            colorPrimary: '#D83A2C',
          },
          Slider: {
            trackBg: '#D83A2C',
            trackHoverBg: '#B83024',
            handleColor: '#D83A2C',
            handleActiveColor: '#B83024',
          },
          Progress: {
            defaultColor: '#D83A2C',
          },
          Switch: {
            colorPrimary: '#D83A2C',
            colorPrimaryHover: '#B83024',
          },
          Radio: {
            colorPrimary: '#D83A2C',
            buttonSolidCheckedBg: '#D83A2C',
            buttonSolidCheckedHoverBg: '#B83024',
          },
          Checkbox: {
            colorPrimary: '#D83A2C',
            colorPrimaryHover: '#B83024',
          },
          DatePicker: {
            activeBorderColor: '#D83A2C',
            hoverBorderColor: 'var(--theme-stone)',
            cellActiveWithRangeBg: 'rgba(216,58,44,0.1)',
            cellHoverWithRangeBg: 'rgba(216,58,44,0.05)',
          },
          Pagination: {
            itemActiveBg: '#D83A2C',
            colorPrimary: '#D83A2C',
            colorPrimaryHover: '#B83024',
          },
          Segmented: {
            itemSelectedBg: '#D83A2C',
            trackBg: 'rgba(120,120,120,0.08)',
          },
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}

export function AppProviders(props: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AppConfigProvider>
          <AuthProvider>
            {props.children}
            <ToastContainer position="bottom-right" />
          </AuthProvider>
        </AppConfigProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
