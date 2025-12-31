import { useTranslation } from 'react-i18next';

/**
 * Custom hook to handle RTL-specific logic
 * Returns utilities for RTL-aware styling
 */
export const useRTL = () => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return {
    isRTL,
    dir: isRTL ? 'rtl' : 'ltr',

    // Icon spacing utilities
    iconStart: isRTL ? 'ml-3' : 'mr-3',
    iconStartSm: isRTL ? 'ml-2' : 'mr-2',
    iconStartXs: isRTL ? 'ml-1.5' : 'mr-1.5',
    iconStartLg: isRTL ? 'ml-4' : 'mr-4',

    iconEnd: isRTL ? 'mr-3' : 'ml-3',
    iconEndSm: isRTL ? 'mr-2' : 'ml-2',
    iconEndXs: isRTL ? 'mr-1.5' : 'ml-1.5',
    iconEndLg: isRTL ? 'mr-4' : 'ml-4',

    // Text alignment
    textAlign: isRTL ? 'text-right' : 'text-left',

    // Flex direction
    flexReverse: isRTL ? 'flex-row-reverse' : 'flex-row',

    // Padding/Margin
    ps: (size) => isRTL ? `pr-${size}` : `pl-${size}`,
    pe: (size) => isRTL ? `pl-${size}` : `pr-${size}`,
    ms: (size) => isRTL ? `mr-${size}` : `ml-${size}`,
    me: (size) => isRTL ? `ml-${size}` : `mr-${size}`,

    // Border
    borderStart: isRTL ? 'border-r' : 'border-l',
    borderEnd: isRTL ? 'border-l' : 'border-r',

    // Rounded corners
    roundedStart: isRTL ? 'rounded-r' : 'rounded-l',
    roundedEnd: isRTL ? 'rounded-l' : 'rounded-r',
  };
};

export default useRTL;

