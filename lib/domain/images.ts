/**
 * Static product image registry.
 * React Native `require()` calls must be static, so seeds/screens refer to
 * product images by key and resolve them here.
 */
import type { ImageSourcePropType } from "react-native";

export const productImages: Record<string, ImageSourcePropType> = {
  phone: require("../../assets/images/products/iphone-15-pro.jpg"),
  bike: require("../../assets/images/products/classic-motorcycle.jpg"),
  tv: require("../../assets/images/products/oled-tv.jpg"),
  laptop: require("../../assets/images/products/macbook-air.jpg"),
  vacuum: require("../../assets/images/products/dyson-vacuum.jpg"),
};

export const productImageKeys = Object.keys(productImages);

export function resolveProductImage(key?: string): ImageSourcePropType | undefined {
  if (!key) return undefined;
  return productImages[key] ?? productImages.phone;
}

/** Deterministic image key from a product name, so posts always get artwork. */
export function guessImageKey(name: string): string {
  const n = name.toLowerCase();
  if (/(bike|motorcycle|royal enfield|scooter|activa|bullet)/.test(n)) return "bike";
  if (/(tv|television|oled|bravia|led)/.test(n)) return "tv";
  if (/(laptop|macbook|notebook|thinkpad|dell|hp )/.test(n)) return "laptop";
  if (/(vacuum|cleaner|dyson|purifier|appliance)/.test(n)) return "vacuum";
  return "phone";
}
