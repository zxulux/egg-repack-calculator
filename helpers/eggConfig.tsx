import { EggType } from "./schema";

export type EggConfig = {
  id: EggType;
  name: string;
  size: number;
  colorVar: string;
};

export const EGG_TYPE_CONFIG: Record<EggType, EggConfig> = {
  extra_large_white: {
    id: "extra_large_white",
    name: "Extra Large White",
    size: 12,
    colorVar: "var(--primary)",
  },
  large_white: {
    id: "large_white",
    name: "Large White",
    size: 12,
    colorVar: "var(--info)",
  },
  large_brown: {
    id: "large_brown",
    name: "Large Brown",
    size: 12,
    colorVar: "var(--secondary)",
  },
  medium_white: {
    id: "medium_white",
    name: "Medium White",
    size: 12,
    colorVar: "var(--accent)",
  },
  large_white_flat: {
    id: "large_white_flat",
    name: "Large White Flat",
    size: 30,
    colorVar: "var(--chart-color-4)",
  },
};

export const EGG_TYPES_LIST = Object.values(EGG_TYPE_CONFIG);