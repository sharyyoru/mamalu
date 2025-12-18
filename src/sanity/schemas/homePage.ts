import { defineType, defineField } from "sanity";

export const homePage = defineType({
  name: "homePage",
  title: "Home Page",
  type: "document",
  fields: [
    defineField({
      name: "heroTitle",
      title: "Hero Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "heroHighlight",
      title: "Hero Highlight Text",
      type: "string",
      description: "The colored/highlighted word in the title",
    }),
    defineField({
      name: "heroSubtitle",
      title: "Hero Subtitle",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "heroImage",
      title: "Hero Background Image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "heroCta",
      title: "Hero Call to Action",
      type: "object",
      fields: [
        { name: "primaryText", title: "Primary Button Text", type: "string" },
        { name: "primaryLink", title: "Primary Button Link", type: "string" },
        { name: "secondaryText", title: "Secondary Button Text", type: "string" },
        { name: "secondaryLink", title: "Secondary Button Link", type: "string" },
      ],
    }),
    defineField({
      name: "featuresTitle",
      title: "Features Section Title",
      type: "string",
    }),
    defineField({
      name: "featuresSubtitle",
      title: "Features Section Subtitle",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "features",
      title: "Features",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "icon", title: "Icon Name", type: "string", description: "e.g., UtensilsCrossed, ShoppingBag, BookOpen, Users" },
            { name: "title", title: "Title", type: "string" },
            { name: "description", title: "Description", type: "text", rows: 2 },
            { name: "link", title: "Link", type: "string" },
          ],
          preview: {
            select: { title: "title" },
          },
        },
      ],
    }),
    defineField({
      name: "stats",
      title: "Statistics",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "value", title: "Value", type: "string" },
            { name: "label", title: "Label", type: "string" },
          ],
          preview: {
            select: {
              title: "label",
              subtitle: "value",
            },
          },
        },
      ],
    }),
    defineField({
      name: "classCategories",
      title: "Class Categories",
      type: "array",
      description: "Categories shown in the floating boxes on homepage",
      of: [
        {
          type: "object",
          fields: [
            { name: "id", title: "Category ID", type: "string", description: "kids, family, birthday, adults" },
            { name: "title", title: "Title", type: "string" },
            { name: "subtitle", title: "Subtitle", type: "string" },
            { name: "image", title: "Image", type: "image", options: { hotspot: true } },
            { name: "badge", title: "Badge Text", type: "string" },
            { name: "badgeColor", title: "Badge Color", type: "string", description: "pink, amber, violet, emerald" },
          ],
          preview: {
            select: { title: "title", subtitle: "subtitle" },
          },
        },
      ],
    }),
    defineField({
      name: "founderSection",
      title: "Founder Section",
      type: "object",
      fields: [
        { name: "name", title: "Name", type: "string" },
        { name: "tagline", title: "Tagline", type: "string" },
        { name: "image", title: "Image", type: "image", options: { hotspot: true } },
        { name: "description", title: "Description", type: "array", of: [{ type: "block" }] },
        { name: "quote", title: "Quote", type: "text" },
      ],
    }),
    defineField({
      name: "ctaTitle",
      title: "CTA Section Title",
      type: "string",
    }),
    defineField({
      name: "ctaSubtitle",
      title: "CTA Section Subtitle",
      type: "string",
    }),
    defineField({
      name: "ctaButtons",
      title: "CTA Buttons",
      type: "object",
      fields: [
        { name: "primaryText", title: "Primary Button Text", type: "string" },
        { name: "primaryLink", title: "Primary Button Link", type: "string" },
        { name: "secondaryText", title: "Secondary Button Text", type: "string" },
        { name: "secondaryLink", title: "Secondary Button Link", type: "string" },
      ],
    }),
  ],
  preview: {
    prepare() {
      return { title: "Home Page" };
    },
  },
});
