import { author } from "./author";
import { blog } from "./blog";
import { recipe } from "./recipe";
import { recipeCategory } from "./recipeCategory";
import { product } from "./product";
import { productCategory } from "./productCategory";
import { cookingClass } from "./cookingClass";
import { instructor } from "./instructor";
import { press } from "./press";
import { siteSettings } from "./siteSettings";
import { homePage } from "./homePage";
import { aboutPage } from "./aboutPage";
import { contactInfo } from "./contactInfo";

export const schemaTypes = [
  // Documents
  author,
  blog,
  recipe,
  recipeCategory,
  product,
  productCategory,
  cookingClass,
  instructor,
  press,
  // Singletons
  siteSettings,
  homePage,
  aboutPage,
  contactInfo,
];
