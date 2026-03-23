import Colors from "./colors";
import Spacing from "./spacing";
import Radius from "./radius";
import Typography from "./typography";

export const COLORS = {
  ...Colors,
};

export const SIZES = {
  padding: Spacing.md,
  radius: Radius.md,
  base: Spacing.sm,
  small: Spacing.sm,
  medium: Spacing.md,
  large: Spacing.lg,
  xl: Spacing.xl,
};

export const FONTS = {
  h1: Typography.h1,
  h2: Typography.h2,
  h3: Typography.h3,
  body: Typography.body,
  bodySmall: Typography.bodySmall,
  button: Typography.button,
  caption: Typography.caption,
};

const Theme = {
  COLORS,
  SIZES,
  FONTS,
};

export default Theme;